const CACHE='asha-billing-v69-ios-motion-user-center';
const ASSETS=['./','./index.html?v=69','./style.css?v=69','./app.js?v=69','./upgrade.js?v=69','./manifest.json?v=69','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{}))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{
  const req=e.request, url=new URL(req.url);
  if(req.mode==='navigate'||/index\.html$|app\.js$|style\.css$|manifest\.json$/.test(url.pathname)){
    e.respondWith(fetch(req,{cache:'no-store'}).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});return res}).catch(()=>caches.match(req).then(r=>r||caches.match('./index.html?v=69'))));
    return;
  }
  e.respondWith(fetch(req).catch(()=>caches.match(req)));
});
