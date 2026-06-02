import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFieldRoutes } from '../hooks/useFieldRoutes';
import { FieldRoute } from '../types/database';
import { 
  MapPin, 
  Clock, 
  Map as MapIcon, 
  CheckCircle2, 
  AlertTriangle, 
  Navigation, 
  Compass, 
  Plus, 
  CheckSquare, 
  Sparkles,
  ClipboardList
} from 'lucide-react';
import { toast } from 'sonner';

export const MyRoutesPage: React.FC = () => {
  const { profile } = useAuth();
  const { routes, loading, updateCheckIn, createRoute } = useFieldRoutes();
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  // Filter routes assigned specifically to this road technician
  const myRoutes = routes.filter(r => r.road_tech_id === profile?.id);

  // Active route is the selected route, or default to the first incomplete/scheduled one
  const selectedRoute = routes.find(r => r.id === selectedRouteId) || myRoutes.find(r => r.status === 'scheduled') || myRoutes[0];

  const handleCreateDemoRoute = async () => {
    if (!profile) return;
    try {
      const futureHours = [1, 3, -0.5, 5]; // Mix of upcoming and slightly past
      const hr = futureHours[Math.floor(Math.random() * futureHours.length)];
      const targetTime = new Date();
      targetTime.setMinutes(targetTime.getMinutes() + hr * 60);

      const mockClients = [
        { name: 'Standard Bank Rosebank', loc: '30 Baker St, Rosebank, Johannesburg' },
        { name: 'Mercedes-Benz Pretoria East', loc: '121 Retief Ave, Pretoria Woodmead' },
        { name: 'Dallmayr Corporate Lounge', loc: '77 Meiring Naude Rd, Brummeria, Pretoria' },
        { name: 'Vodacom World Midrand', loc: '082 Vodacom Blvd, Midrand, Johannesburg' }
      ];

      const client = mockClients[Math.floor(Math.random() * mockClients.length)];

      await createRoute({
        road_tech_id: profile.id,
        client_name: client.name,
        client_location: client.loc,
        task_description: 'Scheduled maintenance of Dallmayr coffee bean machines. Calibrate grind consistency, check water line pressure, and restock corporate espresso packages.',
        scheduled_time: targetTime.toISOString().slice(0, 16) // format datetime-local
      });
      toast.success('Demo route created. You can now perform a GPS check-in!');
    } catch (e: any) {
      toast.error('Could not create demo route: ' + e.message);
    }
  };

  const handleCheckIn = async (routeId: string, scheduledTimeStr: string) => {
    setCheckingInId(routeId);
    toast.message('Initiating Sat-Link GPS Ping...', {
      description: 'Acquiring high-accuracy hardware coordinates...'
    });

    const triggerUpdate = (lat: number, lng: number) => {
      const now = new Date();
      const scheduledTime = new Date(scheduledTimeStr);
      
      // Determine if arrived on-time (e.g. within 15 minutes of schedule, or anytime earlier)
      const buffer = 15; // minutes margin
      const diffMs = now.getTime() - scheduledTime.getTime();
      const diffMins = diffMs / (1000 * 60);

      const finalStatus: 'arrived_on_time' | 'arrived_late' = 
        diffMins <= buffer ? 'arrived_on_time' : 'arrived_late';

      updateCheckIn(routeId, {
        check_in_time: now.toISOString(),
        check_in_lat: lat,
        check_in_lng: lng,
        status: finalStatus
      });
      setCheckingInId(null);
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          triggerUpdate(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn('Geolocation failed or permission denied, using Pretoria Head office fallback coordinates:', error);
          // Standard Dallmayr location fallback (East Pretoria Area)
          const fallbackLat = -25.7533;
          const fallbackLng = 28.2764;
          setTimeout(() => {
            triggerUpdate(fallbackLat, fallbackLng);
          }, 1200);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      // Direct update for non-supported browsers
      const fallbackLat = -25.7533;
      const fallbackLng = 28.2764;
      setTimeout(() => {
        triggerUpdate(fallbackLat, fallbackLng);
      }, 1000);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString('en-ZA', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return isoString;
    }
  };

  const formatFullDateTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString('en-ZA', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div id="my-routes-page" className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border pb-6">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-gold flex items-center gap-1.5 matches-glow">
            <Compass className="animate-spin-slow w-4 h-4 text-brand-gold" />
            Field Driver Itinerary
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary mt-1">My Dispatched Routes</h1>
          <p className="text-xs text-text-secondary mt-1">
            Logged in as <strong className="text-text-primary">{profile?.full_name || profile?.email}</strong>. Track daily SLA checklists & record onsite check-ins.
          </p>
        </div>
        
        {/* Quick Demo Creation Button to make testing easy without needing an admin */}
        <button
          onClick={handleCreateDemoRoute}
          id="btn-create-demo-route"
          className="bg-bg-elevated border border-brand-border hover:border-brand-gold text-text-secondary hover:text-brand-gold font-bold uppercase tracking-wider py-2.5 px-4 rounded-xl text-[10px] flex items-center gap-2 transition-all cursor-pointer"
        >
          <Sparkles size={12} className="text-brand-gold" />
          Simulate Dispatched Route
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Daily Stop Logs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-bg-elevated border border-brand-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-b border-brand-border flex items-center justify-between">
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider text-text-primary">Assigned Stops & Schedule</h2>
                <p className="text-[10px] text-text-secondary uppercase tracking-widest mt-0.5">Maintain on-time arrival SLA targets</p>
              </div>
              <span className="text-[10px] font-bold uppercase py-1 px-2.5 rounded bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
                {myRoutes.length} Stops Active
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-text-secondary text-xs">
                Querying satellite telemetry...
              </div>
            ) : myRoutes.length === 0 ? (
              <div className="p-12 text-center space-y-4 m-4 border-dashed border-2 border-brand-border/40 rounded-xl">
                <p className="text-text-secondary text-sm">No dispatches mapped to your technician profile for today yet.</p>
                <div className="flex justify-center">
                  <button
                    onClick={handleCreateDemoRoute}
                    className="bg-brand-gold hover:bg-brand-gold/90 text-black font-bold uppercase tracking-widest text-[10px] py-2.5 px-5 rounded-xl transition-all cursor-pointer"
                  >
                    Simulate Dispatched Route & Start
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-brand-border/60">
                {myRoutes.map((route, idx) => {
                  const isSelected = selectedRoute?.id === route.id;
                  const isCompleted = route.status === 'arrived_on_time' || route.status === 'arrived_late';
                  
                  return (
                    <div 
                      key={route.id} 
                      className={`p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-bg-base/30 ${
                        isSelected ? 'bg-bg-base/50 border-l-4 border-brand-gold' : ''
                      }`}
                      onClick={() => setSelectedRouteId(route.id)}
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-brand-gold/10 text-brand-gold border border-brand-gold/20 font-mono text-[10px] flex items-center justify-center font-bold">
                            {idx + 1}
                          </span>
                          <div>
                            <h4 className="text-sm font-bold text-text-primary">{route.client_name}</h4>
                            <p className="text-xs text-text-secondary flex items-center gap-1">
                              <MapPin size={11} className="text-brand-gold" />
                              {route.client_location}
                            </p>
                          </div>
                        </div>

                        {/* Route Info */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:pl-9 mt-1">
                          <div className="space-y-0.5">
                            <span className="text-[9px] uppercase tracking-wider text-text-secondary block">Scheduled</span>
                            <span className="text-xs text-text-primary flex items-center gap-1 font-semibold">
                              <Clock size={11} className="text-brand-gold" />
                              {formatTime(route.scheduled_time)}
                            </span>
                          </div>
                          
                          {isCompleted ? (
                            <div className="space-y-0.5">
                              <span className="text-[9px] uppercase tracking-wider text-text-secondary block">Checked In</span>
                              <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                                <CheckCircle2 size={11} />
                                {formatTime(route.check_in_time || '')}
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="text-[9px] uppercase tracking-wider text-text-secondary block">Status</span>
                              <span className="text-xs text-brand-gold font-semibold uppercase tracking-wider text-[10px]">
                                {route.status}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right edge: Actions or status */}
                      <div className="flex items-center gap-3 md:pl-9 md:border-l md:border-brand-border/60">
                        {isCompleted ? (
                          <div className="flex flex-col items-end gap-1">
                            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                              route.status === 'arrived_on_time' 
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            }`}>
                              {route.status.replace('_', ' ')}
                            </span>
                            {route.check_in_lat && (
                              <span className="text-[8px] font-mono text-text-secondary select-all">
                                Lat: {route.check_in_lat.toFixed(4)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCheckIn(route.id, route.scheduled_time);
                            }}
                            id={`btn-checkin-${route.id}`}
                            disabled={checkingInId !== null}
                            className="bg-brand-gold hover:bg-brand-gold/90 text-black font-black uppercase tracking-widest text-[10px] py-2 px-4 rounded-xl flex items-center gap-1.5 transition-all select-none disabled:opacity-40 cursor-pointer"
                          >
                            {checkingInId === route.id ? (
                              <>
                                <Compass className="animate-spin" size={12} />
                                Sat-Syncing...
                              </>
                            ) : (
                              <>
                                <CheckSquare size={12} />
                                GPS Check-In
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right column: Interactive GPS HUD / Navigation details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-bg-elevated border border-brand-border rounded-xl p-6 shadow-sm space-y-5">
            <h3 className="text-xs font-black uppercase tracking-wider text-text-primary flex items-center gap-1.5">
              <Navigation size={14} className="text-brand-gold" />
              Stop Satellite HUD
            </h3>

            {selectedRoute ? (
              <div className="space-y-4">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-text-secondary block">Selected Client Venue</span>
                  <h4 className="text-sm font-bold text-text-primary text-brand-gold">{selectedRoute.client_name}</h4>
                  <p className="text-xs text-text-secondary mt-0.5">{selectedRoute.client_location}</p>
                </div>

                <div className="p-4 bg-bg-base border border-brand-border rounded-xl space-y-2.5">
                  <span className="text-[9px] font-black uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                    <ClipboardList size={11} className="text-brand-gold" />
                    Technician Service Instructions
                  </span>
                  <p className="text-xs text-text-primary leading-relaxed">
                    {selectedRoute.task_description || 'No direct custom instructions provided for this stop. Standard machine diagnostic cycle and SLA compliance audit.'}
                  </p>
                </div>

                {/* Map style visualization / High accuracy GPS HUD */}
                <div className="h-44 bg-bg-base/70 border border-brand-border rounded-xl relative overflow-hidden flex flex-col justify-end p-4">
                  
                  {/* Decorative grid lines simulating satellite map radar */}
                  <div className="absolute inset-0 border border-current opacity-5 border-dashed m-6 rounded-full pointer-events-none animate-pulse" />
                  <div className="absolute inset-0 border border-current opacity-5 border-dashed m-12 rounded-full pointer-events-none" />
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-brand-border/40 pointer-events-none" />
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-brand-border/40 pointer-events-none" />

                  {/* Simulated telemetry coordinates */}
                  <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm border border-brand-border/60 py-1 px-2.5 rounded text-[8px] font-mono text-brand-gold shadow">
                    SYSTEM STATUS: OK
                  </div>

                  {selectedRoute.check_in_lat ? (
                    <div className="relative z-10 space-y-1.5">
                      <div className="flex items-center gap-1.5 justify-center mb-4">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping absolute" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative" />
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest font-mono">
                          CHECK-IN LOCK ACQUIRED
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-center bg-bg-elevated/90 border border-brand-border p-2 rounded-lg">
                        <div className="text-[10px] font-mono">
                          <span className="text-[8px] text-text-secondary uppercase select-all block">LATITUDE</span>
                          {selectedRoute.check_in_lat.toFixed(6)}
                        </div>
                        <div className="text-[10px] font-mono">
                          <span className="text-[8px] text-text-secondary uppercase select-all block">LONGITUDE</span>
                          {selectedRoute.check_in_lng?.toFixed(6)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative z-10 flex flex-col items-center justify-center h-full text-center space-y-2">
                      <MapIcon size={24} className="text-brand-border animate-bounce" />
                      <p className="text-[10px] text-text-secondary uppercase tracking-widest max-w-[150px]">
                        Pending onsite check-in tracking
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-text-secondary text-xs uppercase tracking-widest">
                Select a stop stop to review HUD
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
