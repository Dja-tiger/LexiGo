import { normalizeBuildID } from "./service-worker-update";

export const BUILD_MARKER_STORAGE_KEY = "lexigo.build-marker.v1";
export const BUILD_RECOVERY_STORAGE_KEY = "lexigo.build-recovery.v1";
export const BUILD_CACHE_BUSTER_QUERY = "__lexigo_build";
export const BUILD_RECOVERY_OFFLINE_PATH = "/offline.html";

/**
 * Produces a synchronous, server-rendered guard that executes before the
 * Next.js runtime. When a document from a new build is delivered to an
 * existing browser session, the guard stops further resource loading, clears
 * build-scoped PWA state and performs one cache-busted navigation to the same
 * route.
 *
 * The cache-buster itself is the loop guard: if an old document is returned
 * again for a URL that explicitly requests another build, the browser is sent
 * to the independent static recovery page instead of reloading indefinitely.
 */
export function createBuildVersionGuardScript(buildID: string): string {
  const currentBuild = normalizeBuildID(buildID);
  const literals = {
    currentBuild,
    markerKey: BUILD_MARKER_STORAGE_KEY,
    recoveryKey: BUILD_RECOVERY_STORAGE_KEY,
    cacheBusterQuery: BUILD_CACHE_BUSTER_QUERY,
    offlinePath: BUILD_RECOVERY_OFFLINE_PATH,
    runtimeCachePrefix: "lexigo-shell-",
  };

  return `(() => {
  "use strict";

  const CURRENT_BUILD = ${JSON.stringify(literals.currentBuild)};
  const MARKER_KEY = ${JSON.stringify(literals.markerKey)};
  const RECOVERY_KEY = ${JSON.stringify(literals.recoveryKey)};
  const CACHE_BUSTER_QUERY = ${JSON.stringify(literals.cacheBusterQuery)};
  const OFFLINE_PATH = ${JSON.stringify(literals.offlinePath)};
  const RUNTIME_CACHE_PREFIX = ${JSON.stringify(literals.runtimeCachePrefix)};

  const readStorage = (storage, key) => {
    try { return storage.getItem(key); } catch { return null; }
  };
  const writeStorage = (storage, key, value) => {
    try { storage.setItem(key, value); return true; } catch { return false; }
  };
  const removeStorage = (storage, key) => {
    try { storage.removeItem(key); } catch { /* restricted storage */ }
  };
  const normalizeBuild = (value) => {
    const normalized = String(value || "")
      .trim()
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
    return normalized || "local";
  };
  const currentURL = new URL(window.location.href);
  const requestedBuildRaw = currentURL.searchParams.get(CACHE_BUSTER_QUERY);
  const requestedBuild = requestedBuildRaw ? normalizeBuild(requestedBuildRaw) : null;

  let recovery = null;
  const rawRecovery = readStorage(window.sessionStorage, RECOVERY_KEY);
  if (rawRecovery) {
    try {
      const parsed = JSON.parse(rawRecovery);
      if (
        parsed &&
        parsed.version === 1 &&
        typeof parsed.targetBuild === "string" &&
        typeof parsed.originalHref === "string"
      ) {
        recovery = parsed;
      }
    } catch {
      removeStorage(window.sessionStorage, RECOVERY_KEY);
    }
  }

  const removeInternalQuery = () => {
    if (!currentURL.searchParams.has(CACHE_BUSTER_QUERY)) return;
    currentURL.searchParams.delete(CACHE_BUSTER_QUERY);
    window.history.replaceState(
      window.history.state,
      "",
      currentURL.pathname + currentURL.search + currentURL.hash,
    );
  };

  const completeCurrentBuild = () => {
    writeStorage(window.localStorage, MARKER_KEY, CURRENT_BUILD);
    removeStorage(window.sessionStorage, RECOVERY_KEY);
    removeInternalQuery();
  };

  const redirectToStaticRecovery = () => {
    window.stop();
    const fallbackURL = new URL(OFFLINE_PATH, window.location.origin);
    fallbackURL.searchParams.set("reason", "stale-build");

    let returnHref = recovery && recovery.originalHref
      ? recovery.originalHref
      : currentURL.href;
    try {
      const returnURL = new URL(returnHref, window.location.origin);
      returnURL.searchParams.delete(CACHE_BUSTER_QUERY);
      returnHref = returnURL.href;
    } catch {
      returnHref = window.location.origin + "/";
    }
    fallbackURL.searchParams.set("return", returnHref);
    window.location.replace(fallbackURL.href);
  };

  if (requestedBuild) {
    if (requestedBuild === CURRENT_BUILD) completeCurrentBuild();
    else redirectToStaticRecovery();
    return;
  }

  const markerBuildRaw = readStorage(window.localStorage, MARKER_KEY);
  const markerBuild = markerBuildRaw ? normalizeBuild(markerBuildRaw) : null;
  let controllerBuild = null;
  try {
    const controllerScriptURL = window.navigator.serviceWorker &&
      window.navigator.serviceWorker.controller &&
      window.navigator.serviceWorker.controller.scriptURL;
    if (controllerScriptURL) {
      const controllerBuildRaw = new URL(
        controllerScriptURL,
        window.location.origin,
      ).searchParams.get("build");
      // A controlling worker without an explicit build belongs to the legacy
      // registration contract and must also be replaced.
      controllerBuild = controllerBuildRaw
        ? normalizeBuild(controllerBuildRaw)
        : "legacy-service-worker";
    }
  } catch {
    controllerBuild = null;
  }

  const markerMismatch = markerBuild !== null && markerBuild !== CURRENT_BUILD;
  const controllerMismatch = controllerBuild !== null && controllerBuild !== CURRENT_BUILD;
  if (!markerMismatch && !controllerMismatch) {
    completeCurrentBuild();
    return;
  }

  const originalURL = new URL(window.location.href);
  originalURL.searchParams.delete(CACHE_BUSTER_QUERY);
  writeStorage(window.sessionStorage, RECOVERY_KEY, JSON.stringify({
    version: 1,
    targetBuild: CURRENT_BUILD,
    originalHref: originalURL.href,
    requestedAt: new Date().toISOString(),
  }));

  const reloadURL = new URL(originalURL.href);
  reloadURL.searchParams.set(CACHE_BUSTER_QUERY, CURRENT_BUILD);

  // Stop the parser before incompatible Next.js chunks can be requested.
  window.stop();

  const cleanupRuntime = async () => {
    const cleanupTasks = [];

    if (
      "serviceWorker" in window.navigator &&
      typeof window.navigator.serviceWorker.getRegistrations === "function"
    ) {
      cleanupTasks.push(
        window.navigator.serviceWorker.getRegistrations()
          .then((registrations) => Promise.allSettled(
            registrations.map((registration) => registration.unregister()),
          )),
      );
    }

    if ("caches" in window && window.caches) {
      cleanupTasks.push(
        window.caches.keys().then((cacheNames) => Promise.allSettled(
          cacheNames
            .filter((cacheName) => cacheName.startsWith(RUNTIME_CACHE_PREFIX))
            .map((cacheName) => window.caches.delete(cacheName)),
        )),
      );
    }

    if (cleanupTasks.length === 0) return;

    let timeoutID;
    const timeout = new Promise((resolve) => {
      timeoutID = window.setTimeout(resolve, 2500);
    });
    try {
      await Promise.race([Promise.allSettled(cleanupTasks), timeout]);
    } finally {
      if (timeoutID !== undefined) window.clearTimeout(timeoutID);
    }
  };

  Promise.resolve()
    .then(cleanupRuntime)
    .catch(() => undefined)
    .finally(() => window.location.replace(reloadURL.href));
})();`;
}
