import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { RefreshCw, Download, FileText, Package, FileCheck, QrCode, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface KPIData {
  assets: number;
  contracts: number;
  serviceLogs: number;
  qrMaps: number;
  totalRevenue: number;
}

export const ErpDashboard: React.FC = () => {
  const [data, setData] = useState<KPIData>({ assets: 0, contracts: 0, serviceLogs: 0, qrMaps: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Counts
      const [assets, cpt, jhb, kzn, logs, qr] = await Promise.all([
        supabase.from('erp_assets').select('id', { count: 'exact', head: true }),
        supabase.from('erp_contracts_cpt').select('id', { count: 'exact', head: true }),
        supabase.from('erp_contracts_jhb').select('id', { count: 'exact', head: true }),
        supabase.from('erp_contracts_kzn').select('id', { count: 'exact', head: true }),
        supabase.from('erp_service_logs').select('id', { count: 'exact', head: true }),
        supabase.from('erp_qr_mapping').select('id', { count: 'exact', head: true }),
      ]);

      // Revenue (Cost Amount from Assets)
      const { data: revenueData } = await supabase
        .from('erp_assets')
        .select('cost_amount');

      const totalRevenue = (revenueData || []).reduce((sum, item) => sum + (Number(item.cost_amount) || 0), 0);

      setData({
        assets: assets.count || 0,
        contracts: (cpt.count || 0) + (jhb.count || 0) + (kzn.count || 0),
        serviceLogs: logs.count || 0,
        qrMaps: qr.count || 0,
        totalRevenue
      });
    } catch (err: any) {
      toast.error('Failed to load ERP metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const cards = [
    { title: 'Total Assets', val: data.assets, icon: Package },
    { title: 'Active Contracts', val: data.contracts, icon: FileText },
    { title: 'Pending Service Logs', val: data.serviceLogs, icon: FileCheck },
    { title: 'Total QR Maps', val: data.qrMaps, icon: QrCode },
    { title: 'Total Revenue', val: `$${data.totalRevenue.toLocaleString()}`, icon: TrendingUp },
  ];

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">ERP Command Center</h1>
        <div className="flex gap-2">
          <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded text-sm hover:bg-slate-50">
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded text-sm hover:bg-slate-50">
            <Download size={16} /> Export CSV
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
            Audit Logs
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-white p-4 rounded border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">{card.title}</p>
                <p className="text-xl font-bold text-slate-900 mt-1">{card.val}</p>
              </div>
              <card.icon className="text-blue-600" size={20} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
