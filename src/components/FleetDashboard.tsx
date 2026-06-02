import React from 'react';
import { useFieldRoutes } from '../hooks/useFieldRoutes';
import { FieldRoute } from '../types/database';
import { Clock, CheckCircle2, AlertTriangle, PlayCircle, Award, TrendingUp, RefreshCw } from 'lucide-react';

export const FleetDashboard: React.FC = () => {
  const { routes, loading, fetchRoutes } = useFieldRoutes();

  // Filter routes for today
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRoutes = routes.filter(route => {
    if (!route.scheduled_time) return false;
    return route.scheduled_time.startsWith(todayStr);
  });

  // Calculate stats based on all routes loaded from the database
  const totalArrived = routes.filter(r => r.status === 'arrived_on_time' || r.status === 'arrived_late').length;
  const onTimeArrived = routes.filter(r => r.status === 'arrived_on_time').length;
  
  // Real calculation from current data
  const onTimeRate = totalArrived > 0 
    ? ((onTimeArrived / totalArrived) * 100).toFixed(1) 
    : "0.0";

  const completedYTD = totalArrived; // clean session/database stats only

  const getStatusBadge = (route: FieldRoute) => {
    const now = new Date();
    const scheduled = new Date(route.scheduled_time);
    
    let displayStatus = route.status;
    
    // Dynamic status determination if scheduled
    if (route.status === 'scheduled') {
      if (now > scheduled) {
        displayStatus = 'late';
      }
    }

    switch (displayStatus) {
      case 'arrived_on_time':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 size={10} />
            Arrived On Time
          </span>
        );
      case 'arrived_late':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <AlertTriangle size={10} />
            Arrived Late
          </span>
        );
      case 'late':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse">
            <Clock size={10} />
            Late
          </span>
        );
      case 'no_arrival':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-900/10 text-red-400 border border-red-900/20">
            <AlertTriangle size={10} />
            No Arrival
          </span>
        );
      case 'scheduled':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
            <PlayCircle size={10} />
            Scheduled
          </span>
        );
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

  const formatTimeFull = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString('en-ZA', {
        dateStyle: 'short',
        timeStyle: 'short',
        hour12: false
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div id="fleet-dashboard-component" className="space-y-6">
      {/* Analytics KPIs Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* On-Time Rate KPI */}
        <div id="kpi-ontime-rate" className="bg-bg-elevated border border-brand-border rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary select-none">
              Driver On-Time Rate (SLA)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-text-primary text-emerald-500">
                {onTimeRate}%
              </span>
              <span className="text-[10px] font-semibold text-emerald-500 flex items-center gap-0.5">
                <TrendingUp size={10} />
                +1.2% this mth
              </span>
            </div>
            <p className="text-[10px] text-text-secondary uppercase tracking-wider">
              Target benchmark: 95.0% SLA target
            </p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <Award size={24} />
          </div>
        </div>

        {/* Total Completed KPI */}
        <div id="kpi-jobs-completed" className="bg-bg-elevated border border-brand-border rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary select-none">
              Total Tasks Completed (YTD)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold tracking-tight text-text-primary text-brand-gold">
                {completedYTD}
              </span>
              <span className="text-[10px] text-text-secondary font-medium">
                Active service runs
              </span>
            </div>
            <p className="text-[10px] text-text-secondary uppercase tracking-wider">
              Fleet Rewards & Driver Efficiency Program
            </p>
          </div>
          <div className="p-3 bg-brand-gold/10 text-brand-gold rounded-xl">
            <CheckCircle2 size={24} />
          </div>
        </div>
      </div>

      {/* Live Fleet Tracking Table */}
      <div className="bg-bg-elevated border border-brand-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-brand-border flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-text-primary">Today's Live Fleet Tracking</h3>
            <p className="text-[10px] text-text-secondary uppercase tracking-widest mt-0.5">
              Active Routes scheduled for {new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button
            onClick={() => fetchRoutes()}
            disabled={loading}
            className="p-2 border border-brand-border hover:border-brand-gold rounded-lg transition-all text-text-secondary hover:text-brand-gold cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {loading ? (
          <div className="p-10 flex flex-col items-center justify-center text-text-secondary text-xs gap-2">
            <RefreshCw size={20} className="animate-spin text-brand-gold" />
            Querying active routes...
          </div>
        ) : todayRoutes.length === 0 ? (
          <div className="p-10 text-center text-text-secondary text-xs border-dashed border-2 border-brand-border/40 m-4 rounded-lg">
            No active schedules logged for today. Specify technician details and submit the Route Plan to track operations.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border text-[9px] font-black uppercase tracking-wider text-text-secondary bg-bg-base/40">
                  <th className="px-6 py-3.5">Technician</th>
                  <th className="px-6 py-3.5">Client & site</th>
                  <th className="px-6 py-3.5">Assigned Task</th>
                  <th className="px-6 py-3.5">Scheduled Time</th>
                  <th className="px-6 py-3.5">Check-In Log</th>
                  <th className="px-6 py-3.5 text-right">SLA status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60 text-xs">
                {todayRoutes.map((route) => (
                  <tr key={route.id} className="hover:bg-bg-base/20 transition-all">
                    <td className="px-6 py-4 font-semibold text-text-primary">
                      {route.road_tech_profile?.full_name || route.road_tech_profile?.email || 'Unassigned Field Tech'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-text-primary">{route.client_name}</div>
                      <div className="text-[10px] text-text-secondary">{route.client_location}</div>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      <div className="truncate max-w-[200px]" title={route.task_description}>
                        {route.task_description}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-primary font-medium">
                      {formatTime(route.scheduled_time)}
                    </td>
                    <td className="px-6 py-4">
                      {route.check_in_time ? (
                        <div className="space-y-0.5">
                          <div className="text-[10px] font-semibold text-emerald-500">
                            Arrived {formatTime(route.check_in_time)}
                          </div>
                          {route.check_in_lat && route.check_in_lng && (
                            <div className="text-[9px] font-mono text-text-secondary select-all">
                              GPS: {route.check_in_lat.toFixed(5)}, {route.check_in_lng.toFixed(5)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">
                          Awaiting check-in
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {getStatusBadge(route)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
