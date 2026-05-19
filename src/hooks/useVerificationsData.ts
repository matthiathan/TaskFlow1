import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Verification } from '../types/database';

export const useVerificationsData = () => {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVerifications = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('verifications')
        .select('*')
        .order('verification_date', { ascending: false })
        .order('verification_time', { ascending: false });

      if (error) throw error;
      setVerifications(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  const addVerification = async (verification: Omit<Verification, 'id'>) => {
    // Optimistic update
    const tempId = crypto.randomUUID();
    const newVer = { ...verification, id: tempId } as Verification;
    
    // Check for duplicate in current list (last 10 seconds or same record)
    const isDuplicate = verifications.find(v => 
      v.qr_code === verification.qr_code && 
      v.serial_number === verification.serial_number &&
      v.verification_date === verification.verification_date &&
      Math.abs(parseInt(v.verification_time.replace(/:/g, '')) - parseInt(verification.verification_time.replace(/:/g, ''))) < 10
    );

    if (isDuplicate) {
      throw new Error('DUPLICATE PROTECTION: Entry already recorded in the current cycle.');
    }

    setVerifications(prev => [newVer, ...prev]);

    try {
      const { data, error } = await supabase
        .from('verifications')
        .insert([verification] as any)
        .select()
        .single();

      if (error) throw error;
      
      setVerifications(prev => prev.map(v => v.id === tempId ? data : v));
      return data;
    } catch (err: any) {
      setVerifications(prev => prev.filter(v => v.id !== tempId));
      throw err;
    }
  };

  const deleteVerification = async (id: string) => {
    const original = [...verifications];
    setVerifications(prev => prev.filter(v => v.id !== id));

    try {
      const { error } = await supabase
        .from('verifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err: any) {
      setVerifications(original);
      throw err;
    }
  };

  return {
    verifications,
    loading,
    error,
    addVerification,
    deleteVerification,
    refresh: fetchVerifications
  };
};
