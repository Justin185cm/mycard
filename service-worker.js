self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open('card-cache').then(function(cache) {
      return cache.addAll([
        './',
        './index.html',
        './style.css',
        './app.js',
        './manifest.json',
        'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.6.2/sql-wasm.js',
        'https://unpkg.com/html5-qrcode@2.3.7/html5-qrcode.min.js'
      ]);
    })
  );
});

self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
});
