import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';
import { 
  Search, 
  Terminal, 
  Compass, 
  Briefcase, 
  User, 
  Clock,
  Sun, 
  Moon, 
  LogOut, 
  Plus, 
  Activity, 
  FileText,
  Sliders, 
  Keyboard 
} from 'lucide-react';
import { cn } from '../lib/utils';

export const CommandPalette: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  
  // Visibility States
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  
  // Search state
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);

  // Loaded database items
  const [tasks, setTasks] = useState<{ id: string; title: string; description: string }[]>([]);
  const [profiles, setProfiles] = useState<{ id: string; email: string; full_name?: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const lastKeyPressedRef = useRef<{ key: string; time: number } | null>(null);

  // Prefetch data immediately when command palette opens
  useEffect(() => {
    if (isPaletteOpen) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [tasksRes, profilesRes] = await Promise.all([
            supabase.from('tasks').select('id, title, description').limit(30),
            supabase.from('profiles').select('id, email, full_name').limit(30)
          ]);
          setTasks(tasksRes.data || []);
          setProfiles(profilesRes.data || []);
        } catch (err) {
          console.error("Prefetch anomaly:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
      // Auto-focus the input
      setTimeout(() => inputRef.current?.focus(), 100);
      setActiveIndex(0);
    }
  }, [isPaletteOpen]);

  // Global sequential keyboard listener
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      // If user is focused on interactive element, skip smart navigation but allow Escape to close overlays
      const isInput = 
        e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement || 
        (e.target as HTMLElement).isContentEditable;
      
      if (isInput) {
        if (e.key === 'Escape') {
          e.preventDefault();
          (e.target as HTMLElement).blur();
          setIsPaletteOpen(false);
          setIsHelpOpen(false);
        }
        return;
      }

      const now = Date.now();

      // Command overlay: Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
        setIsHelpOpen(false);
        return;
      }

      // Help index overlay: ? flag
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setIsHelpOpen(prev => !prev);
        setIsPaletteOpen(false);
        return;
      }

      // Quick trigger create action anywhere on 'c' key press
      if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        navigate('/tasks?action=create');
        toast.info("Opening new task creation form");
        return;
      }

      // Global escape close trigger
      if (e.key === 'Escape') {
        setIsPaletteOpen(false);
        setIsHelpOpen(false);
        return;
      }

      // Power-user sequence navigation: e.g. "g" then "d" within 1.2s
      if (lastKeyPressedRef.current && now - lastKeyPressedRef.current.time < 1200) {
        const prevKey = lastKeyPressedRef.current.key.toLowerCase();
        const currentKey = e.key.toLowerCase();

        if (prevKey === 'g') {
          const shortcuts: Record<string, { route: string; label: string }> = {
            d: { route: '/dashboard', label: 'Dashboard' },
            t: { route: '/tasks', label: 'Tasks' },
            c: { route: '/calendar', label: 'Calendar' },
            r: { route: '/reporting', label: 'Service Tickets' },
            m: { route: '/chat', label: 'Communications' },
            a: { route: '/admin', label: 'Admin Panel' },
            s: { route: '/settings', label: 'Settings' },
            p: { route: '/settings', label: 'Settings' }
          };

          const matched = shortcuts[currentKey];
          if (matched && !e.ctrlKey && !e.metaKey && !e.altKey) {
            e.preventDefault();
            lastKeyPressedRef.current = null;
            navigate(matched.route);
            toast.success(`Navigating to ${matched.label}`);
            return;
          }
        }
      }

      // Log potential sequence start
      if (e.key.toLowerCase() === 'g' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        lastKeyPressedRef.current = { key: 'g', time: now };
      } else {
        lastKeyPressedRef.current = null;
      }
    };

    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [navigate]);

  // Static items built into index
  const pageItems = [
    { type: 'nav', title: 'Go to Dashboard', route: '/dashboard', desc: 'Overview of system performance and task status summaries' },
    { type: 'nav', title: 'Go to Tasks & Objectives', route: '/tasks', desc: 'View scheduled work tasks, assign priorities, and update lists' },
    { type: 'nav', title: 'Go to Calendar Schedule', route: '/calendar', desc: 'Trace deadlines, operations schedules, and event timesteps' },
    { type: 'nav', title: 'Go to Service Tickets / Support Reports', route: '/reporting', desc: 'Audit machine maintenance, export logs, or print ticket indexes' },
    { type: 'nav', title: 'Go to Secure Staff Chat / Inbox', route: '/chat', desc: 'Consult colleagues and manage private or group message threads' },
    { type: 'nav', title: 'Go to Settings Panel', route: '/settings', desc: 'Update account password and toggle dashboard theme preferences' },
    { type: 'nav', title: 'Go to Admin Workspace Panel', route: '/admin', desc: 'Manage user credentials and view site logs' }
  ];

  const quickActionItems = [
    { 
      type: 'cmd', 
      title: '/create-task', 
      desc: 'Create a new task and add it to your current active column', 
      action: () => {
        setIsPaletteOpen(false);
        navigate('/tasks?action=create');
      } 
    },
    { 
      type: 'cmd', 
      title: '/file-ticket', 
      desc: 'Report a machine maintenance issue or equipment service ticket', 
      action: () => {
        setIsPaletteOpen(false);
        navigate('/reporting?action=create');
      } 
    },
    { 
      type: 'cmd', 
      title: '/send-message', 
      desc: 'Open the communications page to send messages to colleagues', 
      action: () => {
        setIsPaletteOpen(false);
        navigate('/chat');
      } 
    },
    { 
      type: 'cmd', 
      title: '/toggle-theme', 
      desc: `Switch dashboard colors (Currently: ${theme === 'dark' ? 'Dark' : 'Light'})`, 
      action: () => {
        toggleTheme();
        toast.info(`Theme set to ${theme === 'dark' ? 'Light Mode' : 'Dark Mode'}`);
      } 
    },
    { 
      type: 'cmd', 
      title: '/logout', 
      desc: 'Sign out of your secure Dallmayr South Africa account session', 
      action: async () => {
        setIsPaletteOpen(false);
        await supabase.auth.signOut();
        toast.warning('Signing you out. Please wait.');
        navigate('/login');
      } 
    }
  ];

  // Combine and search datasets
  const getFilteredItems = () => {
    const searchString = query.toLowerCase().trim();
    
    // 1. Pages matched
    const filteredPages = pageItems.filter(p => 
      p.title.toLowerCase().includes(searchString) || 
      p.desc.toLowerCase().includes(searchString)
    );

    // 2. Command action scripts matched
    const filteredCommands = quickActionItems.filter(c => 
      c.title.toLowerCase().includes(searchString) || 
      c.desc.toLowerCase().includes(searchString)
    );

    // 3. Matched Tasks
    const filteredTasks = tasks
      .filter(t => t.title.toLowerCase().includes(searchString) || t.description.toLowerCase().includes(searchString))
      .map(t => ({
        type: 'task',
        title: `Task: ${t.title}`,
        desc: t.description ? (t.description.length > 70 ? `${t.description.slice(0, 70)}...` : t.description) : 'No description provided.',
        action: () => {
          setIsPaletteOpen(false);
          navigate(`/tasks?edit=${t.id}`);
        }
      }));

    // 4. Matched personnel staff profiles
    const filteredProfiles = profiles
      .filter(p => p.email.toLowerCase().includes(searchString) || (p.full_name && p.full_name.toLowerCase().includes(searchString)))
      .map(p => ({
        type: 'profile',
        title: `Employee Profile: ${p.full_name || p.email.split('@')[0]}`,
        desc: `Email contact coordinate: ${p.email}`,
        action: () => {
          setIsPaletteOpen(false);
          navigate(`/chat`);
          toast.success(`Direct message chat with ${p.full_name || p.email} ready`);
        }
      }));

    return [...filteredCommands, ...filteredPages, ...filteredTasks, ...filteredProfiles];
  };

  const results = getFilteredItems();

  // Scroll to active index
  useEffect(() => {
    if (resultsRef.current) {
      const activeEl = resultsRef.current.children[activeIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[activeIndex]) {
        const selected = results[activeIndex];
        if (selected.type === 'nav') {
          setIsPaletteOpen(false);
          navigate((selected as any).route);
          toast.success(`Navigating to ${(selected as any).title}`);
        } else if (selected.action) {
          selected.action();
        }
      }
    }
  };

  return (
    <>
      {/* Visual footer reminder with clean, professional font styles */}
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-1.5 bg-bg-elevated border border-brand-border px-3 py-1.5 rounded-lg text-xs font-semibold text-text-secondary select-none shadow-md print:hidden">
        <Keyboard className="w-4 h-4 text-brand-gold" />
        <span>Press <kbd className="bg-bg-base border border-brand-border px-1 rounded font-mono text-xs">Cmd + K</kbd> or <kbd className="bg-bg-base border border-brand-border px-1 rounded font-mono text-xs">?</kbd></span>
      </div>

      {/* COMMAND PALETTE SPOTLIGHT MODAL */}
      <AnimatePresence>
        {isPaletteOpen && (
          <div className="fixed inset-0 z-50 flex justify-center p-4 pt-[10vh] md:pt-[15vh]">
            {/* Backdrop with motion fade */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPaletteOpen(false)}
              className="absolute inset-0 bg-neutral-950/70 backdrop-blur-sm"
            />

            {/* Main searchable dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative w-full max-w-xl bg-bg-elevated border border-brand-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[500px]"
            >
              {/* Search prompt */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-brand-border bg-bg-base/30">
                <Search className="w-5 h-5 text-brand-gold" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Seach tasks, employees, operations or setting commands..."
                  value={query}
                  onChange={e => {
                    setQuery(e.target.value);
                    setActiveIndex(0);
                  }}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent border-none text-sm outline-none font-semibold text-text-primary placeholder:text-text-secondary/40"
                />
                <span className="text-xs font-semibold text-brand-gold bg-brand-gold/10 px-1.5 py-0.5 border border-brand-gold/25 rounded font-mono">
                  ESC
                </span>
              </div>

              {/* Items index lists */}
              <div ref={resultsRef} className="flex-1 overflow-y-auto p-2 divide-y divide-brand-border/10 scrollbar-thin">
                {results.length === 0 ? (
                  <div className="py-12 text-center flex flex-col items-center justify-center gap-2">
                    <Terminal className="w-8 h-8 text-text-secondary/40" />
                    <p className="text-xs font-semibold text-text-secondary">No coordinates identified.</p>
                  </div>
                ) : (
                  results.map((item, idx) => {
                    const isActive = idx === activeIndex;
                    
                    // Choose icons matching categories
                    let ResultIcon = Compass;
                    let iconColor = 'text-brand-gold';
                    if (item.type === 'cmd') {
                      ResultIcon = Terminal;
                      iconColor = 'text-purple-400';
                    } else if (item.type === 'task') {
                      ResultIcon = Briefcase;
                      iconColor = 'text-blue-400';
                    } else if (item.type === 'profile') {
                      ResultIcon = User;
                      iconColor = 'text-green-400';
                    }

                    return (
                      <div
                        key={`${item.type}-${item.title}-${idx}`}
                        onClick={() => {
                          if (item.type === 'nav') {
                            setIsPaletteOpen(false);
                            navigate((item as any).route);
                            toast.success(`Redirecting to ${(item as any).title}`);
                          } else if (item.action) {
                            item.action();
                          }
                        }}
                        className={cn(
                          "flex items-start gap-4 p-3 rounded-xl cursor-pointer select-none transition-all duration-150 border border-transparent",
                          isActive 
                            ? "bg-brand-gold/10 border-brand-gold/30 shadow-sm" 
                            : "hover:bg-bg-base/40"
                        )}
                      >
                        <div className={cn("p-2 rounded-lg bg-bg-base border border-brand-border/60 self-center", isActive && "border-brand-gold/30")}>
                          <ResultIcon className={cn("w-4 h-4", iconColor)} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className={cn(
                              "text-xs font-semibold block",
                              isActive ? "text-brand-gold" : "text-text-primary"
                            )}>
                              {item.title}
                            </span>
                            {item.type === 'cmd' && (
                              <span className="text-[10px] font-mono font-medium border border-purple-500/25 text-purple-400 bg-purple-500/5 px-1 rounded-sm">
                                Action
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-secondary mt-0.5 truncate leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Status information footer */}
              <div className="px-4 py-2 border-t border-brand-border bg-bg-base/50 text-xs text-text-secondary flex justify-between items-center select-none font-mono">
                <span>Total Matches: {results.length}</span>
                <div className="flex gap-2">
                  <span>Enter to Execute</span>
                  <span>•</span>
                  <span>↑↓ Nav</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* KEYBOARD SHORTCUTS MANUAL GUIDE HUD */}
      <AnimatePresence>
        {isHelpOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHelpOpen(false)}
              className="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm"
            />

            {/* Modal HUD layout */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', duration: 0.25 }}
              className="relative w-full max-w-lg bg-bg-elevated border border-brand-border rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-brand-border bg-bg-base/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-gold/10 rounded-xl border border-brand-gold/20">
                    <Keyboard className="w-5 h-5 text-brand-gold" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">Keyboard Shortcut Guide</h3>
                    <p className="text-xs text-text-secondary">Key shortcuts for efficient portal navigation</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsHelpOpen(false)}
                  className="p-1 px-2.5 bg-bg-base hover:bg-red-500/10 hover:text-red-500 rounded-lg border border-brand-border text-text-secondary text-xs font-semibold font-mono tracking-wider transition-all"
                >
                  ESC
                </button>
              </div>

              {/* Shortcuts Matrix Table */}
              <div className="p-6 space-y-5 text-sm">
                
                {/* Series 1: Sequence Navigations */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-brand-gold uppercase tracking-wider pb-1 border-b border-brand-border/30">
                    Page Sequence Navigation
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center justify-between p-2.5 bg-bg-base/40 border border-brand-border/20 rounded-xl">
                      <span className="text-xs font-semibold text-text-secondary">Dashboard Overview</span>
                      <kbd className="space-x-1">
                        <kbd className="bg-bg-base border border-brand-border px-1.5 py-0.5 rounded font-mono text-xs">G</kbd>
                        <span className="text-xs text-text-secondary">then</span>
                        <kbd className="bg-bg-base border border-brand-border px-1.5 py-0.5 rounded font-mono text-xs">D</kbd>
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-bg-base/40 border border-brand-border/20 rounded-xl">
                      <span className="text-xs font-semibold text-text-secondary">Task objectives</span>
                      <kbd className="space-x-1">
                        <kbd className="bg-bg-base border border-brand-border px-1.5 py-0.5 rounded font-mono text-xs">G</kbd>
                        <span className="text-xs text-text-secondary">then</span>
                        <kbd className="bg-bg-base border border-brand-border px-1.5 py-0.5 rounded font-mono text-xs">T</kbd>
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-bg-base/40 border border-brand-border/20 rounded-xl">
                      <span className="text-xs font-semibold text-text-secondary">Deadlines Calendar</span>
                      <kbd className="space-x-1">
                        <kbd className="bg-bg-base border border-brand-border px-1.5 py-0.5 rounded font-mono text-xs">G</kbd>
                        <span className="text-xs text-text-secondary">then</span>
                        <kbd className="bg-bg-base border border-brand-border px-1.5 py-0.5 rounded font-mono text-xs">C</kbd>
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-bg-base/40 border border-brand-border/20 rounded-xl">
                      <span className="text-xs font-semibold text-text-secondary">Service tickets</span>
                      <kbd className="space-x-1">
                        <kbd className="bg-bg-base border border-brand-border px-1.5 py-0.5 rounded font-mono text-xs">G</kbd>
                        <span className="text-xs text-text-secondary">then</span>
                        <kbd className="bg-bg-base border border-brand-border px-1.5 py-0.5 rounded font-mono text-xs">R</kbd>
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-bg-base/40 border border-brand-border/20 rounded-xl">
                      <span className="text-xs font-semibold text-text-secondary">Comms Link</span>
                      <kbd className="space-x-1">
                        <kbd className="bg-bg-base border border-brand-border px-1.5 py-0.5 rounded font-mono text-xs">G</kbd>
                        <span className="text-xs text-text-secondary">then</span>
                        <kbd className="bg-bg-base border border-brand-border px-1.5 py-0.5 rounded font-mono text-xs">M</kbd>
                      </kbd>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-bg-base/40 border border-brand-border/20 rounded-xl">
                      <span className="text-xs font-semibold text-text-secondary">Portal Settings</span>
                      <kbd className="space-x-1">
                        <kbd className="bg-bg-base border border-brand-border px-1.5 py-0.5 rounded font-mono text-xs">G</kbd>
                        <span className="text-xs text-text-secondary">then</span>
                        <kbd className="bg-bg-base border border-brand-border px-1.5 py-0.5 rounded font-mono text-xs">S</kbd>
                      </kbd>
                    </div>
                  </div>
                </div>

                {/* Series 2: Instant Hotkeys */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-brand-gold uppercase tracking-wider pb-1 border-b border-brand-border/30">
                    Instant Global Handlers
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2.5 bg-bg-base/40 border border-brand-border/20 rounded-xl">
                      <div>
                        <span className="text-xs font-semibold text-text-primary block">Command Search</span>
                        <span className="text-[11px] text-text-secondary">Open searching palette and quick commands from any route</span>
                      </div>
                      <kbd className="bg-bg-base border border-brand-border px-2 py-0.5 rounded font-mono text-xs">Ctrl+K</kbd>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-bg-base/40 border border-brand-border/20 rounded-xl">
                      <div>
                        <span className="text-xs font-semibold text-text-primary block">Task Creator</span>
                        <span className="text-[11px] text-text-secondary">Launch the form to register new tasks instantly</span>
                      </div>
                      <kbd className="bg-bg-base border border-brand-border px-2.5 py-0.5 rounded font-mono text-xs">C</kbd>
                    </div>
                    <div className="flex items-center justify-between p-2.5 bg-bg-base/40 border border-brand-border/20 rounded-xl">
                      <div>
                        <span className="text-xs font-semibold text-text-primary block">Manual HUD Directory</span>
                        <span className="text-[11px] text-text-secondary">Toggle this keyboard guide popup</span>
                      </div>
                      <kbd className="bg-bg-base border border-brand-border px-2.5 py-0.5 rounded font-mono text-xs">?</kbd>
                    </div>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-brand-border bg-bg-base/50 flex align-center justify-between text-xs text-text-secondary select-none font-mono">
                <span>DALLMAYR SYSTEMS NAVIGATION</span>
                <span>ESC to Close</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
