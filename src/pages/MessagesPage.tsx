import React, { useEffect, useRef, useState } from 'react';
import { useMessages } from '../hooks/useMessages';
import { Card, Input, Button } from '../components/ui/Base';
import { Send, Terminal, ShieldAlert, Cpu } from 'lucide-react';
import { cn } from '../lib/utils';

export const MessagesPage: React.FC = () => {
  const { messages, loading, sendMessage } = useMessages();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const text = input;
    setInput('');
    await sendMessage(text);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 h-[calc(100vh-120px)] flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-serif uppercase tracking-[0.1em]">Secure Comms</h1>
          <p className="text-text-secondary text-sm mt-1">Real-time encrypted uplink for field operations.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-black uppercase text-green-500 tracking-widest">Link Active</span>
        </div>
      </div>

      <Card className="flex-grow flex flex-col overflow-hidden bg-bg-elevated/30 backdrop-blur-sm">
        <div 
          ref={scrollRef}
          className="flex-grow overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-brand-border"
        >
          {loading && messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-2">
                <Cpu className="w-8 h-8 text-brand-gold animate-spin mx-auto" />
                <p className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Decrypting Uplink...</p>
              </div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-text-secondary space-y-2">
              <Terminal className="w-12 h-12 opacity-10" />
              <p className="text-xs italic">Channel silent. Waiting for transmission...</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={msg.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center flex-shrink-0 text-brand-gold">
                    {msg.sender_profile?.avatar_url ? (
                      <img src={msg.sender_profile.avatar_url} alt="" className="w-full h-full rounded object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold">{(msg.sender_profile?.full_name || 'U').charAt(0)}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-text-primary">
                        {msg.sender_profile?.full_name || 'Unknown Agent'}
                      </span>
                      <span className="text-[8px] text-text-secondary font-medium">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="bg-bg-base border border-brand-border px-3 py-2 rounded-lg text-sm text-text-primary leading-relaxed shadow-sm max-w-[500px]">
                      {msg.content}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-brand-border bg-bg-elevated/50">
          <form onSubmit={handleSend} className="flex gap-3">
            <Input 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Inject secure message data..."
              className="flex-grow"
              autoFocus
            />
            <Button type="submit" className="px-6 flex-shrink-0">
              <Send className="w-4 h-4" />
              <span className="ml-2">Send</span>
            </Button>
          </form>
        </div>
      </Card>
      
      <div className="mt-4 flex items-center gap-2 text-[8px] font-bold text-text-secondary uppercase tracking-[0.2em] px-2">
        <ShieldAlert className="w-3 h-3 text-brand-gold" />
        All communications are logged and synchronized via secure protocol.
      </div>
    </div>
  );
};
