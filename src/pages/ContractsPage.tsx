import React from 'react';
import { ErpGrid } from '../components/erp/ErpGrid';

export const ContractsPage: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Contracts (All Regions)</h1>
      <div className="space-y-6">
        <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Cape Town</h2>
            <ErpGrid tableName="erp_contracts_cpt" />
        </section>
        <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Johannesburg</h2>
            <ErpGrid tableName="erp_contracts_jhb" />
        </section>
        <section>
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Kwa-Zulu Natal</h2>
            <ErpGrid tableName="erp_contracts_kzn" />
        </section>
      </div>
    </div>
  );
};
