import React, { useState } from 'react';
import { useTasksData } from '../hooks/useTasksData';
import { CalendarGrid } from '../components/calendar/CalendarGrid';
import { TaskFormModal } from '../components/tasks/TaskFormModal';
import { Task } from '../types/database';
import { Spinner } from '../components/ui/LoadingScreen';
import { format } from 'date-fns';

export const CalendarPage: React.FC = () => {
  const { tasks, loading, addTask, updateTask } = useTasksData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [prefilledDate, setPrefilledDate] = useState<string | null>(null);

  const handleDateClick = (date: Date) => {
    setEditingTask(null);
    setPrefilledDate(format(date, 'yyyy-MM-dd'));
    setIsModalOpen(true);
  };

  const handleTaskClick = (task: Task) => {
    setEditingTask(task);
    setPrefilledDate(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (formData: Omit<Task, 'id'>) => {
    if (editingTask) {
      await updateTask(editingTask.id, formData);
    } else {
      await addTask(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-brand-charcoal tracking-tight uppercase mb-1">Live Schedule</h1>
          <p className="text-brand-charcoal/40 font-serif italic">Operational Timeline | Temporal Resource Mapping</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <CalendarGrid 
          tasks={tasks}
          onDateClick={handleDateClick}
          onTaskClick={handleTaskClick}
        />
      )}

      <TaskFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingTask ? editingTask : (prefilledDate ? { 
          title: '', 
          description: '', 
          status: 'todo', 
          priority: 'medium', 
          start_date: prefilledDate, 
          due_date: prefilledDate,
          is_archived: false,
          id: '' // Placeholder
        } as any : null)}
      />
    </div>
  );
};
