import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { ERPRequest, ERPRequestStatus } from '../types/database';
import { EncryptionService } from '../utils/encryption';

export const useERPRequestsData = () => {
  const [requests, setRequests] = useState<ERPRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('erp_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Decrypt issues for display
      const decryptedData = (data || []).map(req => ({
        ...req,
        issue: EncryptionService.decrypt(req.issue)
      }));

      setRequests(decryptedData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const addRequest = async (request: Omit<ERPRequest, 'id' | 'created_at'>) => {
    const encryptedIssue = EncryptionService.encrypt(request.issue);
    const dbPayload = { ...request, issue: encryptedIssue };

    try {
      const { data, error } = await supabase
        .from('erp_requests')
        .insert([dbPayload] as any)
        .select()
        .single();

      if (error) throw error;
      
      const decryptedNew = { ...(data as any), issue: request.issue };
      setRequests(prev => [decryptedNew, ...prev]);
      return decryptedNew;
    } catch (err: any) {
      throw err;
    }
  };

  const updateRequest = async (id: string, updates: Partial<ERPRequest>) => {
    const dbUpdates = { ...updates };
    if (updates.issue) {
      dbUpdates.issue = EncryptionService.encrypt(updates.issue);
    }

    try {
      const { error } = await supabase
        .from('erp_requests')
        .update(dbUpdates as any)
        .eq('id', id);

      if (error) throw error;
      
      setRequests(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    } catch (err: any) {
      throw err;
    }
  };

  const deleteRequest = async (id: string) => {
    try {
      const { error } = await supabase
        .from('erp_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      throw err;
    }
  };

  const updateStatus = async (id: string, status: ERPRequestStatus) => {
    return updateRequest(id, { status });
  };

  return {
    requests,
    loading,
    error,
    addRequest,
    updateRequest,
    deleteRequest,
    updateStatus,
    refresh: fetchRequests
  };
};
