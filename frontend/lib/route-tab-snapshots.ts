import {
  createNavigationHistoryState,
  readNavigationHistoryState,
  type NavigationScrollPosition,
} from "./navigation-history";
import type { AppView, NavigationTarget } from "./navigation";

export type PrimaryRouteView = Extract<AppView, "home" | "learn" | "phrases" | "library" | "progress">;

export type RouteTabSnapshot = {
  target: NavigationTarget;
  scroll: NavigationScrollPosition;
};

type RouteSnapshotStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const SNAPSHOT_PREFIX = "lexigo.route-tab.v1.";
const PRIMARY_ROUTE_VIEWS = new Set<PrimaryRouteView>([
  "home",
  "learn",
  "phrases",
  "library",
  "progress",
]);
const memorySnapshots = new Map<PrimaryRouteView, RouteTabSnapshot>();

function routeView(target: NavigationTarget): PrimaryRouteView | null {
  return PRIMARY_ROUTE_VIEWS.has(target.view as PrimaryRouteView)
    ? target.view as PrimaryRouteView
    : null;
}

function safeStorage(): RouteSnapshotStorage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function storageKey(view: PrimaryRouteView): string {
  return `${SNAPSHOT_PREFIX}${view}`;
}

function decodeSnapshot(raw: string | null, expectedView: PrimaryRouteView): RouteTabSnapshot | null {
  if (!raw) return null;
  try {
    const state = readNavigationHistoryState(JSON.parse(raw) as unknown);
    if (!state || state.target.view !== expectedView) return null;
    return { target: state.target, scroll: state.scroll };
  } catch {
    return null;
  }
}

export function rememberRouteTab(
  target: NavigationTarget,
  scroll: NavigationScrollPosition,
  storage: RouteSnapshotStorage | null = safeStorage(),
): void {
  const view = routeView(target);
  if (!view) return;
  const state = createNavigationHistoryState(target, scroll);
  const snapshot = { target: state.target, scroll: state.scroll };
  memorySnapshots.set(view, snapshot);

  if (!storage) return;
  try {
    storage.setItem(storageKey(view), JSON.stringify(state));
  } catch {
    // Per-tab restoration is an enhancement; navigation remains functional.
  }
}

export function routeTabDestination(
  view: PrimaryRouteView,
  storage: RouteSnapshotStorage | null = safeStorage(),
): RouteTabSnapshot {
  const memory = memorySnapshots.get(view);
  if (memory) return memory;

  if (storage) {
    let raw: string | null = null;
    try {
      raw = storage.getItem(storageKey(view));
    } catch {
      raw = null;
    }
    const stored = decodeSnapshot(raw, view);
    if (stored) {
      memorySnapshots.set(view, stored);
      return stored;
    }
    if (raw !== null) {
      try {
        storage.removeItem(storageKey(view));
      } catch {
        // Ignore inaccessible storage cleanup.
      }
    }
  }

  return { target: { view }, scroll: { x: 0, y: 0 } };
}

export function clearRouteTabSnapshots(storage: RouteSnapshotStorage | null = safeStorage()): void {
  memorySnapshots.clear();
  if (!storage) return;
  for (const view of PRIMARY_ROUTE_VIEWS) {
    try {
      storage.removeItem(storageKey(view));
    } catch {
      return;
    }
  }
}
