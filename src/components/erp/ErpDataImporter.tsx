import React, { useState } from 'react';
import Papa from 'papaparse';
import { supabase } from '../../lib/supabase';
import { Upload, Database, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';

export const ErpDataImporter: React.FC = () => {
  const { role } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [tableName, setTableName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file || !tableName) {
      toast.error('File and Table Name are required');
      return;
    }

    setLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data;
        
        try {
          const { error } = await supabase
            .from(tableName)
            .insert(data);
          
          if (error) throw error;
          
          toast.success(`Successfully imported ${data.length} records into ${tableName}`);
          setFile(null);
          setTableName('');
        } catch (err: any) {
          toast.error('Import failed: ' + err.message);
        } finally {
          setLoading(false);
        }
      },
      error: (err) => {
        toast.error('CSV Parsing failed: ' + err.message);
        setLoading(false);
      }
    });
  };

  if (role !== 'admin') {
    return <div className="p-6 text-red-600 font-bold">Admin Access Required</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Upload className="w-8 h-8 text-brand-gold" />
        <h1 className="text-2xl font-bold text-text-primary">ERP Data Importer</h1>
      </div>

      <div className="bg-bg-elevated border border-brand-border p-8 rounded-2xl shadow-sm space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-text-secondary">Target Table Name</label>
          <input 
            type="text"
            value={tableName}
            onChange={e => setTableName(e.target.value)}
            placeholder="e.g. erp_inventory"
            className="w-full p-3 bg-bg-base border border-brand-border rounded-xl text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-text-secondary">Select CSV File</label>
          <input 
            type="file" 
            accept=".csv"
            onChange={handleFileChange}
            className="w-full p-3 bg-bg-base border border-brand-border rounded-xl text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-gold file:text-white hover:file:bg-brand-gold/90"
          />
        </div>

        <button 
          onClick={handleImport}
          disabled={loading || !file || !tableName}
          className="w-full bg-brand-gold text-white p-3.5 rounded-xl font-bold hover:bg-brand-gold/90 transition-colors disabled:opacity-50"
        >
          {loading ? 'Importing...' : 'Execute Import'}
        </button>
      </div>

      <div className="bg-bg-elevated border border-brand-border p-4 rounded-xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-text-secondary flex-shrink-0 mt-0.5" />
        <p className="text-xs text-text-secondary">
          Important: Ensure your CSV header names match the columns in the database table exactly.
        </p>
      </div>
    </div>
  );
};
