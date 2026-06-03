import React from 'react';
import { useParams } from 'react-router-dom';
import { ErpGrid } from '../components/erp/ErpGrid';

export const ErpTablePage: React.FC = () => {
  const { tableName } = useParams<{ tableName: string }>();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-6 capitalize">{tableName?.replace('_', ' ')}</h1>
      <ErpGrid tableName={tableName || ''} />
    </div>
  );
};
