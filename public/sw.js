// Minimal service worker — just enough to make SwiftDrop installable as a
// PWA on Android/desktop Chrome (which requires a registered service worker
// with a fetch handler). Deliberately does NOT cache pages or API responses:
// this is a live delivery platform — order status, live courier location,
// dispatch state — so serving anything stale would be actively misleading.
// Only the static, versioned icon files are worth caching offline.
const CACHE = "swiftdrop-static-v1";
const PRECACHE_URLS = [
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-192.png",
  "/icons/icon-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  // Cache-first only for our own precached static icons; everything else
  // (pages, API calls, third-party requests) goes straight to the network.
  if (url.origin === self.location.origin && PRECACHE_URLS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
});
