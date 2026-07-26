const CACHE='eolas-platform-alpha-060';
const FILES=[
  './',
  './index.html',
  './engine/styles.css?v=060',
  './games/palworld/data.js?v=060',
  './engine/app.js?v=060',
  './games/palworld/manifest.json',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES.map(f=>new Request(f,{cache:'reload'})))))});
self.addEventListener('activate',e=>{e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()]))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))))});
