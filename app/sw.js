const CACHE_NAME = 'weavax-desktop-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Estrategia Network-First para mantener Firestore y módulos siempre actualizados
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});
