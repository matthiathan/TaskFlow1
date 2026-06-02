import React, { useState } from 'react';
import { useFieldRoutes } from '../hooks/useFieldRoutes';
import { MapPin, Clock, FileText, User, Plus, Loader2 } from 'lucide-react';

// Define inline Input or Button if we want to ensure zero missing import issues.
export const RoutePlanner: React.FC = () => {
  const { roadTechs, createRoute, loading } = useFieldRoutes();
  const [formData, setFormData] = useState({
    road_tech_id: '',
    client_name: '',
    client_location: '',
    task_description: '',
    scheduled_time: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.road_tech_id || !formData.client_name || !formData.client_location || !formData.task_description || !formData.scheduled_time) {
      return;
    }
    setSubmitting(true);
    try {
      await createRoute({
        road_tech_id: formData.road_tech_id,
        client_name: formData.client_name,
        client_location: formData.client_location,
        task_description: formData.task_description,
        scheduled_time: formData.scheduled_time
      });
      setFormData({
        road_tech_id: '',
        client_name: '',
        client_location: '',
        task_description: '',
        scheduled_time: ''
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div id="route-planner-component" className="bg-bg-elevated border border-brand-border rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-brand-gold/10 rounded-lg">
          <MapPin className="text-brand-gold w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-black uppercase tracking-wider text-text-primary">Dispatch & Route Planner</h2>
          <p className="text-[10px] text-text-secondary uppercase tracking-widest mt-0.5">Schedule Field Service & Fleet Orders</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Road Tech Dropdown */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-black uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
            <User size={12} className="text-brand-gold" />
            Assign Road Technician
          </label>
          <select
            id="road-tech-select"
            className="w-full bg-bg-base border border-brand-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-gold text-text-primary transition-all cursor-pointer"
            value={formData.road_tech_id}
            onChange={e => setFormData(p => ({ ...p, road_tech_id: e.target.value }))}
            required
          >
            <option value="">-- Choose Field Driver / Technician --</option>
            {roadTechs.map(tech => (
              <option key={tech.id} value={tech.id}>
                {tech.full_name || tech.email} ({tech.role === 'road_tech' ? 'Road Tech' : 'Tech'})
              </option>
            ))}
          </select>
        </div>

        {/* Client Name & Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-text-secondary">
              Client / Venue Name
            </label>
            <input
              type="text"
              id="client-name-input"
              className="w-full bg-bg-base border border-brand-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-gold text-text-primary transition-all"
              placeholder="e.g. Mercedes-Benz Centurion"
              value={formData.client_name}
              onChange={e => setFormData(p => ({ ...p, client_name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
              <MapPin size={11} className="text-brand-gold" />
              Client Location
            </label>
            <input
              type="text"
              id="client-location-input"
              className="w-full bg-bg-base border border-brand-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-gold text-text-primary transition-all"
              placeholder="e.g. 126 Retief Ave, Pretoria"
              value={formData.client_location}
              onChange={e => setFormData(p => ({ ...p, client_location: e.target.value }))}
              required
            />
          </div>
        </div>

        {/* Scheduled Time */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-black uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
            <Clock size={12} className="text-brand-gold" />
            Scheduled Arrival Time
          </label>
          <input
            type="datetime-local"
            id="scheduled-time-input"
            className="w-full bg-bg-base border border-brand-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-brand-gold text-text-primary transition-all"
            value={formData.scheduled_time}
            onChange={e => setFormData(p => ({ ...p, scheduled_time: e.target.value }))}
            required
          />
        </div>

        {/* Task Description */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-black uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
            <FileText size={12} className="text-brand-gold" />
            Service Task Instructions
          </label>
          <textarea
            id="task-description-textarea"
            className="w-full bg-bg-base border border-brand-border rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-gold text-text-primary transition-all min-h-24 resize-y"
            placeholder="Describe the issue, required maintenance, or delivery requirements..."
            value={formData.task_description}
            onChange={e => setFormData(p => ({ ...p, task_description: e.target.value }))}
            required
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          id="btn-submit-route"
          disabled={submitting || loading}
          className="w-full mt-2 bg-brand-gold hover:bg-brand-gold/90 text-black font-bold uppercase tracking-wider py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
        >
          {submitting ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Broadcasting Route Plans...
            </>
          ) : (
            <>
              <Plus size={14} />
              Save & Dispatch Route Plan
            </>
          )}
        </button>
      </form>
    </div>
  );
};
