export type RumMetricName =
  | "CLS"
  | "LCP"
  | "INP"
  | "FCP"
  | "TTFB"
  | "NEXT_HYDRATION"
  | "NEXT_ROUTE_CHANGE"
  | "NEXT_RENDER"
  | "LONG_TASK_COUNT"
  | "LONG_TASK_TOTAL"
  | "LONG_TASK_MAX"
  | "OBSERVER_CALLBACK_TOTAL"
  | "OBSERVER_CALLBACK_MAX"
  | "ACTION_START_LESSON"
  | "ACTION_REVIEW_ANSWER";

export type RumRating = "good" | "needs-improvement" | "poor" | "unknown";
export type RumNavigationType =
  | "navigate"
  | "reload"
  | "back-forward"
  | "back-forward-cache"
  | "prerender"
  | "restore"
  | "unknown";

export type WebVitalMetricLike = {
  name: string;
  value: number;
  rating?: string;
  navigationType?: string;
};

type RumSample = {
  name: RumMetricName;
  value: number;
  rating: RumRating;
  navigationType: RumNavigationType;
};

type RumContext = {
  appVersion: string;
  route: string;
  deviceClass: "mobile" | "tablet" | "desktop";
  browserFamily: "chromium" | "webkit" | "firefox" | "other";
  displayMode: "browser" | "standalone" | "fullscreen" | "minimal-ui" | "unknown";
};

type RumReport = RumContext & {
  samples: RumSample[];
};

type PrivacyAwareNavigator = Navigator & {
  globalPrivacyControl?: boolean;
  msDoNotTrack?: string | null;
};

type PrivacyAwareWindow = Window & {
  doNotTrack?: string | null;
};

const REPORT_ENDPOINT = "/api/v1/performance/rum";
const SESSION_SAMPLE_KEY = "lexigo:rum-sampled:v1";
const MAX_BATCH_SIZE = 16;
const FLUSH_DELAY_MS = 5_000;

const KNOWN_ROUTES = new Set([
  "/",
  "/learn",
  "/dictionary",
  "/phrases",
  "/progress",
  "/profile",
  "/privacy",
  "/terms",
  "/legal",
]);

const METRIC_NAMES: Record<string, RumMetricName> = {
  CLS: "CLS",
  LCP: "LCP",
  INP: "INP",
  FCP: "FCP",
  TTFB: "TTFB",
  "Next.js-hydration": "NEXT_HYDRATION",
  "Next.js-route-change-to-render": "NEXT_ROUTE_CHANGE",
  "Next.js-render": "NEXT_RENDER",
};

let activeReport: RumReport | null = null;
let flushTimer: number | null = null;
let samplingDecision: boolean | null = null;

export function normalizePerformanceRoute(pathname: string): string {
  const normalized = pathname.split(/[?#]/, 1)[0]?.replace(/\/+$/, "") || "/";
  if (KNOWN_ROUTES.has(normalized)) return normalized;
  if (normalized === "/lesson" || normalized.startsWith("/lesson/")) return "/lesson";
  if (normalized === "/word" || normalized.startsWith("/word/")) return "/word";
  if (normalized === "/phrase" || normalized.startsWith("/phrase/")) return "/phrase";
  return "/not-found";
}

export function classifyDevice(viewportWidth: number): RumContext["deviceClass"] {
  if (viewportWidth < 600) return "mobile";
  if (viewportWidth < 1_100) return "tablet";
  return "desktop";
}

export function classifyBrowser(userAgent: string): RumContext["browserFamily"] {
  const normalized = userAgent.toLowerCase();
  if (normalized.includes("firefox") || normalized.includes("fxios")) return "firefox";
  const iosWebKit = normalized.includes("iphone") || normalized.includes("ipad") || normalized.includes("ipod");
  if (normalized.includes("applewebkit") && (iosWebKit || (!normalized.includes("chrome") && !normalized.includes("chromium") && !normalized.includes("edg/")))) {
    return "webkit";
  }
  if (normalized.includes("chrome") || normalized.includes("chromium") || normalized.includes("edg/") || normalized.includes("crios")) {
    return "chromium";
  }
  return "other";
}

export function normalizeNavigationType(value: string | undefined): RumNavigationType {
  const normalized = value?.replaceAll("_", "-");
  switch (normalized) {
    case "navigate":
    case "reload":
    case "back-forward":
    case "back-forward-cache":
    case "prerender":
    case "restore":
      return normalized;
    default:
      return "unknown";
  }
}

export function mapWebVitalMetric(metric: WebVitalMetricLike): RumSample | null {
  const name = METRIC_NAMES[metric.name];
  if (!name || !Number.isFinite(metric.value) || metric.value < 0) return null;
  return {
    name,
    value: metric.value,
    rating: normalizeRating(metric.rating, name, metric.value),
    navigationType: normalizeNavigationType(metric.navigationType),
  };
}

export function reportWebVitalMetric(metric: WebVitalMetricLike, route?: string): void {
  const sample = mapWebVitalMetric(metric);
  if (sample) enqueueSample(sample, createContext(route));
}

export function flushPerformanceQueue(): void {
  if (flushTimer !== null && typeof window !== "undefined") {
    window.clearTimeout(flushTimer);
  }
  flushTimer = null;
  const report = activeReport;
  activeReport = null;
  if (!report || report.samples.length === 0 || typeof navigator === "undefined") return;

  const body = JSON.stringify(report);
  if (typeof fetch === "function") {
    void fetch(REPORT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      credentials: "omit",
      cache: "no-store",
      keepalive: true,
      referrerPolicy: "no-referrer",
    }).catch(() => undefined);
  }
}

export function startLongTaskMonitoring(route: string): () => void {
  if (!isCollectionEnabled() || typeof PerformanceObserver === "undefined") return () => undefined;
  if (!PerformanceObserver.supportedEntryTypes.includes("longtask")) return () => undefined;

  const capturedRoute = normalizePerformanceRoute(route);
  let taskCount = 0;
  let taskTotal = 0;
  let taskMax = 0;
  let callbackTotal = 0;
  let callbackMax = 0;

  const observer = new PerformanceObserver((list) => {
    const callbackStarted = performance.now();
    for (const entry of list.getEntries()) {
      taskCount += 1;
      taskTotal += entry.duration;
      taskMax = Math.max(taskMax, entry.duration);
    }
    const callbackDuration = performance.now() - callbackStarted;
    callbackTotal += callbackDuration;
    callbackMax = Math.max(callbackMax, callbackDuration);
  });
  observer.observe({ type: "longtask" });

  return () => {
    observer.disconnect();
    if (taskCount === 0) return;
    const navigationType = currentNavigationType();
    const context = createContext(capturedRoute);
    enqueueSample({ name: "LONG_TASK_COUNT", value: taskCount, rating: "unknown", navigationType }, context);
    enqueueSample({ name: "LONG_TASK_TOTAL", value: taskTotal, rating: "unknown", navigationType }, context);
    enqueueSample({ name: "LONG_TASK_MAX", value: taskMax, rating: "unknown", navigationType }, context);
    enqueueSample({ name: "OBSERVER_CALLBACK_TOTAL", value: callbackTotal, rating: "unknown", navigationType }, context);
    enqueueSample({ name: "OBSERVER_CALLBACK_MAX", value: callbackMax, rating: "unknown", navigationType }, context);
    flushPerformanceQueue();
  };
}

export function installActionTimingObserver(): () => void {
  if (!isCollectionEnabled() || typeof document === "undefined") return () => undefined;

  const onClick = (event: MouseEvent) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    let metricName: RumMetricName | null = null;
    if (target.closest("[data-rating]")) metricName = "ACTION_REVIEW_ANSWER";
    else if (target.closest(".lx-setup-submit > button")) metricName = "ACTION_START_LESSON";
    if (!metricName) return;

    const started = performance.now();
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        enqueueSample({
          name: metricName,
          value: performance.now() - started,
          rating: "unknown",
          navigationType: currentNavigationType(),
        });
      });
    });
  };

  document.addEventListener("click", onClick, true);
  return () => document.removeEventListener("click", onClick, true);
}

export function isPrivacyOptOutValue(value: string | null | undefined): boolean {
  return value === "1" || value?.toLowerCase() === "yes";
}

export function isCollectionEnabled(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const privacyNavigator = navigator as PrivacyAwareNavigator;
  const privacyWindow = window as PrivacyAwareWindow;
  if (
    privacyNavigator.globalPrivacyControl === true
    || isPrivacyOptOutValue(navigator.doNotTrack)
    || isPrivacyOptOutValue(privacyNavigator.msDoNotTrack)
    || isPrivacyOptOutValue(privacyWindow.doNotTrack)
  ) {
    return false;
  }
  if (samplingDecision !== null) return samplingDecision;

  const configured = Number.parseFloat(process.env.NEXT_PUBLIC_RUM_SAMPLE_RATE ?? "");
  const fallback = process.env.NODE_ENV === "production" ? 0.1 : 1;
  const sampleRate = Number.isFinite(configured) ? Math.min(1, Math.max(0, configured)) : fallback;

  try {
    const stored = window.sessionStorage.getItem(SESSION_SAMPLE_KEY);
    if (stored === "1" || stored === "0") {
      samplingDecision = stored === "1";
      return samplingDecision;
    }
    samplingDecision = Math.random() < sampleRate;
    window.sessionStorage.setItem(SESSION_SAMPLE_KEY, samplingDecision ? "1" : "0");
  } catch {
    samplingDecision = Math.random() < sampleRate;
  }
  return samplingDecision;
}

export function resetPerformanceRUMForTests(): void {
  activeReport = null;
  flushTimer = null;
  samplingDecision = null;
}

function enqueueSample(sample: RumSample, context = createContext()): void {
  if (!isCollectionEnabled()) return;
  const contextKey = JSON.stringify(context);
  if (activeReport && JSON.stringify(stripSamples(activeReport)) !== contextKey) {
    flushPerformanceQueue();
  }
  if (!activeReport) activeReport = { ...context, samples: [] };
  activeReport.samples.push({ ...sample, value: roundMetricValue(sample.value) });
  if (activeReport.samples.length >= MAX_BATCH_SIZE) {
    flushPerformanceQueue();
    return;
  }
  scheduleFlush();
}

function createContext(route = typeof window === "undefined" ? "/not-found" : window.location.pathname): RumContext {
  const appVersion = typeof document === "undefined" ? "local" : sanitizeBuildID(document.documentElement.dataset.lexigoBuild);
  const width = typeof window === "undefined" ? 1_200 : window.innerWidth;
  const userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent;
  return {
    appVersion,
    route: normalizePerformanceRoute(route),
    deviceClass: classifyDevice(width),
    browserFamily: classifyBrowser(userAgent),
    displayMode: currentDisplayMode(),
  };
}

function currentDisplayMode(): RumContext["displayMode"] {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "unknown";
  if (window.matchMedia("(display-mode: standalone)").matches) return "standalone";
  if (window.matchMedia("(display-mode: fullscreen)").matches) return "fullscreen";
  if (window.matchMedia("(display-mode: minimal-ui)").matches) return "minimal-ui";
  return "browser";
}

function currentNavigationType(): RumNavigationType {
  if (typeof performance === "undefined") return "unknown";
  const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  return normalizeNavigationType(navigation?.type);
}

function normalizeRating(value: string | undefined, name: RumMetricName, metricValue: number): RumRating {
  if (value === "good" || value === "needs-improvement" || value === "poor") return value;
  const thresholds: Partial<Record<RumMetricName, readonly [number, number]>> = {
    CLS: [0.1, 0.25],
    LCP: [2_500, 4_000],
    INP: [200, 500],
    FCP: [1_800, 3_000],
    TTFB: [800, 1_800],
  };
  const metricThresholds = thresholds[name];
  if (!metricThresholds) return "unknown";
  if (metricValue <= metricThresholds[0]) return "good";
  if (metricValue <= metricThresholds[1]) return "needs-improvement";
  return "poor";
}

function sanitizeBuildID(value: string | undefined): string {
  const normalized = value?.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
  return normalized || "local";
}

function roundMetricValue(value: number): number {
  return Math.round(value * 1_000) / 1_000;
}

function stripSamples(report: RumReport): RumContext {
  const { samples: _samples, ...context } = report;
  return context;
}

function scheduleFlush(): void {
  if (flushTimer !== null || typeof window === "undefined") return;
  flushTimer = window.setTimeout(flushPerformanceQueue, FLUSH_DELAY_MS);
}
