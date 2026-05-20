import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Ticket, TaskPriority } from '../types/database';
import { toast } from 'sonner';
import CryptoJS from 'crypto-js';

// In a real production app, this would be injected via secure ENV or user-provided key.
// Here we use a system-level key for demonstration of the client-side encryption principle.
const ENCRYPTION_KEY = import.meta.env.VITE_TICKET_SECRET || 'dallmayr-secure-uplink-256';

export const useTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);

  const encrypt = (text: string) => {
    return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
  };

  const decrypt = (ciphertext: string) => {
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch {
      return '[DECRYPTION ERROR: KEY MISMATCH]';
    }
  };

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (err: any) {
      toast.error(`Logistics Failure: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  const submitTicket = async (ticket: {
    title: string;
    description: string;
    priority: TaskPriority;
    attachment_urls: string[];
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Auth protocol required');

      const encryptedDescription = encrypt(ticket.description);

      const { data, error } = await supabase
        .from('tickets')
        .insert([{
          title: ticket.title,
          description_encrypted: encryptedDescription,
          priority: ticket.priority,
          status: 'open',
          attachment_urls: ticket.attachment_urls,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      toast.success('Manifest Encrypted & Transmitted');
      return data;
    } catch (err: any) {
      toast.error(`Uplink Failed: ${err.message}`);
      throw err;
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
    deleteAttachment,
    decrypt 
  };
};
