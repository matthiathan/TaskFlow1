import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export function useFleetTelemetry() {
  const { user, role } = useAuth();
  const lastUpdateRef = useRef<number>(0);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Only track location if the user is a road_tech
    if (!user || role !== 'road_tech') {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!('geolocation' in navigator)) {
      console.warn('Geolocation is not supported by this browser.');
      return;
    }

    const handleSuccess = async (position: GeolocationPosition) => {
      const now = Date.now();
      // Throttle to only insert once every 30 seconds
      if (now - lastUpdateRef.current < 30000) {
        return;
      }

      const { latitude, longitude, speed } = position.coords;
      // Convert native speed (m/s) to km/h (multiply by 3.6). If speed is null/negative, default to 0.
      const speed_kmh = speed && speed > 0 ? speed * 3.6 : 0;

      lastUpdateRef.current = now;

      try {
        const { error } = await supabase
          .from('driver_telemetry')
          .insert({
            tech_id: user.id,
            latitude,
            longitude,
            speed_kmh,
            recorded_at: new Date().toISOString()
          });

        if (error) {
          console.error('Failed to upload telemetry log:', error.message);
        }
      } catch (err) {
        console.error('Error uploading telemetry log:', err);
      }
    };

    const handleError = (error: GeolocationPositionError) => {
      console.error('Geolocation tracking error:', error.message);
    };

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    };

    // Begin tracking
    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, options);
    watchIdRef.current = watchId;

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [user, role]);
}
