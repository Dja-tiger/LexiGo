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

const routeBudgets = Object.entries(bundleBudgets.routes) as Array<[string, RouteBudget]>;

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
      expect(budget.maxInitialRequests, `${route}: request ceiling`).toBeLessThanOrEqual(24);
    }
  });

  it("requires evidence when a route diverges from the shared original baseline", () => {
    const sharedBaseline = bundleBudgets.routes["/"].baselineJavascriptBytes;

    for (const [route, budget] of routeBudgets) {
      if (budget.baselineJavascriptBytes === sharedBaseline) continue;

      expect(budget.baselineEvidence, `${route}: baseline evidence`).toBeDefined();
      expect(budget.baselineEvidence?.sourceRun, `${route}: source run`).toBeGreaterThan(0);
      expect(Number.isNaN(Date.parse(budget.baselineEvidence?.capturedAt ?? "")), `${route}: capture date`).toBe(false);
      expect(budget.baselineEvidence?.headSha, `${route}: head SHA`).toMatch(/^[0-9a-f]{40}$/);
    }
  });

  it("keeps the dictionary island below the monolithic product graph", () => {
    const monolith = bundleBudgets.routes["/"];
    const dictionary = bundleBudgets.routes["/dictionary"];

    expect(dictionary.baselineJavascriptBytes).toBeLessThan(monolith.baselineJavascriptBytes);
    expect(dictionary.maxJavascriptBytes).toBeLessThan(monolith.maxJavascriptBytes);
    expect(dictionary.maxInitialRequests).toBeLessThan(monolith.maxInitialRequests);
  });

  it("keeps the Progress island below the monolithic product graph", () => {
    const monolith = bundleBudgets.routes["/"];
    const progress = bundleBudgets.routes["/progress"];

    expect(progress.baselineJavascriptBytes).toBeLessThan(monolith.baselineJavascriptBytes);
    expect(progress.maxJavascriptBytes).toBeLessThan(monolith.maxJavascriptBytes);
    expect(progress.maxInitialRequests).toBeLessThan(monolith.maxInitialRequests);
  });
});
