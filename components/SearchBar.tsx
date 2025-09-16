
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
    <form onSubmit={handleSubmit} className="flex w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for a song..."
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-full focus:outline-none focus:ring-2 focus:ring-brand-red/50 bg-gray-100 dark:bg-dark-card dark:text-dark-text"
      />
      <button
        type="submit"
        className="px-6 py-2 bg-brand-red text-white rounded-r-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-brand-red/50 transition-colors duration-200"
      >
        <i className="fas fa-search"></i>
      </button>
    </form>
  );
};
