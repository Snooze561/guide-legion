// Service worker : rend le guide disponible hors ligne.
// Pense à changer VERSION quand la liste SHELL change.
const VERSION = 'guide-v1';
const SHELL = [
  './',
  'index.html',
  'manifest.webmanifest',
  'assets/style.css',
  'assets/app.js',
  'assets/icons/icon-192.png',
  'data/classes.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Icônes Wowhead : elles ne changent jamais, on sert le cache en priorité.
  if (url.hostname === 'wow.zamimg.com') {
    event.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(VERSION).then((cache) => cache.put(req, copy));
        return res;
      }))
    );
    return;
  }

  // Fichiers du site : réseau d'abord pour avoir les dernières données, cache si hors ligne.
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(req).then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(() => caches.match(req, { ignoreSearch: true }))
    );
  }
});
