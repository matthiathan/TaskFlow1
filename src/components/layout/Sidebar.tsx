import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  BarChart3, 
  CheckSquare, 
  MessageSquare, 
  ClipboardList,
  Users, 
  Settings, 
  ShieldCheck, 
  LogOut,
  Moon,
  Sun,
  LayoutDashboard,
  Calendar as CalendarIcon
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
 
const navItems = [
  { icon: LayoutDashboard, label: 'Ops Desk', path: '/dashboard', roles: ['user', 'tech', 'admin'] },
  { icon: CheckSquare, label: 'Task Intel', path: '/tasks', roles: ['user', 'tech', 'admin'] },
  { icon: CalendarIcon, label: 'Scheduling', path: '/calendar', roles: ['user', 'tech', 'admin'] },
  { icon: ClipboardList, label: 'Reporting Hub', path: '/reporting', roles: ['tech', 'admin'] },
  { icon: MessageSquare, label: 'Secure Comms', path: '/chat', roles: ['user', 'tech', 'admin'] },
  { icon: Settings, label: 'Security Panel', path: '/settings', roles: ['user', 'tech', 'admin'] },
  { icon: ShieldCheck, label: 'Admin Hub', path: '/admin', roles: ['admin'] },
];

export const Sidebar: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { theme, toggleTheme } = useTheme();
  const { profile, role, logout } = useAuth(); 

  const allowedItems = navItems.filter(item => item.roles.includes(role || 'user'));

  return (
    <aside className="w-64 h-full border-r border-brand-border bg-bg-elevated flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-brand-gold flex items-center justify-center rounded-xl shadow-lg shadow-brand-gold/20">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-text-primary">OpsPortal</h2>
            <p className="text-[8px] text-text-secondary font-bold uppercase tracking-[0.2em] -mt-1">Dallmayr SA</p>
          </div>
        </div>

        <nav className="space-y-1">
          {allowedItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group',
                isActive 
                  ? 'bg-brand-gold text-white shadow-md shadow-brand-gold/10' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-base border border-transparent hover:border-brand-border'
              )}
            >
              {({ isActive }) => (
                <>
                  <item.icon className={cn('w-4 h-4', isActive ? 'text-white' : 'text-text-secondary group-hover:text-brand-gold')} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 space-y-4">
        {/* User Profile */}
        <div className="p-4 bg-bg-base border border-brand-border rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-center overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] font-black text-brand-gold">{(profile?.full_name || 'U').charAt(0)}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black text-text-primary truncate">{profile?.full_name || 'Unknown'}</p>
            <p className="text-[8px] font-bold text-brand-gold uppercase tracking-widest">{role || 'Standard'}</p>
          </div>
        </div>

        <div className="flex items-center justify-between px-2">
          <button 
            onClick={toggleTheme}
            className="p-2 text-text-secondary hover:text-brand-gold transition-colors"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button 
            onClick={logout}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-red-500 transition-colors"
          >
            <LogOut size={14} />
            <span>Terminate</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
