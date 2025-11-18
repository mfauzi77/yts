// Define cache names. Versioning helps in managing updates.
const STATIC_CACHE_NAME = 'yts-static-cache-v1';
const DATA_CACHE_NAME = 'yts-data-cache-v1';

// A list of files to be cached automatically during service worker installation.
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
];

// --- INSTALL EVENT ---
// Caches the application shell (core static assets).
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

// --- ACTIVATE EVENT ---
// Cleans up old caches to remove outdated data.
self.addEventListener('activate', event => {
  const cacheWhitelist = [STATIC_CACHE_NAME, DATA_CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Ensures the new service worker takes control immediately.
  return self.clients.claim();
});

// --- FETCH EVENT ---
// Intercepts network requests and applies caching strategies.
self.addEventListener('fetch', event => {
  // We only cache GET requests.
  if (event.request.method !== 'GET') {
      return;
  }

  const url = new URL(event.request.url);

  // Strategy: Media Streams from YouTube (Cache First)
  // This is crucial for offline playback.
  if (url.hostname.endsWith('googlevideo.com')) {
    event.respondWith(
        caches.open(DATA_CACHE_NAME).then(cache => {
            return cache.match(event.request).then(cachedResponse => {
                // If we have a cached response (including partial content), return it.
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                // Otherwise, fetch from the network.
                return fetch(event.request).then(networkResponse => {
                    // Cache the response if it's valid (200 OK or 206 Partial Content).
                    if (networkResponse && (networkResponse.status === 200 || networkResponse.status === 206)) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                });
            });
        })
    );
    return;
  }
  
  // Strategy: YouTube API Data (Stale-While-Revalidate)
  // Serve from cache immediately, then update in the background. Good for data that changes.
  if (url.hostname === 'www.googleapis.com' && url.pathname.startsWith('/youtube/v3')) {
      event.respondWith(
          caches.open(DATA_CACHE_NAME).then(cache => {
              return cache.match(event.request).then(cachedResponse => {
                  const fetchPromise = fetch(event.request).then(networkResponse => {
                      // If the fetch is successful, update the cache.
                      if (networkResponse && networkResponse.status === 200) {
                          cache.put(event.request, networkResponse.clone());
                      }
                      return networkResponse;
                  }).catch(err => {
                      console.error('[Service Worker] API fetch failed:', err);
                      // This catch is important for when the user is completely offline.
                  });

                  // Return the cached response if it exists, otherwise wait for the network.
                  return cachedResponse || fetchPromise;
              });
          })
      );
      return;
  }

  // Strategy: Images & Fonts (Cache First)
  // Serve from cache. If not in cache, fetch from network and then cache it. Good for static assets.
  if (url.hostname === 'i.ytimg.com' || url.hostname === 'ka-f.fontawesome.com') {
      event.respondWith(
          caches.open(DATA_CACHE_NAME).then(cache => {
              return cache.match(event.request).then(cachedResponse => {
                  return cachedResponse || fetch(event.request).then(networkResponse => {
                      if (networkResponse && networkResponse.status === 200) {
                          cache.put(event.request, networkResponse.clone());
                      }
                      return networkResponse;
                  });
              });
          })
      );
      return;
  }

  // Strategy: App Shell & Other Static Assets (Cache First)
  // Default strategy for all other GET requests.
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // If we have a response in the cache, return it.
        if (response) {
          return response;
        }

        // Otherwise, fetch from the network.
        return fetch(event.request).then(
          networkResponse => {
            // Check for a valid response.
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            // Clone the response because it's a stream that can only be consumed once.
            const responseToCache = networkResponse.clone();

            caches.open(STATIC_CACHE_NAME)
              .then(cache => {
                // We don't cache opaque responses (e.g., from a CDN without CORS).
                if (networkResponse.type !== 'opaque') {
                  cache.put(event.request, responseToCache);
                }
              });

            return networkResponse;
          }
        );
      })
    );
});