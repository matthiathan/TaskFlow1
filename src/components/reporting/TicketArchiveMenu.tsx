import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Archive, RefreshCcw, AlertTriangle, Clock } from 'lucide-react';

interface ArchivedTicket {
  id: string;
  title: string;
  description: string;
  deleted_at: string;
  assigned_to: string | null;
}

export const TicketArchiveMenu: React.FC = () => {
  const [archivedTickets, setArchivedTickets] = useState<ArchivedTicket[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchArchivedRecords = async () => {
    try {
      setLoading(true);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('tickets')
        .select('id, title, description, deleted_at, assigned_to')
        .not('deleted_at', 'is', null)
        .gte('deleted_at', thirtyDaysAgo.toISOString())
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      setArchivedTickets(data || []);
    } catch (err: any) {
      toast.error(`System Archive Fetch Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedRecords();
  }, []);

  const handleSystemRestoral = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ deleted_at: null })
        .eq('id', id);

      if (error) throw error;
      
      setArchivedTickets(prev => prev.filter(t => t.id !== id));
      toast.success('System Restoral successful. Ticket returned to active queue.');
    } catch (err: any) {
      toast.error(`System Restoral Failed: ${err.message}`);
    }
  };

  const calculateDaysRemaining = (deletedAt: string) => {
    const deletedDate = new Date(deletedAt);
    const purgeDate = new Date(deletedDate);
    purgeDate.setDate(purgeDate.getDate() + 30);
    
    const now = new Date();
    const diffTime = purgeDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="bg-bg-elevated border border-brand-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6 border-b border-brand-border pb-4">
        <div className="flex items-center gap-3">
          <Archive className="w-5 h-5 text-brand-gold" />
          <h2 className="text-xl font-bold uppercase tracking-wide text-text-primary">Archived Service Records</h2>
        </div>
        <div className="text-sm font-medium text-text-secondary bg-bg-base px-3 py-1.5 rounded-lg border border-brand-border">
          Permanent Purge Queue: 30 Days
        </div>
      </div>

      {loading ? (
        <div className="text-sm font-medium text-text-secondary py-4 text-center">Loading archived records...</div>
      ) : archivedTickets.length === 0 ? (
        <div className="text-sm font-medium text-text-secondary py-8 text-center italic border border-dashed border-brand-border rounded-lg bg-bg-base/50">
          No records currently in system archive.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-brand-border text-xs uppercase tracking-wider text-text-secondary font-bold">
                <th className="py-3 px-4">Ticket ID</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Deletion Date</th>
                <th className="py-3 px-4 text-center">Days Remaining</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {archivedTickets.map((ticket) => {
                const daysRemaining = calculateDaysRemaining(ticket.deleted_at);
                const isCritical = daysRemaining < 7;
                
                return (
                  <tr key={ticket.id} className="border-b border-brand-border/50 hover:bg-bg-base/30 transition-colors group">
                    <td className="py-3 px-4 text-sm font-mono text-text-secondary">
                      {ticket.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-text-primary">
                      {ticket.title}
                    </td>
                    <td className="py-3 px-4 text-sm text-text-secondary">
                      {new Date(ticket.deleted_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${
                        isCritical 
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                          : 'bg-bg-base text-text-secondary border border-brand-border'
                      }`}>
                        {isCritical ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {daysRemaining} Days
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleSystemRestoral(ticket.id)}
                        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-brand-gold/10 text-brand-gold border border-brand-gold/30 hover:bg-brand-gold hover:text-bg-base px-3 py-1.5 rounded transition-colors"
                      >
                        <RefreshCcw className="w-3.5 h-3.5" />
                        System Restoral
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
