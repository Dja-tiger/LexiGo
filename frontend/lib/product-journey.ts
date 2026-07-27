import type { NavigationTarget } from "./navigation";
import { markLearnLessonHandoff } from "./lesson-composition-handoff";
import { classifyBrowser, classifyDevice, isCollectionEnabled } from "./performance-rum";

export type ProductJourneyRoute =
  | "/"
  | "/learn"
  | "/dictionary"
  | "/phrases"
  | "/progress"
  | "/profile"
  | "/lesson"
  | "/word"
  | "/phrase";

export type ProductJourneyIntent =
  | "primary_navigation"
  | "home_next_action"
  | "home_configure_lesson"
  | "home_find_material"
  | "catalog_switch"
  | "catalog_open_detail"
  | "catalog_configure_lesson"
  | "lesson_start"
  | "lesson_exit"
  | "authentication"
  | "browser_history"
  | "in_app_navigation";

type ProductJourneyDisplayMode = "browser" | "standalone" | "fullscreen" | "minimal-ui" | "unknown";

type ProductJourneyEvent = {
  appVersion: string;
  fromRoute: ProductJourneyRoute;
  toRoute: ProductJourneyRoute;
  intent: ProductJourneyIntent;
  backtrack: boolean;
  deviceClass: "mobile" | "tablet" | "desktop";
  browserFamily: "chromium" | "webkit" | "firefox" | "other";
  displayMode: ProductJourneyDisplayMode;
};

const REPORT_ENDPOINT = "/api/v1/product/journey";
const HISTORY_KEY = "lexigo.product-journey.routes.v1";
const MAX_HISTORY_LENGTH = 3;
const ROUTES = new Set<ProductJourneyRoute>([
  "/",
  "/learn",
  "/dictionary",
  "/phrases",
  "/progress",
  "/profile",
  "/lesson",
  "/word",
  "/phrase",
]);

let queuedIntent: ProductJourneyIntent | null = null;

export function productJourneyRoute(target: NavigationTarget): ProductJourneyRoute {
  if (target.view === "lesson") return "/lesson";
  if (target.view === "library" && target.detail) return "/word";
  if (target.view === "phrases" && target.detail) return "/phrase";
  if (target.view === "learn") return "/learn";
  if (target.view === "library") return "/dictionary";
  if (target.view === "phrases") return "/phrases";
  if (target.view === "progress") return "/progress";
  if (target.view === "profile") return "/profile";
  return "/";
}

export function nextProductJourneyHistory(
  history: readonly ProductJourneyRoute[],
  fromRoute: ProductJourneyRoute,
  toRoute: ProductJourneyRoute,
): { history: ProductJourneyRoute[]; backtrack: boolean } {
  const normalized = history.filter((route): route is ProductJourneyRoute => ROUTES.has(route));
  const withOrigin = normalized.at(-1) === fromRoute ? [...normalized] : [...normalized, fromRoute];
  const backtrack = withOrigin.length >= 2
    && withOrigin.at(-1) === fromRoute
    && withOrigin.at(-2) === toRoute;
  return {
    history: [...withOrigin, toRoute].slice(-MAX_HISTORY_LENGTH),
    backtrack,
  };
}

export function queueProductJourneyIntent(intent: ProductJourneyIntent): void {
  if (intent === "lesson_start" && window.location.pathname === "/learn") {
    markLearnLessonHandoff();
  }
  queuedIntent = intent;
}

export function consumeProductJourneyIntent(): ProductJourneyIntent | null {
  const intent = queuedIntent;
  queuedIntent = null;
  return intent;
}

export function reportProductJourney(
  fromTarget: NavigationTarget,
  toTarget: NavigationTarget,
  intent: ProductJourneyIntent,
): void {
  const fromRoute = productJourneyRoute(fromTarget);
  const toRoute = productJourneyRoute(toTarget);
  if (fromRoute === toRoute || !isCollectionEnabled()) return;

  const transition = nextProductJourneyHistory(readHistory(), fromRoute, toRoute);
  writeHistory(transition.history);

  const event: ProductJourneyEvent = {
    appVersion: sanitizeBuildID(document.documentElement.dataset.lexigoBuild),
    fromRoute,
    toRoute,
    intent,
    backtrack: transition.backtrack,
    deviceClass: classifyDevice(window.innerWidth),
    browserFamily: classifyBrowser(navigator.userAgent),
    displayMode: currentDisplayMode(),
  };

  if (typeof fetch !== "function") return;
  void fetch(REPORT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
    credentials: "omit",
    cache: "no-store",
    keepalive: true,
    referrerPolicy: "no-referrer",
  }).catch(() => undefined);
}

function readHistory(): ProductJourneyRoute[] {
  try {
    const value = JSON.parse(window.sessionStorage.getItem(HISTORY_KEY) ?? "[]") as unknown;
    if (!Array.isArray(value)) return [];
    return value.filter((route): route is ProductJourneyRoute => typeof route === "string" && ROUTES.has(route as ProductJourneyRoute)).slice(-MAX_HISTORY_LENGTH);
  } catch {
    return [];
  }
}

function writeHistory(history: readonly ProductJourneyRoute[]): void {
  try {
    window.sessionStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(-MAX_HISTORY_LENGTH)));
  } catch {
    // Journey reporting remains best-effort when storage is unavailable.
  }
}

function currentDisplayMode(): ProductJourneyDisplayMode {
  if (window.matchMedia("(display-mode: standalone)").matches) return "standalone";
  if (window.matchMedia("(display-mode: fullscreen)").matches) return "fullscreen";
  if (window.matchMedia("(display-mode: minimal-ui)").matches) return "minimal-ui";
  return "browser";
}

function sanitizeBuildID(value: string | undefined): string {
  const normalized = value?.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  return normalized || "local";
}
