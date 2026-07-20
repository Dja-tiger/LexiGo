export type ScrollSnapshotTimerAPI = {
  setTimeout: (callback: () => void, delayMilliseconds: number) => number;
  clearTimeout: (timerID: number) => void;
};

export type ScrollSnapshotScheduler = {
  schedule: () => void;
  flush: () => void;
  cancel: () => void;
};

export const DEFAULT_SCROLL_SNAPSHOT_DELAY_MS = 300;

/**
 * Coalesces a burst of scroll events into one trailing snapshot write.
 *
 * Writing browser history state on every animation frame is both unnecessary
 * and expensive on WebKit. A long kinetic scroll can otherwise produce dozens
 * of structured-clone/history writes per second and destabilize the renderer.
 */
export function createScrollSnapshotScheduler(
  commitSnapshot: () => void,
  timers: ScrollSnapshotTimerAPI,
  delayMilliseconds = DEFAULT_SCROLL_SNAPSHOT_DELAY_MS,
): ScrollSnapshotScheduler {
  if (!Number.isFinite(delayMilliseconds) || delayMilliseconds < 0) {
    throw new RangeError("delayMilliseconds must be a finite non-negative number");
  }

  let timerID: number | null = null;
  let pending = false;

  const clearTimer = () => {
    if (timerID === null) return;
    timers.clearTimeout(timerID);
    timerID = null;
  };

  const flush = () => {
    clearTimer();
    if (!pending) return;
    pending = false;
    commitSnapshot();
  };

  return {
    schedule() {
      pending = true;
      clearTimer();
      timerID = timers.setTimeout(flush, delayMilliseconds);
    },
    flush,
    cancel() {
      clearTimer();
      pending = false;
    },
  };
}
