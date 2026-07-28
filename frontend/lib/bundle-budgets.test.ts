import { describe, expect, it } from "vitest";

import bundleBudgets from "../bundle-budgets.json";

type BaselineEvidence = {
  sourceRun: number;
  capturedAt: string;
  headSha: string;
};

type RouteBudget = {
  baselineJavascriptBytes: number;
  maxJavascriptBytes: number;
  maxInitialRequests: number;
  baselineEvidence?: BaselineEvidence;
};

const ORIGINAL_MONOLITHIC_BUDGET = {
  baselineJavascriptBytes: 238_257,
  maxJavascriptBytes: 275_000,
  maxInitialRequests: 24,
} as const;

const routeBudgets = Object.entries(bundleBudgets.routes) as Array<[string, RouteBudget]>;

function expectRouteBelowOriginalMonolith(route: string, budget: RouteBudget): void {
  expect(budget.baselineJavascriptBytes, `${route}: baseline`).toBeLessThan(
    ORIGINAL_MONOLITHIC_BUDGET.baselineJavascriptBytes,
  );
  expect(budget.maxJavascriptBytes, `${route}: JavaScript ceiling`).toBeLessThan(
    ORIGINAL_MONOLITHIC_BUDGET.maxJavascriptBytes,
  );
  expect(budget.maxInitialRequests, `${route}: request ceiling`).toBeLessThan(
    ORIGINAL_MONOLITHIC_BUDGET.maxInitialRequests,
  );
}

describe("route bundle budget configuration", () => {
  it("keeps every ceiling bounded above its measured baseline", () => {
    for (const [route, budget] of routeBudgets) {
      expect(budget.baselineJavascriptBytes, `${route}: baseline`).toBeGreaterThan(0);
      expect(budget.maxJavascriptBytes, `${route}: JavaScript ceiling`).toBeGreaterThanOrEqual(
        budget.baselineJavascriptBytes,
      );
      expect(budget.maxJavascriptBytes, `${route}: JavaScript headroom`).toBeLessThanOrEqual(
        Math.ceil(budget.baselineJavascriptBytes * 1.16),
      );
      expect(budget.maxInitialRequests, `${route}: request ceiling`).toBeGreaterThan(0);
      expect(budget.maxInitialRequests, `${route}: request ceiling`).toBeLessThanOrEqual(
        ORIGINAL_MONOLITHIC_BUDGET.maxInitialRequests,
      );
    }
  });

  it("requires evidence when a route diverges from the shared original baseline", () => {
    for (const [route, budget] of routeBudgets) {
      if (budget.baselineJavascriptBytes === ORIGINAL_MONOLITHIC_BUDGET.baselineJavascriptBytes) continue;

      expect(budget.baselineEvidence, `${route}: baseline evidence`).toBeDefined();
      expect(budget.baselineEvidence?.sourceRun, `${route}: source run`).toBeGreaterThan(0);
      expect(Number.isNaN(Date.parse(budget.baselineEvidence?.capturedAt ?? "")), `${route}: capture date`).toBe(false);
      expect(budget.baselineEvidence?.headSha, `${route}: head SHA`).toMatch(/^[0-9a-f]{40}$/);
    }
  });

  it("keeps the Home island below the original monolithic transfer and release limits", () => {
    const home = bundleBudgets.routes["/"];

    expectRouteBelowOriginalMonolith("/", home);
    expect(home.maxJavascriptBytes, "/: JavaScript ceiling below original transfer").toBeLessThan(
      ORIGINAL_MONOLITHIC_BUDGET.baselineJavascriptBytes,
    );
  });

  it("keeps the Learn island below the original monolithic transfer and release limits", () => {
    const learn = bundleBudgets.routes["/learn"];

    expectRouteBelowOriginalMonolith("/learn", learn);
    expect(learn.maxJavascriptBytes, "/learn: JavaScript ceiling below original transfer").toBeLessThan(
      ORIGINAL_MONOLITHIC_BUDGET.baselineJavascriptBytes,
    );
  });

  it("keeps the Dictionary island below the original monolithic product graph", () => {
    expectRouteBelowOriginalMonolith("/dictionary", bundleBudgets.routes["/dictionary"]);
  });

  it("keeps the Progress island below the original monolithic product graph", () => {
    expectRouteBelowOriginalMonolith("/progress", bundleBudgets.routes["/progress"]);
  });

  it("keeps the Active Lesson island below the original monolithic transfer and release limits", () => {
    const activeLesson = bundleBudgets.routes["/lesson/active"];

    expectRouteBelowOriginalMonolith("/lesson/active", activeLesson);
    expect(
      activeLesson.maxJavascriptBytes,
      "/lesson/active: JavaScript ceiling below original transfer",
    ).toBeLessThan(ORIGINAL_MONOLITHIC_BUDGET.baselineJavascriptBytes);
  });
});
