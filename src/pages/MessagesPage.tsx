import React, { useEffect, useRef, useState } from 'react';
import { useMessages } from '../hooks/useMessages';
import { useConversations } from '../hooks/useConversations';
import { Card, Input, Button } from '../components/ui/Base';
import { Send, Terminal, ShieldAlert, Cpu, Globe, User, X, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';
import { PersonnelSearch } from '../components/ui/PersonnelSearch';
import { Profile } from '../types/database';

export const MessagesPage: React.FC = () => {
  const [selectedRecipient, setSelectedRecipient] = useState<Profile | null>(null);
  const { messages, loading: messagesLoading, sendMessage } = useMessages(selectedRecipient?.id);
  const { conversations, loading: convLoading, deleteConversation } = useConversations();
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
    <div className="max-w-6xl mx-auto py-8 px-4 h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-serif uppercase tracking-[0.1em]">Secure Comms</h1>
          <p className="text-text-secondary text-sm mt-1">Real-time encrypted uplink for field operations.</p>
        </div>
        <div className="w-full md:w-80">
          <PersonnelSearch 
            onSelect={setSelectedRecipient} 
            selectedProfile={selectedRecipient} 
          />
        </div>
      </div>

      <div className="flex-grow flex gap-6 min-h-0">
        {/* Chat List / Channels (Condensed) */}
        <div className="hidden lg:flex flex-col w-56 gap-2">
          <button 
            onClick={() => setSelectedRecipient(null)}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all mb-2",
              !selectedRecipient ? "bg-brand-gold text-white border-brand-gold shadow-lg shadow-brand-gold/20" : "bg-bg-elevated/40 border-brand-border text-text-secondary hover:bg-bg-elevated"
            )}
          >
            <Globe className="w-4 h-4" />
            Global Net
          </button>
          
          <div className="flex items-center gap-2 px-3 py-1 mb-1">
            <MessageSquare className="w-3 h-3 text-brand-gold" />
            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-text-secondary">Recent Comms</span>
          </div>

          <div className="flex flex-col gap-1 overflow-y-auto pr-1 scrollbar-thin">
            {/* Pinned / Selected recipient from search that isn't in conversations yet */}
            {selectedRecipient && !conversations.some(c => c.participant?.id === selectedRecipient.id) && (
              <div className="group relative">
                <button 
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all text-left bg-brand-gold text-white border-brand-gold shadow-lg shadow-brand-gold/20"
                >
                  <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                    <User className="w-3 h-3" />
                  </div>
                  <span className="truncate flex-grow">{selectedRecipient.full_name}</span>
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRecipient(null);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 bg-white/10 rounded-lg text-white hover:bg-white/30 transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {conversations.map((conv) => (
              <div key={conv.id} className="group relative">
                <button 
                  onClick={() => setSelectedRecipient(conv.participant || null)}
                  className={cn(
                    "w-full flex items-center gap-3 p-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all text-left pr-8",
                    selectedRecipient?.id === conv.participant?.id 
                      ? "bg-brand-gold/10 border-brand-gold text-brand-gold" 
                      : "bg-bg-elevated/40 border-brand-border text-text-secondary hover:bg-bg-elevated/60"
                  )}
                >
                  <div className="w-6 h-6 rounded-lg bg-brand-gold/10 flex items-center justify-center flex-shrink-0">
                    <User className="w-3 h-3" />
                  </div>
                  <span className="truncate flex-grow">{conv.participant?.full_name || 'Personnel'}</span>
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                    if (selectedRecipient?.id === conv.participant?.id) setSelectedRecipient(null);
                  }}
                  title="Remove link"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded-lg text-text-secondary hover:text-red-500 transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            
            {conversations.length === 0 && !convLoading && (
              <div className="px-3 py-4 text-center border border-dashed border-brand-border rounded-xl opacity-40">
                <p className="text-[8px] font-bold uppercase tracking-widest leading-relaxed">No active links established</p>
              </div>
            )}
          </div>
        </div>

        {/* Message Container */}
        <Card className="flex-grow flex flex-col overflow-hidden bg-bg-elevated/30 backdrop-blur-sm border-brand-border h-full">
          <div className="p-4 border-b border-brand-border bg-bg-elevated/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand-gold/10 rounded-lg">
                {selectedRecipient ? <User className="w-4 h-4 text-brand-gold" /> : <Globe className="w-4 h-4 text-brand-gold" />}
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-text-primary">
                  {selectedRecipient ? selectedRecipient.full_name : 'Global Frequency'}
                </h3>
                <p className="text-[8px] font-bold text-text-secondary uppercase tracking-[0.2em]">
                  {selectedRecipient ? 'Point-to-Point Uplink' : 'Broadcast Protocol active'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
              <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[8px] font-black uppercase text-green-500 tracking-widest">Connected</span>
            </div>
          </div>

          <div 
            ref={scrollRef}
            className="flex-grow overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-brand-border"
          >
            {messagesLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-2">
                  <Cpu className="w-8 h-8 text-brand-gold animate-spin mx-auto" />
                  <p className="text-[10px] font-bold uppercase text-text-secondary tracking-widest">Establishing Secure Route...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-text-secondary space-y-2 opacity-40">
                <Terminal className="w-12 h-12" />
                <p className="text-[10px] uppercase font-bold tracking-widest">Awaiting Transmission...</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center flex-shrink-0 text-brand-gold">
                      {msg.sender_profile?.avatar_url ? (
                        <img src={msg.sender_profile.avatar_url} alt="" className="w-full h-full rounded-lg object-cover" />
                      ) : (
                        <span className="text-[10px] font-black uppercase">{(msg.sender_profile?.full_name || 'U').charAt(0)}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-text-primary">
                          {msg.sender_profile?.full_name || 'Personnel'}
                        </span>
                        <div className="w-1 h-1 rounded-full bg-text-secondary opacity-30" />
                        <span className="text-[8px] text-text-secondary font-bold uppercase">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="bg-bg-base border border-brand-border px-4 py-3 rounded-2xl rounded-tl-none text-sm text-text-primary leading-relaxed shadow-sm max-w-[80%]">
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
                placeholder={selectedRecipient ? `Send direct message to ${selectedRecipient.full_name}...` : "Broadcast to global network..."}
                className="flex-grow"
                autoFocus
              />
              <Button type="submit" className="px-8 flex-shrink-0 uppercase font-black text-[10px] tracking-widest">
                <Send className="w-4 h-4" />
                <span className="ml-2">Transmit</span>
              </Button>
            </form>
          </div>
        </Card>
      </div>
      
      <div className="mt-4 flex items-center gap-2 text-[8px] font-bold text-text-secondary uppercase tracking-[0.2em] px-2">
        <ShieldAlert className="w-3 h-3 text-brand-gold" />
        Operational security protocols are active. Do not transmit sensitive cipher keys.
      </div>
    </div>
  );
};
