import React from 'react';
import { Calendar, MoreVertical, Edit2, Archive, Trash2 } from 'lucide-react';
import { Task, TaskStatus } from '../../types/database';
import { Card } from '../ui/Base';
import { PriorityBadge } from './TaskUI';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onArchive: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onStatusChange, onArchive, onDelete }) => {
  return (
    <Card className="p-4 group relative hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <PriorityBadge priority={task.priority} />
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(task)} className="p-1 hover:bg-bg-hover text-text-muted hover:text-brand-gold rounded-sm transition-colors">
            <Edit2 size={12} />
          </button>
          <button onClick={() => onArchive(task.id, task.is_archived)} className="p-1 hover:bg-bg-hover text-text-muted hover:text-text-primary rounded-sm transition-colors">
            <Archive size={12} />
          </button>
          <button onClick={() => onDelete(task.id)} className="p-1 hover:bg-red-500/10 text-text-muted hover:text-red-500 rounded-sm transition-colors">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <h4 className="text-sm font-semibold text-text-primary mb-2 leading-snug">{task.title}</h4>
      <p className="text-xs text-text-secondary mb-4 line-clamp-2 italic">{task.description}</p>

      <div className="pt-3 border-t border-brand-border flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] text-text-muted font-medium">
          <Calendar size={10} className="text-brand-gold" />
          <span>{task.due_date}</span>
        </div>
        
        <select 
          value={task.status}
          onChange={(e) => onStatusChange(task.id, e.target.value as TaskStatus)}
          className="text-[10px] font-bold uppercase tracking-tighter bg-transparent text-text-secondary hover:text-brand-gold cursor-pointer focus:outline-none"
        >
          <option value="todo">To Do</option>
          <option value="in_progress">Progress</option>
          <option value="meeting">Meeting</option>
          <option value="completed">Done</option>
        </select>
      </div>
    </Card>
  );
};
