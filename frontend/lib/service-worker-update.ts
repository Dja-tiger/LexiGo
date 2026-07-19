export const SERVICE_WORKER_SKIP_WAITING = "LEXIGO_SKIP_WAITING";
export const SERVICE_WORKER_ACTIVATED = "LEXIGO_SW_ACTIVATED";
export const SERVICE_WORKER_RECOVERY_KEY = "lexigo.service-worker.recovery.v1";
export const SERVICE_WORKER_DEFERRED_KEY = "lexigo.service-worker.deferred.v1";

export type ServiceWorkerRecoveryReason = "service-worker-update" | "version-mismatch";

export type ServiceWorkerRecoverySnapshot = {
  version: 1;
  reason: ServiceWorkerRecoveryReason;
  requestedAt: string;
  fromBuild: string;
  href: string;
  resumeHref: string;
  lessonActive: boolean;
};

type ReadableStorage = Pick<Storage, "getItem" | "removeItem">;
type WritableStorage = Pick<Storage, "setItem">;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function normalizeBuildID(value: string | null | undefined): string {
  const normalized = value?.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") ?? "";
  return normalized.slice(0, 80) || "local";
}

export function serviceWorkerScriptURL(buildID: string): string {
  return `/sw.js?build=${encodeURIComponent(normalizeBuildID(buildID))}`;
}

export function serviceWorkerBuildFromURL(scriptURL: string | null | undefined): string | null {
  if (!scriptURL) return null;
  try {
    return normalizeBuildID(new URL(scriptURL, "https://lexigo.invalid").searchParams.get("build"));
  } catch {
    return null;
  }
}

export function isLessonRoute(search: string, pathname?: string): boolean {
  const resolvedPathname = pathname ?? (typeof window === "undefined" ? "" : window.location.pathname);
  return /^\/lesson\/[^/]+\/?$/.test(resolvedPathname)
    || new URLSearchParams(search).get("view") === "lesson";
}

export function isVersionMismatchError(value: unknown): boolean {
  const candidate = value instanceof Error
    ? `${value.name}: ${value.message}`
    : typeof value === "string"
      ? value
      : isRecord(value)
        ? `${String(value.name ?? "")}: ${String(value.message ?? "")}`
        : "";
  return /ChunkLoadError|Loading chunk [^ ]+ failed|Failed to fetch dynamically imported module|Importing a module script failed|CSS_CHUNK_LOAD_FAILED|Unable to preload CSS/i.test(candidate);
}

export function createServiceWorkerRecoverySnapshot(input: {
  reason: ServiceWorkerRecoveryReason;
  buildID: string;
  href: string;
  lessonActive: boolean;
  requestedAt?: Date;
}): ServiceWorkerRecoverySnapshot {
  return {
    version: 1,
    reason: input.reason,
    requestedAt: (input.requestedAt ?? new Date()).toISOString(),
    fromBuild: normalizeBuildID(input.buildID),
    href: input.href,
    resumeHref: input.lessonActive ? "/lesson/active" : input.href,
    lessonActive: input.lessonActive,
  };
}

export function writeServiceWorkerRecovery(
  storage: WritableStorage,
  snapshot: ServiceWorkerRecoverySnapshot,
): boolean {
  try {
    storage.setItem(SERVICE_WORKER_RECOVERY_KEY, JSON.stringify(snapshot));
    return true;
  } catch {
    return false;
  }
}

export function parseServiceWorkerRecovery(raw: string | null): ServiceWorkerRecoverySnapshot | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as unknown;
    if (!isRecord(value) || value.version !== 1) return null;
    if (value.reason !== "service-worker-update" && value.reason !== "version-mismatch") return null;
    if (typeof value.requestedAt !== "string" || Number.isNaN(Date.parse(value.requestedAt))) return null;
    if (typeof value.fromBuild !== "string" || typeof value.href !== "string" || typeof value.resumeHref !== "string") {
      return null;
    }
    if (typeof value.lessonActive !== "boolean") return null;
    return {
      version: 1,
      reason: value.reason,
      requestedAt: value.requestedAt,
      fromBuild: normalizeBuildID(value.fromBuild),
      href: value.href,
      resumeHref: value.resumeHref,
      lessonActive: value.lessonActive,
    };
  } catch {
    return null;
  }
}

export function consumeServiceWorkerRecovery(storage: ReadableStorage): ServiceWorkerRecoverySnapshot | null {
  try {
    const snapshot = parseServiceWorkerRecovery(storage.getItem(SERVICE_WORKER_RECOVERY_KEY));
    storage.removeItem(SERVICE_WORKER_RECOVERY_KEY);
    return snapshot;
  } catch {
    return null;
  }
}

export function writeDeferredServiceWorkerBuild(storage: WritableStorage, buildID: string): boolean {
  try {
    storage.setItem(SERVICE_WORKER_DEFERRED_KEY, normalizeBuildID(buildID));
    return true;
  } catch {
    return false;
  }
}

export function readDeferredServiceWorkerBuild(storage: ReadableStorage): string | null {
  try {
    const value = storage.getItem(SERVICE_WORKER_DEFERRED_KEY);
    return value ? normalizeBuildID(value) : null;
  } catch {
    return null;
  }
}

export function clearDeferredServiceWorkerBuild(storage: Pick<Storage, "removeItem">): void {
  try {
    storage.removeItem(SERVICE_WORKER_DEFERRED_KEY);
  } catch {
    // The update can still be applied when storage is restricted.
  }
}
