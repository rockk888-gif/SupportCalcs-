// Service worker: caches all app assets on install so the app works
// with zero network connectivity after the first successful load.

const CACHE_NAME = 'peddose-prototype-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-180.png'
];

// On install: pre-cache every asset the app needs to run standalone.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// On activate: clean up any old cache versions from previous installs.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// On fetch: serve from cache first (offline-safe), fall back to network
// only if something wasn't cached, and cache whatever comes back.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((networkResponse) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // No cache, no network — nothing more we can do for this asset.
          return new Response('Offline and asset not cached.', {
            status: 503,
            statusText: 'Offline'
          });
        });
    })
  );
});
