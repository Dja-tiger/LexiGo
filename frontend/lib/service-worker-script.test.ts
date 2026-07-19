import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";

import { describe, expect, it } from "vitest";

import { SERVICE_WORKER_ACTIVATED, SERVICE_WORKER_SKIP_WAITING } from "./service-worker-update";

type WorkerListener = (event: Record<string, unknown>) => void;

type WorkerHarness = {
  cacheNames: Set<string>;
  claimed: () => number;
  messages: Array<unknown>;
  skipped: () => number;
  dispatch: (type: string, data?: Record<string, unknown>) => Promise<void>;
};

const workerSource = readFileSync(resolve(process.cwd(), "public/sw.js"), "utf8");

function createWorkerHarness(buildID: string, cacheNames = new Set<string>()): WorkerHarness {
  const listeners = new Map<string, WorkerListener>();
  const messages: Array<unknown> = [];
  let claimCount = 0;
  let skipCount = 0;

  const caches = {
    async open(name: string) {
      cacheNames.add(name);
      return {
        async addAll() {
          return undefined;
        },
        async put() {
          return undefined;
        },
      };
    },
    async keys() {
      return Array.from(cacheNames);
    },
    async delete(name: string) {
      return cacheNames.delete(name);
    },
    async match() {
      return undefined;
    },
  };

  const self = {
    location: {
      href: `https://lexigo.example/sw.js?build=${encodeURIComponent(buildID)}`,
      origin: "https://lexigo.example",
    },
    clients: {
      async claim() {
        claimCount += 1;
      },
      async matchAll() {
        return [{ postMessage: (message: unknown) => messages.push(message) }];
      },
    },
    async skipWaiting() {
      skipCount += 1;
    },
    addEventListener(type: string, listener: WorkerListener) {
      listeners.set(type, listener);
    },
  };

  runInNewContext(workerSource, {
    URL,
    Promise,
    Response: { error: () => ({ status: 0 }) },
    caches,
    fetch: async () => ({ ok: true }),
    self,
  });

  return {
    cacheNames,
    claimed: () => claimCount,
    messages,
    skipped: () => skipCount,
    async dispatch(type, data = {}) {
      const listener = listeners.get(type);
      if (!listener) throw new Error(`Missing ${type} listener`);
      const pending: Array<Promise<unknown>> = [];
      listener({
        ...data,
        waitUntil(value: Promise<unknown>) {
          pending.push(Promise.resolve(value));
        },
      });
      await Promise.all(pending);
    },
  };
}

describe("public service worker", () => {
  it("installs without taking over the active application", async () => {
    const worker = createWorkerHarness("build-a");

    await worker.dispatch("install");

    expect(worker.cacheNames).toContain("lexigo-shell-build-a");
    expect(worker.skipped()).toBe(0);
    expect(worker.claimed()).toBe(0);
  });

  it("activates only after an explicit client message", async () => {
    const caches = new Set(["lexigo-shell-build-a", "third-party-cache"]);
    const worker = createWorkerHarness("build-b", caches);
    await worker.dispatch("install");

    await worker.dispatch("message", { data: { type: SERVICE_WORKER_SKIP_WAITING } });
    await worker.dispatch("activate");

    expect(worker.skipped()).toBe(1);
    expect(worker.claimed()).toBe(1);
    expect(caches).not.toContain("lexigo-shell-build-a");
    expect(caches).toContain("lexigo-shell-build-b");
    expect(caches).toContain("third-party-cache");
    expect(worker.messages).toContainEqual({ type: SERVICE_WORKER_ACTIVATED, buildID: "build-b" });
  });

  it("keeps incompatible builds isolated until the waiting build is approved", async () => {
    const caches = new Set<string>();
    const buildA = createWorkerHarness("incompatible-a", caches);
    await buildA.dispatch("install");

    const buildB = createWorkerHarness("incompatible-b", caches);
    await buildB.dispatch("install");

    expect(caches).toEqual(new Set(["lexigo-shell-incompatible-a", "lexigo-shell-incompatible-b"]));
    expect(buildB.skipped()).toBe(0);

    await buildB.dispatch("message", { data: { type: SERVICE_WORKER_SKIP_WAITING } });
    await buildB.dispatch("activate");

    expect(caches).toEqual(new Set(["lexigo-shell-incompatible-b"]));
  });
});
