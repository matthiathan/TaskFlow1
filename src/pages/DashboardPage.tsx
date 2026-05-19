import React from 'react';
import { Card } from '../components/ui/Base';
import { useAuth } from '../contexts/AuthContext';
import { ClipboardList, Settings, ShieldCheck, MessageSquare, TrendingUp, Clock } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { profile } = useAuth();

  const stats = [
    { label: 'Pending Service Calls', value: '14', icon: Settings, color: 'text-brand-gold shadow-sm' },
    { label: 'Active Tasks', value: '28', icon: ClipboardList, color: 'text-blue-500 shadow-sm' },
    { label: 'Verifications (24h)', value: '142', icon: ShieldCheck, color: 'text-green-500 shadow-sm' },
    { label: 'Unread Comms', value: '03', icon: MessageSquare, color: 'text-brand-gold shadow-sm' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-4xl text-text-primary tracking-tight uppercase mb-1">Command Overview</h1>
          <p className="text-text-secondary font-serif italic">Operational Control Center | Welcome back, {profile?.full_name}</p>
        </div>
        <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest text-text-secondary font-medium">
          <Clock className="w-3 h-3 text-brand-gold" />
          <span>Session Start: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-text-secondary font-bold mb-1">{stat.label}</p>
                <h3 className="text-3xl font-serif text-text-primary">{stat.value}</h3>
              </div>
              <div className={`p-2 bg-bg-surface rounded-sm shadow-sm ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-brand-border flex items-center gap-2 text-[10px] text-green-600 font-medium">
              <TrendingUp className="w-3 h-3" />
              <span>+12% from previous cycle</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-0 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-brand-border flex items-center justify-between bg-brand-charcoal/5">
            <h3 className="text-lg uppercase tracking-tight font-serif text-text-primary">Critical Active ERP Requests</h3>
            <button className="text-[10px] uppercase tracking-widest text-brand-gold font-bold hover:underline">Vew Registry</button>
          </div>
          <div className="overflow-x-auto">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Task No.</th>
                  <th>QR Sequence</th>
                  <th>Client/Location</th>
                  <th>Complexity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map(i => (
                  <tr key={i}>
                    <td className="font-mono text-xs text-text-primary font-bold">ERP-9482{i}</td>
                    <td className="text-text-secondary">DZA-S-00{i}</td>
                    <td>Johannesburg Central</td>
                    <td>
                      <span className={`text-[10px] font-bold uppercase ${i % 2 === 0 ? 'text-red-500' : 'text-amber-500'}`}>
                        {i % 2 === 0 ? 'Urgent' : 'Routine'}
                      </span>
                    </td>
                    <td>
                      <div className="inline-flex items-center gap-2 px-2 py-1 bg-brand-gold-muted rounded-full text-[9px] font-bold text-brand-gold uppercase tracking-tighter">
                        <div className="w-1 h-1 bg-brand-gold rounded-full animate-pulse shadow-sm"></div>
                        In Progress
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-0 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-brand-border bg-brand-charcoal/5 text-text-primary">
            <h3 className="text-lg uppercase tracking-tight font-serif">Internal Dispatch Feed</h3>
          </div>
          <div className="p-6 space-y-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex gap-4 group cursor-pointer">
                <div className="flex-shrink-0 w-10 h-10 bg-bg-surface border border-brand-border flex items-center justify-center font-serif text-text-primary group-hover:bg-brand-gold group-hover:text-brand-charcoal transition-all duration-300 shadow-sm">
                  MT
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-primary">Mark Thompson <span className="ml-2 text-[10px] font-normal text-text-secondary tracking-tighter">24m ago</span></p>
                  <p className="text-xs text-text-secondary line-clamp-2 mt-1 italic">Status update on Job ERP-9482. Parts arrived at Cape Town warehouse. Commencing install tomorrow morning.</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-bg-surface border-t border-brand-border">
            <button className="w-full py-2 text-[10px] uppercase font-bold text-text-muted hover:text-brand-gold tracking-widest transition-colors">Load Archive</button>
          </div>
        </Card>
      </div>
    </div>
  );
};
