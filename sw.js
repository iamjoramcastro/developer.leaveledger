const CACHE = 'uth-v1';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './TaskHub192.png',
  './TaskHub512.png'
];
const RUNTIME = [
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js',
  'https://cdn.jsdelivr.net/npm/firebase@9.23.0/app-compat/dist/firebase-app-compat.js',
  'https://cdn.jsdelivr.net/npm/firebase@9.23.0/auth-compat/dist/firebase-auth-compat.js',
  'https://cdn.jsdelivr.net/npm/firebase@9.23.0/database-compat/dist/firebase-database-compat.js'
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await c.addAll(SHELL);
    await Promise.allSettled(RUNTIME.map(u => fetch(u, {mode:'no-cors'}).then(r => c.put(u, r)).catch(()=>{})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin.includes('firebaseio.com') || url.origin.includes('googleapis.com') || url.origin.includes('firebaseapp.com')) return;

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    if (cached) {
      fetch(req).then(res => { if (res && res.ok) cache.put(req, res.clone()); }).catch(()=>{});
      return cached;
    }
    try {
      const res = await fetch(req);
      if (res && res.ok && (url.origin === location.origin || req.mode === 'no-cors' || res.type === 'opaque')) {
        cache.put(req, res.clone()).catch(()=>{});
      }
      return res;
    } catch (err) {
      const shellFallback = await cache.match('./index.html');
      if (req.mode === 'navigate' && shellFallback) return shellFallback;
      throw err;
    }
  })());
});
