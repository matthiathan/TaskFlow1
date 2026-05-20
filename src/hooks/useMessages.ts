import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Message, Profile } from '../types/database';
import { toast } from 'sonner';

export const useMessages = (recipientId?: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('messages')
        .select('*, sender_profile:profiles!sender_id(*)');

      if (recipientId) {
        // Direct messages between current user and selection
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          query = query.or(`and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`);
        }
      } else {
        // Global / Public messages (recipient_id is NULL)
        query = query.is('recipient_id', null);
      }

      const { data, error } = await query
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      setMessages(data || []);
    } catch (err: any) {
      toast.error(`Comms Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [recipientId]);

  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`messages_${recipientId || 'global'}`)
      .on('postgres_changes' as any, { 
        event: 'INSERT', 
        table: 'messages'
      } as any, async (payload: any) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const isRelevant = !recipientId 
          ? payload.new.recipient_id === null
          : (payload.new.sender_id === user.id && payload.new.recipient_id === recipientId) ||
            (payload.new.sender_id === recipientId && payload.new.recipient_id === user.id);

        if (!isRelevant) return;

        // Fetch profile for the new message
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', payload.new.sender_id)
          .single();

        const newMessage = { ...payload.new, sender_profile: profile } as Message;
        
        setMessages(prev => {
          if (prev.some(m => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMessages, recipientId]);

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
        recipient_id: recipientId || null,
      };
      
      setMessages(prev => [...prev, optimisticMessage]);

      const { error } = await supabase
        .from('messages')
        .insert([{
          id: tempId,
          content,
          sender_id: user.id,
          recipient_id: recipientId || null
        }]);

      if (error) throw error;
    } catch (err: any) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      toast.error(`Transmission Failed: ${err.message}`);
    }
  };

  return { messages, loading, sendMessage };
};
