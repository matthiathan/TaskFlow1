import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg-base h-screen w-full transition-colors duration-300">
      <div className="text-center">
        <h1 className="text-3xl font-serif text-text-primary mb-4 tracking-[0.2em] italic">DALLMAYR</h1>
        <div className="w-48 h-0.5 bg-brand-border mx-auto relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 h-full w-1/3 bg-brand-gold animate-[loading_1.5s_infinite_ease-in-out]"></div>
        </div>
        <p className="mt-4 text-[10px] uppercase tracking-[0.3em] text-text-secondary font-medium font-sans">
          Securing Access Pipeline
        </p>
      </div>
      
      <style>{`
        @keyframes loading {
          0% { left: -33%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
};

export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8 shadow-sm',
    lg: 'w-12 h-12 shadow-sm',
  };

  return (
    <div className={`${sizes[size]} border-2 border-brand-border border-t-brand-gold rounded-full animate-spin shadow-sm`} />
  );
};
