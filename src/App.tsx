import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { Sidebar } from './components/layout/Sidebar';

import { TasksPage } from './pages/TasksPage';
import { MessagesPage } from './pages/MessagesPage';
import { TicketingPage } from './pages/TicketingPage';
import { CalendarPage } from './pages/CalendarPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminPage } from './pages/AdminPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { useAuth } from './contexts/AuthContext';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading, role } = useAuth();

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
      <Sidebar />
      <main className="flex-1 ml-64 overflow-x-hidden">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/reporting" element={role === 'tech' || role === 'admin' ? <TicketingPage /> : <Navigate to="/dashboard" replace />} />
          <Route path="/chat" element={<MessagesPage />} />
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
