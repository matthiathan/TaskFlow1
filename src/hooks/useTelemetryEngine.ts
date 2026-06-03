import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

// Geolocation configuration
const GEO_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 5000,
};

// Filtering constants
const MIN_DISTANCE_METERS = 50;
const MIN_TIME_MS = 10000; // 10 seconds

export const useTelemetryEngine = (driverId: string) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const lastPosition = useRef<GeolocationPosition | null>(null);
  const lastLoggedTime = useRef<number>(0);

  // Calculate distance between two points (Haversine formula)
  const getDistance = (pos1: GeolocationPosition, pos2: GeolocationPosition) => {
    const R = 6371e3; // Earth's radius in meters
    const dLat = (pos2.coords.latitude - pos1.coords.latitude) * Math.PI / 180;
    const dLon = (pos2.coords.longitude - pos1.coords.longitude) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(pos1.coords.latitude * Math.PI / 180) * Math.cos(pos2.coords.latitude * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const uploadBuffer = async () => {
    const buffer = JSON.parse(localStorage.getItem('telemetry_buffer') || '[]');
    if (buffer.length === 0) return;

    setIsSyncing(true);
    try {
      const { error } = await supabase.from('driver_telemetry').insert(buffer);
      if (error) throw error;
      
      // Clear buffer on success
      localStorage.removeItem('telemetry_buffer');
    } catch (err) {
      console.error('Failed to sync telemetry bundle', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        const timeDelta = now - lastLoggedTime.current;
        const distanceDelta = lastPosition.current ? getDistance(lastPosition.current, position) : Infinity;

        // Apply filtering logic: 50m distance OR 10s time
        if (distanceDelta >= MIN_DISTANCE_METERS || timeDelta >= MIN_TIME_MS) {
          const entry = {
            driver_id: driverId,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            speed_kmh: (position.coords.speed || 0) * 3.6, // Convert m/s to km/h
            recorded_at: new Date(position.timestamp).toISOString(),
          };

          // Store to buffer
          const buffer = JSON.parse(localStorage.getItem('telemetry_buffer') || '[]');
          localStorage.setItem('telemetry_buffer', JSON.stringify([...buffer, entry]));

          lastPosition.current = position;
          lastLoggedTime.current = now;

          // Attempt sync
          if (navigator.onLine) {
            uploadBuffer();
          }
        }
      },
      (error) => console.error('Geolocation error:', error),
      GEO_OPTIONS
    );

    // Online listener
    window.addEventListener('online', uploadBuffer);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      window.removeEventListener('online', uploadBuffer);
    };
  }, [driverId]);

  return { isSyncing };
};
