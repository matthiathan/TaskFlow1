import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Profile, ErpPermission } from '../../types/database';
import { Database, Lock, Unlock, Trash, ShieldCheck, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

export const ErpAccessManager: React.FC = () => {
  const { role } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [permissions, setPermissions] = useState<ErpPermission[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [selectedUserId, setSelectedUserId] = useState('');
  const [tableName, setTableName] = useState('');
  const [canRead, setCanRead] = useState(false);
  const [canWrite, setCanWrite] = useState(false);

  useEffect(() => {
    if (role !== 'admin') return;
    fetchData();
  }, [role]);

  const fetchData = async () => {
    setLoading(true);
    const [profilesRes, permsRes] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('erp_table_permissions').select('*')
    ]);

    if (profilesRes.data) setProfiles(profilesRes.data);
    if (permsRes.data) setPermissions(permsRes.data);
    setLoading(false);
  };

  const handleUpsert = async () => {
    if (!selectedUserId || !tableName) {
      toast.error('User and Table Name are required');
      return;
    }

    const { error } = await supabase
      .from('erp_table_permissions')
      .upsert({
        user_id: selectedUserId,
        table_name: tableName,
        can_read: canRead,
        can_write: canWrite
      }, { onConflict: 'user_id, table_name' });

    if (error) {
      toast.error('Failed to save permission: ' + error.message);
    } else {
      toast.success('Permission saved');
      setTableName('');
      setCanRead(false);
      setCanWrite(false);
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('erp_table_permissions').delete().eq('id', id);
    if (error) {
      toast.error('Failed to revoke access: ' + error.message);
    } else {
      toast.success('Access revoked');
      fetchData();
    }
  };

  if (role !== 'admin') {
    return <div className="p-6 text-red-600 font-bold">Admin Access Required</div>;
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-8 h-8 text-brand-gold" />
        <h1 className="text-2xl font-bold text-text-primary">ERP Access Manager</h1>
      </div>

      {/* Form Panel */}
      <div className="bg-bg-elevated border border-brand-border p-6 rounded-2xl shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-text-primary">Assign Permissions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-secondary">User</label>
            <select 
              value={selectedUserId} 
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full p-2.5 bg-bg-base border border-brand-border rounded-xl text-sm text-text-primary"
            >
              <option value="">Select User</option>
              {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-text-secondary">Table Name</label>
            <input 
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="e.g. erp_inventory"
              className="w-full p-2.5 bg-bg-base border border-brand-border rounded-xl text-sm text-text-primary"
            />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-text-secondary font-medium">
              <input type="checkbox" checked={canRead} onChange={e => setCanRead(e.target.checked)} />
              Read
            </label>
            <label className="flex items-center gap-2 text-sm text-text-secondary font-medium">
              <input type="checkbox" checked={canWrite} onChange={e => setCanWrite(e.target.checked)} />
              Write
            </label>
          </div>
          <button 
            onClick={handleUpsert}
            className="bg-brand-gold text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-gold/90 transition-colors"
          >
            Save Permission
          </button>
        </div>
      </div>

      {/* Table Panel */}
      <div className="bg-bg-elevated border border-brand-border rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg-base border-b border-brand-border text-text-secondary">
            <tr className="text-left">
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Table</th>
              <th className="px-6 py-3">Read</th>
              <th className="px-6 py-3">Write</th>
              <th className="px-6 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {permissions.map((perm) => (
              <tr key={perm.id}>
                <td className="px-6 py-4 font-medium text-text-primary">
                  {profiles.find(p => p.id === perm.user_id)?.full_name || 'Unknown'}
                </td>
                <td className="px-6 py-4 font-mono text-xs">{perm.table_name}</td>
                <td className="px-6 py-4">{perm.can_read ? <Unlock className="w-4 h-4 text-emerald-500" /> : <Lock className="w-4 h-4 text-gray-400" />}</td>
                <td className="px-6 py-4">{perm.can_write ? <Unlock className="w-4 h-4 text-emerald-500" /> : <Lock className="w-4 h-4 text-gray-400" />}</td>
                <td className="px-6 py-4">
                  <button onClick={() => handleDelete(perm.id)} className="text-red-500 hover:text-red-700">
                    <Trash className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
