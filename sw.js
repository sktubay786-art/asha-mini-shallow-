// ASHA Fresh 2.0: network-only worker; no app-shell or runtime caching.
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil((async () => { for (const key of await caches.keys()) await caches.delete(key); await self.clients.claim(); })()));
self.addEventListener('fetch', () => {});
