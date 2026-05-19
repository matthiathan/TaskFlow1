import React from 'react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingScreen } from '../ui/LoadingScreen';

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loading } = useAuth();

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex h-screen w-full bg-bg-base overflow-hidden transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full min-w-0">
        <div className="h-1 bg-brand-gold"></div>
        <main className="flex-1 overflow-y-auto bg-bg-base p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
