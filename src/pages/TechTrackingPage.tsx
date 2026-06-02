import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Profile, FieldRoute, Task } from '../types/database';
import { 
  Users, 
  Compass, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Navigation,
  CheckSquare, 
  Sparkles,
  ClipboardList,
  Search,
  ArrowRight,
  Map as MapIcon,
  ShieldAlert,
  Loader2,
  ListTodo,
  Edit,
  Trash2,
  Plus,
  X,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';

export const TechTrackingPage: React.FC = () => {
  const [personnel, setPersonnel] = useState<Profile[]>([]);
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);
  const [routes, setRoutes] = useState<FieldRoute[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals/Forms State
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<FieldRoute | null>(null); // null means adding a new route
  const [routeForm, setRouteForm] = useState({
    client_name: '',
    client_location: '',
    scheduled_time: '',
    status: 'scheduled' as FieldRoute['status'],
    task_description: ''
  });

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null); // null means adding a new task
  const [taskForm, setTaskForm] = useState({
    title: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    status: 'pending' as 'pending' | 'in_progress' | 'resolved',
    due_date: ''
  });

  const [submitting, setSubmitting] = useState(false);

  const openEditRoute = (route: FieldRoute) => {
    setEditingRoute(route);
    setRouteForm({
      client_name: route.client_name,
      client_location: route.client_location,
      scheduled_time: route.scheduled_time ? new Date(route.scheduled_time).toISOString().slice(0, 16) : '',
      status: route.status,
      task_description: route.task_description || ''
    });
    setRouteModalOpen(true);
  };

  const openCreateRoute = () => {
    setEditingRoute(null);
    setRouteForm({
      client_name: '',
      client_location: '',
      scheduled_time: new Date().toISOString().slice(0, 16),
      status: 'scheduled',
      task_description: ''
    });
    setRouteModalOpen(true);
  };

  const handleRouteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTechId) return;
    setSubmitting(true);
    
    try {
      if (editingRoute) {
        // Edit flow
        const updatedRoute = {
          ...editingRoute,
          client_name: routeForm.client_name,
          client_location: routeForm.client_location,
          scheduled_time: new Date(routeForm.scheduled_time).toISOString(),
          status: routeForm.status,
          task_description: routeForm.task_description
        };

        // UI Optimistic update
        setRoutes(prev => {
          const updated = prev.map(r => r.id === editingRoute.id ? updatedRoute : r);
          localStorage.setItem('dallmayr_field_routes', JSON.stringify(updated));
          return updated;
        });

        // DB update
        const { error } = await supabase
          .from('field_routes')
          .update({
            client_name: routeForm.client_name,
            client_location: routeForm.client_location,
            scheduled_time: new Date(routeForm.scheduled_time).toISOString(),
            status: routeForm.status,
            task_description: routeForm.task_description
          })
          .eq('id', editingRoute.id);

        if (error) throw error;
        toast.success('Route updated successfully');
      } else {
        // Add flow
        const newRouteId = crypto.randomUUID();
        const newRoute: FieldRoute = {
          id: newRouteId,
          created_at: new Date().toISOString(),
          road_tech_id: selectedTechId,
          client_name: routeForm.client_name,
          client_location: routeForm.client_location,
          scheduled_time: new Date(routeForm.scheduled_time).toISOString(),
          status: 'scheduled',
          task_description: routeForm.task_description,
          check_in_time: null,
          check_in_lat: null,
          check_in_lng: null
        };

        // UI Optimistic update
        setRoutes(prev => {
          const updated = [newRoute, ...prev];
          localStorage.setItem('dallmayr_field_routes', JSON.stringify(updated));
          return updated;
        });

        // DB insert
        const { error } = await supabase
          .from('field_routes')
          .insert([{
            id: newRouteId,
            road_tech_id: selectedTechId,
            client_name: routeForm.client_name,
            client_location: routeForm.client_location,
            scheduled_time: new Date(routeForm.scheduled_time).toISOString(),
            status: 'scheduled',
            task_description: routeForm.task_description
          }]);

        if (error) throw error;
        toast.success('Route scheduled successfully');
      }
      setRouteModalOpen(false);
    } catch (err: any) {
      toast.error(`Operation failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRouteDelete = async (routeId: string) => {
    if (!window.confirm('Are you sure you want to delete this scheduled route stop?')) return;
    
    // UI update
    setRoutes(prev => {
      const updated = prev.filter(r => r.id !== routeId);
      localStorage.setItem('dallmayr_field_routes', JSON.stringify(updated));
      return updated;
    });

    try {
      const { error } = await supabase
        .from('field_routes')
        .delete()
        .eq('id', routeId);

      if (error) throw error;
      toast.success('Route stop removed');
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message}`);
    }
  };

  const openEditTask = (task: any) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      priority: task.priority || 'medium',
      status: task.status || 'pending',
      due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : ''
    });
    setTaskModalOpen(true);
  };

  const openCreateTask = () => {
    setEditingTask(null);
    setTaskForm({
      title: '',
      priority: 'medium',
      status: 'pending',
      due_date: new Date().toISOString().slice(0, 16)
    });
    setTaskModalOpen(true);
  };

  const getHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`
    };
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTechId) return;
    setSubmitting(true);

    try {
      const headers = await getHeaders();
      const payload = {
        title: taskForm.title,
        priority: taskForm.priority,
        status: taskForm.status,
        due_date: taskForm.due_date ? new Date(taskForm.due_date).toISOString() : null,
        user_id: selectedTechId
      };

      if (editingTask) {
        // Edit flow
        const updatedTask = {
          ...editingTask,
          ...payload
        };

        // UI Optimistic update
        setTasks(prev => prev.map(t => t.id === editingTask.id ? updatedTask : t));

        const response = await fetch(`/api/ops/tasks/${editingTask.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errRes = await response.json();
          throw new Error(errRes.error || 'Failed to update task');
        }

        toast.success('Task updated successfully');
      } else {
        // Add flow
        const newTaskId = crypto.randomUUID();
        const newTask: Task = {
          id: newTaskId,
          created_at: new Date().toISOString(),
          title: taskForm.title,
          description: '',
          priority: taskForm.priority,
          status: taskForm.status,
          due_date: taskForm.due_date ? new Date(taskForm.due_date).toISOString() : null,
          user_id: selectedTechId,
          collaborators: []
        };

        // UI Optimistic update
        setTasks(prev => [newTask, ...prev]);

        const response = await fetch('/api/ops/tasks', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            ...payload,
            id: newTaskId
          })
        });

        if (!response.ok) {
          const errRes = await response.json();
          throw new Error(errRes.error || 'Failed to assign task');
        }

        toast.success('Task assigned successfully');
      }
      setTaskModalOpen(false);
    } catch (err: any) {
      toast.error(`Operation failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this service task?')) return;

    // UI update
    setTasks(prev => prev.filter(t => t.id !== taskId));

    try {
      const headers = await getHeaders();
      const response = await fetch(`/api/ops/tasks/${taskId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        const errRes = await response.json();
        throw new Error(errRes.error || 'Failed to remove task');
      }

      toast.success('Task removed');
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message}`);
    }
  };

  // Fetch all personnel with roles 'tech' or 'road_tech'
  const fetchPersonnel = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) throw error;
      
      // Filter only techs and road techs
      const filtered = (data || []).filter(
        p => p.role === 'tech' || p.role === 'road_tech'
      );
      setPersonnel(filtered);
      
      if (filtered.length > 0 && !selectedTechId) {
        setSelectedTechId(filtered[0].id);
      }
    } catch (err: any) {
      console.warn('Personnel query failed:', err.message);
      setPersonnel([]);
    } finally {
      setLoading(false);
    }
  }, [selectedTechId]);

  // Fetch all routes & tasks from Supabase
  const fetchTelemetry = useCallback(async () => {
    try {
      // Fetch routes
      const { data: routesData, error: routesErr } = await supabase
        .from('field_routes')
        .select('*');
      if (routesErr) throw routesErr;
      setRoutes(routesData || []);
    } catch (routeErr: any) {
      console.warn('Could not pull online routes, pulling from local storage...', routeErr);
      try {
        const stored = localStorage.getItem('dallmayr_field_routes');
        if (stored) {
          setRoutes(JSON.parse(stored));
        }
      } catch (localErr) {
        console.error(localErr);
      }
    }

    try {
      // Fetch tasks
      const { data: tasksData, error: tasksErr } = await supabase
        .from('tasks')
        .select('*')
        .is('deleted_at', null);
      if (tasksErr) throw tasksErr;
      setTasks(tasksData || []);
    } catch (taskErr: any) {
      console.warn('Could not read tasks database row-level security limits:', taskErr.message);
    }
  }, []);

  useEffect(() => {
    fetchPersonnel();
    fetchTelemetry();
  }, [fetchPersonnel, fetchTelemetry]);

  const selectedTech = personnel.find(p => p.id === selectedTechId);

  // Filter routes for selected tech
  const techRoutes = routes.filter(r => r.road_tech_id === selectedTechId);
  
  // Filter tasks for selected tech
  const activeTasks = tasks.filter(t => t.user_id === selectedTechId || t.collaborators?.includes(selectedTechId || ''));

  // Filter personnel by search query
  const filteredPersonnel = personnel.filter(p => {
    const term = searchQuery.toLowerCase();
    return (
      (p.full_name || '').toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term) ||
      p.role.toLowerCase().includes(term)
    );
  });

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'arrived_on_time':
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'arrived_late':
        return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'scheduled':
        return 'text-brand-gold bg-brand-gold/10 border-brand-gold/20';
      default:
        return 'text-text-secondary bg-bg-base border-brand-border';
    }
  };

  return (
    <div id="tech-tracking-page" className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="border-b border-brand-border pb-6">
        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-gold flex items-center gap-1.5 matches-glow">
          <Navigation className="animate-spin-slow w-4 h-4 text-brand-gold" />
          Fleet Route Operations
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-text-primary mt-1">Field Tracking & Dispatch Control</h1>
        <p className="text-xs text-text-secondary mt-1">
          Monitor assigned routes, live GPS check-ins, and daily task lists of active Road Technicians.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column: Technician/Road Tech selection Menu */}
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-bg-elevated border border-brand-border rounded-xl p-5 space-y-4 shadow-sm">
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-text-primary">Service Personnel List</h2>
              <p className="text-[10px] text-text-secondary uppercase tracking-widest mt-0.5">Filter active Field & Lab Techs</p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <Search size={14} className="text-text-secondary/60" />
              </span>
              <input
                type="text"
                className="w-full bg-bg-base border border-brand-border rounded-xl pl-9 pr-4 py-2 text-xs outline-none focus:border-brand-gold text-text-primary placeholder:text-text-secondary/40 transition-all"
                placeholder="Search by name, role, email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Tech List */}
            {loading && filteredPersonnel.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-text-secondary text-xs gap-2">
                <Loader2 className="animate-spin text-brand-gold" size={16} />
                <span>Syncing satellite profiles...</span>
              </div>
            ) : filteredPersonnel.length === 0 ? (
              <div className="text-center py-8 text-text-secondary text-xs">
                No matching field operators found
              </div>
            ) : (
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {filteredPersonnel.map((tech) => {
                  const isSelected = selectedTechId === tech.id;
                  const routesAssigned = routes.filter(r => r.road_tech_id === tech.id);
                  const arrivals = routesAssigned.filter(r => r.status === 'arrived_on_time' || r.status === 'arrived_late').length;

                  return (
                    <button
                      key={tech.id}
                      onClick={() => setSelectedTechId(tech.id)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-3 relative ${
                        isSelected 
                          ? 'bg-bg-base/80 border-brand-gold shadow-sm shadow-brand-gold/5' 
                          : 'bg-bg-elevated/40 border-brand-border hover:border-brand-border/80 hover:bg-bg-base/30'
                      }`}
                    >
                      <div className="w-9 h-9 rounded-full bg-brand-gold/10 border border-brand-gold/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {tech.avatar_url ? (
                          <img src={tech.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-black text-brand-gold font-mono">
                            {(tech.full_name || 'T').charAt(0)}
                          </span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-text-primary truncate">
                          {tech.full_name || tech.email}
                        </h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[8px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                            tech.role === 'road_tech' 
                              ? 'bg-brand-gold/10 text-brand-gold border border-brand-gold/20' 
                              : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          }`}>
                            {tech.role?.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Stop count overlay */}
                      <div className="text-right">
                        <span className="text-[10px] font-mono font-black text-brand-gold block">
                          {arrivals}/{routesAssigned.length}
                        </span>
                        <span className="text-[8px] text-text-secondary uppercase font-bold tracking-widest">STOPS</span>
                      </div>

                      {isSelected && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-10 bg-brand-gold rounded-l" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right columns: Real-time routes timeline + GPS HUD + tasks */}
        <div className="lg:col-span-2 space-y-8">
          
          {selectedTech ? (
            <div className="space-y-8">
              
              {/* Selected driver summary bar */}
              <div className="bg-bg-elevated border border-brand-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-text-secondary block">Selected Operations Operator</span>
                  <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                    {selectedTech.full_name || selectedTech.email}
                    <span className="text-[10px] bg-brand-gold/10 text-brand-gold border border-brand-gold/20 px-2 py-0.5 rounded font-mono">
                      {selectedTech.role?.replace('_', ' ').toUpperCase()}
                    </span>
                  </h3>
                  <p className="text-xs text-text-secondary mt-0.5">{selectedTech.email}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4 divide-x divide-brand-border border border-brand-border/60 p-3 bg-bg-base/40 rounded-xl">
                  <div className="px-3 text-center">
                    <span className="text-[9px] text-text-secondary uppercase font-black block">ROUTED STOPS</span>
                    <strong className="text-lg font-mono font-bold text-text-primary">{techRoutes.length}</strong>
                  </div>
                  <div className="px-3 text-center">
                    <span className="text-[9px] text-text-secondary uppercase font-black block">CHECKED-IN</span>
                    <strong className="text-lg font-mono font-bold text-emerald-500">
                      {techRoutes.filter(r => r.status === 'arrived_on_time' || r.status === 'arrived_late').length}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Grid with daily routes timeline and task checklist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* 1. Daily Routes & Check-in Details */}
                <div className="bg-bg-elevated border border-brand-border rounded-xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-brand-border pb-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                      <Clock size={14} className="text-brand-gold" />
                      Daily Dispatched Stops
                    </h3>
                    <button
                      onClick={openCreateRoute}
                      className="text-[9px] font-black uppercase text-brand-gold hover:text-brand-gold/80 hover:underline flex items-center gap-1 bg-transparent border-none py-1 transition-all cursor-pointer"
                    >
                      <Plus size={12} />
                      Add Stop
                    </button>
                  </div>

                  {techRoutes.length === 0 ? (
                    <div className="text-center py-10 space-y-3 m-2 border border-dashed border-brand-border rounded-xl">
                      <MapIcon size={24} className="text-brand-border/80 mx-auto" />
                      <p className="text-xs text-text-secondary">No routes assigned yet today.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 relative pl-3 border-l-2 border-brand-border/60">
                      {techRoutes.map((route, index) => {
                        const isArrived = route.status === 'arrived_on_time' || route.status === 'arrived_late';
                        return (
                          <div key={route.id} className="relative space-y-1.5 pb-2">
                            {/* Point on timeline */}
                            <div className={`absolute -left-[18px] top-1.5 w-2.5 h-2.5 rounded-full border-2 ${
                              isArrived 
                                ? 'bg-emerald-500 border-bg-elevated' 
                                : 'bg-brand-gold border-bg-elevated'
                            }`} />

                            <div className="flex items-center justify-between gap-2">
                              <h4 className="text-xs font-bold text-text-primary">{route.client_name}</h4>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => openEditRoute(route)}
                                  className="p-1 hover:bg-brand-gold/10 hover:text-brand-gold rounded border border-transparent hover:border-brand-gold/20 text-text-secondary transition-colors cursor-pointer"
                                  title="Edit Route"
                                >
                                  <Edit size={10} />
                                </button>
                                <button
                                  onClick={() => handleRouteDelete(route.id)}
                                  className="p-1 hover:bg-red-500/10 hover:text-red-500 rounded border border-transparent hover:border-red-500/20 text-text-secondary transition-colors cursor-pointer"
                                  title="Delete Route"
                                >
                                  <Trash2 size={10} />
                                </button>
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${getStatusColor(route.status)}`}>
                                  {route.status.replace('_', ' ')}
                                </span>
                              </div>
                            </div>

                            <p className="text-[11px] text-text-secondary flex items-center gap-1">
                              <MapPin size={10} className="text-brand-gold" />
                              {route.client_location}
                            </p>

                            <div className="flex items-center gap-4 text-[10px] text-text-secondary font-mono bg-bg-base/40 border border-brand-border/60 p-2 rounded-lg">
                              <div>
                                <span className="text-[8px] text-text-secondary font-bold uppercase block">Scheduled</span>
                                <span className="text-text-primary">{formatTime(route.scheduled_time)}</span>
                              </div>
                              {isArrived && (
                                <div>
                                  <span className="text-[8px] text-emerald-500 font-bold uppercase block">Arrived On-Site</span>
                                  <span className="text-emerald-500 font-bold">{formatTime(route.check_in_time || '')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Live GPS Telemetry / Check-in Tracking HUD */}
                <div className="bg-bg-elevated border border-brand-border rounded-xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-brand-border pb-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                      <Compass size={14} className="text-brand-gold" />
                      GPS Satellite HUD
                    </h3>
                    <span className="text-[9px] font-extrabold text-emerald-500 font-mono">Telemetry</span>
                  </div>

                  {techRoutes.some(r => r.check_in_lat) ? (
                    <div className="space-y-4">
                      {techRoutes.filter(r => r.check_in_lat).map(route => (
                        <div key={route.id} className="p-3 bg-bg-base border border-brand-border rounded-xl space-y-2.5">
                          <div>
                            <span className="text-[9px] uppercase tracking-wider text-text-secondary block">LATEST RECORDED VISIT</span>
                            <h4 className="text-xs font-bold text-brand-gold">{route.client_name}</h4>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-center bg-bg-elevated border border-brand-border/60 p-2 rounded-lg font-mono">
                            <div>
                              <span className="text-[7px] text-text-secondary uppercase font-bold block">LATITUDE</span>
                              <span className="text-[10px] text-text-primary select-all">
                                {route.check_in_lat?.toFixed(6)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[7px] text-text-secondary uppercase font-bold block">LONGITUDE</span>
                              <span className="text-[10px] text-text-primary select-all">
                                {route.check_in_lng?.toFixed(6)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 justify-center py-2 border-t border-brand-border/60">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest font-mono">
                              GPS Satellite Lock SECURE
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-44 bg-bg-base/50 border border-brand-border/60 rounded-xl relative overflow-hidden flex flex-col justify-center items-center p-4 text-center">
                      <div className="absolute inset-0 border border-current opacity-5 border-dashed m-12 rounded-full pointer-events-none" />
                      <MapIcon size={24} className="text-brand-border/80 animate-bounce" />
                      <p className="text-[10px] text-text-secondary uppercase tracking-widest max-w-[170px] mt-2">
                        No checked-in coordinates detected for today.
                      </p>
                    </div>
                  )}
                </div>

              </div>

              {/* 3. Daily Task Checklist */}
              <div className="bg-bg-elevated border border-brand-border rounded-xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-brand-border pb-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                    <ListTodo size={14} className="text-brand-gold" />
                    Technician Service Tasks
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-extrabold uppercase text-brand-gold font-mono">
                      {activeTasks.filter(t => t.status === 'resolved').length}/{activeTasks.length} Done
                    </span>
                    <button
                      onClick={openCreateTask}
                      className="text-[9px] font-black uppercase text-brand-gold hover:text-brand-gold/80 hover:underline flex items-center gap-1 bg-transparent border-none py-1 transition-all cursor-pointer"
                    >
                      <Plus size={12} />
                      Add Task
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeTasks.map((task) => (
                    <div key={task.id} className="p-4 bg-bg-base border border-brand-border rounded-xl flex items-start gap-4 transition-colors hover:border-brand-border/80 group/task relative">
                      <div className="mt-0.5">
                        {task.status === 'resolved' ? (
                          <CheckCircle2 size={16} className="text-emerald-500" />
                        ) : task.status === 'in_progress' ? (
                          <Compass className="text-amber-500 animate-spin-slow" size={16} />
                        ) : (
                          <CheckSquare size={16} className="text-text-secondary/40" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0 pr-12">
                        <p className={`text-xs font-semibold text-text-primary leading-normal ${
                          task.status === 'resolved' ? 'line-through text-text-secondary/60' : ''
                        }`}>
                          {task.title}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                            task.priority === 'high' 
                              ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                              : task.priority === 'medium'
                              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                              : 'bg-text-secondary/10 text-text-secondary border border-text-secondary/20'
                          }`}>
                            {task.priority || 'medium'}
                          </span>
                          <span className="text-[9px] text-text-secondary font-mono">
                            {task.status?.toUpperCase().replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Task Actions float on hover */}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/task:opacity-100 focus-within:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditTask(task)}
                          className="p-1 hover:bg-brand-gold/10 hover:text-brand-gold rounded border border-transparent hover:border-brand-gold/20 text-text-secondary transition-colors cursor-pointer"
                          title="Edit Task"
                        >
                          <Edit size={10} />
                        </button>
                        <button
                          onClick={() => handleTaskDelete(task.id)}
                          className="p-1 hover:bg-red-500/10 hover:text-red-500 rounded border border-transparent hover:border-red-500/20 text-text-secondary transition-colors cursor-pointer"
                          title="Delete Task"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="flex items-center justify-center py-20 bg-bg-elevated border border-brand-border rounded-xl text-center">
              <div className="space-y-2">
                <Users size={32} className="text-text-secondary/40 mx-auto" />
                <p className="text-sm font-bold text-text-primary">No Field Technician Selected</p>
                <p className="text-xs text-text-secondary">Please select an tech operator from the left sidebar panel to analyze routes and checklist progress.</p>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Route Edit/Create Modal */}
      {routeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-bg-elevated border border-brand-border rounded-xl shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-brand-border bg-bg-base/40">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-brand-gold">Operations Dispatched Logs</span>
                <h3 className="text-sm font-bold text-text-primary mt-0.5">
                  {editingRoute ? 'Edit Dispatched Route' : 'Add New Route Schedule'}
                </h3>
              </div>
              <button
                onClick={() => setRouteModalOpen(false)}
                className="text-text-secondary hover:text-text-primary p-1 rounded-lg hover:bg-bg-base/80 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleRouteSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-text-secondary">
                  Client / Venue Name
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-bg-base border border-brand-border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-brand-gold text-text-primary transition-all"
                  placeholder="e.g. Mercedes-Benz Centurion"
                  value={routeForm.client_name}
                  onChange={e => setRouteForm(p => ({ ...p, client_name: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-text-secondary">
                  Client Location / GPS Address
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-bg-base border border-brand-border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-brand-gold text-text-primary transition-all"
                  placeholder="e.g. 126 Retief Ave, Pretoria"
                  value={routeForm.client_location}
                  onChange={e => setRouteForm(p => ({ ...p, client_location: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-text-secondary">
                    Scheduled Arrival Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    className="w-full bg-bg-base border border-brand-border rounded-xl px-4 py-2 text-xs outline-none focus:border-brand-gold text-text-primary transition-all"
                    value={routeForm.scheduled_time}
                    onChange={e => setRouteForm(p => ({ ...p, scheduled_time: e.target.value }))}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-text-secondary">
                    Arrival Dispatch Status
                  </label>
                  <select
                    className="w-full bg-bg-base border border-brand-border rounded-xl px-4 py-2 text-xs outline-none focus:border-brand-gold text-text-primary transition-all pr-8 cursor-pointer"
                    value={routeForm.status}
                    onChange={e => setRouteForm(p => ({ ...p, status: e.target.value as any }))}
                    disabled={!editingRoute} // on adding, it starts scheduled
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="late">Late</option>
                    <option value="arrived_on_time">Arrived On Time</option>
                    <option value="arrived_late">Arrived Late</option>
                    <option value="no_arrival">No Arrival</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-text-secondary">
                  Service Task Instructions
                </label>
                <textarea
                  className="w-full bg-bg-base border border-brand-border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-brand-gold text-text-primary transition-all min-h-20 resize-y"
                  placeholder="Details of the route visit instructions..."
                  value={routeForm.task_description}
                  onChange={e => setRouteForm(p => ({ ...p, task_description: e.target.value }))}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setRouteModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-text-secondary hover:text-text-primary transition-colors cursor-pointer bg-transparent border border-brand-border rounded-xl hover:bg-bg-base/30"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold uppercase tracking-wider bg-brand-gold hover:bg-brand-gold/90 text-black rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting ? (
                    'Saving changes...'
                  ) : (
                    'Save Dispatch'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Edit/Create Modal */}
      {taskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-bg-elevated border border-brand-border rounded-xl shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-brand-border bg-bg-base/40">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-brand-gold">Personnel Assignment Board</span>
                <h3 className="text-sm font-bold text-text-primary mt-0.5">
                  {editingTask ? 'Edit Maintenance Task' : 'Assign New Technical Task'}
                </h3>
              </div>
              <button
                onClick={() => setTaskModalOpen(false)}
                className="text-text-secondary hover:text-text-primary p-1 rounded-lg hover:bg-bg-base/80 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleTaskSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-text-secondary">
                  Task Title / Service Requirement
                </label>
                <input
                  type="text"
                  required
                  className="w-full bg-bg-base border border-brand-border rounded-xl px-4 py-2.5 text-xs outline-none focus:border-brand-gold text-text-primary transition-all"
                  placeholder="e.g. Calibrate brewer pressure, clean milk dispenser lines..."
                  value={taskForm.title}
                  onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-text-secondary">
                    Priority Clearance
                  </label>
                  <select
                    className="w-full bg-bg-base border border-brand-border rounded-xl px-4 py-2 text-xs outline-none focus:border-brand-gold text-text-primary transition-all cursor-pointer"
                    value={taskForm.priority}
                    onChange={e => setTaskForm(p => ({ ...p, priority: e.target.value as any }))}
                  >
                    <option value="low">LOW</option>
                    <option value="medium">MEDIUM</option>
                    <option value="high">HIGH</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-text-secondary">
                    Operations Status
                  </label>
                  <select
                    className="w-full bg-bg-base border border-brand-border rounded-xl px-4 py-2 text-xs outline-none focus:border-brand-gold text-text-primary transition-all cursor-pointer"
                    value={taskForm.status}
                    onChange={e => setTaskForm(p => ({ ...p, status: e.target.value as any }))}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-text-secondary flex items-center gap-1">
                  <Calendar size={12} className="text-brand-gold" />
                  SLA Target Due Date
                </label>
                <input
                  type="datetime-local"
                  required
                  className="w-full bg-bg-base border border-brand-border rounded-xl px-4 py-2 text-xs outline-none focus:border-brand-gold text-text-primary transition-all"
                  value={taskForm.due_date}
                  onChange={e => setTaskForm(p => ({ ...p, due_date: e.target.value }))}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setTaskModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-text-secondary hover:text-text-primary transition-colors cursor-pointer bg-transparent border border-brand-border rounded-xl hover:bg-bg-base/30"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold uppercase tracking-wider bg-brand-gold hover:bg-brand-gold/90 text-black rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting ? (
                    'Assigning...'
                  ) : (
                    'Assign Task'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
