import { LEXIGO_RUNTIME_CACHE_PREFIX, normalizeBuildID } from "./service-worker-update";

export const RUNTIME_BUILD_STORAGE_KEY = "lexigo.runtime-build.v1";
export const RUNTIME_BUILD_RECOVERY_PARAM = "__lexigo_recover";

export type RuntimeBuildRecoveryAction = "initialize" | "stable" | "recover" | "finalize";

function optionalBuildID(value: string | null | undefined): string | null {
  return value?.trim() ? normalizeBuildID(value) : null;
}

export function resolveRuntimeBuildRecoveryAction(input: {
  currentBuild: string;
  storedBuild?: string | null;
  controllerBuild?: string | null;
  recoveredBuild?: string | null;
}): RuntimeBuildRecoveryAction {
  const currentBuild = normalizeBuildID(input.currentBuild);
  const recoveredBuild = optionalBuildID(input.recoveredBuild);
  if (recoveredBuild === currentBuild) return "finalize";

  const observedBuild = optionalBuildID(input.storedBuild) ?? optionalBuildID(input.controllerBuild);
  if (!observedBuild) return "initialize";
  return observedBuild === currentBuild ? "stable" : "recover";
}

export function runtimeBuildRecoveryScript(buildID: string): string {
  const currentBuild = JSON.stringify(normalizeBuildID(buildID));
  const storageKey = JSON.stringify(RUNTIME_BUILD_STORAGE_KEY);
  const recoveryParam = JSON.stringify(RUNTIME_BUILD_RECOVERY_PARAM);
  const cachePrefix = JSON.stringify(LEXIGO_RUNTIME_CACHE_PREFIX);

  return `(() => {
    const currentBuild = ${currentBuild};
    const storageKey = ${storageKey};
    const recoveryParam = ${recoveryParam};
    const cachePrefix = ${cachePrefix};
    const normalize = (value) => String(value || "").trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || null;
    const readStoredBuild = () => {
      try { return normalize(window.localStorage.getItem(storageKey)); } catch { return null; }
    };
    const writeStoredBuild = () => {
      try { window.localStorage.setItem(storageKey, currentBuild); } catch {}
    };
    const controllerBuild = (() => {
      try {
        const scriptURL = navigator.serviceWorker && navigator.serviceWorker.controller && navigator.serviceWorker.controller.scriptURL;
        return scriptURL ? normalize(new URL(scriptURL, window.location.href).searchParams.get("build")) : null;
      } catch { return null; }
    })();
    const url = new URL(window.location.href);
    const recoveredBuild = normalize(url.searchParams.get(recoveryParam));
    if (recoveredBuild === currentBuild) {
      writeStoredBuild();
      url.searchParams.delete(recoveryParam);
      const cleanURL = url.pathname + url.search + url.hash;
      try { window.history.replaceState(window.history.state, "", cleanURL); } catch {}
      document.documentElement.style.visibility = "";
      document.documentElement.removeAttribute("data-lexigo-build-recovery");
      return;
    }
    const observedBuild = readStoredBuild() || controllerBuild;
    if (!observedBuild) {
      writeStoredBuild();
      return;
    }
    if (observedBuild === currentBuild) return;

    document.documentElement.setAttribute("data-lexigo-build-recovery", "true");
    document.documentElement.style.visibility = "hidden";
    try { window.stop(); } catch {}

    let finished = false;
    const reload = () => {
      if (finished) return;
      finished = true;
      writeStoredBuild();
      url.searchParams.set(recoveryParam, currentBuild);
      window.location.replace(url.toString());
    };
    const cleanup = async () => {
      try {
        if ("serviceWorker" in navigator && typeof navigator.serviceWorker.getRegistrations === "function") {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.allSettled(registrations.map((registration) => registration.unregister()));
        }
      } catch {}
      try {
        if ("caches" in window) {
          const keys = await window.caches.keys();
          await Promise.allSettled(keys.filter((key) => key.startsWith(cachePrefix)).map((key) => window.caches.delete(key)));
        }
      } catch {}
    };
    const timeout = window.setTimeout(reload, 2500);
    void cleanup().finally(() => {
      window.clearTimeout(timeout);
      reload();
    });
  })();`;
}
