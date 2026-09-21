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

// A new delivery offer for a driver, or an order status change for a
// customer — sent from the server via src/lib/push.ts. The payload is
// plain JSON: { title, body, url?, tag? }.
self.addEventListener("push", (event) => {
  let data = { title: "SwiftDrop", body: "" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    if (event.data) data.body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag,
      data: { url: data.url || "/" },
    })
  );
});

// Tapping the notification focuses an already-open SwiftDrop tab if one is
// on the right page, otherwise opens a new one at the notification's URL.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(targetUrl) && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
