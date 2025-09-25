import React, { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
        <i className="fas fa-search text-dark-subtext"></i>
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a song..."
        className="w-full pl-10 pr-4 py-2 border-none rounded-full focus:outline-none focus:ring-2 focus:ring-brand-red/70 bg-dark-card text-dark-text placeholder-dark-subtext"
      />
    </form>
  );
};