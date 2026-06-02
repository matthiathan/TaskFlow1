import React from 'react';
import { RoutePlanner } from '../components/RoutePlanner';
import { FleetDashboard } from '../components/FleetDashboard';

export const RoutePlanningPage: React.FC = () => {
  return (
    <div id="route-planning-page" className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header section with branding style */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border pb-6">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-gold">Dallmayr South Africa</span>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary mt-1">Fleet Operations & Routes</h1>
          <p className="text-xs text-text-secondary mt-1">Enterprise dispatch management, scheduling, and live technician geolocation tracking.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <RoutePlanner />
        </div>
        
        <div className="lg:col-span-2 space-y-6">
          <FleetDashboard />
        </div>
      </div>
    </div>
  );
};
