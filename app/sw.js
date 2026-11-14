const CACHE_NAME = 'weavax-auto-network-first';

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    // Para archivos propios de WeaVax (.js, .html, .json), forzar siempre lectura fresca desde red
    if (url.origin === self.location.origin) {
        event.respondWith(
            fetch(event.request, { cache: 'no-store' }).catch(() => caches.match(event.request))
        );
        return;
    }
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
