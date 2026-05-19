import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Search, 
  User, 
  MessageSquare, 
  MoreVertical, 
  Clock,
  ShieldCheck,
  ChevronLeft
} from 'lucide-react';
import { useMessagesData, useProfilesSearch } from '../hooks/useMessagesData';
import { useAuth } from '../contexts/AuthContext';
import { Card, Button, Input } from '../components/ui/Base';
import { Profile } from '../types/database';
import { Spinner } from '../components/ui/LoadingScreen';
import { format } from 'date-fns';

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedRecipient, setSelectedRecipient] = useState<Profile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  
  const { profiles, searchProfiles, loading: searchLoading } = useProfilesSearch();
  const { messages, loading: messagesLoading, sendMessage } = useMessagesData(selectedRecipient?.id || null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    
    searchTimeoutRef.current = setTimeout(() => {
      searchProfiles(val);
    }, 300);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedRecipient) return;

    const text = messageText;
    setMessageText('');
    try {
      await sendMessage(text);
    } catch (err) {
      console.error('Send failed:', err);
      setMessageText(text); // Put back on failure
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6">
      {/* Recipient Selector / Search */}
      <div className={`w-full md:w-80 flex flex-col gap-6 ${selectedRecipient ? 'hidden md:flex' : 'flex'}`}>
        <div className="space-y-1">
          <h1 className="text-2xl text-brand-charcoal tracking-tight uppercase mb-1">Direct Comms</h1>
          <p className="text-brand-charcoal/40 font-serif text-xs italic">Secure Internal Communication Pipeline</p>
        </div>

        <Card className="flex-1 flex flex-col overflow-hidden shadow-xl border-brand-border h-full">
          <div className="p-4 border-b border-brand-border bg-brand-charcoal/5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-charcoal/30" size={14} />
              <input 
                type="text"
                placeholder="Search Corporate Directory..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full bg-white border border-brand-border pl-9 pr-4 py-2 text-[11px] font-bold uppercase tracking-widest text-brand-charcoal focus:outline-none focus:border-brand-gold transition-colors shadow-inner"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-brand-light/20 p-2 space-y-1">
            {searchLoading ? (
              <div className="py-10 flex justify-center"><Spinner size="sm" /></div>
            ) : profiles.length === 0 && searchQuery ? (
              <div className="py-10 text-center text-[10px] uppercase font-bold text-brand-charcoal/20 tracking-widest">No operatives detected</div>
            ) : profiles.length === 0 ? (
              <div className="py-20 text-center flex flex-col items-center gap-4 opacity-10 grayscale">
                 <MessageSquare size={48} />
                 <p className="text-[10px] uppercase tracking-[0.2em] font-black">Ready for Handshake</p>
              </div>
            ) : (
              profiles.filter(p => p.id !== user?.id).map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedRecipient(p)}
                  className={`w-full flex items-center gap-4 p-4 rounded-sm transition-all duration-300 text-left shadow-sm border ${
                    selectedRecipient?.id === p.id 
                      ? 'bg-brand-charcoal text-white border-brand-charcoal' 
                      : 'bg-white text-brand-charcoal border-brand-border hover:bg-brand-light'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-sm flex items-center justify-center font-serif text-lg font-bold shadow-md ${
                    selectedRecipient?.id === p.id ? 'bg-brand-gold text-brand-charcoal' : 'bg-brand-charcoal text-white'
                  }`}>
                    {p.full_name?.charAt(0)}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-bold truncate">{p.full_name}</p>
                    <p className={`text-[9px] uppercase tracking-tighter ${selectedRecipient?.id === p.id ? 'text-white/40' : 'text-brand-charcoal/40'}`}>
                      {p.role.replace('_', ' ')}
                    </p>
                  </div>
                  {selectedRecipient?.id === p.id && <div className="w-1 h-1 bg-brand-gold rounded-full shadow-sm"></div>}
                </button>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Chat Interface */}
      <div className={`flex-1 flex flex-col h-full bg-white border border-brand-border shadow-2xl rounded-sm overflow-hidden ${!selectedRecipient ? 'hidden md:flex' : 'flex'}`}>
        {!selectedRecipient ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-brand-light/30 text-brand-charcoal/20">
            <ShieldCheck size={64} strokeWidth={1} className="mb-6 opacity-30" />
            <p className="text-sm font-serif italic text-brand-charcoal/40 mb-2">Secure Line Awaiting Handshake</p>
            <p className="text-[10px] uppercase tracking-[0.3em] font-black">Select an operative from the directory to initiate comms</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b border-brand-border flex items-center justify-between bg-white shadow-sm z-10">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedRecipient(null)} className="md:hidden p-2 text-brand-charcoal/40 hover:text-brand-charcoal">
                  <ChevronLeft size={20} />
                </button>
                <div className="w-10 h-10 bg-brand-charcoal text-brand-gold flex items-center justify-center font-serif text-lg font-bold shadow-sm">
                  {selectedRecipient.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-brand-charcoal">{selectedRecipient.full_name}</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-sm"></div>
                    <span className="text-[9px] uppercase tracking-widest text-brand-charcoal/40 font-bold">Secure Tactical Active Link</span>
                  </div>
                </div>
              </div>
              <button className="p-2 text-brand-charcoal/20 hover:text-brand-gold transition-colors">
                <MoreVertical size={16} />
              </button>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-brand-light/10">
              {messagesLoading ? (
                <div className="flex justify-center py-10"><Spinner /></div>
              ) : messages.length === 0 ? (
                <div className="py-20 text-center">
                  <p className="text-xs font-serif italic text-brand-charcoal/30">History manifest is currently empty. Direct transmission is open.</p>
                </div>
              ) : (
                messages.map((m, i) => {
                  const isOwn = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                      <div className={`max-w-[75%] md:max-w-[60%] shadow-lg rounded-sm ${
                        isOwn 
                          ? 'bg-brand-charcoal text-brand-white border-r-4 border-brand-gold' 
                          : 'bg-white text-brand-charcoal border-l-4 border-brand-charcoal border border-brand-border'
                      }`}>
                        <div className="p-4">
                          <p className="text-xs leading-relaxed font-sans">{m.content}</p>
                        </div>
                        <div className={`px-4 py-1.5 text-[8px] font-mono uppercase tracking-widest ${isOwn ? 'text-white/20 text-right' : 'text-brand-charcoal/20'}`}>
                          {format(new Date(m.created_at), 'HH:mm:ss')} • TX_SECURED
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-6 border-t border-brand-border bg-white shadow-xl z-20">
              <form onSubmit={handleSend} className="flex items-center gap-4">
                <input 
                  type="text"
                  placeholder="ENCODE OPERATIONAL DATA..."
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  className="flex-1 bg-brand-light/50 border border-brand-border px-4 py-3 text-xs font-bold tracking-widest text-brand-charcoal uppercase focus:outline-none focus:border-brand-gold transition-shadow shadow-inner rounded-sm"
                />
                <Button type="submit" className="h-full px-6 shadow-md" disabled={!messageText.trim()}>
                  <Send size={16} />
                </Button>
              </form>
              <div className="mt-3 flex items-center gap-2 text-[8px] text-brand-charcoal/20 uppercase font-black tracking-[0.3em]">
                 <Clock size={10} />
                 Automatic Temporal Sync Engaged • Client-Side Encryption Protocol Handled
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
