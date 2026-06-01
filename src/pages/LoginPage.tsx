import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card, Input, Button } from '../components/ui/Base';
import { ShieldCheck, Lock, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              full_name: email.split('@')[0], // Fallback name from email
            }
          }
        });
        if (error) throw error;
        toast.success('Registration successful. Verify your email.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Access Granted');
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brand-gold/10 via-transparent to-transparent opacity-50" />
      
      <div className="w-full max-w-md relative">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-gold rounded-2xl shadow-2xl shadow-brand-gold/30 mb-6">
            <ShieldCheck className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-widest text-text-primary">OpsPortal</h1>
          <p className="text-[10px] text-text-secondary font-bold uppercase tracking-[0.3em] mt-1 italic">Enterprise Gateway</p>
        </div>

        <Card className="p-8 shadow-2xl bg-bg-elevated/40 backdrop-blur-xl border-brand-border">
          <form onSubmit={handleAuth} className="space-y-6">
            <Input 
              label="Personnel Email" 
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="agent@dallmayr.io"
              required
            />
            
            <Input 
              label="Security Cipher" 
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button type="submit" isLoading={loading} className="w-full py-4 uppercase tracking-[0.2em] font-black">
              {isSignUp ? 'Register Entity' : 'Establish Uplink'}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-brand-border text-center">
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-brand-gold transition-colors"
            >
              {isSignUp ? 'Already registered? Log in' : 'New User? Register'}
            </button>
          </div>
        </Card>

        <p className="mt-8 text-center text-[8px] font-bold text-text-secondary uppercase tracking-[0.2em] opacity-50">
          Secure Session Monitoring Active. Unauthorized Access is Prohibited.
        </p>
      </div>
    </div>
  );
};
