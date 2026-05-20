import React, { useState, useEffect } from 'react';
import { Key, Copy, RefreshCw, ShieldCheck, Check } from 'lucide-react';
import { Card, Button } from '../components/ui/Base';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

export const ApiAccessPage: React.FC = () => {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [governing, setGoverning] = useState(false);
  const [copied, setCopied] = useState(false);

  const apiBaseUrl = `${window.location.origin}/api/external/tasks`;

  useEffect(() => {
    fetchApiKey();
  }, []);

  const fetchApiKey = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/api-key', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      setApiKey(data.apiKey);
    } catch (err) {
      console.error('Failed to fetch API key:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateKey = async () => {
    if (!confirm('Generating a new key will immediately invalidate your existing key. This will break any current external integrations. Proceed?')) return;
    
    setGoverning(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/api-key', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      const data = await response.json();
      setApiKey(data.apiKey);
      toast.success('New API Access Vector Generated');
    } catch (err) {
      toast.error('Failed to generate key');
    } finally {
      setGoverning(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto h-full flex flex-col">
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-2">
          <Key className="text-brand-gold w-8 h-8" />
          <h1 className="text-4xl font-serif font-black uppercase tracking-tighter text-text-primary">API Developer Access</h1>
        </div>
        <p className="text-text-secondary max-w-xl">
          Securely integrate Dallmayr operational intelligence into your external cluster.
          All requests must include your unique access vector in the <code className="bg-bg-elevated px-1.5 py-0.5 rounded border border-brand-border text-brand-gold text-sm font-mono">x-api-key</code> header.
        </p>
      </div>

      <div className="grid gap-8">
        {/* Endpoint URL Card */}
        <Card className="p-8 border-brand-border bg-bg-elevated/30">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-text-secondary mb-1">Standard Tasks Endpoint</h2>
              <p className="text-text-primary font-serif italic">Retrieve live directive flow</p>
            </div>
            <div className="px-3 py-1 bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest rounded-full border border-green-500/20">
              Active
            </div>
          </div>

          <div className="flex items-center gap-2 bg-bg-base border border-brand-border p-4 rounded-xl shadow-inner mb-4">
            <code className="flex-1 text-sm font-mono text-brand-gold break-all">{apiBaseUrl}</code>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => copyToClipboard(apiBaseUrl)}
              className="text-text-secondary hover:text-brand-gold"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-secondary">
            <span className="px-2 py-0.5 bg-bg-elevated border border-brand-border rounded">GET</span>
            <span className="opacity-50">Content-Type: application/json</span>
          </div>
        </Card>

        {/* API Key Card */}
        <Card className="p-8 border-brand-border overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <ShieldCheck className="w-32 h-32" />
          </div>

          <div className="flex items-start justify-between mb-8">
            <div>
              <h2 className="text-xs font-black uppercase tracking-[0.2em] text-text-secondary mb-1">Primary Access Vector</h2>
              <p className="text-text-primary font-serif italic">Your unique authentication secret</p>
            </div>
            <Button 
              variant="ghost" 
              onClick={generateKey}
              disabled={governing}
              className="text-[10px] font-black uppercase tracking-widest text-text-secondary hover:text-brand-gold gap-2"
            >
              <RefreshCw className={`w-3 h-3 ${governing ? 'animate-spin' : ''}`} />
              Regenerate
            </Button>
          </div>

          <div className="flex items-center gap-4 bg-bg-base border border-brand-border p-6 rounded-xl shadow-xl">
            {loading ? (
              <div className="flex-1 h-6 bg-brand-border/20 animate-pulse rounded" />
            ) : apiKey ? (
              <code className="flex-1 text-xl font-mono text-text-primary tracking-wider">{apiKey}</code>
            ) : (
              <span className="flex-1 text-sm text-text-secondary italic">No key generated yet. Click regenerate to create one.</span>
            )}
            
            {apiKey && (
              <Button 
                onClick={() => copyToClipboard(apiKey)}
                className="bg-brand-gold hover:bg-brand-gold/90 text-white font-black uppercase tracking-widest text-[10px] px-6 h-12 shadow-lg shadow-brand-gold/20 gap-2"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy Key'}
              </Button>
            )}
          </div>

          <div className="mt-8 flex items-start gap-4 p-4 bg-red-500/5 border border-red-500/10 rounded-xl">
            <ShieldCheck className="text-red-500 w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-red-500/80 font-medium">
              CRITICAL: Treat this key as a password. Never commit it to public repositories or expose it in client-side code. Dallmayr Security will never ask for this key via unencrypted channels.
            </p>
          </div>
        </Card>

        {/* Documentation / Sample */}
        <div className="mt-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-secondary mb-4 px-1">Integration Sample</h3>
          <div className="bg-bg-elevated border border-brand-border rounded-xl p-6 overflow-hidden">
            <pre className="text-[13px] font-mono leading-relaxed overflow-x-auto text-text-primary">
              {`fetch("${apiBaseUrl}", {
  headers: {
    "x-api-key": "${apiKey || 'YOUR_KEY_HERE'}"
  }
})
.then(res => res.json())
.then(data => console.log(data.tasks));`}
            </pre>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-12 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-text-secondary opacity-30">
          Enterprise API Infrastructure v2.4.0
        </p>
      </div>
    </div>
  );
};
