import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Profile, Role, TaskPriority } from '../types/database';
import { Card, Button, Input } from '../components/ui/Base';
import { 
  ShieldCheck, 
  Users, 
  Search, 
  ShieldAlert, 
  Trash2, 
  Key, 
  UserPlus, 
  X, 
  Lock,
  Mail,
  User as UserIcon,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { TicketArchiveMenu } from '../components/reporting/TicketArchiveMenu';

export const AdminPage: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState<{id: string, name: string} | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'user' as Role
  });

  const [resetPassword, setResetPassword] = useState('');

  useEffect(() => {
    fetchProfiles();
  }, []);

  const getHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`
    };
  };

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users', {
        headers: await getHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch auth users');
      const { users } = await response.json();
      const mappedProfiles = (users || []).map((u: any) => ({
        id: u.id,
        email: u.email,
        full_name: u.user_metadata?.full_name || u.email.split('@')[0],
        avatar_url: u.user_metadata?.avatar_url || null,
        role: u.user_metadata?.role || 'user',
        created_at: u.created_at
      })).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setProfiles(mappedProfiles);
    } catch (err: any) {
      toast.error(`Admin Sync Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading('create');
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: await getHeaders(),
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      toast.success('Personnel Enrolled Successfully');
      setShowCreateModal(false);
      setFormData({ email: '', password: '', full_name: '', role: 'user' });
      fetchProfiles();
    } catch (err: any) {
      toast.error(`Enrollment Failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async () => {
    if (!showResetModal || !resetPassword) return;
    setActionLoading('reset');
    try {
      const response = await fetch(`/api/admin/users/${showResetModal.id}`, {
        method: 'PATCH',
        headers: await getHeaders(),
        body: JSON.stringify({ password: resetPassword })
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      toast.success(`Identity Vectors Reset for ${showResetModal.name}`);
      setShowResetModal(null);
      setResetPassword('');
    } catch (err: any) {
      toast.error(`Reset Failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    const originalProfiles = [...profiles];
    setProfiles(prev => prev.filter(p => p.id !== id));
    setActionLoading(id);
    
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: await getHeaders()
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      toast.success('Personnel Purged Successfully');
    } catch (err: any) {
      setProfiles(originalProfiles);
      toast.error(`Purge Failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const updateRole = async (userId: string, role: Role) => {
    setActionLoading(userId);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: await getHeaders(),
        body: JSON.stringify({ role })
      });
      
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, role } : p));
      toast.success(`Clearance Updated: ${role.toUpperCase()}`);
    } catch (err: any) {
      toast.error(`Override Failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-serif uppercase tracking-[0.1em]">Users</h1>
          <p className="text-text-secondary text-sm mt-1">Manage users and roles.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="px-6 uppercase font-black text-[10px] tracking-[0.2em]"
          >
            <UserPlus className="w-4 h-4" />
            Enroll Personnel
          </Button>
          <button 
            onClick={fetchProfiles}
            className="p-2.5 bg-bg-elevated border border-brand-border rounded-xl hover:border-brand-gold transition-colors"
          >
            <RefreshCw className={cn("w-4 h-4 text-text-secondary", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-brand-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className="bg-bg-elevated/50 border-b border-brand-border">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">Personnel</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">Clearance</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {loading && profiles.length === 0 ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={4} className="px-6 py-8">
                        <div className="h-4 bg-bg-elevated rounded w-full" />
                      </td>
                    </tr>
                  ))
                ) : profiles.map((profile) => (
                  <tr key={profile.id} className="hover:bg-bg-elevated/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-gold/10 border border-brand-border flex items-center justify-center overflow-hidden">
                          {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon className="w-5 h-5 text-brand-gold" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-primary">{profile.full_name || 'ANONYMOUS AGENT'}</p>
                          <p className="text-[10px] text-text-secondary font-medium uppercase tracking-tight">{profile.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {(['user', 'tech', 'admin', 'ops_manager', 'road_tech'] as Role[]).map((r) => (
                          <button
                            key={r}
                            onClick={() => updateRole(profile.id, r)}
                            disabled={profile.role === r || actionLoading === profile.id}
                            className={cn(
                              "px-2 py-1 text-[8px] font-black uppercase rounded border transition-all",
                              profile.role === r 
                                ? r === 'admin' || r === 'ops_manager' ? "bg-red-500 text-white border-red-500" : "bg-brand-gold text-white border-brand-gold"
                                : "text-text-secondary border-brand-border hover:border-brand-gold hover:text-brand-gold"
                            )}
                          >
                            {r.replace('_', ' ')}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[9px] font-black uppercase text-text-secondary tracking-widest bg-bg-base border border-brand-border px-2 py-0.5 rounded">
                        ACTIVE NODE
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setShowResetModal({ id: profile.id, name: profile.full_name || profile.email })}
                          className="p-2 bg-bg-elevated border border-brand-border rounded-lg text-text-secondary hover:text-brand-gold hover:border-brand-gold transition-all"
                          title="Override Passcode"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(profile.id, profile.full_name || profile.email)}
                          disabled={actionLoading === profile.id}
                          className="p-2 bg-bg-elevated border border-brand-border rounded-lg text-text-secondary hover:text-red-500 hover:border-red-500 transition-all"
                          title="Purge Identity"
                        >
                          {actionLoading === profile.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Enrollment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-md p-8 bg-bg-elevated border-brand-gold/30 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-gold/10 rounded-xl">
                  <UserPlus className="w-5 h-5 text-brand-gold" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-text-primary">Enroll Personnel</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-text-secondary hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <Input 
                label="Personnel Name"
                icon={<UserIcon className="w-4 h-4" />}
                value={formData.full_name}
                onChange={e => setFormData(p => ({ ...p, full_name: e.target.value }))}
                placeholder="Agent designation..."
                required
              />
              <Input 
                label="Email Uplink"
                type="email"
                icon={<Mail className="w-4 h-4" />}
                value={formData.email}
                onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                placeholder="security@uplink.net"
                required
              />
              <Input 
                label="Initial Passcode"
                type="password"
                icon={<Lock className="w-4 h-4" />}
                value={formData.password}
                onChange={e => setFormData(p => ({ ...p, password: e.target.value }))}
                placeholder="••••••••"
                required
              />
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Security Clearance</label>
                <select 
                  className="w-full bg-bg-base border border-brand-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-gold transition-all"
                  value={formData.role}
                  onChange={e => setFormData(p => ({ ...p, role: e.target.value as Role }))}
                >
                  <option value="user">USER - Standard</option>
                  <option value="tech">TECH - Field Access</option>
                  <option value="ops_manager">OPS MANAGER - Fleet Route Planner</option>
                  <option value="road_tech">ROAD TECH - Field Driver Itinerary</option>
                  <option value="admin">ADMIN - Global Override</option>
                </select>
              </div>

              <Button 
                type="submit" 
                isLoading={actionLoading === 'create'} 
                className="w-full py-4 uppercase font-black text-[10px] tracking-[0.2em] mt-4"
              >
                Establish Credentials
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-sm p-8 bg-bg-elevated border-brand-gold/30 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-gold/10 rounded-xl">
                  <Key className="w-5 h-5 text-brand-gold" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-text-primary">Passcode Override</h3>
                  <p className="text-[10px] font-bold text-text-secondary uppercase">{showResetModal.name}</p>
                </div>
              </div>
              <button onClick={() => setShowResetModal(null)} className="text-text-secondary hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <Input 
                label="New Override String"
                type="password"
                icon={<Lock className="w-4 h-4" />}
                value={resetPassword}
                onChange={e => setResetPassword(e.target.value)}
                placeholder="Enter new credentials..."
                required
              />

              <div className="flex gap-3">
                <Button 
                  variant="secondary" 
                  onClick={() => setShowResetModal(null)}
                  className="flex-grow py-3 uppercase text-[9px] font-black"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleResetPassword}
                  isLoading={actionLoading === 'reset'}
                  className="flex-[2] py-3 uppercase text-[9px] font-black"
                >
                  Confirm Reset
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Warning Panel */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 opacity-80 mb-8">
        <div className="flex gap-4 p-4 bg-red-500/5 border border-red-500/10 rounded-2xl">
          <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-[10px] text-text-secondary leading-relaxed uppercase tracking-tight font-medium">
            <strong className="text-red-500">Node Termination:</strong> Deleting a user will permanently revoke access. This action cannot be undone within the current cluster epoch.
          </p>
        </div>
        <div className="flex gap-4 p-4 bg-brand-gold/5 border border-brand-gold/10 rounded-2xl">
          <Lock className="w-5 h-5 text-brand-gold flex-shrink-0" />
          <p className="text-[10px] text-text-secondary leading-relaxed uppercase tracking-tight font-medium">
            <strong className="text-brand-gold">Administrative Proxy:</strong> All resets and creations are logged via the secure backend proxy using service-level clearance.
          </p>
        </div>
      </div>

      <TicketArchiveMenu />
    </div>
  );
};

