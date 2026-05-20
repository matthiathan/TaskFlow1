import React, { useState } from 'react';
import { Card, Input, Button } from '../components/ui/Base';
import { ShieldCheck, Lock, Eye, EyeOff, Key, Terminal } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export const SettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    new: '',
    confirm: ''
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwords.new !== passwords.confirm) {
      toast.error('Identity vectors do not match. Please verify confirmations.');
      return;
    }

    if (passwords.new.length < 6) {
      toast.error('Encryption string too short. Minimum 6 characters required.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: passwords.new
      });

      if (error) throw error;

      toast.success('Security credentials updated successfully.');
      setPasswords({ new: '', confirm: '' });
    } catch (err: any) {
      toast.error(`Auth Override Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-serif uppercase tracking-[0.1em]">Security Protocol</h1>
        <p className="text-text-secondary text-sm mt-1">Manage your access credentials and authentication vectors.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Password Update Card */}
        <div className="space-y-6">
          <Card className="p-8 border-brand-gold/30 bg-bg-elevated/40">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-brand-gold/10 rounded-xl">
                <Lock className="w-5 h-5 text-brand-gold" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-primary">Credential Override</h3>
                <p className="text-[9px] font-bold text-text-secondary uppercase tracking-widest mt-0.5">Secure Password Update</p>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="relative">
                <Input 
                  label="New Security String"
                  type={showPassword ? 'text' : 'password'}
                  icon={<Key className="w-4 h-4" />}
                  value={passwords.new}
                  onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))}
                  placeholder="Enter new password..."
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[34px] p-1 text-text-secondary hover:text-brand-gold transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <Input 
                label="Confirm Credentials"
                type={showPassword ? 'text' : 'password'}
                icon={<ShieldCheck className="w-4 h-4" />}
                value={passwords.confirm}
                onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                placeholder="Confirm new password..."
                required
              />

              <Button 
                type="submit" 
                isLoading={loading}
                className="w-full h-12 uppercase font-black text-[10px] tracking-[0.2em] mt-2"
              >
                Sync New Identity
              </Button>
            </form>
          </Card>

          <Card className="p-6 bg-brand-charcoal text-white border-none shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-gold mb-4 flex items-center gap-2">
              <Terminal className="w-4 h-4" /> System Audit
            </h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <div className="mt-1"><ShieldCheck className="w-3 h-3 text-brand-gold" /></div>
                <p className="text-[10px] leading-relaxed text-neutral-400">
                  <strong className="text-white block mb-0.5">Instance Encryption</strong>
                  Passwords are encrypted server-side. Ensure yours follows complexity protocols (Mixed case, numbers, symbols).
                </p>
              </li>
            </ul>
          </Card>
        </div>

        {/* Account Info / Status */}
        <div className="space-y-6">
          <Card className="p-8">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-primary mb-6">Uplink Status</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-brand-border">
                <span className="text-[9px] font-bold text-text-secondary uppercase">MFA Protocol</span>
                <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-bg-elevated text-text-secondary">Inactive</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-brand-border">
                <span className="text-[9px] font-bold text-text-secondary uppercase">Last Identity Sync</span>
                <span className="text-[8px] font-black uppercase text-brand-gold tracking-tight">System Clock Sync</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-[9px] font-bold text-text-secondary uppercase">Node Integrity</span>
                <span className="text-[8px] font-black uppercase text-green-500">100% Secure</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
