const CACHE='asha-mini-elite-v22';
const ASSETS=["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png", "./app-bg.jpg", "./sample-qr-1.jpg", "./sample-qr-2.jpg"];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).catch(()=>caches.match('./index.html')))));
