
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Terminal, Shield, Power, Plus, Brain, Activity, Target } from 'lucide-react';
import { Task, SubTask } from './types.ts';
import { getSession, saveSession } from './store/holoStore.ts';
import { decomposeTask } from './services/geminiService.ts';
import HoloCore from './components/HoloCore.tsx';
import TaskNode from './components/TaskNode.tsx';

const App: React.FC = () => {
  const [commandId, setCommandId] = useState<string | null>(localStorage.getItem('ACTIVE_UPLINK'));
  const [inputCommandId, setInputCommandId] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isDecomposing, setIsDecomposing] = useState(false);

  // Load session
  useEffect(() => {
    if (commandId) {
      const storedTasks = getSession(commandId);
      setTasks(storedTasks);
    }
  }, [commandId]);

  // Persist tasks
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
  };

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const task: Task = {
      id: crypto.randomUUID(),
      title: newTaskTitle.trim(),
      category: 'GENERAL',
      completed: false,
      effort: 'MEDIUM',
      subtasks: [],
      createdAt: Date.now()
    };

    setTasks(prev => [task, ...prev]);
    setNewTaskTitle('');
  };

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
        const allCompleted = newSubtasks.every(s => s.completed);
        return { ...t, subtasks: newSubtasks, completed: allCompleted };
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
              id: crypto.randomUUID(),
              title: s.title,
              completed: false,
              effort: s.effort
            }))
          };
        }
        return t;
      }));
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
      <div className="min-h-screen flex items-center justify-center p-6 bg-[#020617]">
        <HoloCore efficiency={0} />
        <div className="max-w-md w-full glass p-8 rounded-2xl border border-cyan-500/30 animate-in fade-in zoom-in duration-700">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-cyan-500/10 border border-cyan-500/50 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
              <Shield className="w-10 h-10 text-cyan-400" />
            </div>
          </div>
          <h1 className="text-3xl font-orbitron font-bold text-center mb-2 text-cyan-400 glow-text">HoloTask 3D</h1>
          <p className="text-slate-400 text-center text-sm mb-8 font-light tracking-wider">COMMAND CENTER UPLINK v2.5</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-orbitron text-cyan-500/70 mb-2 tracking-widest uppercase">Operator ID</label>
              <div className="relative">
                <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-600" />
                <input 
                  type="text"
                  value={inputCommandId}
                  onChange={(e) => setInputCommandId(e.target.value)}
                  placeholder="Enter Command ID..."
                  className="w-full bg-black/40 border border-cyan-500/20 rounded-lg py-3 pl-10 pr-4 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-all font-orbitron text-sm"
                />
              </div>
            </div>
            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 text-white font-orbitron py-3 rounded-lg shadow-lg shadow-cyan-900/20 transition-all active:scale-95"
            >
              INITIALIZE UPLINK
            </button>
          </form>
          
          <div className="mt-8 pt-6 border-t border-slate-800/50 text-center">
            <p className="text-[10px] text-slate-600 font-orbitron tracking-widest uppercase">System Secured by HoloNet Protocols</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden font-inter text-slate-200">
      <HoloCore efficiency={globalEfficiency} />
      
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
              <Activity className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-orbitron font-bold tracking-tight text-slate-100">HoloTask <span className="text-cyan-400">3D</span></h1>
              <p className="text-[10px] text-cyan-600 font-orbitron tracking-[0.2em] uppercase">Sector: {commandId}</p>
            </div>
          </div>

          <div className="flex items-center space-x-8">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[10px] font-orbitron text-slate-500 tracking-widest uppercase">Fleet Efficiency</span>
              <div className="flex items-center space-x-3">
                <div className="w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] transition-all duration-700"
                    style={{ width: `${globalEfficiency * 100}%` }}
                  />
                </div>
                <span className="text-xs font-orbitron font-bold text-cyan-400">{(globalEfficiency * 100).toFixed(0)}%</span>
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-transparent hover:border-red-500/20 rounded-lg transition-all"
            >
              <Power className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main UI */}
      <main className="max-w-4xl mx-auto p-6 md:p-12 relative z-10">
        
        {/* Input Control */}
        <section className="mb-12">
          <form onSubmit={addTask} className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <div className="relative glass p-2 rounded-xl flex items-center">
              <input 
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Transmit new objective..."
                className="flex-1 bg-transparent border-none py-3 px-4 focus:ring-0 text-lg placeholder:text-slate-600 text-slate-100"
              />
              <button 
                type="submit"
                className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 p-3 rounded-lg border border-cyan-500/30 transition-all"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </form>
        </section>

        {/* Task List */}
        <section className="space-y-6">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center space-x-2 text-xs font-orbitron tracking-widest text-slate-500">
              <Target className="w-4 h-4" />
              <span>ACTIVE DIRECTIVES</span>
            </div>
            <div className="text-[10px] font-orbitron text-slate-600">
              TOTAL NODES: {tasks.length}
            </div>
          </div>

          {tasks.length > 0 ? (
            <div className="space-y-4">
              {tasks.map(task => (
                <TaskNode 
                  key={task.id} 
                  task={task} 
                  onToggleTask={toggleTask}
                  onToggleSubTask={toggleSubTask}
                  onDeleteTask={deleteTask}
                  onDecompose={handleDecompose}
                />
              ))}
            </div>
          ) : (
            <div className="glass rounded-2xl p-16 flex flex-col items-center justify-center border-dashed border-2 border-slate-800">
              <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4 text-slate-700">
                <Brain className="w-8 h-8" />
              </div>
              <p className="text-slate-500 font-orbitron tracking-widest text-sm text-center">NO DATA UPLINK DETECTED<br/><span className="text-[10px] opacity-50">AWAITING OBJECTIVES</span></p>
            </div>
          )}
        </section>
      </main>

      {/* AI Loading Overlay */}
      {isDecomposing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300">
          <div className="glass p-8 rounded-2xl border border-cyan-500/30 flex flex-col items-center max-w-xs text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-cyan-500/20 blur-xl animate-pulse rounded-full"></div>
              <Brain className="w-12 h-12 text-cyan-400 animate-bounce relative" />
            </div>
            <h2 className="text-xl font-orbitron text-cyan-400 mb-2">Analyzing...</h2>
            <p className="text-xs text-slate-400 leading-relaxed font-light">
              Gemini AI is decomposing directive into actionable sub-protocols. Calibrating neural pathways.
            </p>
          </div>
        </div>
      )}

      {/* Global Hud Info */}
      <footer className="fixed bottom-6 left-6 right-6 flex items-center justify-between text-[8px] md:text-[10px] font-orbitron text-slate-600 tracking-[0.3em] uppercase pointer-events-none">
        <div>System Status: <span className="text-green-500">OPTIMAL</span></div>
        <div className="hidden md:block">Latency: 14ms | Uplink: Active</div>
        <div>HoloTask v2.5.0-STABLE</div>
      </footer>
    </div>
  );
};

export default App;
