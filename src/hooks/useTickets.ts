import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Ticket, TaskPriority, TicketStatus } from '../types/database';
import { toast } from 'sonner';

export const useTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (err: any) {
      toast.error(`System Failure: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('public:tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTickets(prev => {
            const exists = prev.some(t => t.id === payload.new.id);
            if (!exists) return [payload.new as Ticket, ...prev];
            return prev;
          });
        } else if (payload.eventType === 'UPDATE') {
          setTickets(prev => prev.map(t => t.id === payload.new.id ? { ...t, ...payload.new as Ticket } : t));
        } else if (payload.eventType === 'DELETE') {
          setTickets(prev => prev.filter(t => t.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const submitTicket = async (ticket: {
    title: string;
    issue_description: string;
    priority: TaskPriority;
    qr_code?: string;
    serial_number?: string;
    occurrence_time?: string;
    machine_images?: string[];
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Auth protocol required');

      const { data, error } = await supabase
        .from('tickets')
        .insert([{
          title: ticket.title,
          issue_description: ticket.issue_description,
          priority: ticket.priority,
          status: 'awaiting_tech',
          qr_code: ticket.qr_code || null,
          serial_number: ticket.serial_number || null,
          occurrence_time: ticket.occurrence_time || null,
          machine_images: ticket.machine_images || [],
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      toast.success('Incident Logged & Synchronized');
      return data;
    } catch (err: any) {
      toast.error(`Uplink Failed: ${err.message}`);
      throw err;
    }
  };

  const updateTicketStatus = async (id: string, status: TicketStatus) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      setTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t));
    } catch (err: any) {
      toast.error(`Update Failed: ${err.message}`);
    }
  };

  const updateTicket = async (id: string, updates: Partial<Ticket>) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setTickets(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      toast.success('Ticket updated successfully');
    } catch (err: any) {
      toast.error(`Update Failed: ${err.message}`);
      throw err;
    }
  };

  const deleteTicket = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ deleted_at: new Date().toISOString() }) // THIS IS THE SOFT DELETE FIX
        .eq('id', id);

      if (error) throw error;
      await fetchTickets();
      toast.success('Ticket moved to archive successfully');
    } catch (err: any) {
      toast.error('Failed to archive ticket: ' + err.message);
    }
  };

  const deleteAttachment = async (url: string) => {
    try {
      // Extract file path from URL
      // URL format: https://.../storage/v1/object/public/tickets/filename.ext
      const parts = url.split('/');
      const filename = parts[parts.length - 1];
      
      const { error } = await supabase.storage
        .from('tickets')
        .remove([filename]);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Storage purge failed:', err);
      return false;
    }
  };

  return { 
    tickets, 
    loading, 
    fetchTickets, 
    submitTicket, 
    updateTicketStatus,
    updateTicket,
    deleteTicket,
    deleteAttachment
  };
};
