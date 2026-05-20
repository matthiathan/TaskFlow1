import React from 'react';
import { Task, TaskPriority, TaskStatus } from '../../types/database';
import { cn } from '../../lib/utils';
import { AlertCircle, Clock, CheckCircle2, ChevronRight, Trash2 } from 'lucide-react';
import { Button } from '../ui/Base';

interface TaskListProps {
  tasks: Task[];
  onUpdateStatus: (id: string, status: TaskStatus) => void;
  onDelete: (id: string) => void;
}

const PriorityBadge: React.FC<{ priority: TaskPriority }> = ({ priority }) => {
  const styles = {
    low: 'bg-green-500/10 text-green-500 border-green-500/20',
    medium: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    high: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  return (
    <span className={cn('px-2 py-0.5 rounded text-[10px] font-bold uppercase border', styles[priority])}>
      {priority}
    </span>
  );
};

const StatusIcon: React.FC<{ status: TaskStatus }> = ({ status }) => {
  switch (status) {
    case 'pending': return <Clock className="w-4 h-4 text-neutral-400" />;
    case 'in_progress': return <AlertCircle className="w-4 h-4 text-brand-gold animate-pulse" />;
    case 'resolved': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
  }
};

export const TaskList: React.FC<TaskListProps> = ({ tasks, onUpdateStatus, onDelete }) => {
  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-brand-border rounded-xl">
        <p className="text-text-secondary text-sm">No tasks identified in current sector.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div 
          key={task.id}
          className="group flex items-center gap-4 p-4 bg-bg-elevated border border-brand-border rounded-xl hover:border-brand-gold/30 transition-all"
        >
          <div className="flex-shrink-0">
            <StatusIcon status={task.status} />
          </div>
          
          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-sm font-semibold truncate text-text-primary">{task.title}</h3>
              <PriorityBadge priority={task.priority} />
            </div>
            <p className="text-xs text-text-secondary truncate">{task.description || 'No additional parameters provided.'}</p>
          </div>

          <div className="flex-shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <select
              value={task.status}
              onChange={(e) => onUpdateStatus(task.id, e.target.value as TaskStatus)}
              className="bg-bg-base border border-brand-border text-[10px] uppercase font-bold px-2 py-1 rounded outline-none focus:border-brand-gold"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">Active</option>
              <option value="resolved">Resolved</option>
            </select>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onDelete(task.id)}
              className="hover:text-red-500"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
