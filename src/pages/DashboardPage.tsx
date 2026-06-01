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
  CheckCircle,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { cn } from '../lib/utils';

export const DashboardPage: React.FC = () => {
  const { tasks } = useTasks();

  const stats = [
    { label: 'Total Tasks', value: tasks.length, icon: Activity, color: 'text-brand-gold' },
    { label: 'In Progress', value: tasks.filter(t => t.status === 'in_progress').length, icon: CheckCircle2, color: 'text-blue-500' },
    { label: 'Completed Tasks', value: tasks.filter(t => t.status === 'resolved').length, icon: CheckCircle, color: 'text-green-500' },
    { label: 'Pending Review', value: tasks.filter(t => t.status === 'pending').length, icon: Clock, color: 'text-neutral-500' },
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
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Dallmayr Dashboard</h1>
        <p className="text-text-secondary text-sm mt-1">Real-time task performance analytics and field ticketing summaries.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, idx) => (
          <Card key={idx} className="p-6 bg-bg-elevated/45 backdrop-blur-sm border-brand-border">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-2 rounded-lg bg-bg-base border border-brand-border", stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-xs font-semibold text-text-secondary flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                Live Hub
              </div>
            </div>
            <p className="text-3xl font-bold text-text-primary tracking-tight">{stat.value}</p>
            <p className="text-xs font-semibold text-text-secondary uppercase mt-1 tracking-wider">{stat.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <Card className="lg:col-span-2 p-8 border-brand-border bg-bg-elevated/45">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-bold text-text-primary">Task Distribution</h3>
            <div className="flex items-center gap-4">
              {['Pending', 'Active', 'Resolved'].map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", i === 0 ? "bg-neutral-500" : i === 1 ? "bg-brand-gold" : "bg-green-500")} />
                  <span className="text-xs font-medium text-text-secondary">{label}</span>
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
                  tick={{ fontSize: 11, fontWeight: 500, fill: '#888' }} 
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ 
                    backgroundColor: '#1c1917', 
                    border: '1px solid #2e2a24',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 500,
                    color: '#fff'
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
                  {statusData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === 0 ? '#737373' : index === 1 ? '#c5a059' : '#22c55e'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Side Component */}
        <div className="space-y-8">
          <Card className="p-8 border-brand-border bg-bg-elevated/45">
            <h3 className="text-sm font-bold text-text-primary mb-6">Task Priority Breakdown</h3>
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
                <span className="text-xs font-semibold text-text-secondary">Overview</span>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {priorityData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-medium text-text-secondary">{item.name} Priority</span>
                  </div>
                  <span className="text-xs font-bold text-text-primary">{item.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-brand-gold text-white overflow-hidden relative">
            <div className="relative z-10">
              <Activity className="w-8 h-8 mb-4 opacity-50 text-white" />
              <h4 className="text-sm font-bold mb-1">System Status: Active</h4>
              <p className="text-xs font-medium opacity-90 leading-relaxed">
                All systems are operational and performing optimally.
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
