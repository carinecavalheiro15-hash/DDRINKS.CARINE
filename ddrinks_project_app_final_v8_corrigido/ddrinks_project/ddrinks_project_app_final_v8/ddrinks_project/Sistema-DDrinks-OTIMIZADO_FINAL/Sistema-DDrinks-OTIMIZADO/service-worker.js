const CACHE_NAME = 'ddrinks-cache-v1';
const urlsToCache = [
  'index.html',
  'agenda.html',
  'datas.html',
  'resultado.html',
  'login.html',
  'style.css',
  'script.js',
  'manifest.json',
  // Adicione aqui os ícones e outros assets
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
