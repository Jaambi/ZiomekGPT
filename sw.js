const CACHE = 'ziomek-ai-ultra-v1';
const ASSETS = [
  '/', '/index.html', '/style.css', '/app.js', '/prompts.js', '/manifest.json'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.pathname.startsWith('/api/')) {
    // Network first for API
    e.respondWith(fetch(e.request).catch(() => new Response(JSON.stringify({ offline: true }), { headers: { 'Content-Type':'application/json' } })));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match('/index.html')))
  );
});
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'PING') {
    e.source.postMessage({ type:'SW_STATUS', online: navigator.onLine });
  }
});
