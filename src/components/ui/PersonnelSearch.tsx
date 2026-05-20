import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Profile } from '../../types/database';
import { Search, User, Check, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../contexts/AuthContext';

interface PersonnelSearchProps {
  onSelect: (profile: Profile | null) => void;
  selectedProfile: Profile | null;
}

export const PersonnelSearch: React.FC<PersonnelSearchProps> = ({ onSelect, selectedProfile }) => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const searchPersonnel = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', user?.id) // Don't message yourself
          .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
          .limit(5);

        if (error) throw error;
        setResults(data || []);
        setIsDropdownOpen(true);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(searchPersonnel, 300);
    return () => clearTimeout(timer);
  }, [query, user?.id]);

  return (
    <div className="relative w-full">
      <div className="group relative">
        <Search className={cn(
          "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
          loading ? "text-brand-gold animate-pulse" : "text-text-secondary group-focus-within:text-brand-gold"
        )} />
        <input 
          type="text"
          value={selectedProfile ? selectedProfile.full_name || selectedProfile.email : query}
          onChange={(e) => {
            if (selectedProfile) onSelect(null);
            setQuery(e.target.value);
          }}
          placeholder="Search personnel by name or ID..."
          className="w-full bg-bg-base border border-brand-border rounded-xl pl-10 pr-10 py-2.5 text-sm font-medium focus:outline-none focus:border-brand-gold transition-all"
        />
        {selectedProfile && (
          <button 
            onClick={() => {
              onSelect(null);
              setQuery('');
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-red-500/10 rounded-lg text-text-secondary hover:text-red-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isDropdownOpen && results.length > 0 && !selectedProfile && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-bg-elevated border border-brand-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-1">
            {results.map((profile) => (
              <button
                key={profile.id}
                onClick={() => {
                  onSelect(profile);
                  setIsDropdownOpen(false);
                  setQuery('');
                }}
                className="w-full flex items-center gap-3 p-3 hover:bg-brand-gold/10 transition-colors rounded-lg group text-left"
              >
                <div className="w-8 h-8 rounded-full bg-brand-gold/10 border border-brand-gold/20 flex items-center justify-center flex-shrink-0">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <User className="w-4 h-4 text-brand-gold" />
                  )}
                </div>
                <div className="flex-grow min-w-0">
                  <p className="text-xs font-black text-text-primary uppercase tracking-tight truncate">
                    {profile.full_name || 'Anonymous Agent'}
                  </p>
                  <p className="text-[9px] text-text-secondary font-bold uppercase tracking-widest truncate">
                    {profile.role} • {profile.email.split('@')[1]}
                  </p>
                </div>
                <Check className="w-4 h-4 text-brand-gold opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
