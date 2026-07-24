import { describe, expect, it } from "vitest";

import {
  readNavigationScrollSnapshot,
  removeNavigationScrollSnapshot,
  scheduleNavigationScrollRestoration,
  writeNavigationScrollSnapshot,
  type NavigationScrollRestorationEnvironment,
  type NavigationScrollRestorationResult,
  type NavigationScrollSnapshotStorage,
} from "./navigation-scroll-restoration";

function createFrameHarness() {
  let nextFrameID = 1;
  const frames = new Map<number, () => void>();
  const cancelled: number[] = [];

  return {
    frames,
    cancelled,
    requestFrame(callback: () => void) {
      const frameID = nextFrameID;
      nextFrameID += 1;
      frames.set(frameID, callback);
      return frameID;
    },
    cancelFrame(frameID: number) {
      cancelled.push(frameID);
      frames.delete(frameID);
    },
    runNext() {
      const entry = frames.entries().next().value as [number, () => void] | undefined;
      if (!entry) throw new Error("No animation frame is scheduled");
      frames.delete(entry[0]);
      entry[1]();
    },
  };
}

function createStorage(): NavigationScrollSnapshotStorage & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: (key) => { values.delete(key); },
  };
}

describe("navigation scroll restoration", () => {
  it("retries until asynchronous content makes the saved position reachable", () => {
    const frames = createFrameHarness();
    let maximumY = 0;
    let position = { x: 0, y: 0 };
    let result: NavigationScrollRestorationResult | null = null;
    const environment: NavigationScrollRestorationEnvironment = {
      readPosition: () => position,
      writePosition: (target) => {
        position = { x: target.x, y: Math.min(target.y, maximumY) };
      },
      requestFrame: frames.requestFrame,
      cancelFrame: frames.cancelFrame,
    };

    scheduleNavigationScrollRestoration(
      { x: 0, y: 1200 },
      environment,
      (settled) => { result = settled; },
    );

    frames.runNext();
    expect(position.y).toBe(0);
    expect(result).toBeNull();
    expect(frames.frames.size).toBe(1);

    maximumY = 2400;
    frames.runNext();
    expect(position.y).toBe(1200);
    expect(result).toEqual({ restored: true, attempts: 2 });
    expect(frames.frames.size).toBe(0);
  });

  it("settles a zero position on the first frame", () => {
    const frames = createFrameHarness();
    let position = { x: 7, y: 9 };
    let result: NavigationScrollRestorationResult | null = null;
    scheduleNavigationScrollRestoration(
      { x: 0, y: 0 },
      {
        readPosition: () => position,
        writePosition: (target) => { position = target; },
        requestFrame: frames.requestFrame,
        cancelFrame: frames.cancelFrame,
      },
      (settled) => { result = settled; },
    );

    frames.runNext();
    expect(position).toEqual({ x: 0, y: 0 });
    expect(result).toEqual({ restored: true, attempts: 1 });
  });

  it("cancels a pending restoration without reporting completion", () => {
    const frames = createFrameHarness();
    let settled = false;
    const cancel = scheduleNavigationScrollRestoration(
      { x: 0, y: 500 },
      {
        readPosition: () => ({ x: 0, y: 0 }),
        writePosition: () => undefined,
        requestFrame: frames.requestFrame,
        cancelFrame: frames.cancelFrame,
      },
      () => { settled = true; },
    );

    const [frameID] = frames.frames.keys();
    cancel();
    expect(frames.cancelled).toEqual([frameID]);
    expect(frames.frames.size).toBe(0);
    expect(settled).toBe(false);
  });

  it("stops after the configured frame budget", () => {
    const frames = createFrameHarness();
    let result: NavigationScrollRestorationResult | null = null;
    scheduleNavigationScrollRestoration(
      { x: 0, y: 500 },
      {
        readPosition: () => ({ x: 0, y: 0 }),
        writePosition: () => undefined,
        requestFrame: frames.requestFrame,
        cancelFrame: frames.cancelFrame,
      },
      (settled) => { result = settled; },
      { maxFrames: 2 },
    );

    frames.runNext();
    frames.runNext();
    expect(result).toEqual({ restored: false, attempts: 2 });
    expect(frames.frames.size).toBe(0);
  });

  it("persists, reads and removes a session-scoped fallback snapshot", () => {
    const storage = createStorage();
    expect(writeNavigationScrollSnapshot(storage, "library|backend|review", { x: 4, y: 1045 })).toBe(true);
    expect(readNavigationScrollSnapshot(storage, "library|backend|review")).toEqual({ x: 4, y: 1045 });
    expect(removeNavigationScrollSnapshot(storage, "library|backend|review")).toBe(true);
    expect(readNavigationScrollSnapshot(storage, "library|backend|review")).toBeNull();
  });

  it("ignores corrupt snapshots and unavailable storage", () => {
    const storage = createStorage();
    storage.values.set("lexigo:navigation-scroll:library", "not-json");
    expect(readNavigationScrollSnapshot(storage, "library")).toBeNull();

    const unavailable: NavigationScrollSnapshotStorage = {
      getItem: () => { throw new Error("unavailable"); },
      setItem: () => { throw new Error("unavailable"); },
      removeItem: () => { throw new Error("unavailable"); },
    };
    expect(readNavigationScrollSnapshot(unavailable, "library")).toBeNull();
    expect(writeNavigationScrollSnapshot(unavailable, "library", { x: 0, y: 100 })).toBe(false);
    expect(removeNavigationScrollSnapshot(unavailable, "library")).toBe(false);
  });

  it("rejects invalid restoration options, coordinates and identities", () => {
    const frames = createFrameHarness();
    const environment: NavigationScrollRestorationEnvironment = {
      readPosition: () => ({ x: 0, y: 0 }),
      writePosition: () => undefined,
      requestFrame: frames.requestFrame,
      cancelFrame: frames.cancelFrame,
    };
    const storage = createStorage();

    expect(() => scheduleNavigationScrollRestoration({ x: 0, y: 0 }, environment, undefined, { maxFrames: 0 })).toThrow(RangeError);
    expect(() => scheduleNavigationScrollRestoration({ x: 0, y: 0 }, environment, undefined, { tolerancePixels: -1 })).toThrow(RangeError);
    expect(() => scheduleNavigationScrollRestoration({ x: Number.NaN, y: 0 }, environment)).toThrow(RangeError);
    expect(() => writeNavigationScrollSnapshot(storage, "", { x: 0, y: 0 })).toThrow(RangeError);
    expect(() => writeNavigationScrollSnapshot(storage, "library", { x: Number.NaN, y: 0 })).toThrow(RangeError);
  });
});
