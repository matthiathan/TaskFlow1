import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Menu, X, ShieldCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';
import { CommandPalette } from '../CommandPalette';

import { TasksPage } from '../../pages/TasksPage';
import { MessagesPage } from '../../pages/MessagesPage';
import { TicketingPage } from '../../pages/TicketingPage';
import { CalendarPage } from '../../pages/CalendarPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { AdminPage } from '../../pages/AdminPage';
import { SettingsPage } from '../../pages/SettingsPage';
import { RoutePlanningPage } from '../../pages/RoutePlanningPage';
import { MyRoutesPage } from '../../pages/MyRoutesPage';
import { TechTrackingPage } from '../../pages/TechTrackingPage';

export function DashboardLayout() {
  const { role } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-bg-base">
      <CommandPalette />
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-bg-elevated border-b border-brand-border flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-gold flex items-center justify-center rounded-lg">
            <ShieldCheck className="text-white w-5 h-5" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-text-primary">OpsPortal</span>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-text-primary focus:outline-none"
          aria-label="Toggle Menu"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 lg:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      <main className="flex-1 lg:ml-64 overflow-x-hidden pt-16 lg:pt-0">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/reporting" element={role === 'tech' || role === 'admin' ? <TicketingPage /> : <Navigate to="/" replace />} />
          <Route path="/chat" element={<MessagesPage />} />
          <Route path="/admin" element={role === 'admin' ? <AdminPage /> : <Navigate to="/" replace />} />
          <Route path="/route-planning" element={role === 'ops_manager' || role === 'admin' ? <RoutePlanningPage /> : <Navigate to="/" replace />} />
          <Route path="/tech-tracking" element={role === 'ops_manager' || role === 'admin' ? <TechTrackingPage /> : <Navigate to="/" replace />} />
          <Route path="/my-routes" element={role === 'road_tech' || role === 'admin' ? <MyRoutesPage /> : <Navigate to="/" replace />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
