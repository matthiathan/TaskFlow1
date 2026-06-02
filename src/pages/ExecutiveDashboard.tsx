import React, { useState, useMemo, useEffect } from 'react';
import { useExecutiveAnalytics } from '../hooks/useExecutiveAnalytics';
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
  Pie, 
  Legend
} from 'recharts';
import { 
  Activity, 
  Clock, 
  Building2, 
  TrendingUp, 
  User, 
  Filter, 
  ArrowUpDown, 
  Search,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Department } from '../types/database';

const DEPARTMENT_LABELS: Record<string, string> = {
  warehouse: 'Warehouse Logistics',
  road_techs: 'Road Technicians',
  techs: 'In-House Technicians',
  marketing: 'Sales & Marketing',
  finance: 'Corporate Finance',
  it: 'IT Support & Systems',
  unassigned: 'Unassigned Personnel'
};

const STATS_MAP = [
  { value: 'warehouse', label: 'Warehouse Logistics' },
  { value: 'road_techs', label: 'Road Technicians' },
  { value: 'techs', label: 'In-House Technicians' },
  { value: 'marketing', label: 'Sales & Marketing' },
  { value: 'finance', label: 'Corporate Finance' },
  { value: 'it', label: 'IT Support & Systems' }
];

type SortField = 'name' | 'department' | 'role' | 'completedTasks' | 'avgTAT';
type SortOrder = 'asc' | 'desc';

export const ExecutiveDashboard: React.FC = () => {
  const { loading, departmentData, employeeData, kpiMetrics, refresh } = useExecutiveAnalytics();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('completedTasks');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle Sort Toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Filter & Sort Personnel Matrix Data
  const filteredAndSortedEmployees = useMemo(() => {
    let list = [...employeeData];

    // Filter by department
    if (departmentFilter !== 'all') {
      list = list.filter(emp => emp.department === departmentFilter);
    }

    // Filter by search query (full-name or id matching)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(emp => 
        emp.name.toLowerCase().includes(q) || 
        emp.role.toLowerCase().includes(q)
      );
    }

    // Sort
    list.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      // Handle strings
      if (typeof valA === 'string' && typeof valB === 'string') {
        const strA = valA.toLowerCase();
        const strB = valB.toLowerCase();
        return sortOrder === 'asc' 
          ? strA.localeCompare(strB)
          : strB.localeCompare(strA);
      }

      // Handle numbers
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }

      return 0;
    });

    return list;
  }, [employeeData, departmentFilter, searchQuery, sortField, sortOrder]);

  // Distinct Color Array for Pie Chart
  const departmentColors = {
    warehouse: '#c5a059',  // Gold
    road_techs: '#3b82f6', // Bright Blue
    techs: '#10b981',      // Mint
    marketing: '#ec4899',  // Pink
    finance: '#8b5cf6',    // Magenta Purple
    it: '#f59e0b'          // Amber Orange
  };

  const formattedPieData = useMemo(() => {
    return departmentData
      .map(dept => ({
        name: dept.name,
        value: dept.activeTasks,
        color: departmentColors[dept.department] || '#737373'
      }))
      .filter(item => item.value > 0);
  }, [departmentData]);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-brand-gold">Dallmayr South Africa</span>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary mt-1">Executive Analytics</h1>
          <p className="text-text-secondary text-sm mt-1">
            Corporate performance stats, Departmental Velocity, and Personnel Metrics overview.
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 border border-brand-border bg-bg-elevated text-text-primary hover:border-brand-gold hover:text-brand-gold rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          Sync Reports
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        
        {/* KPI 1 */}
        <Card className="p-6 bg-bg-elevated/45 backdrop-blur-sm border-brand-border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-bg-base border border-brand-border text-brand-gold">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-mono font-bold text-green-500 uppercase flex items-center gap-1 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/15">
              <TrendingUp className="w-3 h-3" /> Live Dispatch
            </span>
          </div>
          {loading ? (
            <div className="h-9 w-24 bg-neutral-800/40 animate-pulse rounded" />
          ) : (
            <p className="text-3xl font-bold text-text-primary tracking-tight">
              {kpiMetrics.totalActiveWorkflows}
            </p>
          )}
          <p className="text-xs font-semibold text-text-secondary uppercase mt-1 tracking-wider">Total Active Workflows</p>
          <p className="text-[10px] text-text-secondary mt-1 max-w-[240px]">Sum of pending & in-progress tasks or diagnostics awaiting field dispatch.</p>
        </Card>

        {/* KPI 2 */}
        <Card className="p-6 bg-bg-elevated/45 backdrop-blur-sm border-brand-border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-bg-base border border-brand-border text-blue-500">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-mono font-bold text-neutral-400 uppercase bg-neutral-800/40 px-1.5 py-0.5 rounded border border-brand-border">
              Enterprise Scale
            </span>
          </div>
          {loading ? (
            <div className="h-9 w-24 bg-neutral-800/40 animate-pulse rounded" />
          ) : (
            <p className="text-3xl font-bold text-text-primary tracking-tight">
              {kpiMetrics.companyWideAvgTAT} hrs
            </p>
          )}
          <p className="text-xs font-semibold text-text-secondary uppercase mt-1 tracking-wider">Turnaround Time (TAT)</p>
          <p className="text-[10px] text-text-secondary mt-1 max-w-[240px]">Company-wide Mean Time to Resolution (MTTR) across operational departments.</p>
        </Card>

        {/* KPI 3 */}
        <Card className="p-6 bg-bg-elevated/45 backdrop-blur-sm border-brand-border sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 rounded-lg bg-bg-base border border-brand-border text-brand-gold">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-mono font-bold text-brand-gold uppercase bg-brand-gold/10 px-1.5 py-0.5 rounded border border-brand-gold/15">
              Primary Hub
            </span>
          </div>
          {loading ? (
            <div className="h-9 w-40 bg-neutral-800/40 animate-pulse rounded" />
          ) : (
            <p className="text-xl font-bold text-text-primary tracking-tight truncate">
              {kpiMetrics.mostActiveDepartment}
            </p>
          )}
          <p className="text-xs font-semibold text-text-secondary uppercase mt-2 tracking-wider">Most Active Department</p>
          <p className="text-[10px] text-text-secondary mt-1 max-w-[240px]">Department harboring the highest total volume of workflows registered this term.</p>
        </Card>

      </div>

      {/* Analytics Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* Chart 1: Average TAT BarChart */}
        <Card className="lg:col-span-2 p-6 sm:p-8 border-brand-border bg-bg-elevated/45">
          <div className="mb-6">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Departmental Velocity Indicator</h3>
            <p className="text-xs text-text-secondary mt-1">Average Turnaround Time (TAT) measured in hours by corporate branch</p>
          </div>
          
          <div className="h-[300px] w-full min-h-[300px] flex items-center justify-center">
            {loading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-brand-gold border-t-transparent animate-spin rounded-full" />
                <span className="text-xs font-mono text-text-secondary uppercase">Calculating Velocity stats...</span>
              </div>
            ) : mounted ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={departmentData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.06} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 9, fontWeight: 600, fill: '#aaa' }} 
                    dy={12}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#888' }}
                    label={{ value: 'Turnaround Hrs', angle: -90, position: 'insideLeft', style: { fill: '#777', fontSize: 10, fontWeight: 600 } }}
                  />
                  <Tooltip 
                    cursor={{ fill: '#c5a059', opacity: 0.05 }}
                    contentStyle={{ 
                      backgroundColor: '#1c1917', 
                      border: '1px solid #2e2a24',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: '#fff'
                    }}
                  />
                  <Bar dataKey="avgTAT" radius={[4, 4, 0, 0]} barSize={36}>
                    {departmentData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={departmentColors[entry.department] || '#c5a059'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </Card>

        {/* Chart 2: Active Tasks Pie / Donut Chart */}
        <Card className="p-6 sm:p-8 border-brand-border bg-bg-elevated/45 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Workload Allocation</h3>
            <p className="text-xs text-text-secondary mt-1 font-medium">Distribution of active tasks across company divisions</p>
          </div>

          <div className="h-[220px] w-full relative min-h-[200px] flex items-center justify-center my-4">
            {loading ? (
              <div className="w-5 h-5 border-2 border-brand-gold border-t-transparent animate-spin rounded-full" />
            ) : mounted && formattedPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie
                    data={formattedPieData}
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {formattedPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1c1917', 
                      border: '1px solid #2e2a24',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: '#fff'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-4">
                <CheckCircle className="w-8 h-8 text-green-500 opacity-60 mb-2" />
                <span className="text-[10px] font-mono text-text-secondary uppercase">All workloads resolved</span>
              </div>
            )}
            
            {/* Absolute center marker */}
            {!loading && formattedPieData.length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-text-primary">
                  {formattedPieData.reduce((sum, item) => sum + item.value, 0)}
                </span>
                <span className="text-[9px] font-black tracking-wider text-text-secondary uppercase">Active</span>
              </div>
            )}
          </div>

          {/* Custom Legends list */}
          <div className="grid grid-cols-2 gap-2 mt-2">
            {departmentData.map((dept) => {
              const color = departmentColors[dept.department];
              return (
                <div key={dept.department} className="flex items-center gap-1.5 overflow-hidden">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-[10px] font-semibold text-text-secondary truncate uppercase mr-1" title={dept.name}>
                    {dept.department.toUpperCase()} ({dept.activeTasks})
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

      </div>

      {/* PHASE 5: Personnel Performance Matrix */}
      <Card className="border-brand-border bg-bg-elevated/45 overflow-hidden">
        
        {/* Table Filters & Header */}
        <div className="p-6 border-b border-brand-border bg-bg-elevated/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Employee Workflow Analytics</h3>
            <p className="text-xs text-text-secondary mt-0.5">Statistical velocity tracking and total completed workloads by personnel.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search filter */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-text-secondary/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search personnel..."
                className="pl-9 pr-4 py-2 w-full sm:w-48 bg-bg-base border border-brand-border rounded-lg text-xs font-semibold text-text-primary placeholder:text-text-secondary/40 outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30 transition-all"
              />
            </div>

            {/* Department Filter dropdown */}
            <div className="relative flex items-center">
              <Filter className="absolute left-3 top-2.5 w-3.5 h-3.5 text-text-secondary" />
              <select
                value={departmentFilter}
                onChange={e => setDepartmentFilter(e.target.value)}
                className="pl-9 pr-6 py-2 bg-bg-base border border-brand-border text-xs font-bold text-text-primary rounded-lg outline-none cursor-pointer focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30 transition-all select-brand-arrow"
              >
                <option value="all">Company-wide (All Branches)</option>
                {STATS_MAP.map(item => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
                <option value="unassigned">Unassigned Department</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-brand-gold border-t-transparent animate-spin rounded-full" />
              <span className="text-xs font-mono text-text-secondary uppercase">Compiling corporate directory...</span>
            </div>
          ) : filteredAndSortedEmployees.length === 0 ? (
            <div className="py-12 text-center text-text-secondary font-mono text-xs uppercase">
              No personnel metrics available matching filter criteria
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-bg-elevated/20 border-b border-brand-border">
                  
                  {/* Name header */}
                  <th 
                    onClick={() => handleSort('name')}
                    className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      Employee Name
                      <ArrowUpDown className={cn("w-3.5 h-3.5", sortField === 'name' ? "text-brand-gold" : "text-text-secondary opacity-40")} />
                    </div>
                  </th>

                  {/* Department header */}
                  <th 
                    onClick={() => handleSort('department')}
                    className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      Department
                      <ArrowUpDown className={cn("w-3.5 h-3.5", sortField === 'department' ? "text-brand-gold" : "text-text-secondary opacity-40")} />
                    </div>
                  </th>

                  {/* System Role */}
                  <th 
                    onClick={() => handleSort('role')}
                    className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      System Role
                      <ArrowUpDown className={cn("w-3.5 h-3.5", sortField === 'role' ? "text-brand-gold" : "text-text-secondary opacity-40")} />
                    </div>
                  </th>

                  {/* Total Completed */}
                  <th 
                    onClick={() => handleSort('completedTasks')}
                    className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      Total Completed Workflows
                      <ArrowUpDown className={cn("w-3.5 h-3.5", sortField === 'completedTasks' ? "text-brand-gold" : "text-text-secondary opacity-40")} />
                    </div>
                  </th>

                  {/* Turnaround Time head */}
                  <th 
                    onClick={() => handleSort('avgTAT')}
                    className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      Average Turnaround Time (TAT)
                      <ArrowUpDown className={cn("w-3.5 h-3.5", sortField === 'avgTAT' ? "text-brand-gold" : "text-text-secondary opacity-40")} />
                    </div>
                  </th>

                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/40">
                {filteredAndSortedEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-bg-elevated/20 transition-all group">
                    
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-brand-gold/10 border border-brand-border flex items-center justify-center font-bold text-xs uppercase text-brand-gold">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-text-primary group-hover:text-brand-gold transition-colors">{emp.name}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                        emp.department === 'unassigned' 
                          ? "bg-neutral-800 text-text-secondary border border-brand-border/40"
                          : "bg-brand-gold/10 text-brand-gold border border-brand-gold/20"
                      )}>
                        {DEPARTMENT_LABELS[emp.department] || emp.department}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{emp.role}</span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-text-primary">{emp.completedTasks}</span>
                        {emp.completedTasks > 0 && (
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        )}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold font-mono text-text-secondary">
                        {emp.avgTAT > 0 ? `${emp.avgTAT} hrs` : 'N/A'}
                      </span>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </Card>
    </div>
  );
};
