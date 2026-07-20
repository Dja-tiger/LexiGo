from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text()
    count = text.count(old)
    print(f"patching {path}: matches={count}")
    if count != 1:
        raise SystemExit(f"{path}: expected one replacement, found {count}: {old[:100]!r}")
    file.write_text(text.replace(old, new, 1))


def strip_trailing_whitespace(path: str) -> None:
    file = Path(path)
    lines = file.read_text().splitlines()
    file.write_text("\n".join(line.rstrip() for line in lines) + "\n")


replace_once(
    "frontend/lib/performance-rum.ts",
    '''type PrivacyAwareNavigator = Navigator & {
  globalPrivacyControl?: boolean;
};''',
    '''type PrivacyAwareNavigator = Navigator & {
  globalPrivacyControl?: boolean;
  msDoNotTrack?: string | null;
};''',
)
replace_once(
    "frontend/lib/performance-rum.ts",
    '''export function reportWebVitalMetric(metric: WebVitalMetricLike): void {
  const sample = mapWebVitalMetric(metric);
  if (sample) enqueueSample(sample);
}''',
    '''export function reportWebVitalMetric(metric: WebVitalMetricLike, route?: string): void {
  const sample = mapWebVitalMetric(metric);
  if (sample) enqueueSample(sample, createContext(route));
}''',
)
replace_once(
    "frontend/lib/performance-rum.ts",
    '''  const body = JSON.stringify(report);
  if (typeof navigator.sendBeacon === "function") {
    const accepted = navigator.sendBeacon(REPORT_ENDPOINT, new Blob([body], { type: "application/json" }));
    if (accepted) return;
  }

  if (typeof fetch === "function") {''',
    '''  const body = JSON.stringify(report);
  if (typeof fetch === "function") {''',
)
replace_once(
    "frontend/lib/performance-rum.ts",
    '''export function isCollectionEnabled(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  const privacyNavigator = navigator as PrivacyAwareNavigator;
  const privacyWindow = window as PrivacyAwareWindow;
  if (privacyNavigator.globalPrivacyControl === true || navigator.doNotTrack === "1" || privacyWindow.doNotTrack === "1") {
    return false;
  }''',
    '''export function isPrivacyOptOutValue(value: string | null | undefined): boolean {
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
  }''',
)

Path("frontend/components/web-vitals-reporter.tsx").write_text('''"use client";

import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { useCallback, useEffect, useRef } from "react";

import {
  flushPerformanceQueue,
  installActionTimingObserver,
  reportWebVitalMetric,
  startLongTaskMonitoring,
  type WebVitalMetricLike,
} from "@/lib/performance-rum";

function usesCurrentRoute(metric: WebVitalMetricLike): boolean {
  return metric.name === "Next.js-route-change-to-render" || metric.name === "Next.js-render";
}

export function WebVitalsReporter() {
  const pathname = usePathname();
  const initialPathname = useRef(pathname);
  const currentPathname = useRef(pathname);

  useEffect(() => {
    currentPathname.current = pathname;
  }, [pathname]);

  const handleWebVital = useCallback((metric: WebVitalMetricLike) => {
    reportWebVitalMetric(metric, usesCurrentRoute(metric) ? currentPathname.current : initialPathname.current);
  }, []);

  useReportWebVitals(handleWebVital);

  useEffect(() => startLongTaskMonitoring(pathname), [pathname]);

  useEffect(() => installActionTimingObserver(), []);

  useEffect(() => {
    const flushWhenHidden = () => {
      if (document.visibilityState === "hidden") flushPerformanceQueue();
    };
    const flushBeforePageExit = () => flushPerformanceQueue();

    document.addEventListener("visibilitychange", flushWhenHidden);
    window.addEventListener("pagehide", flushBeforePageExit);
    return () => {
      document.removeEventListener("visibilitychange", flushWhenHidden);
      window.removeEventListener("pagehide", flushBeforePageExit);
      flushPerformanceQueue();
    };
  }, []);

  return null;
}
''')

replace_once(
    "frontend/lib/performance-rum.test.ts",
    '''  classifyDevice,
  mapWebVitalMetric,''',
    '''  classifyDevice,
  isPrivacyOptOutValue,
  mapWebVitalMetric,''',
)
replace_once(
    "frontend/lib/performance-rum.test.ts",
    '''describe("normalizeNavigationType", () => {''',
    '''describe("privacy opt-out values", () => {
  it("recognizes browser DNT variants without accepting arbitrary values", () => {
    expect(isPrivacyOptOutValue("1")).toBe(true);
    expect(isPrivacyOptOutValue("yes")).toBe(true);
    expect(isPrivacyOptOutValue("YES")).toBe(true);
    expect(isPrivacyOptOutValue("0")).toBe(false);
    expect(isPrivacyOptOutValue(null)).toBe(false);
  });
});

describe("normalizeNavigationType", () => {''',
)

replace_once(
    "docs/performance-observability.md",
    '''Reports are batched, sent with `navigator.sendBeacon` when possible, and fall back to `fetch(..., { keepalive: true })`. Session cookies and authorization headers are not sent.''',
    '''Reports are batched and sent with `fetch(..., { keepalive: true, credentials: "omit" })`. Session cookies and authorization headers are not sent, including during page exit.''',
)

performance_path = '''  /api/v1/performance/rum:
    post:
      operationId: reportPerformanceRUM
      tags: [performance]
      summary: Принять анонимный пакет performance-метрик.
      description: Принимает только allow-listed агрегаты без user ID, IP, raw URL, query, referrer, cookie, session ID и raw User-Agent.
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/PerformanceRUMReport"
      responses:
        "202":
          description: Пакет принят и сохранён.
          headers:
            Cache-Control:
              schema: { type: string, const: no-store }
        "400":
          $ref: "#/components/responses/BadRequest"
        "403":
          $ref: "#/components/responses/Forbidden"
        "422":
          $ref: "#/components/responses/ValidationError"
        "429":
          $ref: "#/components/responses/TooManyRequests"
        "500":
          description: Внутренняя ошибка сохранения без раскрытия деталей инфраструктуры.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
'''
replace_once(
    "api/openapi.yaml",
    '''  /api/v1/auth/register:
''',
    performance_path + '''  /api/v1/auth/register:
''',
)

performance_schemas = '''    PerformanceRUMReport:
      type: object
      additionalProperties: false
      required: [appVersion, route, deviceClass, browserFamily, displayMode, samples]
      properties:
        appVersion:
          type: string
          minLength: 1
          maxLength: 80
          pattern: '^[A-Za-z0-9._-]+$'
        route:
          type: string
          enum: [/, /learn, /dictionary, /phrases, /progress, /profile, /lesson, /word, /phrase, /privacy, /terms, /legal, /not-found]
        deviceClass:
          type: string
          enum: [mobile, tablet, desktop]
        browserFamily:
          type: string
          enum: [chromium, webkit, firefox, other]
        displayMode:
          type: string
          enum: [browser, standalone, fullscreen, minimal-ui, unknown]
        samples:
          type: array
          minItems: 1
          maxItems: 16
          items:
            $ref: "#/components/schemas/PerformanceRUMSample"
    PerformanceRUMSample:
      type: object
      additionalProperties: false
      required: [name, value, rating, navigationType]
      properties:
        name:
          type: string
          enum:
            - CLS
            - LCP
            - INP
            - FCP
            - TTFB
            - NEXT_HYDRATION
            - NEXT_ROUTE_CHANGE
            - NEXT_RENDER
            - LONG_TASK_COUNT
            - LONG_TASK_TOTAL
            - LONG_TASK_MAX
            - OBSERVER_CALLBACK_TOTAL
            - OBSERVER_CALLBACK_MAX
            - ACTION_START_LESSON
            - ACTION_REVIEW_ANSWER
        value:
          type: number
          minimum: 0
          maximum: 600000
        rating:
          type: string
          enum: [good, needs-improvement, poor, unknown]
        navigationType:
          type: string
          enum: [navigate, reload, back-forward, back-forward-cache, prerender, restore, unknown]
'''
replace_once(
    "api/openapi.yaml",
    '''  schemas:
    CatalogMetadata:
''',
    '''  schemas:
''' + performance_schemas + '''    CatalogMetadata:
''',
)

for path in [
    "frontend/lib/performance-rum.ts",
    "frontend/components/web-vitals-reporter.tsx",
    "frontend/lib/performance-rum.test.ts",
    "docs/performance-observability.md",
    "api/openapi.yaml",
]:
    strip_trailing_whitespace(path)

print("issue 59 self-review patch completed")
