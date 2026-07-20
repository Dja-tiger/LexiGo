import { runInNewContext } from "node:vm";

import { describe, expect, it, vi } from "vitest";

import {
  BUILD_CACHE_BUSTER_QUERY,
  BUILD_MARKER_STORAGE_KEY,
  BUILD_RECOVERY_STORAGE_KEY,
  createBuildVersionGuardScript,
} from "./build-version-guard";

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, String(value));
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

type GuardHarnessOptions = {
  currentBuild: string;
  href?: string;
  storedBuild?: string;
  recovery?: Record<string, unknown>;
  cacheNames?: string[];
};

function createGuardHarness(options: GuardHarnessOptions) {
  const localStorage = new MemoryStorage();
  const sessionStorage = new MemoryStorage();
  const cacheNames = new Set(options.cacheNames ?? []);
  let currentURL = new URL(options.href ?? "https://lexigo.example/dictionary?source=mixed#catalog");
  let stopped = 0;
  let unregistered = 0;
  const deletedCaches: string[] = [];
  const replacements: string[] = [];
  const historyReplacements: string[] = [];

  if (options.storedBuild) localStorage.setItem(BUILD_MARKER_STORAGE_KEY, options.storedBuild);
  if (options.recovery) {
    sessionStorage.setItem(BUILD_RECOVERY_STORAGE_KEY, JSON.stringify(options.recovery));
  }

  const location = {
    get href() {
      return currentURL.href;
    },
    get origin() {
      return currentURL.origin;
    },
    replace(nextHref: string) {
      currentURL = new URL(nextHref, currentURL);
      replacements.push(currentURL.href);
    },
  };

  const windowObject = {
    location,
    localStorage,
    sessionStorage,
    history: {
      state: null,
      replaceState(_state: unknown, _title: string, nextHref: string) {
        historyReplacements.push(nextHref);
        currentURL = new URL(nextHref, currentURL);
      },
    },
    navigator: {
      serviceWorker: {
        async getRegistrations() {
          return [{
            async unregister() {
              unregistered += 1;
              return true;
            },
          }];
        },
      },
    },
    caches: {
      async keys() {
        return Array.from(cacheNames);
      },
      async delete(cacheName: string) {
        deletedCaches.push(cacheName);
        return cacheNames.delete(cacheName);
      },
    },
    stop() {
      stopped += 1;
    },
    setTimeout,
    clearTimeout,
  };

  runInNewContext(createBuildVersionGuardScript(options.currentBuild), {
    window: windowObject,
    URL,
    Date,
    JSON,
    Promise,
    String,
  });

  return {
    localStorage,
    sessionStorage,
    cacheNames,
    deletedCaches,
    historyReplacements,
    replacements,
    stopped: () => stopped,
    unregistered: () => unregistered,
    href: () => currentURL.href,
  };
}

describe("pre-runtime build version guard", () => {
  it("initializes a fresh browser without reloading", () => {
    const harness = createGuardHarness({ currentBuild: "build-a" });

    expect(harness.localStorage.getItem(BUILD_MARKER_STORAGE_KEY)).toBe("build-a");
    expect(harness.replacements).toEqual([]);
    expect(harness.stopped()).toBe(0);
  });

  it("cleans build-scoped runtime state and performs one cache-busted navigation", async () => {
    const harness = createGuardHarness({
      currentBuild: "build-b",
      storedBuild: "build-a",
      cacheNames: ["lexigo-shell-build-a", "third-party-cache"],
    });

    await vi.waitFor(() => expect(harness.replacements).toHaveLength(1));

    const replacement = new URL(harness.replacements[0]);
    expect(replacement.pathname).toBe("/dictionary");
    expect(replacement.searchParams.get("source")).toBe("mixed");
    expect(replacement.searchParams.get(BUILD_CACHE_BUSTER_QUERY)).toBe("build-b");
    expect(replacement.hash).toBe("#catalog");
    expect(harness.stopped()).toBe(1);
    expect(harness.unregistered()).toBe(1);
    expect(harness.deletedCaches).toEqual(["lexigo-shell-build-a"]);
    expect(harness.cacheNames).toEqual(new Set(["third-party-cache"]));

    const recovery = JSON.parse(
      harness.sessionStorage.getItem(BUILD_RECOVERY_STORAGE_KEY) ?? "null",
    );
    expect(recovery).toMatchObject({
      version: 1,
      targetBuild: "build-b",
      originalHref: "https://lexigo.example/dictionary?source=mixed#catalog",
    });
  });

  it("completes a successful recovery and removes only the internal query parameter", () => {
    const harness = createGuardHarness({
      currentBuild: "build-b",
      storedBuild: "build-a",
      href: "https://lexigo.example/dictionary?source=mixed&__lexigo_build=build-b#catalog",
      recovery: {
        version: 1,
        targetBuild: "build-b",
        originalHref: "https://lexigo.example/dictionary?source=mixed#catalog",
      },
    });

    expect(harness.localStorage.getItem(BUILD_MARKER_STORAGE_KEY)).toBe("build-b");
    expect(harness.sessionStorage.getItem(BUILD_RECOVERY_STORAGE_KEY)).toBeNull();
    expect(harness.historyReplacements).toEqual(["/dictionary?source=mixed#catalog"]);
    expect(harness.href()).toBe("https://lexigo.example/dictionary?source=mixed#catalog");
    expect(harness.replacements).toEqual([]);
    expect(harness.stopped()).toBe(0);
  });

  it("uses the static recovery page instead of entering a reload loop", () => {
    const harness = createGuardHarness({
      currentBuild: "build-a",
      storedBuild: "build-a",
      href: "https://lexigo.example/dictionary?source=mixed&__lexigo_build=build-b#catalog",
      recovery: {
        version: 1,
        targetBuild: "build-b",
        originalHref: "https://lexigo.example/dictionary?source=mixed#catalog",
      },
    });

    expect(harness.replacements).toHaveLength(1);
    const replacement = new URL(harness.replacements[0]);
    expect(replacement.pathname).toBe("/offline.html");
    expect(replacement.searchParams.get("reason")).toBe("stale-build");
    expect(replacement.searchParams.get("return")).toBe(
      "https://lexigo.example/dictionary?source=mixed#catalog",
    );
    expect(harness.stopped()).toBe(1);
    expect(harness.unregistered()).toBe(0);
  });
});
