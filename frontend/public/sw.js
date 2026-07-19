const CACHE_PREFIX = "lexigo-shell-";
const BUILD_ID = new URL(self.location.href).searchParams.get("build") || "local";
const CACHE = `${CACHE_PREFIX}${BUILD_ID.replace(/[^a-zA-Z0-9._-]+/g, "-")}`;
const APP_SHELL = ["/", "/manifest.webmanifest", "/icon.svg", "/icons/icon-192.png", "/icons/icon-512.png"];
const SKIP_WAITING_MESSAGE = "LEXIGO_SKIP_WAITING";
const ACTIVATED_MESSAGE = "LEXIGO_SW_ACTIVATED";
let activationRequested = false;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener("message", (event) => {
  if (!event.data || event.data.type !== SKIP_WAITING_MESSAGE) return;
  activationRequested = true;
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE)
        .map((key) => caches.delete(key)),
    );

    if (activationRequested) await self.clients.claim();

    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    clients.forEach((client) => client.postMessage({ type: ACTIVATED_MESSAGE, buildID: BUILD_ID }));
  })());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/health/")) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) return response;
          return caches.match("/", { cacheName: CACHE }).then((cached) => cached || response);
        })
        .catch(() => caches.match("/", { cacheName: CACHE }).then((cached) => cached || Response.error())),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request, { cacheName: CACHE }).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== "basic") return response;
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE).then((cache) => cache.put(event.request, copy)));
        return response;
      });
    }),
  );
});
