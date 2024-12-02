const APP_VERSION = '1.0.0';
const CACHE_PREFIX = 'logday-cache-';

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    // Force all clients to reload to ensure new styles are applied
    self.clients.matchAll().then(clients => {
      console.log(`[SW] Reloading ${clients.length} client(s)`);
      clients.forEach(client => client.navigate(client.url));
    });
  }
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating new service worker version:', APP_VERSION);

  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // Clear old version caches
      caches.keys().then(cacheNames => 
        Promise.all(
          cacheNames
            .filter(cacheName => 
              cacheName.startsWith(CACHE_PREFIX) && 
              !cacheName.includes(APP_VERSION)
            )
            .map(cacheName => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        )
      )
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