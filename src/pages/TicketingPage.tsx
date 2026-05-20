import React, { useState, useEffect } from 'react';
import { useTickets } from '../hooks/useTickets';
import { Card, Input, Textarea, Button } from '../components/ui/Base';
import { FileUpload } from '../components/ui/FileUpload';
import { 
  ClipboardList, 
  Search, 
  Plus, 
  Settings2, 
  Cpu, 
  Hash, 
  QrCode, 
  Clock, 
  X,
  LayoutGrid,
  History
} from 'lucide-react';
import { TaskPriority, Ticket } from '../types/database';
import { TicketKanban } from '../components/reporting/TicketKanban';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

export const TicketingPage: React.FC = () => {
  const { tickets, loading, fetchTickets, submitTicket, updateTicketStatus } = useTickets();
  const [showNewReport, setShowNewReport] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    issue_description: '',
    priority: 'medium' as TaskPriority,
    qr_code: '',
    serial_number: '',
    occurrence_time: new Date().toISOString().slice(0, 16),
    machine_images: [] as string[]
  });

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleUpload = (url: string) => {
    setFormData(prev => ({ 
      ...prev, 
      machine_images: [...prev.machine_images, url] 
    }));
  };

  const handleFileRemoved = (url: string) => {
    setFormData(prev => ({ 
      ...prev, 
      machine_images: prev.machine_images.filter(u => u !== url) 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.issue_description || !formData.serial_number) {
      toast.error('Mission parameters incomplete. S/N, Title, and Description are required.');
      return;
    }

    try {
      await submitTicket(formData);
      setFormData({
        title: '',
        issue_description: '',
        priority: 'medium',
        qr_code: '',
        serial_number: '',
        occurrence_time: new Date().toISOString().slice(0, 16),
        machine_images: []
      });
      setShowNewReport(false);
      fetchTickets();
    } catch (err) {
      // Error handled in hook
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.serial_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.qr_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-[1600px] mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-serif uppercase tracking-[0.1em]">Operational Intelligence</h1>
          <p className="text-text-secondary text-sm mt-1">Real-time machine incident tracking and field diagnostic hub.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input 
              type="text"
              placeholder="Search S/N, QR, or Title..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-bg-elevated border border-brand-border rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold uppercase tracking-wider focus:outline-none focus:border-brand-gold transition-all"
            />
          </div>
          <Button 
            onClick={() => setShowNewReport(true)}
            className="px-6 h-11 uppercase font-black text-[10px] tracking-[0.2em]"
          >
            <Plus className="w-4 h-4" />
            Log New Incident
          </Button>
        </div>
      </div>

      {/* Main Kanban Content */}
      <div className="min-h-[600px]">
        {loading && tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] gap-4">
            <Settings2 className="w-12 h-12 text-brand-gold animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary">Syncing Intel Grid...</p>
          </div>
        ) : (
          <TicketKanban tickets={filteredTickets} onUpdateStatus={updateTicketStatus} />
        )}
      </div>

      {/* New Incident Modal */}
      {showNewReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-bg-elevated border border-brand-border rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 border-b border-brand-border flex items-center justify-between bg-bg-base/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-gold/10 rounded-xl">
                  <ClipboardList className="w-5 h-5 text-brand-gold" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-text-primary">Incident Declaration</h3>
                  <p className="text-[9px] font-bold text-text-secondary uppercase tracking-widest">Protocol 4-A: Hardware Anomaly Logging</p>
                </div>
              </div>
              <button 
                onClick={() => setShowNewReport(false)}
                className="p-2 hover:bg-neutral-500/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[75vh] scrollbar-thin">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Identification */}
                <div className="space-y-4">
                  <Input 
                    label="Machine S/N"
                    icon={<Hash className="w-4 h-4" />}
                    value={formData.serial_number}
                    onChange={e => setFormData(p => ({ ...p, serial_number: e.target.value }))}
                    placeholder="e.g. DAL-8829-X"
                    required
                  />
                  <Input 
                    label="Identification QR"
                    icon={<QrCode className="w-4 h-4" />}
                    value={formData.qr_code}
                    onChange={e => setFormData(p => ({ ...p, qr_code: e.target.value }))}
                    placeholder="Scan or enter code..."
                  />
                  <Input 
                    label="Occurrence Time"
                    icon={<Clock className="w-4 h-4" />}
                    type="datetime-local"
                    value={formData.occurrence_time}
                    onChange={e => setFormData(p => ({ ...p, occurrence_time: e.target.value }))}
                  />
                </div>

                {/* Classification */}
                <div className="space-y-4">
                  <Input 
                    label="Subject Title"
                    icon={<Settings2 className="w-4 h-4" />}
                    value={formData.title}
                    onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                    placeholder="Brief summary..."
                    required
                  />
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Severity Grading</label>
                    <select 
                      className="w-full bg-bg-base border border-brand-border rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-brand-gold transition-all"
                      value={formData.priority}
                      onChange={e => setFormData(p => ({ ...p, priority: e.target.value as TaskPriority }))}
                    >
                      <option value="low">Category III - Maintenance</option>
                      <option value="medium">Category II - Operational</option>
                      <option value="high">Category I - Mission Critical</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Diagnostic Narrative</label>
                  <Textarea 
                    value={formData.issue_description}
                    onChange={e => setFormData(p => ({ ...p, issue_description: e.target.value }))}
                    placeholder="Provide full technical context of the failure..."
                    className="min-h-[120px]"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Visual Evidence</label>
                  <FileUpload 
                    onUploadComplete={handleUpload}
                    onFileRemoved={handleFileRemoved}
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-3">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => setShowNewReport(false)}
                  className="flex-grow py-4"
                >
                  Abort
                </Button>
                <Button 
                  type="submit" 
                  isLoading={loading} 
                  className="flex-[2] py-4 uppercase font-black tracking-[0.2em]"
                >
                  Transmit Report
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Protocol Summary */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-brand-border pt-8">
         <div className="flex items-center gap-3 grayscale opacity-50">
            <LayoutGrid className="w-4 h-4 text-brand-gold" />
            <span className="text-[10px] font-black uppercase tracking-widest text-text-primary">Kanban View</span>
         </div>
         <div className="flex items-center gap-3 grayscale opacity-50">
            <History className="w-4 h-4 text-brand-gold" />
            <span className="text-[10px] font-black uppercase tracking-widest text-text-primary">30-Day Archive</span>
         </div>
         <div className="flex items-center gap-3 grayscale opacity-50">
            <Cpu className="w-4 h-4 text-brand-gold" />
            <span className="text-[10px] font-black uppercase tracking-widest text-text-primary">Asset Sync ACTIVE</span>
         </div>
      </div>
    </div>
  );
};
