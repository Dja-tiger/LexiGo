import { describe, expect, it } from "vitest";

import {
  SERVICE_WORKER_DEFERRED_KEY,
  SERVICE_WORKER_RECOVERY_KEY,
  clearDeferredServiceWorkerBuild,
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

  it("recognizes the canonical active lesson route", () => {
    expect(isLessonRoute("?view=lesson&source=mixed")).toBe(true);
    expect(isLessonRoute("?view=learn&source=mixed")).toBe(false);
    expect(isLessonRoute("")).toBe(false);
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

  it("persists a lesson-safe recovery target and consumes it once", () => {
    const storage = new MemoryStorage();
    const snapshot = createServiceWorkerRecoverySnapshot({
      reason: "service-worker-update",
      buildID: "build-a",
      href: "https://lexigo.example/?view=lesson&source=mixed",
      lessonActive: true,
      requestedAt: new Date("2026-07-19T00:00:00.000Z"),
    });

    expect(snapshot.resumeHref).toBe("/");
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
