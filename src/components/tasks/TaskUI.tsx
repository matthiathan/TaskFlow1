import React from 'react';
import { Task, TaskPriority, TaskStatus } from '../../types/database';

export const PriorityBadge: React.FC<{ priority: TaskPriority }> = ({ priority }) => {
  const styles = {
    low: 'bg-priority-low/10 text-priority-low border-priority-low/20 shadow-sm',
    medium: 'bg-priority-medium/10 text-priority-medium border-priority-medium/20 shadow-sm',
    high: 'bg-priority-high/10 text-priority-high border-priority-high/20 shadow-sm',
  };

  return (
    <span className={`px-2 py-0.5 rounded-sm border text-[9px] font-bold uppercase tracking-wider ${styles[priority]}`}>
      {priority}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: TaskStatus }> = ({ status }) => {
  const labels: Record<TaskStatus, string> = {
    todo: 'To Do',
    in_progress: 'In Progress',
    meeting: 'Meeting',
    completed: 'Completed',
  };

  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-text-secondary uppercase tracking-tighter">
      <div className={`w-1.5 h-1.5 rounded-full shadow-sm ${
        status === 'completed' ? 'bg-status-done' : 
        status === 'in_progress' ? 'bg-status-progress' : 
        status === 'meeting' ? 'bg-status-meeting' : 'bg-status-todo'
      }`} />
      {labels[status]}
    </span>
  );
};
