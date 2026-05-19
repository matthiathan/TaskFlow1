import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList, 
  ShieldCheck, 
  Settings, 
  LogOut,
  ChevronRight,
  MessageSquare,
  Calendar,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../lib/supabase';

export const Sidebar: React.FC = () => {
  const { profile, isAdmin, isRoadTech } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'road_tech', 'user'] },
    { to: '/tasks', label: 'Operations Ops', icon: ClipboardList, roles: ['admin', 'road_tech', 'user'] },
    { to: '/calendar', label: 'Live Schedule', icon: Calendar, roles: ['admin', 'road_tech', 'user'] },
    { to: '/erp-requests', label: 'ERP Technical', icon: Settings, roles: ['admin', 'road_tech'] },
    { to: '/verifications', label: 'Asset Audits', icon: ShieldCheck, roles: ['admin', 'road_tech'] },
    { to: '/messages', label: 'Internal Comms', icon: MessageSquare, roles: ['admin', 'road_tech', 'user'] },
  ];

  const filteredItems = navItems.filter(item => 
    profile?.role && item.roles.includes(profile.role)
  );

  return (
    <div className="w-64 h-full bg-bg-surface text-text-primary flex flex-col shadow-2xl z-20 border-r border-brand-border transition-colors duration-300">
      <div className="p-8">
        <h1 className="text-2xl font-serif tracking-widest text-brand-gold italic">DALLMAYR</h1>
        <p className="text-[9px] text-text-secondary uppercase tracking-[0.3em] mt-1">South Africa</p>
      </div>

      <div className="flex-1 px-4 py-4 space-y-1">
        {filteredItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `
              group flex items-center justify-between px-4 py-3 text-xs tracking-wider uppercase transition-all duration-300
              ${isActive 
                ? 'bg-brand-gold text-brand-charcoal font-semibold border-r-4 border-brand-charcoal' 
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'}
            `}
          >
            {({ isActive }) => (
              <>
                <div className="flex items-center gap-4">
                  <item.icon className={`w-4 h-4 shadow-sm ${isActive ? 'text-brand-charcoal' : 'text-brand-gold'}`} />
                  <span>{item.label}</span>
                </div>
                <ChevronRight className={`w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'text-brand-charcoal' : ''}`} />
              </>
            )}
          </NavLink>
        ))}
      </div>

      <div className="p-6 border-t border-brand-border">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-brand-gold text-brand-charcoal flex items-center justify-center font-serif text-sm font-bold shadow-sm">
            {profile?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-medium truncate text-text-primary">{profile?.full_name || 'Guest User'}</p>
            <p className="text-[10px] text-text-muted uppercase tracking-tighter">{profile?.role?.replace('_', ' ') || 'Access'}</p>
          </div>
        </div>

        <button 
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-2 bg-bg-elevated hover:bg-bg-hover text-text-secondary hover:text-brand-gold text-[10px] uppercase tracking-widest transition-all duration-200 rounded-sm mb-2 shadow-sm border border-brand-border"
        >
          {theme === 'light' ? (
            <><Moon className="w-3 h-3" /> <span>Switch to Dark Protocol</span></>
          ) : (
            <><Sun className="w-3 h-3" /> <span>Switch to Light Protocol</span></>
          )}
        </button>
        
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2 bg-bg-elevated hover:bg-red-600/10 text-text-secondary hover:text-red-500 text-[10px] uppercase tracking-widest transition-all duration-200 rounded-sm border border-brand-border"
        >
          <LogOut className="w-3 h-3" />
          <span>Terminate Session</span>
        </button>
      </div>
    </div>
  );
};
