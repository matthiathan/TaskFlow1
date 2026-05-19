import React, { useState } from 'react';
import { Shield, Search, UserCog, Mail } from 'lucide-react';
import { useProfilesData } from '../hooks/useProfilesData';
import { Spinner } from '../components/ui/LoadingScreen';
import { UserRole } from '../types/database';

export const AdminUsersPage: React.FC = () => {
  const { profiles, loading, updateUserRole } = useProfilesData();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProfiles = profiles.filter(profile => 
    profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
    const styles = {
      admin: 'bg-red-500/10 text-red-500 border-red-500/20',
      road_tech: 'bg-brand-gold/10 text-brand-gold border-brand-gold/20',
      user: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    };

    return (
      <span className={`px-2 py-0.5 rounded-sm border text-[9px] font-bold uppercase tracking-wider ${styles[role] || styles.user}`}>
        {role.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl text-text-primary tracking-tight uppercase mb-1">Access Control</h1>
          <p className="text-text-secondary font-serif italic">Security Clearance & Personnel Management</p>
        </div>
      </div>

      {/* Toolbar / Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-bg-elevated p-4 border border-brand-border shadow-sm rounded-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
          <input 
            type="text"
            placeholder="Search personnel by name or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-bg-surface border border-brand-border pl-9 pr-4 py-2 text-[11px] font-medium tracking-tight text-text-primary focus:outline-none focus:border-brand-gold transition-colors shadow-inner"
          />
        </div>
        <div className="flex items-center gap-2 text-text-muted text-xs uppercase tracking-widest font-bold">
          <Shield size={14} className="text-brand-gold" />
          <span>Admin Override Active</span>
        </div>
      </div>

      {/* Personnel List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <div className="bg-bg-surface border border-brand-border rounded-sm shadow-sm overflow-hidden">
          <div className="divide-y divide-brand-border">
            {filteredProfiles.map(profile => (
              <div key={profile.id} className="p-4 hover:bg-bg-elevated transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* User Info */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 bg-bg-elevated border border-brand-border flex items-center justify-center font-serif text-lg font-bold text-brand-gold shadow-sm">
                    {profile.full_name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                      {profile.full_name || 'Unknown Agent'}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-xs text-text-secondary">
                      <Mail size={12} />
                      {profile.email}
                    </div>
                  </div>
                </div>

                {/* Role Management */}
                <div className="flex items-center gap-4">
                  <RoleBadge role={profile.role} />
                  
                  <div className="flex items-center gap-2 bg-bg-base px-3 py-1.5 border border-brand-border rounded-sm">
                    <UserCog size={14} className="text-text-muted" />
                    <select 
                      value={profile.role}
                      onChange={(e) => updateUserRole(profile.id, e.target.value as UserRole)}
                      className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-text-primary focus:outline-none cursor-pointer"
                    >
                      <option value="user">Standard Access</option>
                      <option value="road_tech">Road Tech</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
