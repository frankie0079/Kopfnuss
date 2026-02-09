/* ============================================
   Digital Smartbox -- Service Worker
   Cache-First fuer statische Assets
   ============================================ */

const CACHE_NAME = 'smartbox-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/variables.css',
  '/css/base.css',
  '/css/layout.css',
  '/css/setup.css',
  '/css/game.css',
  '/css/animations.css',
  '/css/victory.css',
  '/js/app.js',
  '/js/state.js',
  '/js/models/card.js',
  '/js/models/game.js',
  '/js/data/demo-set.js',
  '/js/views/setup.js',
  '/js/views/game.js',
  '/js/views/victory.js',
  '/js/views/import.js',
  '/js/components/ring.js',
  '/js/components/scoreboard.js',
  '/js/components/turn-indicator.js',
  '/js/components/timer.js',
  '/js/services/audio.js',
  '/js/services/card-store.js',
  '/js/services/zip-import.js',
  // CDN
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap'
];

// ── Install: Cache befuellen ────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Statische Assets cachen (einzeln, damit ein Fehler nicht alles blockiert)
        return Promise.allSettled(
          STATIC_ASSETS.map(url => cache.add(url).catch(err => {
            console.warn(`[SW] Cache fehlgeschlagen fuer: ${url}`, err);
          }))
        );
      })
      .then(() => self.skipWaiting())
  );
});

// ── Activate: Alte Caches loeschen ──────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: Cache-First, Network-Fallback ────

self.addEventListener('fetch', (event) => {
  // Nur GET-Requests cachen
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;

        return fetch(event.request)
          .then(response => {
            // Gueltige Responses in den Cache legen
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, clone);
              });
            }
            return response;
          })
          .catch(() => {
            // Offline-Fallback: Hauptseite zurueckgeben
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
          });
      })
  );
});
