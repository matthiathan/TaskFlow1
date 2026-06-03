import React, { useState, useEffect } from 'react';
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
  Calendar as CalendarIcon,
  Navigation,
  MapPin,
  Users,
  BarChart3,
  Activity,
  Database,
  Lock,
  Upload,
  Package,
  FileText,
  FileCheck,
  QrCode,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';
import { InstallAppBanner } from './InstallAppBanner';
import { supabase } from '../../lib/supabase';
  
const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['user', 'tech', 'admin', 'road_tech', 'exec'] },
  { icon: CheckSquare, label: 'Tasks', path: '/tasks', roles: ['user', 'tech', 'admin', 'ops_manager', 'road_tech', 'exec'] },
  { icon: CalendarIcon, label: 'Calendar', path: '/calendar', roles: ['user', 'tech', 'admin', 'ops_manager', 'road_tech', 'exec'] },
  { icon: ClipboardList, label: 'Service Tickets', path: '/reporting', roles: ['tech', 'admin', 'road_tech'] },
  { icon: Navigation, label: 'Route Planning', path: '/route-planning', roles: ['ops_manager'] },
  { icon: Users, label: 'Tech Tracking', path: '/tech-tracking', roles: ['admin', 'ops_manager'] },
  { icon: Activity, label: 'Driver Analytics', path: '/driver-analytics', roles: ['admin', 'ops_manager'] },
  { icon: MapPin, label: 'My Routes', path: '/my-routes', roles: ['road_tech'] },
  { icon: BarChart3, label: 'Executive Analytics', path: '/analytics', roles: ['admin', 'exec'] },
  { icon: MessageSquare, label: 'Communications', path: '/chat', roles: ['user', 'tech', 'admin', 'road_tech', 'exec'] },
  { icon: Settings, label: 'Settings', path: '/settings', roles: ['user', 'tech', 'admin', 'ops_manager', 'road_tech', 'exec'] },
  { icon: ShieldCheck, label: 'Admin Panel', path: '/admin', roles: ['admin'] },
];

export const Sidebar: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { theme, toggleTheme } = useTheme();
  const { profile, role, logout } = useAuth();
  const [canReadAnyTable, setCanReadAnyTable] = useState(false);

  useEffect(() => {
    async function checkErpAccess() {
      if (!profile?.id) return;
      if (role === 'admin') {
        setCanReadAnyTable(true);
        return;
      }
      
      const { data } = await supabase
        .from('erp_table_permissions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('can_read', true);
        
      if (data && data.length > 0) {
        setCanReadAnyTable(true);
      }
    }
    
    checkErpAccess();
  }, [profile?.id, role]);

  const allowedItems = navItems.filter(item => item.roles.includes(role || 'user'));

  return (
    <aside className="w-64 h-full border-r border-brand-border bg-bg-elevated flex flex-col">
      {/* Static Header */}
      <div className="p-6 pb-2 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-gold flex items-center justify-center rounded-xl shadow-md shadow-brand-gold/15 flex-shrink-0">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text-primary">Dallmayr SA</h2>
            <p className="text-xs text-text-secondary">Corporate Portal</p>
          </div>
        </div>
      </div>

      {/* Scrollable Nav Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1 scrollbar-thin scrollbar-thumb-brand-border scrollbar-track-transparent">
        <nav className="space-y-1 mb-4">
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
                  <item.icon className={cn('w-4 h-4', isActive ? 'text-white' : 'text-text-secondary group-hover:text-brand-gold flex-shrink-0')} />
                  <span className="truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* ERP System Section */}
        {(role === 'admin' || canReadAnyTable) && (
          <div className="mt-6">
            <h3 className="px-4 text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">ERP System</h3>
            <div className="space-y-1">
              {role === 'admin' && (
                <>
                <NavLink
                  to="/erp-access-manager"
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
                      <Lock className={cn('w-4 h-4', isActive ? 'text-white' : 'text-text-secondary group-hover:text-brand-gold flex-shrink-0')} />
                      <span className="truncate">Access Manager</span>
                    </>
                  )}
                </NavLink>
                <NavLink
                  to="/erp-importer"
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
                      <Upload className={cn('w-4 h-4', isActive ? 'text-white' : 'text-text-secondary group-hover:text-brand-gold flex-shrink-0')} />
                      <span className="truncate">Data Importer</span>
                    </>
                  )}
                </NavLink>
                </>
              )}
              {canReadAnyTable && (
                <>
                {[
                  { label: 'Dashboard', path: '/erp', icon: LayoutDashboard },
                  { label: 'Assets', path: '/erp/table/erp_assets', icon: Package },
                  { label: 'Contracts', path: '/erp/contracts', icon: FileText },
                  { label: 'Service Logs', path: '/erp/table/erp_service_logs', icon: FileCheck },
                  { label: 'QR Mapping', path: '/erp/table/erp_qr_mapping', icon: QrCode },
                ].map(link => (
                    <NavLink
                      key={link.path}
                      to={link.path}
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
                          <link.icon className={cn('w-4 h-4', isActive ? 'text-white' : 'text-text-secondary group-hover:text-brand-gold flex-shrink-0')} />
                          <span className="truncate">{link.label}</span>
                        </>
                      )}
                    </NavLink>
                ))}

                </>
              )}
            </div>
          </div>
        )}

        <div className="px-2 mt-4">
          <InstallAppBanner />
        </div>
      </div>

      {/* Static Footer */}
      <div className="p-6 border-t border-brand-border/50 bg-bg-elevated flex-shrink-0 space-y-4">
        {/* User Profile */}
        <div className="p-4 bg-bg-base border border-brand-border rounded-2xl flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-center overflow-hidden flex-shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-xs font-bold text-brand-gold">{(profile?.full_name || 'U').charAt(0)}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-text-primary truncate">{profile?.full_name || 'User Profile'}</p>
            <p className="text-xs text-brand-gold capitalize font-medium truncate">{role || 'Standard User'}</p>
          </div>
        </div>

        <div className="flex items-center justify-between px-2">
          <button 
            onClick={toggleTheme}
            className="p-2 text-text-secondary hover:text-brand-gold transition-colors flex-shrink-0"
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button 
            onClick={logout}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-red-500 transition-colors flex-shrink-0"
          >
            <LogOut size={14} />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
