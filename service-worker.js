
const CACHE_NAME = "membership-app-v1";
const ASSETS = [
  "index.html",
  "add.html",
  "settings.html",
  "style.css",
  "index.js",
  "preset-cards.json",
  "https://unpkg.com/@picocss/pico@latest"
];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(resp =>
      resp || fetch(event.request).catch(() => caches.match("index.html"))
    )
  );
});
