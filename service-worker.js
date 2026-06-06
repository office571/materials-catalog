const CACHE_NAME = "catalog-app-v1";

const FILES_TO_CACHE = [
  "./",
  "./catalog.html",
  "./main.css",
  "./main.js",
  "./manifest.json",
  "./utilities/favicon.png",
  "./utilities/favicon.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
