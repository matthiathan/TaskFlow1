import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Task, TaskStatus } from '../types/database';

export const useTasksData = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('due_date', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 1. Initial data fetch
    fetchTasks();

    // 2. Establish Real-Time Subscription
    const tasksSubscription = supabase
      .channel('tasks-live-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks((prev) => {
              // Prevent duplicates from our own optimistic updates
              if (prev.some((t) => t.id === payload.new.id)) return prev;
              
              // Add new task and re-sort by due_date
              const newTasks = [...prev, payload.new as Task];
              return newTasks.sort((a, b) => 
                new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
              );
            });
          }
          if (payload.eventType === 'UPDATE') {
            setTasks((prev) =>
              prev.map((t) => (t.id === payload.new.id ? (payload.new as Task) : t))
            );
          }
          if (payload.eventType === 'DELETE') {
            setTasks((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // 3. Cleanup connection when the user leaves the page
    return () => {
      supabase.removeChannel(tasksSubscription);
    };
  }, [fetchTasks]);

  const addTask = async (task: Omit<Task, 'id'>) => {
    const tempId = crypto.randomUUID();
    const newTask = { ...task, id: tempId } as Task;
    setTasks(prev => [newTask, ...prev]);

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([task] as any)
        .select()
        .single();

      if (error) throw error;
      setTasks(prev => prev.map(t => t.id === tempId ? data : t));
      return data;
    } catch (err: any) {
      setTasks(prev => prev.filter(t => t.id !== tempId));
      throw err;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const originalTasks = [...tasks];
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates as any)
        .eq('id', id);

      if (error) throw error;
    } catch (err: any) {
      setTasks(originalTasks);
      throw err;
    }
  };

  const deleteTask = async (id: string) => {
    const originalTasks = [...tasks];
    setTasks(prev => prev.filter(t => t.id !== id));

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err: any) {
      setTasks(originalTasks);
      throw err;
    }
  };

  const toggleArchive = async (id: string, isArchived: boolean) => {
    return updateTask(id, { is_archived: !isArchived });
  };

  const updateStatus = async (id: string, status: TaskStatus) => {
    return updateTask(id, { status });
  };

  return {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    toggleArchive,
    updateStatus,
    refresh: fetchTasks
  };
};
