import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  CheckSquare, 
  MessageSquare, 
  ClipboardList,
  Settings, 
  ShieldCheck, 
  LogOut,
  Moon,
  Sun,
  LayoutDashboard,
  Calendar as CalendarIcon
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
 
const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['user', 'tech', 'admin'] },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks', roles: ['user', 'tech', 'admin'] },
  { icon: CalendarIcon, label: 'Calendar', path: '/calendar', roles: ['user', 'tech', 'admin'] },
  { icon: ClipboardList, label: 'Service Tickets', path: '/reporting', roles: ['tech', 'admin'] },
  { icon: MessageSquare, label: 'Communications', path: '/chat', roles: ['user', 'tech', 'admin'] },
  { icon: Settings, label: 'Settings', path: '/settings', roles: ['user', 'tech', 'admin'] },
  { icon: ShieldCheck, label: 'Admin Panel', path: '/admin', roles: ['admin'] },
];

export const Sidebar: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { theme, toggleTheme } = useTheme();
  const { profile, role, logout } = useAuth(); 

  const allowedItems = navItems.filter(item => item.roles.includes(role || 'user'));

  return (
    <aside className="w-64 h-full border-r border-brand-border bg-bg-elevated flex flex-col">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-brand-gold flex items-center justify-center rounded-xl shadow-md shadow-brand-gold/15">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text-primary">Dallmayr SA</h2>
            <p className="text-xs text-text-secondary">Corporate Portal</p>
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
              <span className="text-xs font-bold text-brand-gold">{(profile?.full_name || 'U').charAt(0)}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-text-primary truncate">{profile?.full_name || 'User Profile'}</p>
            <p className="text-xs text-brand-gold capitalize font-medium">{role || 'Standard User'}</p>
          </div>
        </div>

        <div className="flex items-center justify-between px-2">
          <button 
            onClick={toggleTheme}
            className="p-2 text-text-secondary hover:text-brand-gold transition-colors"
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button 
            onClick={logout}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-red-500 transition-colors"
          >
            <LogOut size={14} />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
