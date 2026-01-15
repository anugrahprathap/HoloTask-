
import React, { useState } from 'react';
import { Task, SubTask } from '../types.ts';
import { ChevronDown, ChevronUp, CheckCircle, Circle, Cpu, Trash2, Zap, Plus, MessageSquare } from 'lucide-react';

interface TaskNodeProps {
  task: Task;
  onToggleTask: (taskId: string) => void;
  onToggleSubTask: (taskId: string, subTaskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onDecompose: (task: Task) => void;
  onAddSubTask: (taskId: string, title: string) => void;
  onUpdateRemark: (taskId: string, remark: string) => void;
  onUpdateSubTaskRemark: (taskId: string, subTaskId: string, remark: string) => void;
}

const TaskNode: React.FC<TaskNodeProps> = ({ 
  task, 
  onToggleTask, 
  onToggleSubTask, 
  onDeleteTask, 
  onDecompose, 
  onAddSubTask,
  onUpdateRemark,
  onUpdateSubTaskRemark
}) => {
  const [expanded, setExpanded] = useState(false);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('');

  const completedSubtasks = task.subtasks.filter(s => s.completed).length;
  const progress = task.subtasks.length > 0 
    ? (completedSubtasks / task.subtasks.length) * 100 
    : (task.completed ? 100 : 0);

  const handleAddSubTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubTaskTitle.trim()) {
      onAddSubTask(task.id, newSubTaskTitle.trim());
      setNewSubTaskTitle('');
    }
  };

  return (
    <div className={`glass rounded-lg overflow-hidden transition-all duration-300 border-l-4 ${task.completed ? 'border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)]' : 'border-slate-700'}`}>
      <div className="p-3 md:p-4 flex items-center justify-between gap-2">
        <div className="flex items-center space-x-3 md:space-x-4 flex-1 min-w-0">
          <button 
            onClick={() => onToggleTask(task.id)}
            className="text-cyan-400 hover:text-cyan-300 transition-colors flex-shrink-0"
          >
            {task.completed ? <CheckCircle className="w-5 h-5 md:w-6 md:h-6" /> : <Circle className="w-5 h-5 md:w-6 md:h-6 text-slate-600" />}
          </button>
          
          <div className="truncate">
            <div className="flex items-center space-x-2 mb-0.5">
              <span className="text-[8px] font-orbitron text-cyan-500/70 tracking-widest uppercase truncate max-w-[80px] md:max-w-none">{task.category}</span>
              <span className={`text-[7px] md:text-[8px] font-orbitron px-1 py-0.5 rounded border border-slate-700 ${
                task.effort === 'HIGH' ? 'bg-red-500/10 text-red-400' : 
                task.effort === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-400' : 
                'bg-green-500/10 text-green-400'
              }`}>
                {task.effort}
              </span>
            </div>
            <h3 className={`text-sm md:text-base font-medium tracking-tight truncate ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
              {task.title}
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-1 md:space-x-2">
          {!task.completed && (
            <button 
              onClick={() => onDecompose(task)}
              title="Decompose with AI"
              className="p-1.5 md:p-2 bg-purple-600/10 hover:bg-purple-600/30 text-purple-400 rounded border border-purple-500/20 transition-all hidden sm:block"
            >
              <Cpu className="w-3.5 h-3.5" />
            </button>
          )}
          <button 
            onClick={() => setExpanded(!expanded)}
            className={`p-1.5 md:p-2 hover:bg-white/5 rounded text-slate-400 transition-all ${expanded ? 'bg-white/5 text-cyan-400' : ''}`}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => onDeleteTask(task.id)}
            className="p-1.5 md:p-2 hover:bg-red-500/10 text-slate-500 hover:text-red-400 rounded transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="h-[2px] bg-slate-800 w-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-cyan-600 to-purple-600 transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      </div>

      {expanded && (
        <div className="p-4 bg-black/40 space-y-6 animate-in slide-in-from-top-2 duration-300">
          
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-[9px] font-orbitron text-slate-500 tracking-widest uppercase">
              <MessageSquare className="w-3 h-3 text-cyan-500/50" />
              <span>Protocol Remark</span>
            </div>
            <textarea
              value={task.remark || ''}
              onChange={(e) => onUpdateRemark(task.id, e.target.value)}
              placeholder="Operational log..."
              className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-xs text-slate-300 placeholder:text-slate-700 focus:outline-none focus:border-cyan-500/30 transition-all min-h-[60px] resize-none"
            />
          </div>

          <div className="space-y-3">
            <div className="text-[9px] font-orbitron text-slate-500 tracking-widest uppercase border-b border-white/5 pb-1 flex justify-between">
              <span>Sub-Protocols</span>
              <span>{completedSubtasks}/{task.subtasks.length}</span>
            </div>
            {task.subtasks.map(sub => (
              <div key={sub.id} className="group">
                <div className="flex items-center justify-between px-1 py-1 rounded hover:bg-white/5 transition-colors">
                  <div className="flex items-center space-x-3 flex-1">
                    <button onClick={() => onToggleSubTask(task.id, sub.id)} className="transition-transform active:scale-90 flex-shrink-0">
                      {sub.completed ? 
                        <CheckCircle className="w-4 h-4 text-cyan-500" /> : 
                        <Circle className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                      }
                    </button>
                    <span className={`text-xs md:text-sm font-light truncate ${sub.completed ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                      {sub.title}
                    </span>
                  </div>
                  <div className="flex items-center text-[8px] md:text-[9px] text-slate-600 font-orbitron ml-2">
                    <Zap className="w-2.5 h-2.5 mr-1 text-yellow-500/50" /> {sub.effort}
                  </div>
                </div>
                <div className="ml-8 mt-0.5 pr-2">
                  <input 
                    type="text"
                    value={sub.remark || ''}
                    onChange={(e) => onUpdateSubTaskRemark(task.id, sub.id, e.target.value)}
                    placeholder="Log detail..."
                    className="w-full bg-transparent border-none p-0 text-[10px] text-slate-500 placeholder:text-slate-800 focus:outline-none focus:text-cyan-400/70 transition-all italic font-light"
                  />
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddSubTask} className="flex items-center space-x-2 mt-4 pt-4 border-t border-slate-800/50">
            <input 
              type="text"
              value={newSubTaskTitle}
              onChange={(e) => setNewSubTaskTitle(e.target.value)}
              placeholder="Inject sub..."
              className="flex-1 bg-black/30 border border-slate-800 rounded px-3 py-2 text-[10px] text-slate-300 placeholder:text-slate-700 focus:outline-none focus:border-cyan-500/30 transition-all font-light"
            />
            <button 
              type="submit"
              disabled={!newSubTaskTitle.trim()}
              className="p-2 bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-500 border border-cyan-500/20 rounded disabled:opacity-20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default TaskNode;
