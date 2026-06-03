import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { toast } from 'sonner';

interface ErpGridProps {
  tableName: string;
}

export const ErpGrid: React.FC<ErpGridProps> = ({ tableName }) => {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [tableName, page]);

  const fetchData = async () => {
    setLoading(true);
    const { data: rows, error } = await supabase
      .from(tableName)
      .select('*')
      .range((page - 1) * pageSize, page * pageSize - 1);
      
    if (error) {
      toast.error('Error fetching data: ' + error.message);
    } else {
      setData(rows || []);
      if (rows && rows.length > 0) {
        setColumns(Object.keys(rows[0]));
      }
    }
    setLoading(false);
  };

  const filteredData = data.filter(row => 
    Object.entries(filters).every(([col, val]) => 
      !val || String(row[col] ?? '').toLowerCase().includes(val.toLowerCase())
    )
  );

  return (
    <div className="bg-white border rounded shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-900 text-white uppercase tracking-wider">
            <tr>
              {columns.map(col => <th key={col} className="px-3 py-2 font-semibold">{col}</th>)}
            </tr>
            <tr className="bg-slate-100">
              {columns.map(col => (
                <th key={`filter-${col}`} className="px-1 py-1">
                  <input 
                    type="text" 
                    placeholder={`...`}
                    className="w-full p-1 border rounded text-slate-800 text-xs"
                    onChange={e => setFilters(prev => ({ ...prev, [col]: e.target.value }))}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                {columns.map(col => (
                  <td key={col} className="px-3 py-2 font-medium text-slate-700 whitespace-nowrap">{String(row[col] ?? '')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center p-2 border-t bg-slate-50 text-slate-600">
        <span className="text-xs">Page {page}</span>
        <div className="flex gap-1">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} className="p-1 border rounded hover:bg-white"><ChevronLeft size={14}/></button>
          <button onClick={() => setPage(p => p + 1)} className="p-1 border rounded hover:bg-white"><ChevronRight size={14}/></button>
        </div>
      </div>
    </div>
  );
};
