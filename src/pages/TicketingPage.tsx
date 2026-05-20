import React, { useState } from 'react';
import { useTickets } from '../hooks/useTickets';
import { Card, Input, Textarea, Button } from '../components/ui/Base';
import { FileUpload } from '../components/ui/FileUpload';
import { ShieldCheck, ClipboardList, AlertTriangle, FileSearch, Trash2 } from 'lucide-react';
import { TaskPriority } from '../types/database';
import { toast } from 'sonner';

export const TicketingPage: React.FC = () => {
  const { loading, submitTicket } = useTickets();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as TaskPriority,
    attachment_urls: [] as string[]
  });

  const handleUpload = (url: string) => {
    setFormData(prev => ({ 
      ...prev, 
      attachment_urls: [...prev.attachment_urls, url] 
    }));
  };

  const handleFileRemoved = (url: string) => {
    setFormData(prev => ({ 
      ...prev, 
      attachment_urls: prev.attachment_urls.filter(u => u !== url) 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast.error('Title and description are mandatory.');
      return;
    }

    try {
      await submitTicket(formData);
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        attachment_urls: []
      });
      // Force reload UI state or navigate if needed
    } catch (err) {
      // Handled in hook
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-serif uppercase tracking-[0.1em]">Event Reporting</h1>
        <p className="text-text-secondary text-sm mt-1">Submit high-priority operational anomalies via secure uplink.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <Input 
                  label="Core Subject"
                  value={formData.title}
                  onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g., HVAC failure in Sector 7G..."
                  required
                />

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                      Technical Manifesto
                    </label>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-brand-gold/10 border border-brand-gold/20 rounded-full">
                      <ShieldCheck className="w-2.5 h-2.5 text-brand-gold" />
                      <span className="text-[8px] font-black uppercase text-brand-gold tracking-widest">AES-256 Enabled</span>
                    </div>
                  </div>
                  <Textarea 
                    value={formData.description}
                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                    placeholder="Provide sensitive technical diagnostics and operational context..."
                    className="min-h-[150px]"
                    required
                  />
                  <p className="text-[9px] text-text-secondary italic">This field will be encrypted locally before transmission.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Impact Assessment</label>
                    <select 
                      className="w-full bg-bg-base border border-brand-border rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-brand-gold input-recessed"
                      value={formData.priority}
                      onChange={e => setFormData(p => ({ ...p, priority: e.target.value as TaskPriority }))}
                    >
                      <option value="low">Low Impact</option>
                      <option value="medium">Standard Operational</option>
                      <option value="high">Mission Critical</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Technical Evidence</label>
                  <FileUpload 
                    onUploadComplete={handleUpload}
                    onFileRemoved={handleFileRemoved}
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  isLoading={loading} 
                  className="w-full py-4 text-sm font-black uppercase tracking-[0.2em] gap-3"
                >
                  <ClipboardList className="w-4 h-4" />
                  Transmit Encrypted Report
                </Button>
              </div>
            </form>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 bg-brand-charcoal text-white border-none shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-gold mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Security Protocol
            </h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="mt-1"><AlertTriangle className="w-3 h-3 text-brand-gold" /></div>
                <p className="text-[10px] leading-relaxed text-neutral-400">
                  <strong className="text-white block mb-0.5">End-to-End Encryption</strong>
                  Technical manifest descriptions are encrypted client-side using AES-256 standard before entering the database.
                </p>
              </li>
              <li className="flex gap-3">
                <div className="mt-1"><FileSearch className="w-3 h-3 text-brand-gold" /></div>
                <p className="text-[10px] leading-relaxed text-neutral-400">
                  <strong className="text-white block mb-0.5">Automated Purging</strong>
                  Orphaned files are automatically deleted from cloud clusters if removed from the reporting form.
                </p>
              </li>
            </ul>
          </Card>

          <Card className="p-6">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-primary mb-4">Submission Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-tight">
                <span className="text-text-secondary">Queued Artifacts</span>
                <span className="text-brand-gold">{formData.attachment_urls.length}</span>
              </div>
              <div className="w-full bg-bg-elevated h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-brand-gold h-full transition-all duration-300"
                  style={{ width: `${(formData.attachment_urls.length / 5) * 100}%` }}
                />
              </div>
              <p className="text-[9px] text-text-secondary italic">Limit of 5 artifacts per transmission protocol.</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
