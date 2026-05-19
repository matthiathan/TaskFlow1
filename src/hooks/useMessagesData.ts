import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Message, Profile } from '../types/database';
import { useAuth } from '../contexts/AuthContext';

export const useMessagesData = (recipientId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<any>(null);

  const fetchMessages = useCallback(async () => {
    if (!user || !recipientId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${recipientId}),and(sender_id.eq.${recipientId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user, recipientId]);

  useEffect(() => {
    fetchMessages();

    if (!user || !recipientId) return;

    // Initialize Real-Time Protocol with broad filters but local refined logic
    // Using a more specific channel name to avoid cross-talk if possible
    const channelName = `chat:${[user.id, recipientId].sort().join('-')}`;
    const messagesSubscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'messages',
          filter: `or(sender_id.eq.${user.id},receiver_id.eq.${user.id})` // Basic filter for user
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as Message;
            // Guard: check if this message belongs to the current conversation
            const isRelevant = (newMessage.sender_id === user.id && newMessage.receiver_id === recipientId) || 
                              (newMessage.sender_id === recipientId && newMessage.receiver_id === user.id);
            
            if (isRelevant) {
              setMessages((prev) => {
                // Prevent duplicate if optimistic update already injected it locally or already updated
                if (prev.some((m) => m.id === newMessage.id)) return prev;
                return [...prev, newMessage];
              });
            }
          }
          if (payload.eventType === 'UPDATE') {
            const updatedMessage = payload.new as Message;
            // Only update if it belongs to current conversation
            const isRelevant = (updatedMessage.sender_id === user.id && updatedMessage.receiver_id === recipientId) || 
                              (updatedMessage.sender_id === recipientId && updatedMessage.receiver_id === user.id);
            
            if (isRelevant) {
              setMessages((prev) =>
                prev.map((m) => (m.id === updatedMessage.id ? updatedMessage : m))
              );
            }
          }
          if (payload.eventType === 'DELETE') {
            setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSubscription);
    };
  }, [user, recipientId, fetchMessages]);

  const sendMessage = async (content: string) => {
    if (!user || !recipientId) return;

    const tempId = crypto.randomUUID();
    const newMessage: Message = {
      id: tempId,
      sender_id: user.id,
      receiver_id: recipientId,
      content,
      is_read: false,
      created_at: new Date().toISOString()
    };

    // Optimistic update
    setMessages(prev => [...prev, newMessage]);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([{
          sender_id: user.id,
          receiver_id: recipientId,
          content,
          is_read: false
        }] as any)
        .select()
        .single();

      if (error) throw error;

      // Update optimistic with real one
      setMessages(prev => prev.map(m => m.id === tempId ? data : m));
      return data;
    } catch (err: any) {
      // Rollback
      setMessages(prev => prev.filter(m => m.id !== tempId));
      throw err;
    }
  };

  return {
    messages,
    loading,
    error,
    sendMessage
  };
};

export const useProfilesSearch = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  const searchProfiles = async (query: string) => {
    if (!query.trim()) {
      setProfiles([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('full_name', `%${query}%`)
        .limit(10);

      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    profiles,
    loading,
    searchProfiles
  };
};
