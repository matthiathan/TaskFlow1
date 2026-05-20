import React from 'react';
import { useTasks } from '../hooks/useTasks';
import { Card } from '../components/ui/Base';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  Activity, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Zap,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { cn } from '../lib/utils';

export const DashboardPage: React.FC = () => {
  const { tasks, loading } = useTasks();

  const stats = [
    { label: 'System Directives', value: tasks.length, icon: Activity, color: 'text-brand-gold' },
    { label: 'Active Operations', value: tasks.filter(t => t.status === 'in_progress').length, icon: Zap, color: 'text-blue-500' },
    { label: 'Resolved Goals', value: tasks.filter(t => t.status === 'resolved').length, icon: CheckCircle2, color: 'text-green-500' },
    { label: 'Pending Response', value: tasks.filter(t => t.status === 'pending').length, icon: Clock, color: 'text-neutral-500' },
  ];

  const priorityData = [
    { name: 'High', value: tasks.filter(t => t.priority === 'high').length, color: '#ef4444' },
    { name: 'Medium', value: tasks.filter(t => t.priority === 'medium').length, color: '#c5a059' },
    { name: 'Low', value: tasks.filter(t => t.priority === 'low').length, color: '#22c55e' },
  ].filter(d => d.value > 0);

  const statusData = [
    { name: 'Pending', count: tasks.filter(t => t.status === 'pending').length },
    { name: 'Active', count: tasks.filter(t => t.status === 'in_progress').length },
    { name: 'Resolved', count: tasks.filter(t => t.status === 'resolved').length },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-serif uppercase tracking-[0.1em]">Ops Intelligence</h1>
        <p className="text-text-secondary text-sm mt-1">Real-time telemetry and operational throughput analysis.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <Card key={idx} className="p-6 bg-bg-elevated/40 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-2 rounded-lg bg-bg-base border border-brand-border", stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-[10px] font-black text-text-secondary uppercase tracking-widest flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-500" />
                Live Feed
              </div>
            </div>
            <p className="text-3xl font-black text-text-primary tracking-tighter">{stat.value}</p>
            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.2em] mt-1">{stat.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <Card className="lg:col-span-2 p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-primary">Operational Distribution</h3>
            <div className="flex items-center gap-4">
              {['Pending', 'Active', 'Resolved'].map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={cn("w-1.5 h-1.5 rounded-full", i === 0 ? "bg-neutral-500" : i === 1 ? "bg-brand-gold" : "bg-green-500")} />
                  <span className="text-[8px] font-bold text-text-secondary uppercase">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="h-[300px] w-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.1} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#666' }} 
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ 
                    backgroundColor: '#1a1a1a', 
                    border: '1px solid #262626',
                    borderRadius: '8px',
                    fontSize: '10px',
                    fontWeight: 800,
                    color: '#fff'
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
                  {statusData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === 0 ? '#666' : index === 1 ? '#c5a059' : '#22c55e'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Side Component */}
        <div className="space-y-8">
          <Card className="p-8">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-primary mb-6">Threat Mitigation</h3>
            <div className="h-[200px] w-full relative min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie
                    data={priorityData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <ShieldCheck className="w-6 h-6 text-brand-gold mb-1" />
                <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary">Secured</span>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {priorityData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[10px] font-bold text-text-secondary uppercase">{item.name} Priority</span>
                  </div>
                  <span className="text-[10px] font-black text-text-primary">{item.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-brand-gold text-white overflow-hidden relative">
            <div className="relative z-10">
              <Activity className="w-8 h-8 mb-4 opacity-50" />
              <h4 className="text-sm font-black uppercase tracking-widest mb-1">System Status: Optimal</h4>
              <p className="text-[10px] font-medium opacity-80 leading-relaxed uppercase tracking-tight">
                All secure uplinks are operational. Latency detected within expected parameters.
              </p>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <ShieldCheck size={120} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
