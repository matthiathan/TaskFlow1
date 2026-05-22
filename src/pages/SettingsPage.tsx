import React, { useState } from 'react';
import { Card, Input, Button } from '../components/ui/Base';
import { ShieldCheck, Lock, Eye, EyeOff, Key } from 'lucide-react';
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
      toast.error('The passwords do not match. Please verify confirmations.');
      return;
    }

    if (passwords.new.length < 6) {
      toast.error('Password too short. Minimum 6 characters required.');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: passwords.new
      });

      if (error) throw error;

      toast.success('Your security password has been updated.');
      setPasswords({ new: '', confirm: '' });
    } catch (err: any) {
      toast.error(`Password update failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-text-primary">Account Settings</h1>
        <p className="text-text-secondary text-sm mt-1">Manage your access coordinates, passwords, and security status.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Password Update Card */}
        <div className="space-y-6">
          <Card className="p-8 border-brand-border bg-bg-elevated/45">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-brand-gold/10 rounded-xl">
                <Lock className="w-5 h-5 text-brand-gold" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary">Change Password</h3>
                <p className="text-xs text-text-secondary mt-0.5">Keep your account secure with a unique password</p>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="relative">
                <Input 
                  label="New Password"
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
                label="Confirm New Password"
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
                className="w-full h-11 text-xs font-bold uppercase mt-2"
              >
                Save New Password
              </Button>
            </form>
          </Card>

          <Card className="p-6 bg-brand-charcoal text-white border-none shadow-md">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-gold mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Password Guidelines
            </h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <p className="text-xs leading-relaxed text-neutral-400">
                  <strong className="text-white block mb-0.5">Complex Encryption Guidelines</strong>
                  Passwords are encrypted securely before database storage. To ensure maximum account defense, create a passphrase combining mixed cases, numbers, and special characters.
                </p>
              </li>
            </ul>
          </Card>
        </div>

        {/* Account Info / Status */}
        <div className="space-y-6">
          <Card className="p-8 border-brand-border bg-bg-elevated/45">
            <h3 className="text-sm font-semibold text-text-primary mb-6">Security & Session Status</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-brand-border">
                <span className="text-xs text-text-secondary font-medium">Multi-Factor Auth (MFA)</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-bg-elevated text-text-secondary">Disabled</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-brand-border">
                <span className="text-xs text-text-secondary font-medium">Authentication Source</span>
                <span className="text-xs font-semibold text-brand-gold">Standard Email Account</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-text-secondary font-medium">Database Node Security</span>
                <span className="text-xs font-semibold text-green-500">Fully Encrypted</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
