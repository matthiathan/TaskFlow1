import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input, Textarea, Button } from '../ui/Base';
import { TaskPriority, TaskStatus } from '../../types/database';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: { title: string; description: string; priority: TaskPriority; status: TaskStatus; due_date: string | null }) => Promise<any>;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    status: 'pending' as TaskStatus,
    due_date: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        due_date: formData.due_date || null
      });
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'pending',
        due_date: '',
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal id="task-form" isOpen={isOpen} onClose={onClose} title="Initialize New Directive">
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
            label="Deadline"
            type="date"
            value={formData.due_date}
            onChange={e => setFormData(p => ({ ...p, due_date: e.target.value }))}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">Abort</Button>
          <Button type="submit" isLoading={loading} className="flex-1">Commence Directive</Button>
        </div>
      </form>
    </Modal>
  );
};
