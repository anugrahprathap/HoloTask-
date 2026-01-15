
import React, { useState } from 'react';
import { Task, SubTask } from '../types';
import { ChevronDown, ChevronUp, CheckCircle, Circle, Cpu, Trash2, Zap } from 'lucide-react';

interface TaskNodeProps {
  task: Task;
  onToggleTask: (taskId: string) => void;
  onToggleSubTask: (taskId: string, subTaskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onDecompose: (task: Task) => void;
}

const TaskNode: React.FC<TaskNodeProps> = ({ task, onToggleTask, onToggleSubTask, onDeleteTask, onDecompose }) => {
  const [expanded, setExpanded] = useState(false);

  const completedSubtasks = task.subtasks.filter(s => s.completed).length;
  const progress = task.subtasks.length > 0 
    ? (completedSubtasks / task.subtasks.length) * 100 
    : (task.completed ? 100 : 0);

  return (
    <div className={`glass rounded-lg mb-4 overflow-hidden transition-all duration-300 border-l-4 ${task.completed ? 'border-cyan-400' : 'border-slate-700'}`}>
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => onToggleTask(task.id)}
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            {task.completed ? <CheckCircle className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
          </button>
          
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-orbitron text-cyan-500/70 tracking-widest">{task.category}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border border-slate-700 ${
                task.effort === 'HIGH' ? 'bg-red-500/20 text-red-400' : 
                task.effort === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-400' : 
                'bg-green-500/20 text-green-400'
              }`}>
                {task.effort} EFFORT
              </span>
            </div>
            <h3 className={`text-lg font-medium tracking-tight ${task.completed ? 'line-through text-slate-500' : 'text-slate-100'}`}>
              {task.title}
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {task.subtasks.length === 0 && !task.completed && (
            <button 
              onClick={() => onDecompose(task)}
              title="Decompose with AI"
              className="p-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 rounded-lg border border-purple-500/30 transition-all"
            >
              <Cpu className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={() => setExpanded(!expanded)}
            className="p-2 hover:bg-white/5 rounded-lg text-slate-400 transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => onDeleteTask(task.id)}
            className="p-2 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-slate-800 w-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-cyan-600 to-purple-600 transition-all duration-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Expanded Subtasks */}
      {expanded && (
        <div className="p-4 bg-black/20 space-y-3">
          {task.subtasks.length > 0 ? (
            task.subtasks.map(sub => (
              <div key={sub.id} className="flex items-center justify-between group">
                <div className="flex items-center space-x-3">
                  <button onClick={() => onToggleSubTask(task.id, sub.id)}>
                    {sub.completed ? 
                      <CheckCircle className="w-4 h-4 text-cyan-500" /> : 
                      <Circle className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                    }
                  </button>
                  <span className={`text-sm ${sub.completed ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                    {sub.title}
                  </span>
                </div>
                <div className="flex items-center text-[10px] text-slate-600 font-orbitron">
                   <Zap className="w-3 h-3 mr-1" /> W: {sub.effort}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 text-center italic">No sub-directives found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskNode;
