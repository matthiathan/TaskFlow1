import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  MoreVertical, 
  CheckCircle2, 
  Clock, 
  Loader2,
  FileText,
  Image as ImageIcon,
  AlertTriangle,
  ChevronDown,
  X,
  File,
} from 'lucide-react';
import { useERPRequestsData } from '../hooks/useERPRequestsData';
import { Button, Input, Card } from '../components/ui/Base';
import { ERPRequest, ERPRequestStatus } from '../types/database';
import { Spinner } from '../components/ui/LoadingScreen';
import { FileUpload } from '../components/ui/FileUpload';

export const ERPRequestsPage: React.FC = () => {
  const { requests, loading, addRequest, deleteRequest, updateStatus } = useERPRequestsData();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<ERPRequestStatus | 'all'>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    task_number: '',
    serial_number: '',
    qr_code: '',
    title: '',
    issue: '',
    requester_name: '',
    status: 'pending' as ERPRequestStatus,
    request_date: new Date().toISOString().split('T')[0],
    request_time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    image_urls: [] as string[],
    documents: [] as string[],
    is_archived: false,
    escalated_to: null
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addRequest(formData);
      // Reset form
      setFormData({
        task_number: '',
        serial_number: '',
        qr_code: '',
        title: '',
        issue: '',
        requester_name: '',
        status: 'pending',
        request_date: new Date().toISOString().split('T')[0],
        request_time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        image_urls: [],
        documents: [],
        is_archived: false,
        escalated_to: null
      });
    } catch (err) {
      console.error('Failed to submit ERP request:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('SECURITY PROTOCOL: Permanent deletion of ERP record requested. Confirm purge?')) {
      await deleteRequest(id);
    }
  };

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.task_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.serial_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.qr_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || req.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-text-primary tracking-tight uppercase mb-1">ERP Technical Portal</h1>
          <p className="text-text-secondary font-serif italic">Servicing Operations | Integrated Asset Management</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Entry Form */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-brand-gold"></div>
            <h3 className="text-lg font-serif uppercase tracking-tight mb-6 text-text-primary">Request Initialization</h3>
            
            <form onSubmit={handleSubmit} className="p-1 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Task Sequence No." 
                  value={formData.task_number}
                  onChange={e => setFormData(p => ({ ...p, task_number: e.target.value }))}
                  required
                />
                <Input 
                  label="Serial ID" 
                  value={formData.serial_number}
                  onChange={e => setFormData(p => ({ ...p, serial_number: e.target.value }))}
                  required
                />
              </div>

              <Input 
                label="Encryption QR Reference" 
                value={formData.qr_code}
                onChange={e => setFormData(p => ({ ...p, qr_code: e.target.value }))}
                required
              />

              <Input 
                label="Strategic Title" 
                value={formData.title}
                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                required
              />

              <div className="space-y-1">
                <label className="block text-[10px] font-serif uppercase tracking-widest text-text-secondary font-medium">
                  Issue Manifest <span className="text-brand-gold ml-1 italic">(Encrypted)</span>
                </label>
                <textarea 
                  className="w-full bg-bg-elevated border border-brand-border px-3 py-2 text-sm focus:outline-none focus:border-brand-gold transition-colors duration-200 placeholder:text-text-muted/50 min-h-[120px] resize-none text-text-primary"
                  value={formData.issue}
                  onChange={e => setFormData(p => ({ ...p, issue: e.target.value }))}
                  placeholder="Provide detailed technical diagnostics..."
                  required
                />
              </div>

              <Input 
                label="Originating Requester" 
                value={formData.requester_name}
                onChange={e => setFormData(p => ({ ...p, requester_name: e.target.value }))}
                required
              />

              <div className="space-y-3">
                <label className="block text-[10px] font-serif uppercase tracking-widest text-text-secondary font-medium">
                  Media & Documentation Appendices
                </label>
                
                {/* Image Upload */}
                <div className="space-y-2">
                  <p className="text-[9px] uppercase tracking-wider text-text-muted font-bold">Image Attachments</p>
                  <FileUpload 
                    bucket="erp_media"
                    folderPath={`images/${new Date().toISOString().split('T')[0]}`}
                    onUploadComplete={(url) => setFormData(p => ({ ...p, image_urls: [...p.image_urls, url] }))}
                    accept="image/*"
                  />
                  {formData.image_urls.length > 0 && (
                    <div className="flex gap-2 flex-wrap mt-2">
                      {formData.image_urls.map((url, i) => (
                        <div key={i} className="relative w-16 h-16 border border-brand-border rounded-sm overflow-hidden group">
                          <img src={url} alt="Uploaded" className="w-full h-full object-cover" />
                          <button 
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, image_urls: p.image_urls.filter((_, idx) => idx !== i) }))}
                            className="absolute top-0 right-0 p-0.5 bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Document Upload */}
                <div className="space-y-2">
                  <p className="text-[9px] uppercase tracking-wider text-text-muted font-bold">Document Logs (PDFs)</p>
                  <FileUpload 
                    bucket="erp_media"
                    folderPath={`docs/${new Date().toISOString().split('T')[0]}`}
                    onUploadComplete={(url) => setFormData(p => ({ ...p, documents: [...p.documents, url] }))}
                    accept="application/pdf"
                  />
                  {formData.documents.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {formData.documents.map((url, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-bg-surface border border-brand-border rounded-sm group">
                          <div className="flex items-center gap-2">
                            <File size={12} className="text-brand-gold" />
                            <span className="text-[10px] text-text-secondary truncate max-w-[150px]">Reference Document {i + 1}</span>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setFormData(p => ({ ...p, documents: p.documents.filter((_, idx) => idx !== i) }))}
                            className="text-text-muted hover:text-red-500 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Button type="submit" className="w-full uppercase tracking-widest font-bold text-[10px] shadow-lg mt-4 h-11" isLoading={isSubmitting}>
                Command Integration
              </Button>
            </form>
          </Card>

          <Card className="p-4 bg-brand-charcoal text-white/40 text-[9px] uppercase tracking-[0.2em] leading-relaxed">
            <div className="flex items-center gap-2 text-brand-gold mb-2">
              <ShieldCheck className="w-3 h-3" />
              <span className="font-bold">Security Advisory</span>
            </div>
            All data in the "Issue Manifest" field is encrypted with AES-256 standard before transmission to the database. Decryption is only possible through authenticated portal sessions with the appropriate encryption keys.
          </Card>
        </div>

        {/* Right: Queue Table */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-bg-elevated p-4 border border-brand-border shadow-sm rounded-sm">
            <div className="flex items-center gap-2 border-b border-brand-border md:border-none pb-2 md:pb-0 w-full md:w-auto overflow-x-auto">
               <button onClick={() => setFilterStatus('all')} className={`px-4 py-1.5 text-[10px] uppercase font-bold tracking-widest rounded-sm shadow-sm transition-all ${filterStatus === 'all' ? 'bg-text-primary text-bg-base' : 'text-text-secondary hover:text-text-primary'}`}>All</button>
               <button onClick={() => setFilterStatus('pending')} className={`px-4 py-1.5 text-[10px] uppercase font-bold tracking-widest rounded-sm shadow-sm transition-all ${filterStatus === 'pending' ? 'bg-text-primary text-bg-base' : 'text-text-secondary hover:text-text-primary'}`}>Pending</button>
               <button onClick={() => setFilterStatus('in_progress')} className={`px-4 py-1.5 text-[10px] uppercase font-bold tracking-widest rounded-sm shadow-sm transition-all ${filterStatus === 'in_progress' ? 'bg-text-primary text-bg-base' : 'text-text-secondary hover:text-text-primary'}`}>Progress</button>
               <button onClick={() => setFilterStatus('resolved')} className={`px-4 py-1.5 text-[10px] uppercase font-bold tracking-widest rounded-sm shadow-sm transition-all ${filterStatus === 'resolved' ? 'bg-text-primary text-bg-base' : 'text-text-secondary hover:text-text-primary'}`}>Resolved</button>
            </div>
            <div className="relative w-full md:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input 
                type="text"
                placeholder="Queue Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-bg-surface border border-brand-border pl-9 pr-4 py-2 text-[11px] font-medium tracking-tight focus:outline-none focus:border-brand-gold transition-colors shadow-inner text-text-primary"
              />
            </div>
          </div>

          <Card className="overflow-hidden shadow-sm">
            {loading ? (
              <div className="py-20 flex justify-center"><Spinner /></div>
            ) : filteredRequests.length === 0 ? (
              <div className="py-20 text-center italic text-brand-charcoal/40 font-serif">No active records detected in the serving pipeline.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="enterprise-table">
                  <thead>
                    <tr>
                      <th>Seq No / Asset</th>
                      <th>Operational Directives</th>
                      <th>Requester</th>
                      <th>Status Mapping</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map(req => (
                      <tr key={req.id} className="group">
                        <td className="whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-xs font-mono font-bold text-text-primary">{req.task_number}</span>
                            <span className="text-[10px] text-text-secondary tracking-tighter">S/N: {req.serial_number}</span>
                            <span className="text-[10px] text-text-secondary tracking-tighter">QR: {req.qr_code}</span>
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-col max-w-xs">
                            <span className="text-xs font-semibold text-text-primary">{req.title}</span>
                            <span className="text-[10px] text-text-secondary italic line-clamp-1">{req.issue}</span>
                            {(req.image_urls.length > 0 || req.documents.length > 0) && (
                              <div className="flex items-center gap-2 mt-2">
                                {req.image_urls.length > 0 && (
                                  <div className="flex items-center gap-1 text-[9px] text-brand-gold font-bold">
                                    <ImageIcon size={10} />
                                    {req.image_urls.length} IMG
                                  </div>
                                )}
                                {req.documents.length > 0 && (
                                  <div className="flex items-center gap-1 text-[9px] text-brand-gold font-bold">
                                    <File size={10} />
                                    {req.documents.length} DOC
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap">
                          <div className="flex items-center gap-2">
                             <div className="w-6 h-6 bg-bg-surface border border-brand-border rounded-full flex items-center justify-center text-[10px] font-bold text-text-primary shadow-sm">
                               {req.requester_name.charAt(0)}
                             </div>
                             <span className="text-xs text-text-secondary font-medium">{req.requester_name}</span>
                          </div>
                        </td>
                        <td>
                          <select 
                            value={req.status}
                            onChange={(e) => updateStatus(req.id, e.target.value as ERPRequestStatus)}
                            className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm border focus:outline-none cursor-pointer transition-all shadow-sm
                              ${req.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                                req.status === 'in_progress' ? 'bg-brand-gold-muted text-brand-gold border-brand-gold/30' : 
                                req.status === 'resolved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}
                            `}
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="archived">Archived</option>
                          </select>
                        </td>
                        <td className="text-right">
                          <button onClick={() => handleDelete(req.id)} className="p-2 text-text-muted hover:text-red-500 transition-colors rounded-sm shadow-sm opacity-0 group-hover:opacity-100">
                             <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

const ShieldCheck = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>
  </svg>
);
