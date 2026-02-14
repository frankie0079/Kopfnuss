/* ============================================
   Kopfnuss! -- Service Worker
   Network-First: Immer aktuelle Dateien,
   Cache nur als Offline-Fallback.
   ============================================ */

const CACHE_NAME = 'smartbox-v18';

// ── Bei localhost: sofort selbst deregistrieren ──

if (self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1') {
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
        .then(() => self.registration.unregister())
        .then(() => self.clients.claim())
    );
  });
  // Kein fetch-Handler: Browser laedt direkt vom Server
} else {

  // ── Produktion: Network-First mit Cache-Fallback ──

  const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './css/variables.css',
    './css/base.css',
    './css/layout.css',
    './css/setup.css',
    './css/game.css',
    './css/animations.css',
    './css/victory.css',
    './js/app.js',
    './js/state.js',
    './js/models/card.js',
    './js/models/game.js',
    './js/data/demo-set.js',
    './js/views/setup.js',
    './js/views/game.js',
    './js/views/victory.js',
    './js/views/import.js',
    './js/components/ring.js',
    './js/components/scoreboard.js',
    './js/components/turn-indicator.js',
    './js/components/timer.js',
    './js/services/audio.js',
    './js/services/card-store.js',
    './js/services/zip-import.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
    'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap'
  ];

  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then(cache => Promise.allSettled(
          STATIC_ASSETS.map(url => cache.add(url).catch(() => {}))
        ))
        .then(() => self.skipWaiting())
    );
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys()
        .then(keys => Promise.all(
          keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
        ))
        .then(() => self.clients.claim())
    );
  });

  // Network-First: Immer zuerst vom Server laden,
  // Cache nur wenn offline.
  self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then(cached => {
            if (cached) return cached;
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
          });
        })
    );
  });
}
