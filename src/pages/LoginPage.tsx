import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input } from '../components/ui/Base';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base p-6 transition-colors duration-300">
      <div className="absolute inset-0 z-0 opacity-10 flex items-center justify-center pointer-events-none">
        <h1 className="text-[20vw] font-serif font-bold text-text-primary tracking-widest italic uppercase">DALLMAYR</h1>
      </div>

      <Card className="z-10 w-full max-w-md p-10 border-brand-gold/20 bg-bg-elevated shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-brand-gold"></div>
        <div className="text-center mb-8">
          <h2 className="text-3xl text-brand-gold mb-2 tracking-tight italic">Operations Portal</h2>
          <p className="text-[10px] text-text-secondary uppercase tracking-[0.4em] font-medium font-sans">Corporate Identity Verification</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l border-red-500 text-red-600 text-xs shadow-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <Input
              label="Corporate Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@dallmayr.co.za"
              required
              className="bg-white border-brand-border text-brand-charcoal placeholder:text-brand-charcoal/30 focus:border-brand-gold"
            />
            <Input
              label="Security Protocol Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="bg-white border-brand-border text-brand-charcoal placeholder:text-brand-charcoal/30 focus:border-brand-gold"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 uppercase tracking-[0.2em] font-bold text-[11px] shadow-[0_10px_20px_rgba(212,175,55,0.15)]" 
            isLoading={loading}
          >
            Authenticate Access
          </Button>
        </form>

        <div className="mt-10 pt-6 border-t border-brand-border text-center">
          <p className="text-[9px] text-text-muted uppercase tracking-[0.2em]">
            Proprietary Enterprise Software © 2024 Dallmayr International
          </p>
        </div>
      </Card>
    </div>
  );
};
