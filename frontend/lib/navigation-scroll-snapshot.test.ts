import { describe, expect, it } from "vitest";

import { createScrollSnapshotScheduler, type ScrollSnapshotTimerAPI } from "./navigation-scroll-snapshot";

type ScheduledCallback = {
  id: number;
  callback: () => void;
  delayMilliseconds: number;
};

function createTimerHarness() {
  let nextID = 1;
  const scheduled = new Map<number, ScheduledCallback>();
  const cleared: number[] = [];

  const timers: ScrollSnapshotTimerAPI = {
    setTimeout(callback, delayMilliseconds) {
      const id = nextID;
      nextID += 1;
      scheduled.set(id, { id, callback, delayMilliseconds });
      return id;
    },
    clearTimeout(timerID) {
      cleared.push(timerID);
      scheduled.delete(timerID);
    },
  };

  return {
    timers,
    scheduled,
    cleared,
    run(timerID: number) {
      const entry = scheduled.get(timerID);
      if (!entry) throw new Error(`timer ${timerID} is not scheduled`);
      scheduled.delete(timerID);
      entry.callback();
    },
  };
}

describe("scroll snapshot scheduler", () => {
  it("coalesces a long scroll burst into one trailing history write", () => {
    const harness = createTimerHarness();
    let commits = 0;
    const scheduler = createScrollSnapshotScheduler(() => {
      commits += 1;
    }, harness.timers, 300);

    for (let index = 0; index < 120; index += 1) scheduler.schedule();

    expect(commits).toBe(0);
    expect(harness.scheduled.size).toBe(1);
    expect(harness.cleared).toHaveLength(119);

    const [pendingTimer] = harness.scheduled.keys();
    expect(harness.scheduled.get(pendingTimer)?.delayMilliseconds).toBe(300);
    harness.run(pendingTimer);

    expect(commits).toBe(1);
    expect(harness.scheduled.size).toBe(0);
  });

  it("flushes the final position once when the page becomes hidden", () => {
    const harness = createTimerHarness();
    let commits = 0;
    const scheduler = createScrollSnapshotScheduler(() => {
      commits += 1;
    }, harness.timers);

    scheduler.schedule();
    scheduler.schedule();
    scheduler.flush();
    scheduler.flush();

    expect(commits).toBe(1);
    expect(harness.scheduled.size).toBe(0);
  });

  it("cancels a pending snapshot without committing during teardown", () => {
    const harness = createTimerHarness();
    let commits = 0;
    const scheduler = createScrollSnapshotScheduler(() => {
      commits += 1;
    }, harness.timers);

    scheduler.schedule();
    scheduler.cancel();
    scheduler.flush();

    expect(commits).toBe(0);
    expect(harness.scheduled.size).toBe(0);
  });

  it("rejects invalid delays", () => {
    const harness = createTimerHarness();
    expect(() => createScrollSnapshotScheduler(() => undefined, harness.timers, Number.NaN)).toThrow(RangeError);
    expect(() => createScrollSnapshotScheduler(() => undefined, harness.timers, -1)).toThrow(RangeError);
  });
});
