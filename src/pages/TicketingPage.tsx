import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTickets } from '../hooks/useTickets';
import { useAuth } from '../contexts/AuthContext';
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
  History,
  FileSpreadsheet,
  Download,
  Printer,
  TrendingUp,
  BarChart2,
  AlertTriangle,
  Layers,
  CheckCircle,
  Activity
} from 'lucide-react';
import { TaskPriority, Ticket } from '../types/database';
import { TicketKanban } from '../components/reporting/TicketKanban';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  LineChart, 
  Line, 
  CartesianGrid, 
  Cell 
} from 'recharts';

export const TicketingPage: React.FC = () => {
  const { tickets, loading, fetchTickets, submitTicket, updateTicketStatus, updateTicket, deleteTicket } = useTickets();
  const { role } = useAuth();
  const isAdminOrTech = role === 'admin' || role === 'tech';
  
  const [showNewReport, setShowNewReport] = useState(false);
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null);
  
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [reportTemplate, setReportTemplate] = useState<'standard' | 'critical' | 'inventory'>('standard');
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'create') {
      setShowNewReport(true);
      setEditingTicketId(null);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  
  const [formData, setFormData] = useState({
    title: '',
    issue_description: '',
    priority: 'medium' as TaskPriority,
    qr_code: '',
    serial_number: '',
    occurrence_time: new Date().toISOString().slice(0, 16),
    machine_images: [] as string[]
  });

  const resetForm = () => {
    setFormData({
      title: '',
      issue_description: '',
      priority: 'medium',
      qr_code: '',
      serial_number: '',
      occurrence_time: new Date().toISOString().slice(0, 16),
      machine_images: []
    });
    setEditingTicketId(null);
  }

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
      toast.error('All required fields must be complete. Serial Number, Title, and Description are required.');
      return;
    }

    try {
      if (editingTicketId) {
        await updateTicket(editingTicketId, formData);
      } else {
        await submitTicket(formData);
      }
      resetForm();
      setShowNewReport(false);
      fetchTickets();
    } catch (err) {
      // Error handled in hook
    }
  };

  const handleEditTicket = (ticket: Ticket) => {
    setFormData({
      title: ticket.title,
      issue_description: ticket.issue_description,
      priority: ticket.priority,
      qr_code: ticket.qr_code || '',
      serial_number: ticket.serial_number || '',
      occurrence_time: ticket.occurrence_time || new Date().toISOString().slice(0, 16),
      machine_images: ticket.machine_images || []
    });
    setEditingTicketId(ticket.id);
    setShowNewReport(true);
  };

  const handleDeleteTicket = async (id: string) => {
    try {
      await deleteTicket(id);
    } catch (err) {
      // error handling inside hook
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.serial_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.qr_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- STATS CALCULATION ENGINES ---
  const kpiAlertsCount = tickets.filter(t => t.priority === 'high').length;
  const kpiAwaitingCount = tickets.filter(t => t.status === 'awaiting_tech').length;
  const kpiResolvedCount = tickets.filter(t => t.status === 'repaired' || t.status === 'closed').length;
  const resolutionRatio = tickets.length > 0 ? Math.round((kpiResolvedCount / tickets.length) * 100) : 0;

  // --- RECHARTS MATH ENGINES ---
  const priorityChartData = [
    { name: 'Low Priority', incidents: tickets.filter(t => t.priority === 'low').length, fill: '#10b981' },
    { name: 'Medium Priority', incidents: tickets.filter(t => t.priority === 'medium').length, fill: '#3b82f6' },
    { name: 'High Priority', incidents: tickets.filter(t => t.priority === 'high').length, fill: '#ef4444' }
  ];

  const statusChartData = [
    { name: 'Awaiting Tech', count: tickets.filter(t => t.status === 'awaiting_tech').length },
    { name: 'Diagnostics', count: tickets.filter(t => t.status === 'diagnostic').length },
    { name: 'Repaired', count: tickets.filter(t => t.status === 'repaired').length },
    { name: 'Closed', count: tickets.filter(t => t.status === 'closed').length }
  ];

  // --- DYNAMIC DATA EXPORT WORKFLOWS ---
  const handleExportCSV = () => {
    let listToExport = [...filteredTickets];
    let templateName = "Standard_Service_Tickets";

    if (reportTemplate === 'critical') {
      listToExport = filteredTickets.filter(t => t.priority === 'high');
      templateName = "Critical_SLA_Incidents";
    } else if (reportTemplate === 'inventory') {
      listToExport = [...filteredTickets].sort((a, b) => (a.serial_number || '').localeCompare(b.serial_number || ''));
      templateName = "Machine_Maintenance_Checklist";
    }

    const headers = [
      'Ticket ID', 
      'Ticket Title', 
      'Description', 
      'Priority Level', 
      'Status', 
      'Machine S/N', 
      'QR Code', 
      'Reported Time', 
      'Created Date'
    ];

    const rows = listToExport.map(t => [
      t.id,
      t.title.replace(/"/g, '""'),
      t.issue_description.replace(/"/g, '""'),
      t.priority.toUpperCase(),
      t.status.toUpperCase(),
      t.serial_number || '',
      t.qr_code || '',
      t.occurrence_time ? new Date(t.occurrence_time).toLocaleString() : '',
      new Date(t.created_at).toLocaleString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${templateName}_Export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Incidents list compiled and downloaded as CSV');
  };

  const handleExportExcel = () => {
    let listToExport = [...filteredTickets];
    let templateTitle = "DALLMAYR SOUTH AFRICA FIELD SERVICE EXPORT";
    let templateName = "Corporate_Report_Manifest";

    if (reportTemplate === 'critical') {
      listToExport = filteredTickets.filter(t => t.priority === 'high');
      templateTitle = "DALLMAYR SLA CRITICAL REPORT";
      templateName = "Critical_Incident_Audit";
    } else if (reportTemplate === 'inventory') {
      listToExport = [...filteredTickets].sort((a, b) => (a.serial_number || '').localeCompare(b.serial_number || ''));
      templateTitle = "DALLMAYR EQUIPMENT MAINTENANCE SERVICE LOG";
      templateName = "Equipment_Maintenance_Log";
    }

    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; }
          .title-block { background: #d97706; color: #ffffff; font-size: 16px; font-weight: bold; padding: 14px; text-align: center; }
          .meta-info { font-size: 11px; color: #d97706; padding: 4px; font-weight: bold; border-bottom: 2px solid #d97706; }
          th { background: #1c1917; color: #fbbf24; border: 1px solid #44403c; font-size: 11px; padding: 10px; text-transform: uppercase; text-align: left; }
          td { border: 1px solid #e7e5e4; font-size: 11px; padding: 8px; }
          .p-high { color: #ef4444; font-weight: bold; }
          .p-med { color: #3b82f6; font-weight: bold; }
          .p-low { color: #10b981; }
          .badge { font-weight: bold; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <table>
          <tr><td colspan="6" class="title-block">${templateTitle}</td></tr>
          <tr><td colspan="6" class="meta-info">Dallmayr South Africa Corporate Portal • Generated: ${new Date().toLocaleString()}</td></tr>
          <tr></tr>
          <tr>
            <th>Ticket ID</th>
            <th>Service Issue</th>
            <th>Machine Serial Number</th>
            <th>Priority Severity</th>
            <th>Current Status</th>
            <th>Reported Time</th>
          </tr>
          ${listToExport.map(t => `
            <tr>
              <td>${t.id.slice(0, 8)}</td>
              <td><b>${t.title}</b><br/><span style="color:#78716c;">${t.issue_description}</span></td>
              <td><b>${t.serial_number || 'N/A'}</b></td>
              <td class="badge p-${t.priority === 'high' ? 'high' : t.priority === 'medium' ? 'med' : 'low'}">${t.priority}</td>
              <td class="badge">${t.status}</td>
              <td>${t.occurrence_time ? new Date(t.occurrence_time).toLocaleString() : 'N/A'}</td>
            </tr>
          `).join('')}
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${templateName}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Dallmayr spreadsheet generated successfully');
  };

  const handlePrintPDF = () => {
    window.print();
    toast.success('PDF print command initiated');
  };

  return (
    <div className="max-w-[1600px] mx-auto py-8 px-4 sm:px-6 lg:px-8 print:p-0">
      
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text-primary">Service Ticket Hub</h1>
          <p className="text-text-secondary text-sm mt-1">Real-time equipment support ticketing and technical log analysis.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => setShowAnalytics(prev => !prev)}
            className={cn(
              "px-4 h-11 border rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shadow-sm",
              showAnalytics 
                ? "bg-brand-gold/10 border-brand-gold text-brand-gold" 
                : "bg-bg-elevated border-brand-border text-text-secondary hover:text-text-primary"
            )}
          >
            <TrendingUp className="w-4 h-4" />
            <span>{showAnalytics ? 'Hide Analytics Sidebar' : 'Show Analytics Sidebar'}</span>
          </button>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input 
              type="text"
              placeholder="Search by S/N, QR, or Title..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-bg-elevated border border-brand-border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:outline-none focus:border-brand-gold transition-all"
            />
          </div>
          <Button 
            onClick={() => setShowNewReport(true)}
            className="px-6 h-11 text-xs font-bold"
          >
            <Plus className="w-4 h-4" />
            File Support Ticket
          </Button>
        </div>
      </div>

      {/* --- ENTERPRISE ANALYTICS CORE & SPREADSHEET EXPORTER --- */}
      {showAnalytics && tickets.length > 0 && (
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-12 gap-6 print:block print:space-y-6">
          
          {/* Section: Live System Visual Trends */}
          <Card className="lg:col-span-8 p-6 border-brand-border flex flex-col justify-between shadow-md bg-bg-elevated/45 print:border-none print:shadow-none print:p-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-brand-gold" />
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">Service Ticketing Analytics</h3>
                  <p className="text-xs text-text-secondary">Key trends compiled from current active tickets</p>
                </div>
              </div>

              {/* Print indicator */}
              <div className="hidden print:block text-xs uppercase text-brand-gold font-bold">
                DALLMAYR MAINTENANCE REPORT TRANSCRIPT
              </div>
            </div>

            {/* Recharts Grid container */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Chart 1: Categorical Priority Distribution */}
              <div className="h-[200px] bg-bg-base/30 border border-brand-border/45 p-3 rounded-xl flex flex-col justify-between">
                <span className="text-xs font-semibold text-text-secondary tracking-wider">Tickets by Severity Level</span>
                <ResponsiveContainer width="99%" height="86%">
                  <BarChart data={priorityChartData}>
                    <XAxis dataKey="name" stroke="#888" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" fontSize={9} allowDecimals={false} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: '#1c1917', border: '1px solid #44403c', fontSize: '10px', borderRadius: '8px', color: '#fff' }} />
                    <Bar dataKey="incidents" barSize={18} radius={[4, 4, 0, 0]}>
                      {priorityChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Chart 2: Direct status pipelines */}
              <div className="h-[200px] bg-bg-base/30 border border-brand-border/45 p-3 rounded-xl flex flex-col justify-between">
                <span className="text-xs font-semibold text-text-secondary tracking-wider">Service Diagnostics Pipeline</span>
                <ResponsiveContainer width="99%" height="86%">
                  <LineChart data={statusChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" opacity={0.15} />
                    <XAxis dataKey="name" stroke="#888" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" fontSize={9} allowDecimals={false} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: '#1c1917', border: '1px solid #44403c', fontSize: '10px', borderRadius: '8px', color: '#fff' }} />
                    <Line type="monotone" dataKey="count" stroke="#d97706" strokeWidth={2.5} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

            </div>

            {/* Bottom KPI summaries */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-brand-border/20">
              <div className="flex gap-2 items-center">
                <div className="p-2 bg-neutral-500/10 rounded-lg text-text-primary">
                  <Activity className="w-4 h-4 text-neutral-400" />
                </div>
                <div>
                  <span className="text-xs text-text-secondary block">Total Tickets</span>
                  <span className="text-sm font-semibold block">{tickets.length} Incidents</span>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <span className="text-xs text-text-secondary block">High Priority SLA</span>
                  <span className="text-sm font-semibold text-red-500 block">{kpiAlertsCount} Urgent</span>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <div className="p-2 bg-brand-gold/10 rounded-lg text-brand-gold">
                  <Layers className="w-4 h-4 text-brand-gold" />
                </div>
                <div>
                  <span className="text-xs text-text-secondary block">Pending Assignment</span>
                  <span className="text-sm font-semibold text-brand-gold block">{kpiAwaitingCount} Awaiting</span>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <span className="text-xs text-text-secondary block">Resolution Rate</span>
                  <span className="text-sm font-semibold text-green-500 block">{resolutionRatio}% Solved</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Section: Custom Template Document Exporters */}
          <Card className="lg:col-span-4 p-6 border-brand-border flex flex-col justify-between shadow-md bg-bg-elevated/45 print:hidden">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-brand-gold" />
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">Export Support Reports</h3>
                  <p className="text-xs text-text-secondary">Configure layouts and download documents</p>
                </div>
              </div>
              
              <hr className="border-brand-border/10"/>

              {/* Sheet Template Selection dropdown */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-text-secondary">Export Template Layout</label>
                <select
                  value={reportTemplate}
                  onChange={e => setReportTemplate(e.target.value as any)}
                  className="w-full bg-bg-base border border-brand-border rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-brand-gold text-text-primary"
                >
                  <option value="standard">Standard Support Manifest</option>
                  <option value="critical">Critical SLA Ticket Auditing</option>
                  <option value="inventory">Equipment Machine Reference Log</option>
                </select>
                <p className="text-xs text-text-secondary/70 italic leading-relaxed">
                  {reportTemplate === 'standard' && 'Includes all diagnostic incident reports logged in real-time, categorized sequentially.'}
                  {reportTemplate === 'critical' && 'Filters outputs exclusively to Categories I (High severity) to audit emergency response times.'}
                  {reportTemplate === 'inventory' && 'Arranges logs sorted structurally by mechanical Serial Number for warehouse maintenance checklists.'}
                </p>
              </div>
            </div>

            {/* Compilers triggers list */}
            <div className="space-y-3 pt-6 lg:pt-0">
              <button 
                onClick={handleExportCSV}
                className="w-full bg-bg-base border border-brand-border hover:border-brand-gold/40 rounded-xl p-3 text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <span className="text-xs font-semibold text-text-primary group-hover:text-brand-gold transition-colors block">Export CSV Dataset</span>
                  <span className="text-xs text-text-secondary/60">Standard CSV Format</span>
                </div>
                <Download className="w-4 h-4 text-text-secondary group-hover:text-brand-gold transition-colors" />
              </button>

              <button 
                onClick={handleExportExcel}
                className="w-full bg-bg-base border border-brand-border hover:border-brand-gold/40 rounded-xl p-3 text-left transition-all flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <span className="text-xs font-semibold text-text-primary group-hover:text-brand-gold transition-colors block">Generate Excel Workbook</span>
                  <span className="text-xs text-text-secondary/60">Professional Excel format</span>
                </div>
                <FileSpreadsheet className="w-4 h-4 text-text-secondary group-hover:text-brand-gold transition-colors" />
              </button>

              <button 
                onClick={handlePrintPDF}
                className="w-full bg-brand-gold text-white focus:bg-brand-gold/80 rounded-xl p-3 text-left transition-all flex items-center justify-between group cursor-pointer shadow-md shadow-brand-gold/10"
              >
                <div>
                  <span className="text-xs font-semibold block">Print Support Summary Log</span>
                  <span className="text-xs text-white/80">Print-friendly PDF layout</span>
                </div>
                <Printer className="w-4 h-4 text-white" />
              </button>
            </div>
          </Card>

        </div>
      )}

      {/* Main Kanban Content */}
      <div className="min-h-[600px] print:m-0 print:border-none">
        {loading && tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] gap-4">
            <Settings2 className="w-12 h-12 text-brand-gold animate-spin" />
            <p className="text-xs font-semibold text-text-secondary">Loading Incident Directory...</p>
          </div>
        ) : (
          <TicketKanban 
            tickets={filteredTickets} 
            onUpdateStatus={updateTicketStatus} 
            onEditTicket={handleEditTicket}
            onDeleteTicket={handleDeleteTicket}
            isAdminOrTech={isAdminOrTech}
          />
        )}
      </div>

      {/* New Incident Modal */}
      {showNewReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300 print:hidden">
          <div className="w-full max-w-2xl bg-bg-elevated border border-brand-border rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 border-b border-brand-border flex items-center justify-between bg-bg-base/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-gold/10 rounded-xl">
                  <ClipboardList className="w-5 h-5 text-brand-gold" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">
                    {editingTicketId ? 'Edit Support Ticket' : 'File Support Ticket'}
                  </h3>
                  <p className="text-xs text-text-secondary">
                    {editingTicketId ? 'Update the details below' : 'Please describe the equipment issue and details below'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { resetForm(); setShowNewReport(false); }}
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
                    label="Machine Serial Number"
                    icon={<Hash className="w-4 h-4" />}
                    value={formData.serial_number}
                    onChange={e => setFormData(p => ({ ...p, serial_number: e.target.value }))}
                    placeholder="e.g. DAL-8829-X"
                    required
                  />
                  <Input 
                    label="Machine QR Code"
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
                    label="Ticket Title"
                    icon={<Settings2 className="w-4 h-4" />}
                    value={formData.title}
                    onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                    placeholder="Brief summary..."
                    required
                  />
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-text-secondary">Priority Level</label>
                    <select 
                      className="w-full bg-bg-base border border-brand-border rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-brand-gold transition-all"
                      value={formData.priority}
                      onChange={e => setFormData(p => ({ ...p, priority: e.target.value as TaskPriority }))}
                    >
                      <option value="low">Low Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="high">High Priority</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-text-secondary">Detailed Description</label>
                  <Textarea 
                    value={formData.issue_description}
                    onChange={e => setFormData(p => ({ ...p, issue_description: e.target.value }))}
                    placeholder="Provide full details and context of the failure or request..."
                    className="min-h-[120px]"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-text-secondary">Attachments & Images</label>
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
                  onClick={() => { resetForm(); setShowNewReport(false); }}
                  className="flex-grow py-4"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  isLoading={loading} 
                  className="flex-[2] py-4 text-xs font-semibold"
                >
                  {editingTicketId ? 'Update Ticket' : 'Submit Support Ticket'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Protocol Summary */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-brand-border pt-8 print:hidden">
         <div className="flex items-center gap-3 opacity-60">
            <LayoutGrid className="w-4 h-4 text-brand-gold" />
            <span className="text-xs font-semibold text-text-primary">Kanban Overview Board</span>
         </div>
         <div className="flex items-center gap-3 opacity-60">
            <History className="w-4 h-4 text-brand-gold" />
            <span className="text-xs font-semibold text-text-primary">30-Day Solved Tickets Archive</span>
         </div>
         <div className="flex items-center gap-3 opacity-60">
            <Cpu className="w-4 h-4 text-brand-gold" />
            <span className="text-xs font-semibold text-text-primary">System Synchronization Active</span>
         </div>
      </div>
    </div>
  );
};
