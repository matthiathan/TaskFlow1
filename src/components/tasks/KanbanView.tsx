import React from 'react';
import { Task, TaskStatus } from '../../types/database';
import { TaskCard } from './TaskCard';

interface KanbanViewProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onArchive: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
}

export const KanbanView: React.FC<KanbanViewProps> = ({ tasks, onEdit, onStatusChange, onArchive, onDelete }) => {
  const columns: { label: string; status: TaskStatus }[] = [
    { label: 'To Do', status: 'todo' },
    { label: 'In Progress', status: 'in_progress' },
    { label: 'Meeting', status: 'meeting' },
    { label: 'Completed', status: 'completed' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {columns.map((column) => (
        <div key={column.status} className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-brand-border">
            <h3 className="text-xs uppercase tracking-widest font-bold text-text-secondary">
              {column.label}
            </h3>
            <span className="text-[10px] font-mono bg-bg-surface px-2 py-0.5 rounded-full text-text-muted">
              {tasks.filter(t => t.status === column.status).length}
            </span>
          </div>
          
          <div className="flex-1 space-y-4">
            {tasks
              .filter(t => t.status === column.status)
              .map(task => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  onEdit={onEdit}
                  onStatusChange={onStatusChange}
                  onArchive={onArchive}
                  onDelete={onDelete}
                />
              ))}
            
            {tasks.filter(t => t.status === column.status).length === 0 && (
              <div className="h-24 border border-dashed border-brand-border rounded-sm flex items-center justify-center bg-bg-surface/50">
                <p className="text-[10px] uppercase tracking-widest text-text-muted font-medium italic">Stationary</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
