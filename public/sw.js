const APP_VERSION = '1.0.0';
const CACHE_PREFIX = 'logday-cache-';

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Take control of all clients as soon as the service worker activates
      self.clients.claim(),
      
      // Clear old caches if needed
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            return caches.delete(cacheName);
          })
        );
      })
    ])
  );
});

// Handle fetch events with versioned caching
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then(response => {
        // Skip caching for non-successful responses
        if (!response || response.status !== 200) {
          return response;
        }

        // Clone the response before caching
        const responseToCache = response.clone();
        const cacheName = `${CACHE_PREFIX}${APP_VERSION}`;

        caches.open(cacheName).then(cache => {
          cache.put(event.request, responseToCache);
          console.log('[SW] Cached new response:', event.request.url);
        });

        return response;
      });
    })
  );
});