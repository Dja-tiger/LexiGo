import { describe, expect, it } from "vitest";

import { isScenarioCatalogPayload } from "./lexigo-scenario-catalog-app";

const SCENARIOS = [
  {
    slug: "incident-update",
    type: "incident",
    title: "Incident update",
    summary: "Communicate impact and the next checkpoint.",
    userRole: "on-call engineer",
    workplaceGoal: "Provide a precise update.",
    completionCriterion: "Facts, impact and next action are explicit.",
    constraints: ["Do not claim an unverified root cause"],
    requiresFactHypothesis: true,
    estimatedMinutes: 12,
    version: 1,
    stepCount: 4,
  },
  {
    slug: "troubleshooting-plan",
    type: "troubleshooting",
    title: "Troubleshooting",
    summary: "Separate evidence from hypotheses.",
    userRole: "backend engineer",
    workplaceGoal: "Propose a testable diagnostic plan.",
    completionCriterion: "The plan has evidence and next checks.",
    constraints: ["Keep hypotheses qualified"],
    requiresFactHypothesis: true,
    estimatedMinutes: 15,
    version: 1,
    stepCount: 5,
  },
] as const;

describe("Scenario catalog response contract", () => {
  it("accepts the server envelope without changing item order", () => {
    const payload = { items: [...SCENARIOS], count: SCENARIOS.length };

    expect(isScenarioCatalogPayload(payload)).toBe(true);
    expect(payload.items.map((item) => item.slug)).toEqual([
      "incident-update",
      "troubleshooting-plan",
    ]);
  });

  it("accepts an explicit empty server catalog", () => {
    expect(isScenarioCatalogPayload({ items: [], count: 0 })).toBe(true);
  });

  it("rejects count drift, malformed entries and duplicate slugs", () => {
    expect(isScenarioCatalogPayload({ items: [...SCENARIOS], count: 1 })).toBe(false);
    expect(isScenarioCatalogPayload({ items: [{ ...SCENARIOS[0], estimatedMinutes: 0 }], count: 1 })).toBe(false);
    expect(isScenarioCatalogPayload({
      items: [SCENARIOS[0], { ...SCENARIOS[1], slug: SCENARIOS[0].slug }],
      count: 2,
    })).toBe(false);
  });
});
