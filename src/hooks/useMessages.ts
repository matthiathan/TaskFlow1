import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Message, Profile } from '../types/database';
import { toast } from 'sonner';

export const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});

  const fetchMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender_profile:profiles(*)')
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      setMessages(data || []);
    } catch (err: any) {
      toast.error(`Comms Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel('messages_feed')
      .on('postgres_changes' as any, { 
        event: 'INSERT', 
        table: 'messages'
      } as any, async (payload: any) => {
        // Fetch profile for the new message
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', payload.new.sender_id)
          .single();

        const newMessage = { ...payload.new, sender_profile: profile } as Message;
        
        setMessages(prev => {
          // Check if message already exists (optimistic update might have added it)
          if (prev.some(m => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMessages]);

  const sendMessage = async (content: string) => {
    const tempId = crypto.randomUUID();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required');

      // Optimistic Update
      const optimisticMessage: Message = {
        id: tempId,
        created_at: new Date().toISOString(),
        content,
        sender_id: user.id,
      };
      
      setMessages(prev => [...prev, optimisticMessage]);

      const { error } = await supabase
        .from('messages')
        .insert([{
          id: tempId,
          content,
          sender_id: user.id
        }]);

      if (error) throw error;
    } catch (err: any) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      toast.error(`Transmission Failed: ${err.message}`);
    }
  };

  return { messages, loading, sendMessage };
};
