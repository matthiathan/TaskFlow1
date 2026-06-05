import { supabase } from '../lib/supabase';

export const useScanner = () => {
  const handleScan = async (assetSerial: string, userId: string, userRole: string) => {
    const { data, error } = await supabase.rpc('process_machine_scan', {
      asset_serial: assetSerial,
      scanned_by_user_id: userId,
      user_role: userRole,
    });

    if (error) {
      console.error('Scan error:', error);
      throw error;
    }

    return data;
  };

  return { handleScan };
};
