import React, { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '../components/ui/Base';
import { Spinner } from '../components/ui/LoadingScreen';
import { PriorityBadge, StatusBadge } from '../components/tasks/TaskUI';
import { useTasksData } from '../hooks/useTasksData';
import { Task } from '../types/database';
import { TaskFormModal } from '../components/tasks/TaskFormModal';

export const SpecialTasksPage: React.FC = () => {
  // Using your existing hook to maintain modularity without writing new fetch logic
  const { tasks, loading, addTask, updateTask, deleteTask, updateStatus } = useTasksData();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Read: Filter tasks based on search
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => 
      !task.is_archived && 
      (task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
       task.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [tasks, searchQuery]);

  // Create
  const handleCreateNew = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  // Update
  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (formData: Omit<Task, 'id'>) => {
    if (editingTask) {
      await updateTask(editingTask.id, formData);
    } else {
      await addTask(formData);
    }
    setIsModalOpen(false);
  };

  const handleToggleStatus = (task: Task) => {
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    updateStatus(task.id, newStatus);
  };

  // Delete
  const handleDelete = (id: string) => {
    if (window.confirm('PROTOCOL WARNING: This will permanently delete this record. Proceed?')) {
      deleteTask(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl text-text-primary tracking-tight uppercase mb-1">Special Operations</h1>
          <p className="text-text-secondary font-serif italic">Dedicated CRUD Module | Ad-Hoc Tasks</p>
        </div>
        <Button onClick={handleCreateNew} className="uppercase tracking-[0.2em] text-[10px] font-bold shadow-md h-10 px-6">
          <Plus size={14} className="mr-2" />
          New Entry
        </Button>
      </div>

      {/* Toolbar / Search Section */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-bg-elevated p-4 border border-brand-border shadow-sm rounded-sm transition-colors duration-300">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
          <input 
            type="text"
            placeholder="Search entries..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-bg-surface border border-brand-border pl-9 pr-4 py-2 text-[11px] font-medium tracking-tight text-text-primary focus:outline-none focus:border-brand-gold transition-colors shadow-inner"
          />
        </div>
      </div>

      {/* Data List (Read) */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <div className="bg-bg-surface border border-brand-border rounded-sm shadow-sm overflow-hidden">
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center text-text-muted text-xs uppercase tracking-widest">
              No active records found.
            </div>
          ) : (
            <div className="divide-y divide-brand-border">
              {filteredTasks.map(task => (
                <div key={task.id} className="p-4 hover:bg-bg-elevated transition-colors flex items-center justify-between gap-4">
                  
                  {/* Left Side: Status & Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <button onClick={() => handleToggleStatus(task)} className="mt-1 text-brand-gold hover:text-brand-charcoal transition-colors">
                      {task.status === 'completed' ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                    </button>
                    <div>
                      <h3 className={`text-sm font-medium ${task.status === 'completed' ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                        {task.title}
                      </h3>
                      <p className="text-xs text-text-secondary mt-1 line-clamp-1">{task.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <PriorityBadge priority={task.priority} />
                        <StatusBadge status={task.status} />
                      </div>
                    </div>
                  </div>

                  {/* Right Side: Actions (Update/Delete) */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEdit(task)}
                      className="p-2 text-text-muted hover:text-brand-gold transition-colors"
                      title="Edit Entry"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(task.id)}
                      className="p-2 text-text-muted hover:text-red-500 transition-colors"
                      title="Delete Entry"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Shared Form Modal for Create/Update */}
      <TaskFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingTask}
      />
    </div>
  );
};
