import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingScreen } from '../ui/LoadingScreen';
import { Menu, X } from 'lucide-react';

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (loading) return <LoadingScreen />;

  return (
    <div className="flex h-screen w-full bg-bg-base overflow-hidden transition-colors duration-300 relative">
      {/* Mobile Toggle */}
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-50 w-12 h-12 bg-brand-gold text-brand-charcoal rounded-full flex items-center justify-center shadow-2xl border-2 border-brand-charcoal focus:outline-none active:scale-95 transition-all"
      >
        <Menu size={24} />
      </button>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-brand-charcoal/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full relative">
          <Sidebar />
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden absolute top-4 right-4 text-text-muted hover:text-brand-gold p-1"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col h-full min-w-0">
        <div className="h-1 bg-brand-gold shrink-0"></div>
        <main className="flex-1 overflow-y-auto bg-bg-base p-4 md:p-8">
          <div className="max-w-7xl mx-auto pb-20 lg:pb-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
