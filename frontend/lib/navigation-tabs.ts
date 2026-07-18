import type { AppView, NavigationTarget } from "./navigation";
import type { NavigationScrollPosition } from "./navigation-history";

export type PrimaryNavigationView = Exclude<AppView, "profile" | "lesson">;

export type NavigationTabSnapshot = {
  target: NavigationTarget;
  scroll: NavigationScrollPosition;
};

export type NavigationTabSnapshots = Partial<Record<PrimaryNavigationView, NavigationTabSnapshot>>;

const PRIMARY_VIEWS = new Set<PrimaryNavigationView>([
  "home",
  "learn",
  "phrases",
  "library",
  "progress",
]);

function safeCoordinate(value: number): number {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function copyScroll(scroll: NavigationScrollPosition): NavigationScrollPosition {
  return {
    x: safeCoordinate(scroll.x),
    y: safeCoordinate(scroll.y),
  };
}

function copyTarget(target: NavigationTarget): NavigationTarget {
  return {
    view: target.view,
    ...(target.source ? { source: target.source } : {}),
    ...(target.detail ? { detail: target.detail } : {}),
  };
}

export function isPrimaryNavigationView(view: AppView): view is PrimaryNavigationView {
  return PRIMARY_VIEWS.has(view as PrimaryNavigationView);
}

export function rememberNavigationTabSnapshot(
  snapshots: NavigationTabSnapshots,
  target: NavigationTarget,
  scroll: NavigationScrollPosition,
): NavigationTabSnapshots {
  if (!isPrimaryNavigationView(target.view)) return snapshots;

  return {
    ...snapshots,
    [target.view]: {
      target: copyTarget(target),
      scroll: copyScroll(scroll),
    },
  };
}

export function navigationTabDestination(
  snapshots: NavigationTabSnapshots,
  view: PrimaryNavigationView,
): NavigationTabSnapshot {
  const saved = snapshots[view];
  if (!saved) {
    return {
      target: { view },
      scroll: { x: 0, y: 0 },
    };
  }

  return {
    target: copyTarget(saved.target),
    scroll: copyScroll(saved.scroll),
  };
}
