import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Clock, ArrowUpRight, Loader2 } from 'lucide-react';
import { getSearchSuggestions } from '../services/youtubeService';

interface SearchBarProps {
  onSearch: (query: string) => void;
  searchHistory?: string[];
  isLoading?: boolean;
  initialQuery?: string;
  onSelectSuggestion?: (suggestion: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  searchHistory = [],
  isLoading: externalLoading = false,
  initialQuery = '',
  onSelectSuggestion,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Fetch suggestions when query changes with debouncing
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setSuggestions([]);
      setIsFetchingSuggestions(false);
      return;
    }

    setIsFetchingSuggestions(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await getSearchSuggestions(trimmed);
        setSuggestions(results);
        setSelectedIndex(-1);
      } catch (err) {
        setSuggestions([]);
      } finally {
        setIsFetchingSuggestions(false);
      }
    }, 200);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleSelectSuggestion = useCallback(
    (suggestion: string) => {
      setQuery(suggestion);
      setIsOpen(false);
      setSelectedIndex(-1);
      if (onSelectSuggestion) {
        onSelectSuggestion(suggestion);
      } else {
        onSearch(suggestion);
      }
    },
    [onSearch, onSelectSuggestion]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      handleSelectSuggestion(suggestions[selectedIndex]);
    } else {
      setIsOpen(false);
      onSearch(query);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
      }
      return;
    }

    const displayList =
      suggestions.length > 0 ? suggestions : query.trim() === '' ? searchHistory.slice(0, 5) : [];

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < displayList.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : displayList.length - 1));
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setSelectedIndex(-1);
    onSearch('');
    inputRef.current?.focus();
  };

  const showHistory = query.trim() === '' && searchHistory.length > 0;
  const itemsToShow =
    suggestions.length > 0 ? suggestions : showHistory ? searchHistory.slice(0, 6) : [];
  const shouldShowDropdown = isOpen && (itemsToShow.length > 0 || isFetchingSuggestions);
  const isLoading = isFetchingSuggestions || externalLoading;

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="flex w-full relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-dark-subtext">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-brand animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Cari lagu, musisi, atau album..."
          autoComplete="off"
          spellCheck="false"
          className="w-full pl-10 pr-9 py-2 text-sm rounded-full bg-dark-surface/90 hover:bg-dark-elevated/80 focus:bg-dark-surface text-white placeholder-dark-subtext border border-white/10 focus:border-brand/60 focus:outline-none focus:ring-2 focus:ring-brand/30 transition-all shadow-inner"
        />

        {query && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-2.5">
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-dark-subtext hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Hapus teks pencarian"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </form>

      {/* Suggestions & Search History Dropdown */}
      {shouldShowDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-dark-surface/95 border border-dark-border rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-2xl py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
          {showHistory && (
            <div className="px-4 py-1.5 text-[11px] font-bold text-dark-muted uppercase tracking-wider flex items-center justify-between">
              <span>Pencarian Terakhir</span>
              <Clock className="w-3 h-3 opacity-60" />
            </div>
          )}

          <ul className="max-h-72 overflow-y-auto no-scrollbar divide-y divide-white/5">
            {itemsToShow.map((item, index) => {
              const isSelected = selectedIndex === index;
              return (
                <li
                  key={`${item}-${index}`}
                  onClick={() => handleSelectSuggestion(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`group flex items-center justify-between px-4 py-2.5 cursor-pointer text-sm transition-colors ${
                    isSelected
                      ? 'bg-dark-elevated text-brand font-semibold'
                      : 'text-white/90 hover:bg-dark-elevated/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {showHistory ? (
                      <Clock className="w-3.5 h-3.5 text-dark-muted flex-shrink-0" />
                    ) : (
                      <Search className="w-3.5 h-3.5 text-dark-muted group-hover:text-brand flex-shrink-0" />
                    )}
                    <span className="truncate">{item}</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuery(item);
                      inputRef.current?.focus();
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-dark-muted hover:text-white transition-opacity rounded-full hover:bg-white/10 ml-2 flex-shrink-0"
                    title="Masukkan ke pencarian"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
