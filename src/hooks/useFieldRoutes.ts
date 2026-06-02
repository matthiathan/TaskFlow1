import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { FieldRoute, Profile } from '../types/database';
import { toast } from 'sonner';

const STORAGE_KEY = 'dallmayr_field_routes';

export const useFieldRoutes = () => {
  const [routes, setRoutes] = useState<FieldRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [roadTechs, setRoadTechs] = useState<Profile[]>([]);

  // Function to load fallback routes from local storage
  const getLocalRoutes = (): FieldRoute[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // Function to save to local storage
  const saveLocalRoutes = (newRoutes: FieldRoute[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newRoutes));
    } catch (e) {
      console.error('Failed to save routes to localStorage', e);
    }
  };

  const fetchRoadTechs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) throw error;
      
      // Match 'road_tech' first, then 'tech' as fallback if road_tech is empty
      const techsList = (data || []).filter(p => p.role === 'road_tech');
      if (techsList.length === 0) {
        setRoadTechs((data || []).filter(p => p.role === 'tech' || p.role === 'road_tech'));
      } else {
        setRoadTechs(techsList);
      }
    } catch (err: any) {
      console.warn('Failed to load profiles:', err.message);
      setRoadTechs([]);
    }
  }, []);

  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    try {
      // Try simple fetch since relations might not be set up
      const { data, error } = await supabase
        .from('field_routes')
        .select('*');
      
      if (error) throw error;

      // Populate profile manually if successful
      const { data: profiles } = await supabase.from('profiles').select('*');
      const enriched = (data || []).map(route => ({
        ...route,
        road_tech_profile: (profiles || []).find(p => p.id === route.road_tech_id) || null
      }));
      setRoutes(enriched);
      saveLocalRoutes(enriched);
    } catch (err: any) {
      console.warn('Supabase fetch failed for field_routes, using local replication:', err.message);
      const local = getLocalRoutes();
      try {
        const { data: profiles } = await supabase.from('profiles').select('*');
        if (profiles && profiles.length > 0) {
          const enriched = local.map(route => ({
            ...route,
            road_tech_profile: profiles.find(p => p.id === route.road_tech_id) || null
          }));
          setRoutes(enriched);
        } else {
          setRoutes(local);
        }
      } catch {
        setRoutes(local);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const createRoute = async (routeData: {
    road_tech_id: string;
    client_name: string;
    client_location: string;
    task_description: string;
    scheduled_time: string;
  }) => {
    const newRouteId = crypto.randomUUID();
    const newRoute: FieldRoute = {
      id: newRouteId,
      created_at: new Date().toISOString(),
      road_tech_id: routeData.road_tech_id,
      client_name: routeData.client_name,
      client_location: routeData.client_location,
      task_description: routeData.task_description,
      scheduled_time: routeData.scheduled_time,
      status: 'scheduled',
      check_in_time: null,
      check_in_lat: null,
      check_in_lng: null
    };

    // Keep state updated immediately (optimistic update)
    const localBefore = getLocalRoutes();
    const updatedLocal = [newRoute, ...localBefore];
    saveLocalRoutes(updatedLocal);
    
    const profile = roadTechs.find(p => p.id === routeData.road_tech_id) || null;
    const enrichedNewRoute: FieldRoute = { ...newRoute, road_tech_profile: profile };
    setRoutes(prev => [enrichedNewRoute, ...prev]);

    try {
      const { data, error } = await supabase
        .from('field_routes')
        .insert([{
          id: newRouteId,
          road_tech_id: routeData.road_tech_id,
          client_name: routeData.client_name,
          client_location: routeData.client_location,
          task_description: routeData.task_description,
          scheduled_time: routeData.scheduled_time,
          status: 'scheduled'
        }]);

      if (error) throw error;
      toast.success('Route Created & Broadcasted Successfully');
      return data;
    } catch (err: any) {
      console.warn('Supabase insert failed, maintaining local persistence:', err.message);
      toast.warning('Route Saved Locally (Supabase Sync Pending Permissions)');
      return enrichedNewRoute;
    }
  };

  const updateCheckIn = async (routeId: string, checkInData: {
    check_in_time: string;
    check_in_lat: number;
    check_in_lng: number;
    status: 'arrived_on_time' | 'arrived_late';
  }) => {
    const local = getLocalRoutes();
    const updatedLocal = local.map(r => r.id === routeId ? { ...r, ...checkInData } : r);
    saveLocalRoutes(updatedLocal);

    setRoutes(prev => prev.map(r => r.id === routeId ? { ...r, ...checkInData } : r));

    try {
      const { data, error } = await supabase
        .from('field_routes')
        .update({
          check_in_time: checkInData.check_in_time,
          check_in_lat: checkInData.check_in_lat,
          check_in_lng: checkInData.check_in_lng,
          status: checkInData.status
        })
        .eq('id', routeId);

      if (error) throw error;
      toast.success('Check-in Logged & Synchronized');
      return data;
    } catch (err: any) {
      console.warn('Supabase update failed, saved locally:', err.message);
      toast.warning('Check-in Saved to Local Database');
      return null;
    }
  };

  const updateRoute = async (routeId: string, updates: Partial<FieldRoute>) => {
    const local = getLocalRoutes();
    const updatedLocal = local.map(r => r.id === routeId ? { ...r, ...updates } : r);
    saveLocalRoutes(updatedLocal);

    setRoutes(prev => prev.map(r => r.id === routeId ? { ...r, ...updates } : r));

    try {
      const { data, error } = await supabase
        .from('field_routes')
        .update(updates)
        .eq('id', routeId);

      if (error) throw error;
      toast.success('Route updated successfully');
      return data;
    } catch (err: any) {
      console.warn('Supabase update failed, saved locally:', err.message);
      toast.warning('Route updated locally');
      return null;
    }
  };

  const deleteRoute = async (routeId: string) => {
    const local = getLocalRoutes();
    const updatedLocal = local.filter(r => r.id !== routeId);
    saveLocalRoutes(updatedLocal);

    setRoutes(prev => prev.filter(r => r.id !== routeId));

    try {
      const { error } = await supabase
        .from('field_routes')
        .delete()
        .eq('id', routeId);

      if (error) throw error;
      toast.success('Route deleted successfully');
    } catch (err: any) {
      console.warn('Supabase delete failed, deleted locally:', err.message);
      toast.warning('Route deleted locally');
    }
  };

  useEffect(() => {
    fetchRoadTechs();
    fetchRoutes();
  }, [fetchRoadTechs, fetchRoutes]);

  return {
    routes,
    loading,
    roadTechs,
    fetchRoutes,
    fetchRoadTechs,
    createRoute,
    updateCheckIn,
    updateRoute,
    deleteRoute
  };
};
