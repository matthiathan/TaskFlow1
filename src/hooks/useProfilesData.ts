import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile, UserRole } from '../types/database';

export const useProfilesData = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const updateUserRole = async (id: string, newRole: UserRole) => {
    const originalProfiles = [...profiles];
    
    // Optimistic update for UI speed
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, role: newRole } : p));

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', id);

      if (error) throw error;
    } catch (err: any) {
      // Rollback on failure
      setProfiles(originalProfiles);
      alert(`Protocol Error: Failed to update role. ${err.message}`);
      throw err;
    }
  };

  return { profiles, loading, error, updateUserRole, refresh: fetchProfiles };
};
