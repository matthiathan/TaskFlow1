import React, { useState, useEffect } from 'react';
import { Task, TaskStatus, TaskPriority } from '../../types/database';
import { Modal } from '../ui/Modal';
import { Input, Button } from '../ui/Base';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: Omit<Task, 'id'>) => Promise<void>;
  initialData?: Task | null;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState<Omit<Task, 'id'>>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    start_date: new Date().toISOString().split('T')[0],
    due_date: new Date().toISOString().split('T')[0],
    is_archived: false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      const { id, ...rest } = initialData;
      setFormData(rest);
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        start_date: new Date().toISOString().split('T')[0],
        due_date: new Date().toISOString().split('T')[0],
        is_archived: false
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Submission failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Update Operational Directive' : 'Initialize New Directive'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} size="sm" className="uppercase tracking-widest text-[10px] font-bold">Cancel</Button>
          <Button onClick={handleSubmit} isLoading={loading} size="sm" className="uppercase tracking-widest text-[10px] font-bold shadow-md">
            {initialData ? 'Execute Update' : 'Publish Directive'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input 
          label="Directive Primary Identifier" 
          value={formData.title}
          onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
          placeholder="e.g. Maintenance Cycle A-42"
          required
        />
        
        <div className="space-y-1">
          <label className="block text-[10px] font-serif uppercase tracking-widest text-brand-charcoal/60">Functional Description</label>
          <textarea 
            className="w-full bg-white border border-brand-border px-3 py-2 text-sm focus:outline-none focus:border-brand-gold transition-colors duration-200 placeholder:text-brand-charcoal/30 min-h-[100px] resize-none"
            value={formData.description}
            onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
            placeholder="Specify technical parameters or operational context..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-serif uppercase tracking-widest text-brand-charcoal/60">Operational Priority</label>
            <select 
              value={formData.priority}
              onChange={e => setFormData(p => ({ ...p, priority: e.target.value as TaskPriority }))}
              className="w-full bg-white border border-brand-border px-3 py-2 text-sm focus:outline-none focus:border-brand-gold transition-colors duration-200 cursor-pointer shadow-sm"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-serif uppercase tracking-widest text-brand-charcoal/60">Strategic Status</label>
            <select 
              value={formData.status}
              onChange={e => setFormData(p => ({ ...p, status: e.target.value as TaskStatus }))}
              className="w-full bg-white border border-brand-border px-3 py-2 text-sm focus:outline-none focus:border-brand-gold transition-colors duration-200 cursor-pointer shadow-sm"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="meeting">Meeting Schedule</option>
              <option value="completed">Operational Success</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="Commencement Date" 
            type="date"
            value={formData.start_date}
            onChange={e => setFormData(p => ({ ...p, start_date: e.target.value }))}
          />
          <Input 
            label="Deadline Manifest" 
            type="date"
            value={formData.due_date}
            onChange={e => setFormData(p => ({ ...p, due_date: e.target.value }))}
          />
        </div>
      </form>
    </Modal>
  );
};
