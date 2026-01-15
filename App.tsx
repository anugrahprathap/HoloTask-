
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Terminal, Shield, Power, Plus, Brain, Activity, Target, ChevronLeft, ChevronRight, Filter, Settings, X, Download, Upload, User, Save } from 'lucide-react';
import { Task, SubTask, UserProfile } from './types.ts';
import { getSession, saveSession } from './store/holoStore.ts';
import { decomposeTask } from './services/geminiService.ts';
import HoloCore from './components/HoloCore.tsx';
import TaskNode from './components/TaskNode.tsx';

const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

type SortOption = 'NEWEST' | 'OLDEST' | 'PROGRESS' | 'CATEGORY';

const App: React.FC = () => {
  const [commandId, setCommandId] = useState<string | null>(localStorage.getItem('ACTIVE_UPLINK'));
  const [inputCommandId, setInputCommandId] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profile, setProfile] = useState<UserProfile>({ callsign: 'OPERATOR_01', joinedAt: Date.now() });
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isDecomposing, setIsDecomposing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>('NEWEST');
  const itemsPerPage = 5;

  useEffect(() => {
    if (commandId) {
      const storedTasks = getSession(commandId);
      setTasks(storedTasks);
      
      const storedProfile = localStorage.getItem(`PROFILE_${commandId}`);
      if (storedProfile) setProfile(JSON.parse(storedProfile));
    }
  }, [commandId]);

  useEffect(() => {
    if (commandId) {
      saveSession(commandId, tasks);
    }
  }, [tasks, commandId]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCommandId.trim()) {
      setCommandId(inputCommandId.trim());
      localStorage.setItem('ACTIVE_UPLINK', inputCommandId.trim());
    }
  };

  const handleLogout = () => {
    setCommandId(null);
    localStorage.removeItem('ACTIVE_UPLINK');
    setTasks([]);
    setIsSettingsOpen(false);
  };

  const saveProfile = (newCallsign: string) => {
    const updated = { ...profile, callsign: newCallsign };
    setProfile(updated);
    if (commandId) {
      localStorage.setItem(`PROFILE_${commandId}`, JSON.stringify(updated));
    }
  };

  const exportTasks = () => {
    const dataStr = JSON.stringify(tasks, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `holotask_${commandId}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importTasks = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          setTasks(imported);
          alert('DIRECTIVE DATA UPLINK SUCCESSFUL');
        }
      } catch (err) {
        alert('DATA CORRUPTION DETECTED: INVALID JSON FORMAT');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const task: Task = {
      id: generateId(),
      title: newTaskTitle.trim(),
      category: 'GENERAL',
      completed: false,
      effort: 'MEDIUM',
      subtasks: [],
      remark: '',
      createdAt: Date.now()
    };

    setTasks(prev => [task, ...prev]);
    setNewTaskTitle('');
    setCurrentPage(1);
  };

  const sortedTasks = useMemo(() => {
    const list = [...tasks];
    switch (sortBy) {
      case 'OLDEST': return list.sort((a, b) => a.createdAt - b.createdAt);
      case 'PROGRESS': return list.sort((a, b) => {
        const getProg = (t: Task) => t.subtasks.length > 0 
          ? (t.subtasks.filter(s => s.completed).length / t.subtasks.length) 
          : (t.completed ? 1 : 0);
        return getProg(b) - getProg(a);
      });
      case 'CATEGORY': return list.sort((a, b) => a.category.localeCompare(b.category));
      case 'NEWEST': 
      default: return list.sort((a, b) => b.createdAt - a.createdAt);
    }
  }, [tasks, sortBy]);

  const totalPages = Math.ceil(sortedTasks.length / itemsPerPage);
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedTasks.slice(start, start + itemsPerPage);
  }, [sortedTasks, currentPage]);

  const toggleTask = useCallback((taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const newState = !t.completed;
        return {
          ...t,
          completed: newState,
          subtasks: t.subtasks.map(s => ({ ...s, completed: newState }))
        };
      }
      return t;
    }));
  }, []);

  const toggleSubTask = useCallback((taskId: string, subTaskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const newSubtasks = t.subtasks.map(s => 
          s.id === subTaskId ? { ...s, completed: !s.completed } : s
        );
        const allCompleted = newSubtasks.length > 0 && newSubtasks.every(s => s.completed);
        return { ...t, subtasks: newSubtasks, completed: allCompleted };
      }
      return t;
    }));
  }, []);

  const updateTaskRemark = useCallback((taskId: string, remark: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, remark } : t));
  }, []);

  const updateSubTaskRemark = useCallback((taskId: string, subTaskId: string, remark: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          subtasks: t.subtasks.map(s => s.id === subTaskId ? { ...s, remark } : s)
        };
      }
      return t;
    }));
  }, []);

  const addSubTask = useCallback((taskId: string, title: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const newSubTask: SubTask = {
          id: generateId(),
          title: title.trim(),
          completed: false,
          effort: 5,
          remark: ''
        };
        return {
          ...t,
          completed: false,
          subtasks: [...t.subtasks, newSubTask]
        };
      }
      return t;
    }));
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }, []);

  const handleDecompose = async (task: Task) => {
    setIsDecomposing(true);
    const result = await decomposeTask(task.title);
    if (result) {
      setTasks(prev => prev.map(t => {
        if (t.id === task.id) {
          return {
            ...t,
            category: result.category,
            effort: result.effort,
            subtasks: result.subtasks.map((s: any) => ({
              id: generateId(),
              title: s.title,
              completed: false,
              effort: s.effort,
              remark: ''
            }))
          };
        }
        return t;
      }));
    } else {
      alert("Neural link failed. Ensure environment API Key is active.");
    }
    setIsDecomposing(false);
  };

  const globalEfficiency = useMemo(() => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.completed).length;
    return completed / tasks.length;
  }, [tasks]);

  if (!commandId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 md:p-6 bg-[#020617]">
        <HoloCore efficiency={0} />
        <div className="max-w-md w-full glass p-6 md:p-8 rounded-2xl border border-cyan-500/30">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-cyan-500/10 border border-cyan-500/50">
              <Shield className="w-10 h-10 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-orbitron font-bold text-center mb-2 text-cyan-400 glow-text uppercase">HoloTask 3D</h1>
          <p className="text-slate-400 text-center text-[10px] mb-8 font-light tracking-[0.3em] uppercase opacity-60">Command Center Uplink</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-orbitron text-cyan-500/70 mb-2 tracking-widest uppercase">Operator ID</label>
              <div className="relative">
                <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-600" />
                <input 
                  type="text"
                  value={inputCommandId}
                  onChange={(e) => setInputCommandId(e.target.value)}
                  placeholder="ID_77_ALPHA..."
                  className="w-full bg-black/40 border border-cyan-500/20 rounded-lg py-3 pl-10 pr-4 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all font-orbitron text-xs"
                />
              </div>
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-orbitron py-3 rounded-lg text-xs tracking-widest transition-all active:scale-95">
              INITIALIZE
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden font-inter text-slate-200">
      <HoloCore efficiency={globalEfficiency} />
      <input type="file" ref={fileInputRef} onChange={importTasks} accept=".json" className="hidden" />

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
          <div className="max-w-lg w-full glass border border-cyan-500/30 rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4 text-cyan-400" />
                <span className="font-orbitron text-xs tracking-widest uppercase text-cyan-400">System Settings</span>
              </div>
              <button onClick={() => setIsSettingsOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Profile Section */}
              <section className="space-y-4">
                <div className="flex items-center space-x-2 text-[10px] font-orbitron text-slate-500 tracking-[0.2em] uppercase">
                  <User className="w-3 h-3" />
                  <span>Operator Profile</span>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-600 to-purple-700 flex items-center justify-center text-xl font-orbitron font-bold border border-white/20">
                    {profile.callsign[0]}
                  </div>
                  <div className="flex-1">
                    <label className="block text-[8px] font-orbitron text-slate-600 uppercase mb-1">Callsign</label>
                    <input 
                      type="text" 
                      value={profile.callsign}
                      onChange={(e) => saveProfile(e.target.value)}
                      className="w-full bg-transparent border-none p-0 text-cyan-400 font-orbitron text-sm focus:ring-0"
                    />
                  </div>
                </div>
              </section>

              {/* Data Management */}
              <section className="space-y-4">
                <div className="flex items-center space-x-2 text-[10px] font-orbitron text-slate-500 tracking-[0.2em] uppercase">
                  <Save className="w-3 h-3" />
                  <span>Data Protocols</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={exportTasks}
                    className="flex flex-col items-center justify-center p-4 glass hover:bg-white/5 rounded-xl border border-white/5 transition-all group"
                  >
                    <Download className="w-6 h-6 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-orbitron uppercase tracking-widest">Export JSON</span>
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-4 glass hover:bg-white/5 rounded-xl border border-white/5 transition-all group"
                  >
                    <Upload className="w-6 h-6 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-[9px] font-orbitron uppercase tracking-widest">Import JSON</span>
                  </button>
                </div>
              </section>

              <section className="pt-4 border-t border-white/5">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all font-orbitron text-xs tracking-widest"
                >
                  <Power className="w-4 h-4" />
                  <span>TERMINATE UPLINK</span>
                </button>
              </section>
            </div>
          </div>
        </div>
      )}
      
      {/* Responsive Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/5 px-4 md:px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 self-start md:self-auto">
            <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
              <Activity className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-orbitron font-bold tracking-tight text-slate-100">HoloTask <span className="text-cyan-400">3D</span></h1>
              <p className="text-[8px] md:text-[10px] text-cyan-600 font-orbitron tracking-[0.2em] uppercase">Sector: {commandId}</p>
            </div>
          </div>

          <div className="flex items-center justify-between w-full md:w-auto md:space-x-8">
            <div className="flex flex-col items-start md:items-end">
              <span className="text-[8px] md:text-[10px] font-orbitron text-slate-500 tracking-widest uppercase">Efficiency</span>
              <div className="flex items-center space-x-3">
                <div className="w-24 md:w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all duration-700"
                    style={{ width: `${globalEfficiency * 100}%` }}
                  />
                </div>
                <span className="text-[10px] md:text-xs font-orbitron font-bold text-cyan-400">{(globalEfficiency * 100).toFixed(0)}%</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 ml-4">
               <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 hover:bg-white/10 text-slate-400 hover:text-cyan-400 border border-transparent hover:border-white/10 rounded-lg transition-all"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button 
                onClick={handleLogout}
                className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-transparent hover:border-red-500/20 rounded-lg transition-all"
              >
                <Power className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main UI */}
      <main className="max-w-4xl mx-auto px-4 py-8 md:p-12 relative z-10">
        
        {/* Welcome HUD */}
        <div className="mb-8 flex items-end justify-between px-2">
           <div>
              <span className="text-[10px] font-orbitron text-cyan-500 tracking-[0.3em] uppercase opacity-60">Status: Online</span>
              <h2 className="text-xl md:text-2xl font-orbitron font-bold text-slate-100">Welcome, <span className="text-cyan-400 glow-text">{profile.callsign}</span></h2>
           </div>
           <div className="hidden sm:block text-right">
              <span className="block text-[8px] font-orbitron text-slate-600 uppercase">System Time</span>
              <span className="text-xs font-orbitron text-slate-400">{new Date().toLocaleTimeString()}</span>
           </div>
        </div>

        {/* Input Control */}
        <section className="mb-8 md:mb-12">
          <form onSubmit={addTask} className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative glass p-1.5 md:p-2 rounded-xl flex items-center">
              <input 
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Transmit objective..."
                className="flex-1 bg-transparent border-none py-2 px-3 md:py-3 md:px-4 focus:ring-0 text-base md:text-lg placeholder:text-slate-600 text-slate-100 font-light"
              />
              <button 
                type="submit"
                className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 p-2 md:p-3 rounded-lg border border-cyan-500/30 transition-all"
              >
                <Plus className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>
          </form>
        </section>

        {/* HUD Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 px-2">
          <div className="flex items-center space-x-2 text-[10px] font-orbitron tracking-widest text-slate-500">
            <Filter className="w-3 h-3" />
            <span>SORT:</span>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent border-none focus:ring-0 text-cyan-400 cursor-pointer hover:text-cyan-300 transition-colors"
            >
              <option value="NEWEST" className="bg-[#020617]">NEWEST</option>
              <option value="OLDEST" className="bg-[#020617]">OLDEST</option>
              <option value="PROGRESS" className="bg-[#020617]">EFFICIENCY</option>
              <option value="CATEGORY" className="bg-[#020617]">CATEGORY</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-[10px] font-orbitron text-slate-600 uppercase tracking-tighter">
              Page {currentPage} / {Math.max(1, totalPages)}
            </span>
            <div className="flex space-x-1">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-1.5 glass rounded border border-white/5 disabled:opacity-20 hover:text-cyan-400 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-1.5 glass rounded border border-white/5 disabled:opacity-20 hover:text-cyan-400 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Task List */}
        <section className="space-y-4 md:space-y-6">
          {paginatedTasks.length > 0 ? (
            <div className="space-y-4">
              {paginatedTasks.map(task => (
                <TaskNode 
                  key={task.id} 
                  task={task} 
                  onToggleTask={toggleTask}
                  onToggleSubTask={toggleSubTask}
                  onDeleteTask={deleteTask}
                  onDecompose={handleDecompose}
                  onAddSubTask={addSubTask}
                  onUpdateRemark={updateTaskRemark}
                  onUpdateSubTaskRemark={updateSubTaskRemark}
                />
              ))}
            </div>
          ) : (
            <div className="glass rounded-2xl p-12 md:p-16 flex flex-col items-center justify-center border-dashed border-2 border-slate-800">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4 text-slate-700">
                <Brain className="w-6 h-6 md:w-8 md:h-8" />
              </div>
              <p className="text-slate-500 font-orbitron tracking-widest text-xs md:text-sm text-center">NO DATA UPLINK<br/><span className="text-[8px] md:text-[10px] opacity-50">INITIATE DIRECTIVES</span></p>
            </div>
          )}
        </section>
      </main>

      {/* AI Loading Overlay */}
      {isDecomposing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="glass p-8 rounded-2xl border border-cyan-500/30 flex flex-col items-center max-w-[280px] text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-cyan-500/20 blur-xl animate-pulse rounded-full"></div>
              <Brain className="w-10 h-10 text-cyan-400 animate-bounce relative" />
            </div>
            <h2 className="text-lg font-orbitron text-cyan-400 mb-2 uppercase">Neural Link...</h2>
            <p className="text-[10px] text-slate-400 leading-relaxed font-light tracking-wide">
              Gemini AI is analyzing directives. Calibrating logic gates.
            </p>
          </div>
        </div>
      )}

      {/* Responsive Footer HUD */}
      <footer className="fixed bottom-4 left-4 right-4 md:bottom-6 md:left-6 md:right-6 flex items-center justify-between text-[6px] md:text-[10px] font-orbitron text-slate-600 tracking-[0.2em] md:tracking-[0.3em] uppercase pointer-events-none">
        <div>System: <span className="text-green-500">OPT</span></div>
        <div className="hidden sm:block">Lat: 14ms | Uplink: ACT</div>
        <div>Holo v2.5.1</div>
      </footer>
    </div>
  );
};

export default App;
