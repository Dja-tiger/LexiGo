import { describe, expect, it } from "vitest";

import {
  consumeProductJourneyIntent,
  nextProductJourneyHistory,
  productJourneyRoute,
  queueProductJourneyIntent,
} from "./product-journey";

describe("productJourneyRoute", () => {
  it("keeps only allow-listed coarse routes", () => {
    expect(productJourneyRoute({ view: "home" })).toBe("/");
    expect(productJourneyRoute({ view: "library", query: "user@example.com" })).toBe("/dictionary");
    expect(productJourneyRoute({ view: "library", detail: "481" })).toBe("/word");
    expect(productJourneyRoute({ view: "phrases", detail: "incident-response" })).toBe("/phrase");
    expect(productJourneyRoute({ view: "lesson", detail: "00000000-0000-0000-0000-000000000001" })).toBe("/lesson");
  });
});

describe("nextProductJourneyHistory", () => {
  it("detects an immediate A to B to A return without identifiers", () => {
    const first = nextProductJourneyHistory([], "/", "/dictionary");
    expect(first).toEqual({ history: ["/", "/dictionary"], backtrack: false });

    const second = nextProductJourneyHistory(first.history, "/dictionary", "/");
    expect(second).toEqual({ history: ["/", "/dictionary", "/"], backtrack: true });
  });

  it("bounds retained route history", () => {
    const transition = nextProductJourneyHistory(
      ["/", "/learn", "/dictionary"],
      "/dictionary",
      "/progress",
    );
    expect(transition.history).toEqual(["/learn", "/dictionary", "/progress"]);
    expect(transition.backtrack).toBe(false);
  });
});

describe("queued navigation intent", () => {
  it("is consumed once for App Router popstate navigation", () => {
    queueProductJourneyIntent("primary_navigation");
    expect(consumeProductJourneyIntent()).toBe("primary_navigation");
    expect(consumeProductJourneyIntent()).toBeNull();
  });
});
