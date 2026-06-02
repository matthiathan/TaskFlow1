import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import { supabase } from '../lib/supabase';
import { Profile, TelemetryLog } from '../types/database';
import { 
  Activity, 
  Search, 
  RefreshCw, 
  MapPin, 
  Smartphone, 
  AlertTriangle, 
  Gauge, 
  Clock, 
  Sparkles,
  TrafficCone,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Create a custom modern React-Leaflet marker icon utilizing Tailwind styling inside HTML.
// This rules out the brittle Leaflet-Vite bundle relative asset link errors.
const createMarkerIcon = (speed: number) => {
  const isSpeeding = speed > 110;
  const colorClass = isSpeeding ? '#dc2626' : '#d97706'; // Red or Amber
  const pulseClass = isSpeeding ? 'bg-red-500 animate-ping' : 'bg-brand-gold animate-pulse';
  const speedPercentage = Math.min((speed / 130) * 100, 100); 
  const gaugeColor = isSpeeding ? '#ef4444' : '#f59e0b';
  
  const svgHtml = `
    <div class="relative flex items-center justify-center group cursor-pointer" data-speed="${Math.round(speed)}">
      <!-- Speed Gauge Overlay -->
      <div class="absolute -top-10 w-12 h-12 rounded-full border-2 border-white/80 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none flex items-center justify-center"
           style="background: conic-gradient(from 0deg, ${gaugeColor} ${speedPercentage}%, #e5e7eb 0%);">
        <div class="absolute inset-1 bg-gray-900 rounded-full flex items-center justify-center">
            <span class="text-[8px] font-bold text-white">${Math.round(speed)}</span>
        </div>
      </div>
      
      <div class="absolute w-8 h-8 rounded-full opacity-40 ${pulseClass}"></div>
      <div class="relative w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-lg" style="background-color: ${colorClass};">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      </div>
    </div>
  `;
  return L.divIcon({
    html: svgHtml,
    className: 'custom-leaflet-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Map component helper to auto-fit or pan search results
const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

export const DriverAnalyticsPage: React.FC = () => {
  const [telemetry, setTelemetry] = useState<TelemetryLog[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-26.2041, 28.0473]); // Johannesburg default
  const [mapZoom, setMapZoom] = useState(6);

  const fetchData = useCallback(async () => {
    try {
      setRefreshing(true);
      // 1. Fetch profiles to match technician details
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;
      setProfiles(profilesData || []);

      // 2. Fetch driver telemetry logged in the last 2 hours
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const { data: telemetryData, error: telemetryError } = await supabase
        .from('driver_telemetry')
        .select('*')
        .gte('recorded_at', twoHoursAgo)
        .order('recorded_at', { ascending: false });

      if (telemetryError) throw telemetryError;

      // Group by tech_id to only hold the single most recent record for each tech
      const driverMap = new Map<string, TelemetryLog>();
      
      (telemetryData || []).forEach((log: any) => {
        if (!driverMap.has(log.tech_id)) {
          const associatedProfile = (profilesData || []).find((p) => p.id === log.tech_id);
          driverMap.set(log.tech_id, {
            ...log,
            profile: associatedProfile || null
          });
        }
      });

      const uniqueTelemetry = Array.from(driverMap.values());
      setTelemetry(uniqueTelemetry);

      // If we have active points, center the map around the first active tech
      if (uniqueTelemetry.length > 0) {
        setMapCenter([uniqueTelemetry[0].latitude, uniqueTelemetry[0].longitude]);
      }
    } catch (err) {
      console.error('Error fetching fleet telemetry:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Subscribe to new telemetry inserts
    const channel = supabase
      .channel('telemetry_live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'driver_telemetry' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  // Filter techs by search keywords (name, department, email)
  const filteredTelemetry = telemetry.filter((item) => {
    const fullName = item.profile?.full_name?.toLowerCase() || '';
    const email = item.profile?.email?.toLowerCase() || '';
    const query = searchQuery.toLowerCase();
    return fullName.includes(query) || email.includes(query);
  });

  // Calculate dynamic statistics
  const totalActiveTechs = telemetry.length;
  const speedingCount = telemetry.filter(item => item.speed_kmh > 110).length;
  const averageSpeed = telemetry.length 
    ? Math.round(telemetry.reduce((acc, curr) => acc + curr.speed_kmh, 0) / telemetry.length)
    : 0;

  const handleFocusTechOnMap = (lat: number, lng: number) => {
    setMapCenter([lat, lng]);
    setMapZoom(13);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-brand-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-brand-gold/10 rounded-lg border border-brand-gold/20 text-brand-gold">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-text-primary">Driver Analytics</h1>
          </div>
          <p className="text-xs text-text-secondary">
            Live operations map & tactical speed compliance system for field-deployed service technicians.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-secondary/60" />
            <input
              type="text"
              placeholder="Filter by driver name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-full sm:w-64 bg-bg-elevated border border-brand-border/60 hover:border-brand-border rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand-gold placeholder-text-secondary/50"
            />
          </div>
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="flex items-center justify-center p-2.5 bg-bg-elevated hover:bg-bg-elevated/70 border border-brand-border/60 hover:border-brand-border rounded-xl text-text-primary transition-all cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-brand-gold' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-4 rounded-2xl bg-bg-elevated border border-brand-border/40 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Active Road Fleet</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-text-primary">{totalActiveTechs}</span>
              <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live
              </span>
            </div>
          </div>
          <div className="p-3 bg-brand-gold/10 text-brand-gold rounded-2xl">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-bg-elevated border border-brand-border/40 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Compliance Risk (&gt;110km/h)</span>
            <div className="flex items-baseline gap-1">
              <span className={`text-2xl font-black ${speedingCount > 0 ? 'text-red-500' : 'text-text-primary'}`}>
                {speedingCount}
              </span>
              <span className="text-[10px] font-bold text-text-secondary font-mono">active alerts</span>
            </div>
          </div>
          <div className={`p-3 rounded-2xl ${speedingCount > 0 ? 'bg-red-500/10 text-red-500 animate-bounce' : 'bg-bg-base text-text-secondary'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-bg-elevated border border-brand-border/40 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Average Fleet Velocity</span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-text-primary">{averageSpeed}</span>
              <span className="text-[10px] font-bold text-text-secondary">km/h</span>
            </div>
          </div>
          <div className="p-3 bg-brand-gold/10 text-brand-gold rounded-2xl">
            <Gauge className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Interactive Map area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaflet Map container */}
        <div className="lg:col-span-2 h-[450px] rounded-2xl border border-brand-border/40 overflow-hidden shadow-md relative bg-bg-elevated">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-bg-elevated/80 backdrop-blur-sm">
              <RefreshCw className="w-8 h-8 animate-spin text-brand-gold mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Initializing Geo-Link...</p>
            </div>
          ) : null}

          <MapContainer 
            center={mapCenter} 
            zoom={mapZoom} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            
            <MapController center={mapCenter} zoom={mapZoom} />

            {/* Render markers for each road tech */}
            <MarkerClusterGroup>
              {filteredTelemetry.map((item) => (
                <Marker
                  key={item.id}
                  position={[item.latitude, item.longitude]}
                  icon={createMarkerIcon(item.speed_kmh)}
                >
                  <Popup className="custom-leaflet-popup">
                    <div className="p-1 text-xs space-y-2 select-none min-w-[200px]">
                      <div className="flex items-center gap-1.5 border-b border-brand-border/30 pb-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                        <span className="font-bold text-gray-900">
                          {item.profile?.full_name || item.profile?.email || 'Field Driver'}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-gray-600">
                          <span className="flex items-center gap-1 text-[10px]"><Gauge className="w-3.5 h-3.5" /> Speed</span>
                          <span className={`font-mono font-bold ${item.speed_kmh > 110 ? 'text-red-600' : 'text-gray-900'}`}>
                            {Math.round(item.speed_kmh)} km/h
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-gray-600">
                          <span className="flex items-center gap-1 text-[10px]"><Clock className="w-3.5 h-3.5" /> Updated</span>
                          <span className="text-[10px] font-semibold text-gray-700">
                            {formatDistanceToNow(new Date(item.recorded_at))} ago
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-gray-600">
                          <span className="flex items-center gap-1 text-[10px]"><MapPin className="w-3.5 h-3.5" /> Geolocation</span>
                          <span className="text-[9px] font-mono font-semibold text-gray-500">
                            {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MarkerClusterGroup>
          </MapContainer>
        </div>

        {/* Live Active list panel */}
        <div className="rounded-2xl border border-brand-border/40 bg-bg-elevated p-4 shadow-md flex flex-col h-[450px]">
          <div className="flex items-center justify-between pb-3 border-b border-brand-border/40 mb-3 flex-shrink-0">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Fleet Registry</h3>
            <span className="px-2 py-0.5 bg-brand-gold/10 border border-brand-gold/20 rounded-full text-[9px] font-bold text-brand-gold uppercase tracking-wider">
              {filteredTelemetry.length} Active
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin scrollbar-thumb-brand-border scrollbar-track-transparent">
            {filteredTelemetry.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-text-secondary">
                <TrafficCone className="w-8 h-8 text-text-secondary/40 mb-2" />
                <p className="text-[10px] font-bold uppercase tracking-wider">No Drivers Reporting Location</p>
                <p className="text-[9px] text-text-secondary/70 max-w-[200px] mt-1">
                  Active road tech coordinates will establish geo-link telemetry when online.
                </p>
              </div>
            ) : (
              filteredTelemetry.map((item) => {
                const isSpeeding = item.speed_kmh > 110;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleFocusTechOnMap(item.latitude, item.longitude)}
                    className="group border border-brand-border/30 hover:border-brand-gold/50 hover:bg-bg-base/30 p-3 rounded-xl transition-all cursor-pointer flex flex-col gap-2 relative overflow-hidden"
                  >
                    {isSpeeding && (
                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-red-600"></div>
                    )}
                    
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold text-text-primary group-hover:text-brand-gold transition-colors">
                          {item.profile?.full_name || 'Anonymous Fleet Driver'}
                        </h4>
                        <p className="text-[10px] text-text-secondary/70 truncate max-w-[150px]">
                          {item.profile?.email || 'N/A'}
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black font-mono tracking-wider flex items-center gap-1 ${
                          isSpeeding 
                            ? 'bg-red-500/10 border border-red-500/30 text-red-500' 
                            : 'bg-brand-gold/10 border border-brand-gold/30 text-brand-gold'
                        }`}>
                          {Math.round(item.speed_kmh)} km/h
                        </span>
                        <span className="text-[9px] font-bold text-text-secondary flex items-center gap-1">
                          <Clock className="w-3 h-3 text-text-secondary/50" />
                          {formatDistanceToNow(new Date(item.recorded_at))} ago
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[9px] font-mono text-text-secondary/80">
                      <MapPin className="w-3.5 h-3.5 text-brand-gold" />
                      <span>{item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Fleet telemetry and logs stats details table */}
      <div className="rounded-2xl border border-brand-border/40 bg-bg-elevated overflow-hidden shadow-md">
        <div className="p-4 bg-bg-elevated border-b border-brand-border/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4.5 h-4.5 text-brand-gold" />
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Active Fleet Status & Logistics Panel</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-base/40 border-b border-brand-border/30 text-[10px] font-bold text-text-secondary uppercase tracking-wider">
                <th className="py-3 px-4">Technician Driver</th>
                <th className="py-3 px-4">System Email</th>
                <th className="py-3 px-4">Department Unit</th>
                <th className="py-3 px-4">Active Speed</th>
                <th className="py-3 px-4">GPS Coordinates</th>
                <th className="py-3 px-4 text-right">Report Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/20 text-xs font-medium">
              {filteredTelemetry.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 px-4 text-center text-text-secondary text-[10px] font-bold uppercase tracking-wider">
                    No active telemetry logs detected in telemetry matrix table.
                  </td>
                </tr>
              ) : (
                filteredTelemetry.map((item) => {
                  const isSpeeding = item.speed_kmh > 110;
                  return (
                    <tr 
                      key={item.id} 
                      className="hover:bg-bg-base/20 transition-colors py-3"
                    >
                      <td className="py-3.5 px-4 font-bold text-text-primary">
                        {item.profile?.full_name || 'Autonomous Driver'}
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary font-mono text-[11px]">
                        {item.profile?.email || 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary">
                        <span className="bg-bg-base border border-brand-border/40 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                          {item.profile?.department || 'ops'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black font-mono tracking-wider ${
                          isSpeeding 
                            ? 'bg-red-500/10 border border-red-500/40 text-red-500 animate-pulse' 
                            : 'bg-brand-gold/10 border border-brand-gold/40 text-brand-gold'
                        }`}>
                          {Math.round(item.speed_kmh)} km/h
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary font-mono text-[10px] tracking-tight">
                        {item.latitude.toFixed(5)}, {item.longitude.toFixed(5)}
                      </td>
                      <td className="py-3.5 px-4 text-right text-text-secondary">
                        {new Date(item.recorded_at).toLocaleTimeString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DriverAnalyticsPage;
