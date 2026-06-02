import { useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export function useFleetTelemetry() {
  const { user, role } = useAuth();
  const watchIdRef = useRef<number | null>(null);
  const lastToastSuccessRef = useRef<boolean>(false);

  useEffect(() => {
    // Only track location if the user is a road_tech
    if (!user || role !== 'road_tech') {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    toast.info('Telemetry active. Finding satellites...');

    if (!('geolocation' in navigator)) {
      toast.error('Hardware Blocked: Geolocation is not supported by this browser.');
      return;
    }

    const handleSuccess = async (position: GeolocationPosition) => {
      const { latitude, longitude, speed } = position.coords;
      // Convert native speed (m/s) to km/h (multiply by 3.6). If speed is null/negative, default to 0.
      const speed_kmh = speed && speed > 0 ? speed * 3.6 : 0;

      if (!lastToastSuccessRef.current) {
        toast.success('GPS Lock Acquired!');
        lastToastSuccessRef.current = true;
      }

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
          toast.error('Database Blocked: ' + error.message);
        }
      } catch (err: any) {
        toast.error('Database Blocked: ' + (err.message || 'Unknown error'));
      }
    };

    const handleError = (error: GeolocationPositionError) => {
      toast.error('Hardware Blocked: ' + error.message);
    };

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 25000,
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
      lastToastSuccessRef.current = false;
    };
  }, [user, role]);
}
