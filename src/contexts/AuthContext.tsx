import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { Profile, Role } from '../types/database';

interface AuthContextType {
  user: any;
  profile: Profile | null;
  loading: boolean;
  role: Role | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
    // Check active sessions
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Inactivity Logout (10 minutes)
  useEffect(() => {
    if (!user) return;

    let timeout: NodeJS.Timeout;

    const resetTimer = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        logout();
      }, 10 * 60 * 1000); // 10 minutes
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    
    const activityHandler = () => resetTimer();

    events.forEach(event => document.addEventListener(event, activityHandler));
    resetTimer();

    return () => {
      if (timeout) clearTimeout(timeout);
      events.forEach(event => document.removeEventListener(event, activityHandler));
    };
  }, [user]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, role: profile?.role || null, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
