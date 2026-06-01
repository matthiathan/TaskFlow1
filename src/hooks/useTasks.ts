import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Task, TaskStatus } from '../types/database';
import { toast } from 'sonner';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('user_id', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setTasks(data || []);
    } catch (err: any) {
      toast.error(`Fetch Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();

    // Set up real-time subscription
    const channel = supabase
      .channel('tasks_changes')
      .on('postgres_changes' as any, { event: '*', table: 'tasks' } as any, () => {
        fetchTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTasks]);

  const addTask = async (task: Omit<Task, 'id' | 'created_at' | 'user_id'>) => {
    const tempId = crypto.randomUUID();
    const optimisticTask = { ...task, id: tempId, created_at: new Date().toISOString(), user_id: 'temp' } as Task;
    
    setTasks(prev => [optimisticTask, ...prev]);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('tasks')
        .insert([{ ...task, id: tempId, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      setTasks(prev => prev.map(t => t.id === tempId ? data : t));
      toast.success('Task initialized');
      return data;
    } catch (err: any) {
      setTasks(prev => prev.filter(t => t.id !== tempId));
      toast.error(`Creation Failed: ${err.message}`);
      throw err;
    }
  };

  const updateTaskStatus = async (id: string, status: TaskStatus) => {
    const originalTasks = [...tasks];
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    } catch (err: any) {
      setTasks(originalTasks);
      toast.error(`Update Failed: ${err.message}`);
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const originalTasks = [...tasks];
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));

    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setTasks(prev => prev.map(t => t.id === id ? data : t));
      return data;
    } catch (err: any) {
      setTasks(originalTasks);
      toast.error(`Update Failed: ${err.message}`);
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
      toast.success('Task decommissioned');
    } catch (err: any) {
      setTasks(originalTasks);
      toast.error(`Purge Failed: ${err.message}`);
    }
  };

  return { tasks, loading, addTask, updateTaskStatus, updateTask, deleteTask, refresh: fetchTasks };
};
