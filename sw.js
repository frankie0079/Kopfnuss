/* ============================================
   Kopfnuss! -- Service Worker
   Network-First: Immer aktuelle Dateien,
   Cache nur als Offline-Fallback.
   ============================================ */

const CACHE_NAME = 'smartbox-v74';

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
    './js/data/cards.js',
    './js/views/setup.js',
    './js/views/game.js',
    './js/views/victory.js',
    './js/views/import.js',
    './js/components/ring.js',
    './js/components/scoreboard.js',
    './js/components/turn-indicator.js',
    './js/components/timer.js',
    './js/services/audio.js',
    './css/admin.css',
    './js/admin/admin.js',
    './js/admin/batch-import.js',
    './js/admin/card-editor.js',
    './js/admin/library.js',
    './js/admin/settings.js',
    './js/admin/card-db.js',
    './js/admin/export.js',
    './js/admin/vision-api.js',
    './assets/sounds/correct-1.mp3',
    './assets/sounds/correct-2.mp3',
    './assets/sounds/correct-3.mp3',
    './assets/sounds/wrong-1.mp3',
    './assets/sounds/wrong-2.mp3',
    './assets/sounds/wrong-3.mp3',
    './assets/sounds/timer-10s.mp3',
    './assets/sounds/victory-1.mp3',
    './assets/sounds/victory-2.mp3',
    './assets/sounds/start-game.mp3',
    './assets/sounds/passe.mp3',
    'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
    'https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Gabarito:wght@400;600;700;900&family=Caveat:wght@500;700&family=DM+Sans:wght@400;500;600;700&display=swap'
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
