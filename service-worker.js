const STATIC_CACHE_NAME = 'yts-static-cache-v3';
const DATA_CACHE_NAME = 'yts-data-cache-v3';
const IMAGE_CACHE_NAME = 'yts-image-cache-v2';

const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
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
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Strategy: Images (Cache First) - Sangat penting untuk offline thumbnail
  if (url.hostname.includes('ytimg.com') || url.hostname.includes('googleusercontent.com') || url.hostname.includes('unsplash.com')) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then(cache => {
        return cache.match(event.request).then(response => {
          return response || fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.ok) {
              const clonedResponse = networkResponse.clone();
              caches.open(IMAGE_CACHE_NAME).then(cache => cache.put(event.request, clonedResponse));
            }
            return networkResponse;
          }).catch(() => new Response('', { status: 408 }));
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
          if (response && response.ok) {
            const clonedRes = response.clone();
            caches.open(DATA_CACHE_NAME).then(cache => cache.put(event.request, clonedRes));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Default Strategy: Network first with Cache fallback
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        if (networkResponse && networkResponse.ok && (networkResponse.type === 'basic' || networkResponse.type === 'cors')) {
          const clonedResponse = networkResponse.clone();
          caches.open(STATIC_CACHE_NAME).then(cache => cache.put(event.request, clonedResponse));
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          return new Response('', { status: 408 });
        });
      })
  );
});
