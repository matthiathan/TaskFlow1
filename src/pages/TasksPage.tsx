import React, { useState, useMemo } from 'react';
import { LayoutGrid, List, Search, Plus, Filter, LayoutList, CheckCircle2, ArchiveX } from 'lucide-react';
import { useTasksData } from '../hooks/useTasksData';
import { KanbanView } from '../components/tasks/KanbanView';
import { ListView } from '../components/tasks/ListView';
import { TaskFormModal } from '../components/tasks/TaskFormModal';
import { Button, Input } from '../components/ui/Base';
import { Task, TaskStatus, TaskPriority } from '../types/database';
import { Spinner } from '../components/ui/LoadingScreen';

type Tab = 'active' | 'completed' | 'archived';

export const TasksPage: React.FC = () => {
  const { tasks, loading, addTask, updateTask, deleteTask, toggleArchive, updateStatus } = useTasksData();
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [activeTab, setActiveTab] = useState<Tab>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesTab = 
        activeTab === 'archived' ? task.is_archived :
        activeTab === 'completed' ? (!task.is_archived && task.status === 'completed') :
        (!task.is_archived && task.status !== 'completed');
      
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            task.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;

      return matchesTab && matchesSearch && matchesPriority;
    });
  }, [tasks, activeTab, searchQuery, priorityFilter]);

  const handleCreateNew = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

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
  };

  const handleDelete = (id: string) => {
    if (window.confirm('PROTOCOL WARNING: This will permanently purge the operational record. Proceed?')) {
      deleteTask(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl text-text-primary tracking-tight uppercase mb-1">Strategic Operations</h1>
          <p className="text-text-secondary font-serif italic">Mission Control | Task Life-Cycle Management</p>
        </div>
        <Button onClick={handleCreateNew} className="uppercase tracking-[0.2em] text-[10px] font-bold shadow-md h-10 px-6">
          <Plus size={14} className="mr-2" />
          Initialize Directive
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-bg-elevated p-4 border border-brand-border shadow-sm rounded-sm transition-colors duration-300">
        <div className="flex items-center gap-1 bg-bg-surface p-1 rounded-sm border border-brand-border">
          <button 
            onClick={() => setActiveTab('active')}
            className={`flex items-center gap-2 px-4 py-1.5 text-[10px] uppercase font-bold tracking-widest transition-all rounded-sm shadow-sm ${activeTab === 'active' ? 'bg-text-primary text-bg-base' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <LayoutList size={12} />
            Active
          </button>
          <button 
            onClick={() => setActiveTab('completed')}
            className={`flex items-center gap-2 px-4 py-1.5 text-[10px] uppercase font-bold tracking-widest transition-all rounded-sm shadow-sm ${activeTab === 'completed' ? 'bg-text-primary text-bg-base' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <CheckCircle2 size={12} />
            Resolved
          </button>
          <button 
            onClick={() => setActiveTab('archived')}
            className={`flex items-center gap-2 px-4 py-1.5 text-[10px] uppercase font-bold tracking-widest transition-all rounded-sm shadow-sm ${activeTab === 'archived' ? 'bg-text-primary text-bg-base' : 'text-text-secondary hover:text-text-primary'}`}
          >
            <ArchiveX size={12} />
            Archived
          </button>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
            <input 
              type="text"
              placeholder="Operational Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-bg-surface border border-brand-border pl-9 pr-4 py-2 text-[11px] font-medium tracking-tight text-text-primary focus:outline-none focus:border-brand-gold transition-colors shadow-inner"
            />
          </div>
          
          <select 
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value as any)}
            className="bg-bg-surface border border-brand-border px-3 py-2 text-[11px] font-bold uppercase tracking-tighter text-text-secondary focus:outline-none focus:border-brand-gold cursor-pointer transition-all shadow-sm"
          >
            <option value="all">All Priorities</option>
            <option value="high">Critical Only</option>
            <option value="medium">Medium Only</option>
            <option value="low">Low Support</option>
          </select>

          <div className="flex items-center gap-1 bg-bg-surface p-1 rounded-sm border border-brand-border">
            <button 
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-sm transition-all shadow-sm ${viewMode === 'kanban' ? 'bg-bg-elevated text-brand-gold' : 'text-text-muted hover:text-text-secondary'}`}
              title="Board View"
            >
              <LayoutGrid size={13} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-sm transition-all shadow-sm ${viewMode === 'list' ? 'bg-bg-elevated text-brand-gold' : 'text-text-muted hover:text-text-secondary'}`}
              title="List View"
            >
              <List size={13} />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <div className="min-h-[500px]">
          {viewMode === 'kanban' && activeTab === 'active' ? (
            <KanbanView 
              tasks={filteredTasks} 
              onEdit={handleEdit}
              onStatusChange={updateStatus}
              onArchive={toggleArchive}
              onDelete={handleDelete}
            />
          ) : (
            <ListView 
              tasks={filteredTasks} 
              onEdit={handleEdit}
              onStatusChange={updateStatus}
              onArchive={toggleArchive}
              onDelete={handleDelete}
            />
          )}
        </div>
      )}

      <TaskFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingTask}
      />
    </div>
  );
};
