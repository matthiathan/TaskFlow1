import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Profile, Role } from '../types/database';
import { Card, Button } from '../components/ui/Base';
import { ShieldCheck, Users, Search, Filter, ShieldAlert, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

export const AdminPage: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (err: any) {
      toast.error(`Admin Link Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (userId: string, role: Role) => {
    setUpdating(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);

      if (error) throw error;
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role } : p));
      toast.success(`Security Clearance Updated: ${role.toUpperCase()}`);
    } catch (err: any) {
      toast.error(`Override Failed: ${err.message}`);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-serif uppercase tracking-[0.1em]">Security Oversight</h1>
          <p className="text-text-secondary text-sm mt-1">Personnel management and RBAC authorization protocols.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary group-focus-within:text-brand-gold transition-colors" />
            <input 
              type="text" 
              placeholder="Search Personnel ID..." 
              className="bg-bg-elevated border border-brand-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-brand-gold transition-all w-64"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-bg-elevated/50 border-b border-brand-border">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">Personnel</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">Clearance</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">Joined</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={4} className="px-6 py-8">
                        <div className="h-4 bg-bg-elevated rounded w-full" />
                      </td>
                    </tr>
                  ))
                ) : profiles.map((profile) => (
                  <tr key={profile.id} className="hover:bg-bg-elevated/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center overflow-hidden">
                          {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <ShieldCheck className="w-5 h-5 text-brand-gold" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-primary">{profile.full_name || 'Anonymous Agent'}</p>
                          <p className="text-[10px] text-text-secondary font-medium">{profile.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                        profile.role === 'admin' ? "bg-red-500/10 text-red-500 border-red-500/20" :
                        profile.role === 'tech' ? "bg-brand-gold/10 text-brand-gold border-brand-gold/20" :
                        "bg-blue-500/10 text-blue-500 border-blue-500/20"
                      )}>
                        {profile.role === 'admin' && <ShieldAlert className="w-3 h-3" />}
                        {profile.role}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-bold text-text-secondary uppercase">
                        {new Date(profile.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {(['user', 'tech', 'admin'] as Role[]).map((r) => (
                          <button
                            key={r}
                            onClick={() => updateRole(profile.id, r)}
                            disabled={profile.role === r || updating === profile.id}
                            className={cn(
                              "px-2 py-1 text-[8px] font-black uppercase rounded transition-all",
                              profile.role === r 
                                ? "bg-brand-gold text-white" 
                                : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated border border-brand-border"
                            )}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 border-l-4 border-l-red-500">
          <div className="flex gap-4">
            <div className="p-3 bg-red-500/10 rounded-xl h-fit">
              <ShieldAlert className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-text-primary mb-1">Administrative Warning</h4>
              <p className="text-[10px] text-text-secondary leading-relaxed uppercase tracking-tight">
                Role modification affects entire cluster access. Ensure personnel verification before escalating security clearing.
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 border-l-4 border-l-brand-gold">
          <div className="flex gap-4">
            <div className="p-3 bg-brand-gold/10 rounded-xl h-fit">
              <Users className="w-6 h-6 text-brand-gold" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-text-primary mb-1">Automatic Enrollment</h4>
              <p className="text-[10px] text-text-secondary leading-relaxed uppercase tracking-tight">
                Database trigger automatically assigns 'USER' clearance to all new entities.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
