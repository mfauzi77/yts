import React from 'react';

type ApiStatus = 'idle' | 'success' | 'error';

interface ApiStatusIndicatorProps {
  status: ApiStatus;
}

export const ApiStatusIndicator: React.FC<ApiStatusIndicatorProps> = ({ status }) => {
  const statusConfig = {
    idle: { color: 'bg-gray-400', text: 'API Status: Idle' },
    success: { color: 'bg-green-500', text: 'API Status: OK' },
    error: { color: 'bg-red-500', text: 'API Status: Error' },
  };

  const { color, text } = statusConfig[status];
  
  // Apply a subtle pulse only when the status changes, not when idle
  const pulseClass = (status === 'success' || status === 'error') ? 'animate-pulse' : '';

  return (
    <div className="relative flex items-center" title={text}>
      <span className={`h-3 w-3 rounded-full transition-colors duration-300 ${color} ${pulseClass}`}></span>
    </div>
  );
};
