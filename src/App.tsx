import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Menu, X, Loader2, ShieldCheck } from 'lucide-react';
import { cn } from './lib/utils';

import { TasksPage } from './pages/TasksPage';
import { MessagesPage } from './pages/MessagesPage';
import { TicketingPage } from './pages/TicketingPage';
import { CalendarPage } from './pages/CalendarPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminPage } from './pages/AdminPage';
import { ApiAccessPage } from './pages/ApiAccessPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { useAuth } from './contexts/AuthContext';

function AppContent() {
  const { user, loading, role } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand-gold" />
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary">Authenticating Uplink...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="flex min-h-screen bg-bg-base">
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
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/reporting" element={role === 'tech' || role === 'admin' ? <TicketingPage /> : <Navigate to="/dashboard" replace />} />
          <Route path="/chat" element={<MessagesPage />} />
          <Route path="/api-access" element={role === 'tech' || role === 'admin' ? <ApiAccessPage /> : <Navigate to="/dashboard" replace />} />
          <Route path="/admin" element={role === 'admin' ? <AdminPage /> : <Navigate to="/dashboard" replace />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Toaster position="top-right" theme={undefined} richColors />
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
