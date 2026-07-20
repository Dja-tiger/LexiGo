import { describe, expect, it } from "vitest";

import {
  classifyBrowser,
  classifyDevice,
  isPrivacyOptOutValue,
  mapWebVitalMetric,
  normalizeNavigationType,
  normalizePerformanceRoute,
} from "./performance-rum";

describe("normalizePerformanceRoute", () => {
  it.each([
    ["/", "/"],
    ["/dictionary?query=rollback", "/dictionary"],
    ["/lesson/00000000-0000-0000-0000-000000000001", "/lesson"],
    ["/word/101", "/word"],
    ["/phrase/incident-response", "/phrase"],
    ["/private/user@example.com", "/not-found"],
  ])("normalizes %s without preserving identifiers", (input, expected) => {
    expect(normalizePerformanceRoute(input)).toBe(expected);
  });
});

describe("coarse device and browser dimensions", () => {
  it("uses stable viewport buckets", () => {
    expect(classifyDevice(390)).toBe("mobile");
    expect(classifyDevice(768)).toBe("tablet");
    expect(classifyDevice(1440)).toBe("desktop");
  });

  it("classifies browser engines without returning raw user agents", () => {
    expect(classifyBrowser("Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Version/18 Mobile Safari/604.1")).toBe("webkit");
    expect(classifyBrowser("Mozilla/5.0 AppleWebKit/537.36 Chrome/140.0 Safari/537.36")).toBe("chromium");
    expect(classifyBrowser("Mozilla/5.0 Firefox/142.0")).toBe("firefox");
    expect(classifyBrowser("custom user agent with user@example.com")).toBe("other");
  });
});

describe("mapWebVitalMetric", () => {
  it("maps Core Web Vitals and derives release ratings", () => {
    expect(mapWebVitalMetric({ name: "LCP", value: 2400, navigationType: "navigate" })).toEqual({
      name: "LCP",
      value: 2400,
      rating: "good",
      navigationType: "navigate",
    });
    expect(mapWebVitalMetric({ name: "INP", value: 350, navigationType: "back_forward" })).toEqual({
      name: "INP",
      value: 350,
      rating: "needs-improvement",
      navigationType: "back-forward",
    });
    expect(mapWebVitalMetric({ name: "CLS", value: 0.4 })).toEqual({
      name: "CLS",
      value: 0.4,
      rating: "poor",
      navigationType: "unknown",
    });
  });

  it("maps Next.js route timings and rejects arbitrary metric names", () => {
    expect(mapWebVitalMetric({ name: "Next.js-route-change-to-render", value: 42 })).toEqual({
      name: "NEXT_ROUTE_CHANGE",
      value: 42,
      rating: "unknown",
      navigationType: "unknown",
    });
    expect(mapWebVitalMetric({ name: "USER_EMAIL", value: 1 })).toBeNull();
    expect(mapWebVitalMetric({ name: "LCP", value: Number.NaN })).toBeNull();
  });
});

describe("privacy opt-out values", () => {
  it("recognizes browser DNT variants without accepting arbitrary values", () => {
    expect(isPrivacyOptOutValue("1")).toBe(true);
    expect(isPrivacyOptOutValue("yes")).toBe(true);
    expect(isPrivacyOptOutValue("YES")).toBe(true);
    expect(isPrivacyOptOutValue("0")).toBe(false);
    expect(isPrivacyOptOutValue(null)).toBe(false);
  });
});

describe("normalizeNavigationType", () => {
  it("allows only bounded navigation dimensions", () => {
    expect(normalizeNavigationType("back_forward_cache")).toBe("back-forward-cache");
    expect(normalizeNavigationType("user@example.com")).toBe("unknown");
  });
});
