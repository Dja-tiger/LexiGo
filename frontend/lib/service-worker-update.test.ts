import { describe, expect, it } from "vitest";

import {
  LEXIGO_RUNTIME_CACHE_PREFIX,
  SERVICE_WORKER_DEFERRED_KEY,
  SERVICE_WORKER_RECOVERY_KEY,
  clearDeferredServiceWorkerBuild,
  clearLexigoRuntimeState,
  consumeServiceWorkerRecovery,
  createServiceWorkerRecoverySnapshot,
  isLessonRoute,
  isVersionMismatchError,
  normalizeBuildID,
  parseServiceWorkerRecovery,
  readDeferredServiceWorkerBuild,
  serviceWorkerBuildFromURL,
  serviceWorkerScriptURL,
  writeDeferredServiceWorkerBuild,
  writeServiceWorkerRecovery,
} from "./service-worker-update";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe("service worker update helpers", () => {
  it("creates a stable versioned script URL", () => {
    expect(normalizeBuildID(" feature/issue 52 ")).toBe("feature-issue-52");
    expect(serviceWorkerScriptURL("sha:abc/123")).toBe("/sw.js?build=sha-abc-123");
    expect(serviceWorkerBuildFromURL("https://lexigo.example/sw.js?build=release-42")).toBe("release-42");
  });

  it("recognizes canonical and legacy active lesson routes", () => {
    expect(isLessonRoute("", "/lesson/active")).toBe(true);
    expect(isLessonRoute("?view=lesson&source=mixed", "/")).toBe(true);
    expect(isLessonRoute("?view=learn&source=mixed", "/learn")).toBe(false);
    expect(isLessonRoute("", "/progress")).toBe(false);
  });

  it.each([
    new Error("Loading chunk 491 failed"),
    Object.assign(new Error("network"), { name: "ChunkLoadError" }),
    "Failed to fetch dynamically imported module",
    { name: "TypeError", message: "Importing a module script failed" },
  ])("classifies recoverable version mismatch failures", (failure) => {
    expect(isVersionMismatchError(failure)).toBe(true);
  });

  it("does not classify unrelated render failures as version mismatches", () => {
    expect(isVersionMismatchError(new Error("Cannot read properties of undefined"))).toBe(false);
  });

  it("unregisters stale workers and removes only LexiGo runtime caches", async () => {
    const unregisterCalls: string[] = [];
    const registrations = [
      { unregister: async () => { unregisterCalls.push("first"); return true; } },
      { unregister: async () => { unregisterCalls.push("second"); return false; } },
      { unregister: async () => { unregisterCalls.push("third"); throw new Error("already gone"); } },
    ];
    const deleted: string[] = [];
    const cacheStorage = {
      keys: async () => [
        `${LEXIGO_RUNTIME_CACHE_PREFIX}old-build`,
        `${LEXIGO_RUNTIME_CACHE_PREFIX}current-build`,
        "unrelated-cache",
      ],
      delete: async (name: string) => {
        deleted.push(name);
        return name !== `${LEXIGO_RUNTIME_CACHE_PREFIX}current-build`;
      },
    };

    await expect(clearLexigoRuntimeState(registrations, cacheStorage)).resolves.toEqual({
      unregisteredWorkers: 1,
      deletedCaches: [`${LEXIGO_RUNTIME_CACHE_PREFIX}old-build`],
    });
    expect(unregisterCalls).toEqual(["first", "second", "third"]);
    expect(deleted).toEqual([
      `${LEXIGO_RUNTIME_CACHE_PREFIX}old-build`,
      `${LEXIGO_RUNTIME_CACHE_PREFIX}current-build`,
    ]);
  });

  it("continues recovery when CacheStorage is unavailable", async () => {
    const result = await clearLexigoRuntimeState([
      { unregister: async () => true },
    ]);
    expect(result).toEqual({ unregisteredWorkers: 1, deletedCaches: [] });
  });

  it("persists a lesson-safe recovery target and consumes it once", () => {
    const storage = new MemoryStorage();
    const snapshot = createServiceWorkerRecoverySnapshot({
      reason: "service-worker-update",
      buildID: "build-a",
      href: "https://lexigo.example/lesson/active?source=mixed",
      lessonActive: true,
      requestedAt: new Date("2026-07-19T00:00:00.000Z"),
    });

    expect(snapshot.resumeHref).toBe("/lesson/active");
    expect(writeServiceWorkerRecovery(storage, snapshot)).toBe(true);
    expect(storage.getItem(SERVICE_WORKER_RECOVERY_KEY)).not.toBeNull();
    expect(consumeServiceWorkerRecovery(storage)).toEqual(snapshot);
    expect(consumeServiceWorkerRecovery(storage)).toBeNull();
  });

  it("rejects malformed recovery data", () => {
    expect(parseServiceWorkerRecovery("{}" )).toBeNull();
    expect(parseServiceWorkerRecovery("not-json")).toBeNull();
  });

  it("persists and clears a deferred waiting build", () => {
    const storage = new MemoryStorage();
    expect(writeDeferredServiceWorkerBuild(storage, " build-b ")).toBe(true);
    expect(storage.getItem(SERVICE_WORKER_DEFERRED_KEY)).toBe("build-b");
    expect(readDeferredServiceWorkerBuild(storage)).toBe("build-b");
    clearDeferredServiceWorkerBuild(storage);
    expect(readDeferredServiceWorkerBuild(storage)).toBeNull();
  });
});
