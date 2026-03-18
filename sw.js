const CACHE_NAME = 'asistencia-v1';

// Archivos a cachear para uso offline
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Instalación: cachear archivos base
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => {
        console.log('Cache parcial:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activación: limpiar caches viejas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first, fallback a cache
self.addEventListener('fetch', event => {
  // Solo manejar GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si la respuesta es válida, guardarla en cache
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Sin red: usar cache
        return caches.match(event.request).then(cached => {
          return cached || caches.match('./index.html');
        });
      })
  );
});
