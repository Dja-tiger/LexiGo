import type { NavigationScrollPosition } from "./navigation-history";

export type NavigationScrollRestorationResult = {
  restored: boolean;
  attempts: number;
};

export type NavigationScrollRestorationEnvironment = {
  readPosition: () => NavigationScrollPosition;
  writePosition: (position: NavigationScrollPosition) => void;
  requestFrame: (callback: () => void) => number;
  cancelFrame: (frameID: number) => void;
};

export type NavigationScrollRestorationOptions = {
  maxFrames?: number;
  tolerancePixels?: number;
};

export const DEFAULT_NAVIGATION_SCROLL_RESTORE_MAX_FRAMES = 300;
export const DEFAULT_NAVIGATION_SCROLL_RESTORE_TOLERANCE_PX = 1;

function finiteCoordinate(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new RangeError(`${label} must be finite`);
  return Math.max(0, value);
}

function positionReached(
  current: NavigationScrollPosition,
  target: NavigationScrollPosition,
  tolerancePixels: number,
): boolean {
  return Math.abs(current.x - target.x) <= tolerancePixels
    && Math.abs(current.y - target.y) <= tolerancePixels;
}

/**
 * Re-applies a history scroll position until asynchronous route content makes
 * the target reachable. A single animation frame is insufficient when a
 * catalog reload temporarily collapses the document height to one viewport.
 */
export function scheduleNavigationScrollRestoration(
  target: NavigationScrollPosition,
  environment: NavigationScrollRestorationEnvironment,
  onSettled: (result: NavigationScrollRestorationResult) => void = () => undefined,
  options: NavigationScrollRestorationOptions = {},
): () => void {
  const maxFrames = options.maxFrames ?? DEFAULT_NAVIGATION_SCROLL_RESTORE_MAX_FRAMES;
  const tolerancePixels = options.tolerancePixels ?? DEFAULT_NAVIGATION_SCROLL_RESTORE_TOLERANCE_PX;
  if (!Number.isInteger(maxFrames) || maxFrames < 1) {
    throw new RangeError("maxFrames must be a positive integer");
  }
  if (!Number.isFinite(tolerancePixels) || tolerancePixels < 0) {
    throw new RangeError("tolerancePixels must be a finite non-negative number");
  }

  const normalizedTarget = {
    x: finiteCoordinate(target.x, "target.x"),
    y: finiteCoordinate(target.y, "target.y"),
  };
  let frameID: number | null = null;
  let attempts = 0;
  let cancelled = false;

  const restore = () => {
    frameID = null;
    if (cancelled) return;

    environment.writePosition(normalizedTarget);
    attempts += 1;
    const restored = positionReached(
      environment.readPosition(),
      normalizedTarget,
      tolerancePixels,
    );
    if (restored || attempts >= maxFrames) {
      onSettled({ restored, attempts });
      return;
    }
    frameID = environment.requestFrame(restore);
  };

  frameID = environment.requestFrame(restore);
  return () => {
    cancelled = true;
    if (frameID === null) return;
    environment.cancelFrame(frameID);
    frameID = null;
  };
}
