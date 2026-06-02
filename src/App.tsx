import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { Sidebar } from './components/layout/Sidebar';
import { Menu, X, Loader2, ShieldCheck } from 'lucide-react';
import { cn } from './lib/utils';

import { DashboardLayout } from './components/layout/DashboardLayout';
import { LoginPage } from './pages/LoginPage';
import { useAuth } from './contexts/AuthContext';
import { useFleetTelemetry } from './hooks/useFleetTelemetry';

function AppContent() {
  const { user, loading } = useAuth();

  // Mount the live fleet tracking telemetry engine globally
  useFleetTelemetry();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand-gold" />
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary">Authenticating Uplink...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" replace />} />
      <Route 
        path="/*" 
        element={user ? <DashboardLayout /> : <Navigate to="/login" replace />} 
      />
    </Routes>
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
