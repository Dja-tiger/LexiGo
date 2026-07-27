import {
  navigationURL,
  parseNavigation,
  type NavigationTarget,
} from "./navigation";

export const NAVIGATION_HISTORY_VERSION = 1 as const;

export type NavigationScrollPosition = {
  x: number;
  y: number;
};

export type RouteGraphHistoryOwner = "dictionary" | "home" | "product";

export type NavigationHistoryState = {
  lexigo: true;
  version: typeof NAVIGATION_HISTORY_VERSION;
  target: NavigationTarget;
  scroll: NavigationScrollPosition;
  lexigoRouteGraph?: RouteGraphHistoryOwner;
};

type MatchMediaSource = {
  matchMedia: (query: string) => Pick<MediaQueryList, "matches">;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function routeGraphOwner(value: unknown): RouteGraphHistoryOwner | undefined {
  if (!isRecord(value)) return undefined;
  const candidate = value.lexigoRouteGraph;
  return candidate === "dictionary" || candidate === "home" || candidate === "product"
    ? candidate
    : undefined;
}

function currentRouteGraphOwner(): RouteGraphHistoryOwner | undefined {
  if (typeof window === "undefined") return undefined;
  return routeGraphOwner(window.history.state);
}

function safeCoordinate(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

function normalizeUnknownTarget(value: unknown): NavigationTarget | null {
  if (!isRecord(value) || typeof value.view !== "string") return null;

  const params = new URLSearchParams();
  params.set("view", value.view);
  for (const key of ["source", "topic", "status", "query", "sort", "detail"] as const) {
    if (typeof value[key] === "string") params.set(key, value[key]);
  }
  if (typeof value.page === "number") params.set("page", String(value.page));

  const normalized = parseNavigation(`?${params.toString()}`);
  if (normalized.view !== value.view) return null;
  for (const key of ["source", "topic", "status", "query", "sort", "detail", "page"] as const) {
    if (value[key] !== undefined && normalized[key] !== value[key]) return null;
  }

  return normalized;
}

function baseNavigationHistoryState(
  target: NavigationTarget,
  scroll: NavigationScrollPosition,
): NavigationHistoryState {
  return {
    lexigo: true,
    version: NAVIGATION_HISTORY_VERSION,
    target,
    scroll: {
      x: safeCoordinate(scroll.x),
      y: safeCoordinate(scroll.y),
    },
  };
}

export function createNavigationHistoryState(
  target: NavigationTarget,
  scroll: NavigationScrollPosition,
): NavigationHistoryState {
  const routeGraph = currentRouteGraphOwner();
  return {
    ...baseNavigationHistoryState(target, scroll),
    ...(routeGraph ? { lexigoRouteGraph: routeGraph } : {}),
  };
}

export function readNavigationHistoryState(value: unknown): NavigationHistoryState | null {
  if (!isRecord(value)
    || value.lexigo !== true
    || value.version !== NAVIGATION_HISTORY_VERSION
    || !isRecord(value.scroll)) {
    return null;
  }

  const target = normalizeUnknownTarget(value.target);
  if (!target) return null;
  const routeGraph = routeGraphOwner(value);
  return {
    ...baseNavigationHistoryState(target, {
      x: value.scroll.x as number,
      y: value.scroll.y as number,
    }),
    ...(routeGraph ? { lexigoRouteGraph: routeGraph } : {}),
  };
}

export function navigationTargetFromHistory(value: unknown, search: string): NavigationTarget {
  const current = readNavigationHistoryState(value);
  if (current) return current.target;

  // Compatibility with pre-v1 entries created before Issue #46.
  if (isRecord(value) && value.lexigo === true) {
    const legacy = normalizeUnknownTarget(value);
    if (legacy) return legacy;
  }

  return parseNavigation(search);
}

export function navigationScrollFromHistory(value: unknown): NavigationScrollPosition {
  return readNavigationHistoryState(value)?.scroll ?? { x: 0, y: 0 };
}

export function navigationIdentity(target: NavigationTarget): string {
  return navigationURL(target);
}

/**
 * Route changes and history restoration recover application state; they are not
 * decorative motion. Keep writes immediate so touch, wheel and keyboard input
 * can take control without waiting for a browser-managed smooth animation.
 */
export function navigationScrollBehavior(source: MatchMediaSource): ScrollBehavior {
  void source;
  return "auto";
}
