import React, { useState, useRef } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    onSearch(''); // This clears the search results in the parent component
    inputRef.current?.focus();
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
        <i className="fas fa-search text-dark-subtext"></i>
      </div>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Cari lagu..."
        className="w-full pl-10 pr-10 py-2 border-none rounded-full focus:outline-none focus:ring-2 focus:ring-brand-red/70 bg-dark-card text-dark-text placeholder-dark-subtext"
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
  );
};