
const STATIC_CACHE_NAME = 'yts-static-cache-v2';
const DATA_CACHE_NAME = 'yts-data-cache-v2';
const IMAGE_CACHE_NAME = 'yts-image-cache-v1';

const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.tsx',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => cache.addAll(URLS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (![STATIC_CACHE_NAME, DATA_CACHE_NAME, IMAGE_CACHE_NAME].includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Strategy: Images (Cache First) - Sangat penting untuk offline thumbnail
  if (url.hostname.includes('ytimg.com') || url.hostname.includes('googleusercontent.com')) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then(cache => {
        return cache.match(event.request).then(response => {
          return response || fetch(event.request).then(networkResponse => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // Strategy: YouTube API (Network First, then Cache)
  if (url.hostname === 'www.googleapis.com') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clonedRes = response.clone();
          caches.open(DATA_CACHE_NAME).then(cache => cache.put(event.request, clonedRes));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Default Strategy: Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then(response => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        caches.open(STATIC_CACHE_NAME).then(cache => cache.put(event.request, networkResponse.clone()));
        return networkResponse;
      });
      return response || fetchPromise;
    })
  );
});
