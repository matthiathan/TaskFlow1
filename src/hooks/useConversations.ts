import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Conversation, Profile } from '../types/database';
import { useAuth } from '../contexts/AuthContext';

export const useConversations = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // 1. Try to fetch from the dedicated conversations table
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .gte('last_message_at', thirtyDaysAgo.toISOString())
        .order('last_message_at', { ascending: false });

      if (!error && data && data.length > 0) {
        // Filter out conversations deleted by the current user
        const filtered = data.filter(c => {
          if (c.user_a === user.id) return !c.is_deleted_a;
          return !c.is_deleted_b;
        });

        const enriched = await Promise.all(filtered.map(async (conv) => {
          const otherId = conv.user_a === user.id ? conv.user_b : conv.user_a;
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', otherId)
            .single();
          
          return {
            ...conv,
            participant: profile as Profile
          };
        }));

        setConversations(enriched);
        return;
      }

      // 2. Fallback: Derive from message history if conversations table is empty
      const { data: messages, error: msgError } = await supabase
        .from('messages')
        .select('*, sender_profile:profiles!sender_id(*), recipient_profile:profiles!recipient_id(*)')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .not('recipient_id', 'is', null) // Only direct messages
        .order('created_at', { ascending: false })
        .limit(100);

      if (msgError) throw msgError;

      const pairs = new Map<string, Conversation>();
      
      messages?.forEach(msg => {
        const otherProfile = msg.sender_id === user.id ? msg.recipient_profile : msg.sender_profile;
        if (!otherProfile) return;
        
        const pairId = [user.id, otherProfile.id].sort().join(':');
        if (!pairs.has(pairId)) {
          pairs.set(pairId, {
            id: pairId,
            user_a: [user.id, otherProfile.id].sort()[0],
            user_b: [user.id, otherProfile.id].sort()[1],
            last_message_at: msg.created_at,
            is_deleted_a: false,
            is_deleted_b: false,
            participant: otherProfile as unknown as Profile
          });
        }
      });

      setConversations(Array.from(pairs.values()));
    } catch (err) {
      console.error('Failed to resolve conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
    
    const channel = supabase
      .channel('conversations_sync')
      .on('postgres_changes', { 
        event: '*', 
        table: 'conversations',
        schema: 'public'
      }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchConversations]);

  const deleteConversation = async (id: string) => {
    if (!user) return;
    const conversation = conversations.find(c => c.id === id);
    if (!conversation) return;

    const field = conversation.user_a === user.id ? 'is_deleted_a' : 'is_deleted_b';
    
    const { error } = await supabase
      .from('conversations')
      .update({ [field]: true })
      .eq('id', id);

    if (error) throw error;
    setConversations(prev => prev.filter(c => c.id !== id));
  };

  return { conversations, loading, deleteConversation, refresh: fetchConversations };
};
