import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Database, Search, AlertCircle, Table } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

export const ErpExplorer: React.FC = () => {
  const { profile, role } = useAuth();
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [adminTableInput, setAdminTableInput] = useState('');

  useEffect(() => {
    async function fetchPermissions() {
      if (role === 'admin') return;
      if (!profile?.id) return;
      
      const { data } = await supabase
        .from('erp_table_permissions')
        .select('table_name')
        .eq('user_id', profile.id)
        .eq('can_read', true);
        
      if (data) {
        setTables(data.map(p => p.table_name));
      }
    }
    fetchPermissions();
  }, [profile?.id, role]);

  const fetchData = async (tableName: string) => {
    if (!tableName) return;
    setLoading(true);
    const { data: rows, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(100);
      
    if (error) {
      toast.error('Error fetching data: ' + error.message);
    } else {
      setData(rows || []);
    }
    setLoading(false);
  };

  const headers = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Database className="w-8 h-8 text-brand-gold" />
        <h1 className="text-2xl font-bold text-text-primary">Database Explorer</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Table Selector */}
        <div className="bg-bg-elevated border border-brand-border p-6 rounded-2xl shadow-sm space-y-4">
          <h2 className="font-semibold text-text-primary">Select Table</h2>
          {role === 'admin' ? (
            <div className="space-y-2">
              <input 
                type="text"
                value={adminTableInput}
                onChange={e => setAdminTableInput(e.target.value)}
                placeholder="Enter exact table name"
                className="w-full p-2.5 bg-bg-base border border-brand-border rounded-xl text-sm"
              />
              <button 
                onClick={() => fetchData(adminTableInput)}
                className="w-full bg-brand-gold text-white p-2.5 rounded-xl text-sm font-semibold hover:bg-brand-gold/90"
              >
                Query Table
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {tables.map(table => (
                <button 
                  key={table}
                  onClick={() => { setSelectedTable(table); fetchData(table); }}
                  className={cn(
                    "w-full text-left p-3 rounded-xl text-sm font-medium transition-colors",
                    selectedTable === table ? "bg-brand-gold text-white" : "hover:bg-bg-base text-text-secondary"
                  )}
                >
                  <Table className="inline w-4 h-4 mr-2" />
                  {table}
                </button>
              ))}
              {tables.length === 0 && <p className="text-xs text-text-secondary italic">No tables accessible.</p>}
            </div>
          )}
        </div>

        {/* Dynamic Grid */}
        <div className="lg:col-span-3 bg-bg-elevated border border-brand-border rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-text-secondary">Loading data...</div>
          ) : data.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-bg-base border-b border-brand-border text-text-secondary">
                  <tr>
                    {headers.map(h => <th key={h} className="px-6 py-3 uppercase text-[10px] font-bold tracking-wider">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border text-text-primary">
                  {data.map((row, i) => (
                    <tr key={i} className="hover:bg-bg-base">
                      {headers.map(h => <td key={h} className="px-6 py-4 whitespace-nowrap">{String(row[h])}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-text-secondary flex flex-col items-center gap-2">
              <AlertCircle className="w-8 h-8 opacity-50" />
              <p>No data or table not selected.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
