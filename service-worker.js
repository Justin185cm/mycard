const CACHE_NAME = 'membership-card-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/add.html',
  '/settings.html',
  '/index.js',
  '/style.css',
  '/preset-cards.json',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://cdn.jsdelivr.net/npm/@picocss/pico@1/css/pico.min.css',
  'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js',
  'https://cdn.jsdelivr.net/npm/qrcodejs/qrcode.min.js',
  'https://cdn.jsdelivr.net/npm/@zxing/library@latest'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
