import React, { useState } from 'react';

type Tab = 'Recommendations' | 'Playlist' | 'History' | 'Offline';

interface TabViewProps {
  searchResults: React.ReactNode;
  playlist: React.ReactNode;
  history: React.ReactNode;
  offline: React.ReactNode;
}

export const TabView: React.FC<TabViewProps> = ({ searchResults, playlist, history, offline }) => {
  const [activeTab, setActiveTab] = useState<Tab>('Recommendations');

  const renderContent = () => {
    switch (activeTab) {
      case 'Recommendations':
        return searchResults;
      case 'Playlist':
        return playlist;
      case 'History':
        return history;
      case 'Offline':
        return offline;
      default:
        return null;
    }
  };
  
  const getTabClass = (tabName: Tab) => {
      return `px-4 py-2 font-semibold rounded-t-lg transition-colors duration-200 focus:outline-none ${
        activeTab === tabName
          ? 'bg-white dark:bg-dark-card text-brand-red border-b-2 border-brand-red'
          : 'text-gray-500 dark:text-dark-subtext hover:text-gray-700 dark:hover:text-dark-text'
      }`;
  }

  return (
    <div>
      <div className="border-b border-gray-200 dark:border-gray-700 mb-4">
        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
            <button onClick={() => setActiveTab('Recommendations')} className={getTabClass('Recommendations')}>Recommendations</button>
            <button onClick={() => setActiveTab('Playlist')} className={getTabClass('Playlist')}>Playlist</button>
            <button onClick={() => setActiveTab('History')} className={getTabClass('History')}>History</button>
            <button onClick={() => setActiveTab('Offline')} className={getTabClass('Offline')}>Offline</button>
        </nav>
      </div>
      <div>
        {renderContent()}
      </div>
    </div>
  );
};