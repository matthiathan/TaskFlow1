import React, { useState } from 'react';
import { useTasks } from '../hooks/useTasks';
import { TaskList } from '../components/tasks/TaskList';
import { KanbanBoard } from '../components/tasks/KanbanBoard';
import { TaskFormModal } from '../components/tasks/TaskFormModal';
import { Button, Card } from '../components/ui/Base';
import { LayoutGrid, List, Plus, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

export const TasksPage: React.FC = () => {
  const { tasks, loading, addTask, updateTaskStatus, deleteTask } = useTasks();
  const [view, setView] = useState<'list' | 'kanban'>('kanban');
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-serif uppercase tracking-[0.1em]">Task Intelligence</h1>
          <p className="text-text-secondary text-sm mt-1">Manage operational objectives and system directives.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-bg-elevated border border-brand-border rounded-lg p-1 flex">
            <button
              onClick={() => setView('list')}
              className={cn(
                'p-2 rounded-md transition-all',
                view === 'list' ? 'bg-bg-base text-brand-gold shadow-sm' : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('kanban')}
              className={cn(
                'p-2 rounded-md transition-all',
                view === 'kanban' ? 'bg-bg-base text-brand-gold shadow-sm' : 'text-text-secondary hover:text-text-primary'
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          
          <Button onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            <span>New Directive</span>
          </Button>
        </div>
      </div>

      {loading && tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="w-10 h-10 animate-spin text-brand-gold" />
          <p className="mt-4 text-text-secondary font-medium uppercase tracking-widest text-[10px]">Synchronizing Secure Uplink...</p>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {view === 'list' ? (
            <TaskList 
              tasks={tasks} 
              onUpdateStatus={updateTaskStatus} 
              onDelete={deleteTask} 
            />
          ) : (
            <KanbanBoard 
              tasks={tasks} 
              onUpdateStatus={updateTaskStatus} 
            />
          )}
        </div>
      )}

      <TaskFormModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={addTask} 
      />
    </div>
  );
};
