const CACHE_PREFIX = "lexigo-shell-";
const BUILD_ID = new URL(self.location.href).searchParams.get("build") || "local";
const CACHE = `${CACHE_PREFIX}${BUILD_ID.replace(/[^a-zA-Z0-9._-]+/g, "-")}`;
const OFFLINE_DOCUMENT = "/offline.html";
const OFFLINE_ASSETS = [
  OFFLINE_DOCUMENT,
  "/manifest.webmanifest",
  "/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];
const SKIP_WAITING_MESSAGE = "LEXIGO_SKIP_WAITING";
const ACTIVATED_MESSAGE = "LEXIGO_SW_ACTIVATED";
let activationRequested = false;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(OFFLINE_ASSETS)));
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

async function staticOfflineDocument() {
  return caches.match(OFFLINE_DOCUMENT, { cacheName: CACHE, ignoreSearch: true });
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/health/")) return;

  if (event.request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(event.request);
        if (response.ok || response.status < 500) return response;
        return (await staticOfflineDocument()) || response;
      } catch {
        return (await staticOfflineDocument()) || Response.error();
      }
    })());
    return;
  }

  event.respondWith(
    caches.match(event.request, { cacheName: CACHE }).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then(async (response) => {
        if (!response || response.status !== 200 || response.type !== "basic") return response;
        const copy = response.clone();
        const cache = await caches.open(CACHE);
        await cache.put(event.request, copy);
        return response;
      });
    }),
  );
});
