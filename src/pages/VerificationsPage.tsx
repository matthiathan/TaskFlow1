import React, { useState, useRef, useEffect } from 'react';
import { 
  QrCode, 
  ArrowRightLeft, 
  MapPin, 
  History, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  Hash,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { useVerificationsData } from '../hooks/useVerificationsData';
import { Button, Input, Card } from '../components/ui/Base';
import { Verification } from '../types/database';
import { Spinner } from '../components/ui/LoadingScreen';

export const VerificationsPage: React.FC = () => {
  const { verifications, loading, addVerification, deleteVerification } = useVerificationsData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const qrInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [formData, setFormData] = useState({
    qr_code: '',
    serial_number: '',
    direction: 'Inbound' as 'Inbound' | 'Outbound',
    location: localStorage.getItem('last_verification_location') || '',
    is_archived: false
  });

  useEffect(() => {
    // Auto-focus on load
    qrInputRef.current?.focus();
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!formData.qr_code || !formData.serial_number || !formData.location) return;

    setIsSubmitting(true);
    setFeedback(null);

    const submission = {
      ...formData,
      verification_date: new Date().toISOString().split('T')[0],
      verification_time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    try {
      await addVerification(submission);
      
      // Save location for stickiness
      localStorage.setItem('last_verification_location', formData.location);

      setFeedback({ type: 'success', message: `RECORDED: ${formData.qr_code} [${formData.direction}]` });
      
      // Reset fields except location
      setFormData(p => ({
        ...p,
        qr_code: '',
        serial_number: '',
      }));

      // Instant Refocus
      setTimeout(() => {
        qrInputRef.current?.focus();
      }, 50);

    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Verification signal interrupted' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (e.target === qrInputRef.current) {
        // Just focus next if QR scanned
      }
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('PROTOCOL WARNING: This audit entry will be permanently redacted. Proceed?')) {
      deleteVerification(id);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="p-1 px-4 bg-brand-charcoal text-white rounded-t-sm inline-block shadow-lg">
           <h1 className="text-xl font-serif uppercase tracking-widest text-brand-gold italic">Asset Audits</h1>
        </div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-brand-charcoal/40 font-bold">
          <History className="w-3 h-3 text-brand-gold" />
          <span>Real-Time Audit Stream Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Rapid Entry Form */}
        <div className="space-y-6">
          <Card className="p-8 relative overflow-hidden border-brand-gold shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-brand-gold"></div>
            
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center gap-4 bg-brand-light p-1 rounded-sm border border-brand-border mb-8 shadow-sm">
                 <button 
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, direction: 'Inbound' }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-[11px] font-bold uppercase tracking-widest transition-all rounded-sm shadow-sm ${formData.direction === 'Inbound' ? 'bg-brand-charcoal text-white' : 'text-brand-charcoal/40 hover:text-brand-charcoal'}`}
                >
                  <ArrowDownLeft className="w-4 h-4 text-green-500" />
                  Inbound
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, direction: 'Outbound' }))}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 text-[11px] font-bold uppercase tracking-widest transition-all rounded-sm shadow-sm ${formData.direction === 'Outbound' ? 'bg-brand-charcoal text-white' : 'text-brand-charcoal/40 hover:text-brand-charcoal'}`}
                >
                  <ArrowUpRight className="w-4 h-4 text-red-500" />
                  Outbound
                </button>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gold" size={16} />
                  <input 
                    ref={qrInputRef}
                    type="text"
                    placeholder="SCAN QR SEQUENCE"
                    value={formData.qr_code}
                    onChange={e => setFormData(p => ({ ...p, qr_code: e.target.value.toUpperCase() }))}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                    className="w-full bg-brand-light border-2 border-brand-border h-16 pl-12 pr-4 text-xl font-mono font-bold tracking-tighter text-brand-charcoal focus:outline-none focus:border-brand-charcoal transition-all shadow-inner"
                    required
                  />
                </div>

                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-charcoal/30" size={16} />
                  <input 
                    type="text"
                    placeholder="ENTER SERIAL NUMBER"
                    value={formData.serial_number}
                    onChange={e => setFormData(p => ({ ...p, serial_number: e.target.value.toUpperCase() }))}
                    autoComplete="off"
                    className="w-full bg-white border-2 border-brand-border h-14 pl-12 pr-4 text-lg font-mono font-semibold tracking-tight text-brand-charcoal focus:outline-none focus:border-brand-charcoal transition-all shadow-sm"
                    required
                  />
                </div>

                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-charcoal/30" size={16} />
                  <input 
                    type="text"
                    placeholder="STATION / LOCATION"
                    value={formData.location}
                    onChange={e => setFormData(p => ({ ...p, location: e.target.value }))}
                    autoComplete="off"
                    className="w-full bg-white border-2 border-brand-border h-14 pl-12 pr-4 text-sm font-bold uppercase tracking-widest text-brand-charcoal focus:outline-none focus:border-brand-charcoal transition-all shadow-sm"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-16 text-lg uppercase tracking-[0.3em] font-black shadow-xl" isLoading={isSubmitting}>
                Log Entry
              </Button>
            </form>

            {feedback && (
              <div className={`mt-6 p-4 rounded-sm border-l-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm ${
                feedback.type === 'success' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700'
              }`}>
                {feedback.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                <p className="text-[11px] font-bold uppercase tracking-widest">{feedback.message}</p>
              </div>
            )}
          </Card>

          <Card className="p-4 bg-brand-charcoal border-l-4 border-brand-gold text-white/60 text-[10px] uppercase font-bold tracking-widest shadow-lg">
             Rapid Entry Protocol Active. Location stickiness engaged. Focus lock: QR Input.
          </Card>
        </div>

        {/* Audit Log */}
        <div className="space-y-4">
          <Card className="h-[calc(100vh-280px)] flex flex-col overflow-hidden shadow-2xl border-brand-border">
            <div className="p-4 bg-brand-charcoal/5 border-b border-brand-border flex items-center justify-between">
              <h3 className="text-xs uppercase tracking-widest font-black text-brand-charcoal/60">Dynamic Audit Stream</h3>
              <span className="text-[9px] font-mono bg-brand-charcoal text-white px-2 py-0.5 rounded-full shadow-sm">
                Session Count: {verifications.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto bg-brand-light/20 p-px">
              {loading ? (
                <div className="flex justify-center py-20"><Spinner /></div>
              ) : verifications.length === 0 ? (
                <div className="py-20 text-center italic text-brand-charcoal/20 text-xs font-serif">Awaiting initial tactical entry...</div>
              ) : (
                <div className="divide-y divide-brand-border/50">
                  {verifications.map((v, i) => (
                    <div key={v.id} className={`p-4 bg-white hover:bg-brand-light transition-all flex items-center justify-between group cursor-default shadow-sm border-l-2 ${v.direction === 'Inbound' ? 'border-green-500' : 'border-red-500'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-sm shadow-sm ${v.direction === 'Inbound' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                           {v.direction === 'Inbound' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                             <span className="text-[11px] font-mono font-bold text-brand-charcoal">{v.qr_code}</span>
                             <span className="text-[10px] text-brand-charcoal/40 font-medium">/{v.serial_number}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[9px] uppercase tracking-tighter text-brand-charcoal/40 mt-1">
                             <span className="flex items-center gap-1"><MapPin size={8} /> {v.location}</span>
                             <span className="flex items-center gap-1"><History size={8} /> {v.verification_time}</span>
                          </div>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => handleDelete(v.id)}
                        className="p-2 text-brand-charcoal/10 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 rounded-sm hover:bg-white shadow-sm"
                      >
                         <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
