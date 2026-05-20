import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input, Textarea, Button } from '../ui/Base';
import { Task, TaskPriority, TaskStatus, Profile } from '../../types/database';
import { supabase } from '../../lib/supabase';
import { UserPlus, X, Users } from 'lucide-react';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: any) => Promise<any>;
  onDelete?: (id: string) => Promise<any>;
  initialData?: Task | null;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({ isOpen, onClose, onSubmit, onDelete, initialData }) => {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    status: 'pending' as TaskStatus,
    due_date: '',
    collaborators: [] as string[]
  });

  const getCurrentDateTime = () => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
    return localISOTime;
  };

  useEffect(() => {
    if (initialData) {
      let formattedDate = '';
      if (initialData.due_date) {
        const date = new Date(initialData.due_date);
        const tzOffset = date.getTimezoneOffset() * 60000;
        formattedDate = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
      }

      setFormData({
        title: initialData.title,
        description: initialData.description || '',
        priority: initialData.priority,
        status: initialData.status,
        due_date: formattedDate,
        collaborators: initialData.collaborators || []
      });
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'pending',
        due_date: getCurrentDateTime(),
        collaborators: []
      });
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data } = await supabase.from('profiles').select('*').limit(20);
      if (data) setProfiles(data);
    };
    if (isOpen) fetchProfiles();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        due_date: formData.due_date || null
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const toggleCollaborator = (profileId: string) => {
    setFormData(prev => {
      const exists = prev.collaborators.includes(profileId);
      if (exists) {
        return { ...prev, collaborators: prev.collaborators.filter(id => id !== profileId) };
      } else {
        return { ...prev, collaborators: [...prev.collaborators, profileId] };
      }
    });
  };

  const handleDelete = async () => {
    if (!initialData || !onDelete) return;
    
    setDeleting(true);
    try {
      await onDelete(initialData.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal 
      id="task-form" 
      isOpen={isOpen} 
      onClose={onClose} 
      title={initialData ? "Modify Operational Directive" : "Initialize New Directive"}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input 
          label="Objective Title"
          value={formData.title}
          onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
          placeholder="e.g., System recalibration..."
          required
        />
        
        <Textarea 
          label="Technical Description"
          value={formData.description}
          onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
          placeholder="Provide detailed operational parameters..."
        />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Threat Priority</label>
            <select 
              className="w-full bg-bg-base border border-brand-border rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-brand-gold input-recessed"
              value={formData.priority}
              onChange={e => setFormData(p => ({ ...p, priority: e.target.value as TaskPriority }))}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <Input 
            label="Deadline & Time"
            type="datetime-local"
            value={formData.due_date}
            onChange={e => setFormData(p => ({ ...p, due_date: e.target.value }))}
          />
        </div>

        {/* Collaborators Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Personnel Access (Collaborators)</label>
            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-brand-gold/10 rounded border border-brand-gold/20">
              <Users className="w-2.5 h-2.5 text-brand-gold" />
              <span className="text-[8px] font-black uppercase text-brand-gold">{formData.collaborators.length} ACTIVE</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto p-2 border border-brand-border rounded-lg bg-bg-elevated/30">
            {profiles.map(profile => (
              <button
                key={profile.id}
                type="button"
                onClick={() => toggleCollaborator(profile.id)}
                className={cn(
                  "px-2 py-1 rounded-md text-[10px] font-bold uppercase transition-all border",
                  formData.collaborators.includes(profile.id)
                    ? "bg-brand-gold text-white border-brand-gold shadow-sm shadow-brand-gold/20"
                    : "bg-bg-base text-text-secondary border-brand-border hover:border-brand-gold/50"
                )}
              >
                {profile.full_name || profile.email.split('@')[0]}
              </button>
            ))}
          </div>
          <p className="text-[9px] text-text-secondary italic">Select personnel who should have data clearance for this directive.</p>
        </div>

        <div className="flex gap-3 pt-2">
          {initialData && onDelete && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleDelete}
              isLoading={deleting}
              className="px-4 border-red-500/30 text-red-500 hover:bg-red-500/10 uppercase font-bold text-[10px] tracking-widest"
            >
              Purge
            </Button>
          )}
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1 uppercase font-bold text-[10px] tracking-widest text-text-secondary">Abort</Button>
          <Button type="submit" isLoading={loading} className="flex-1 uppercase font-bold text-[10px] tracking-widest">
            {initialData ? "Sync Update" : "Commence Directive"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
