import React from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const InstallAppBanner: React.FC = () => {
  const { isInstallable, installApp } = usePWAInstall();
  const [dismissed, setDismissed] = React.useState(false);

  if (!isInstallable || dismissed) return null;

  return (
    <div className="mx-4 my-2 p-4 rounded-xl bg-gradient-to-br from-bg-base to-bg-elevated border border-brand-border/40 relative shadow-md animate-fade-in">
      <button 
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 text-text-secondary/70 hover:text-text-primary transition-colors cursor-pointer"
        aria-label="Dismiss banner"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      
      <div className="flex gap-3 items-start mr-4">
        <div className="p-2 bg-brand-gold/10 rounded-lg border border-brand-gold/20 text-brand-gold mt-0.5 flex-shrink-0">
          <Smartphone className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-1">Dallmayr FSM</h4>
          <p className="text-[10px] text-text-secondary leading-relaxed font-semibold mb-3">
            Install to your home screen for offline access and native FSM performance.
          </p>
          <button
            onClick={installApp}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-brand-gold border border-brand-gold hover:bg-transparent hover:text-brand-gold text-white font-bold rounded-lg text-[10px] uppercase tracking-wider transition-all duration-200 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Install App
          </button>
        </div>
      </div>
    </div>
  );
};
export default InstallAppBanner;
