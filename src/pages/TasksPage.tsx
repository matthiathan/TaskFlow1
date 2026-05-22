import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTasks } from '../hooks/useTasks';
import { TaskList } from '../components/tasks/TaskList';
import { KanbanBoard } from '../components/tasks/KanbanBoard';
import { CalendarAgendaView } from '../components/tasks/CalendarAgendaView';
import { TaskFormModal } from '../components/tasks/TaskFormModal';
import { Button } from '../components/ui/Base';
import { LayoutGrid, List, Calendar as CalendarIcon, Plus, Loader2 } from 'lucide-react';
import { Task, TaskStatus } from '../types/database';
import { cn } from '../lib/utils';

export const TasksPage: React.FC = () => {
  const { tasks, loading, addTask, updateTask, deleteTask } = useTasks();
  const [view, setView] = useState<'table' | 'kanban' | 'calendar'>('kanban');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const action = searchParams.get('action');
    const editId = searchParams.get('edit');

    if (action === 'create') {
      setIsModalOpen(true);
      setEditTask(null);
      setSearchParams({}, { replace: true });
    } else if (editId && tasks.length > 0) {
      const found = tasks.find(t => t.id === editId);
      if (found) {
        setEditTask(found);
        setIsModalOpen(true);
        setSearchParams({}, { replace: true });
      }
    }
  }, [searchParams, tasks, setSearchParams]);

  const handleOpenEdit = (task: Task) => {
    setEditTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditTask(null);
  };

  const handleSubmit = async (data: any) => {
    if (editTask) {
      await updateTask(editTask.id, data);
    } else {
      await addTask(data);
    }
  };

  // Support virtual columns through status mutations
  const handleUpdateStatusExtended = async (id: string, status: TaskStatus, customDesc?: string) => {
    const updates: Partial<Task> = { status };
    if (customDesc !== undefined) {
      updates.description = customDesc;
    }
    await updateTask(id, updates);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Tasks & Objectives</h1>
          <p className="text-text-secondary text-sm mt-1">Organize team objectives, handle work checklists, and view scheduled tasks.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-bg-elevated border border-brand-border rounded-lg p-1 flex">
            <button
              onClick={() => setView('table')}
              className={cn(
                'px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider',
                view === 'table' ? 'bg-bg-base text-brand-gold shadow-sm' : 'text-text-secondary hover:text-text-primary'
              )}
              title="Table view"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setView('kanban')}
              className={cn(
                'px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider',
                view === 'kanban' ? 'bg-bg-base text-brand-gold shadow-sm' : 'text-text-secondary hover:text-text-primary'
              )}
              title="Kanban Board"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setView('calendar')}
              className={cn(
                'px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider',
                view === 'calendar' ? 'bg-bg-base text-brand-gold shadow-sm' : 'text-text-secondary hover:text-text-primary'
              )}
              title="Calendar Agenda"
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Calendar</span>
            </button>
          </div>
          
          <Button onClick={() => setIsModalOpen(true)} className="gap-2 px-4 h-11 text-xs font-bold">
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </Button>
        </div>
      </div>

      {loading && tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32">
          <Loader2 className="w-10 h-10 animate-spin text-brand-gold" />
          <p className="mt-4 text-text-secondary text-xs font-semibold uppercase tracking-wider">Synchronizing task data...</p>
        </div>
      ) : (
        <div className="animate-in fade-in duration-300">
          {view === 'table' ? (
            <TaskList 
              tasks={tasks} 
              onUpdateStatus={(id, status) => handleUpdateStatusExtended(id, status)} 
              onDelete={deleteTask}
              onEdit={handleOpenEdit}
            />
          ) : view === 'kanban' ? (
            <KanbanBoard 
              tasks={tasks} 
              onUpdateStatus={handleUpdateStatusExtended} 
              onEdit={handleOpenEdit}
            />
          ) : (
            <CalendarAgendaView 
              tasks={tasks} 
              onEdit={handleOpenEdit}
              onUpdateStatus={(id, status) => handleUpdateStatusExtended(id, status)}
            />
          )}
        </div>
      )}

      <TaskFormModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSubmit={handleSubmit} 
        onDelete={deleteTask}
        initialData={editTask}
      />
    </div>
  );
};
