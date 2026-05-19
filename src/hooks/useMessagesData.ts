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

    // Realtime subscription
    const channel = supabase
      .channel(`chat:${[user.id, recipientId].sort().join('-')}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          if (newMessage.sender_id === recipientId) {
            setMessages((prev) => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
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
