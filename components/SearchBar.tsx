import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getSearchSuggestions } from '../services/youtubeService';

interface SearchBarProps {
  onSearch: (query: string) => void;
  searchHistory?: string[];
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, searchHistory = [] }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch suggestions when query changes with debouncing
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await getSearchSuggestions(trimmed);
        setSuggestions(results);
        setSelectedIndex(-1);
      } catch (err) {
        console.error('Failed to get search suggestions:', err);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
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

  const handleSelectSuggestion = useCallback((suggestion: string) => {
    setQuery(suggestion);
    setIsOpen(false);
    setSelectedIndex(-1);
    onSearch(suggestion);
  }, [onSearch]);

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

    const displayList = suggestions.length > 0 ? suggestions : (query.trim() === '' ? searchHistory.slice(0, 5) : []);

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
  const itemsToShow = suggestions.length > 0 ? suggestions : (showHistory ? searchHistory.slice(0, 6) : []);
  const shouldShowDropdown = isOpen && (itemsToShow.length > 0 || isLoading);

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="flex w-full relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-dark-subtext">
          {isLoading ? (
            <svg className="animate-spin h-4 w-4 text-brand-red" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <i className="fas fa-search"></i>
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
          placeholder="Cari lagu, musisi, atau genre..."
          autoComplete="off"
          spellCheck="false"
          className="w-full pl-10 pr-10 py-2 border border-transparent focus:border-brand-red/40 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-red/70 bg-dark-card text-dark-text placeholder-dark-subtext transition-all duration-200"
        />
        {query && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-dark-subtext hover:text-white hover:bg-dark-surface transition-colors"
              aria-label="Hapus pencarian"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}
      </form>

      {/* Suggestions Dropdown */}
      {shouldShowDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-dark-card border border-dark-highlight/80 rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-md divide-y divide-white/5 py-1 animate-in fade-in slide-in-from-top-1 duration-150">
          {showHistory && (
            <div className="px-4 py-1.5 text-xs font-semibold text-dark-subtext uppercase tracking-wider flex items-center justify-between">
              <span>Pencarian Terakhir</span>
              <i className="fas fa-clock text-xs opacity-60"></i>
            </div>
          )}

          <ul className="max-h-72 overflow-y-auto divide-y divide-white/5">
            {itemsToShow.map((item, index) => {
              const isSelected = selectedIndex === index;
              return (
                <li
                  key={`${item}-${index}`}
                  onClick={() => handleSelectSuggestion(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`group flex items-center justify-between px-4 py-2.5 cursor-pointer text-sm transition-colors ${
                    isSelected
                      ? 'bg-dark-surface text-brand-red font-semibold'
                      : 'text-dark-text hover:bg-dark-surface hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <i
                      className={`text-xs flex-shrink-0 ${
                        showHistory
                          ? 'fas fa-history text-dark-subtext group-hover:text-white'
                          : 'fas fa-search text-dark-subtext group-hover:text-brand-red'
                      } ${isSelected ? 'text-brand-red' : ''}`}
                    ></i>
                    <span className="truncate">{item}</span>
                  </div>
                  
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setQuery(item);
                      inputRef.current?.focus();
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-dark-subtext hover:text-white transition-opacity rounded-full hover:bg-dark-highlight ml-2 flex-shrink-0"
                    title="Salin ke kotak pencarian"
                  >
                    <i className="fas fa-arrow-up rotate-[-45deg] text-xs"></i>
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
