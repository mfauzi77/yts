import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary fallbackTitle="Aplikasi Mengalami Kendala">
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Register Service Worker for PWA and caching capabilities
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Purge outdated static caches from v1 & v2 to prevent stale chunk errors
    if ('caches' in window) {
      caches.keys().then(keys => {
        keys.forEach(k => {
          if (k.includes('-v1') || k.includes('-v2')) {
            caches.delete(k);
          }
        });
      }).catch(() => {});
    }

    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        registration.update().catch(() => {});
      })
      .catch(err => {
        console.log('ServiceWorker registration failed: ', err);
      });
  });
}
