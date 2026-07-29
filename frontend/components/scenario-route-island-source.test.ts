import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const bootstrap = readFileSync(new URL("./lexigo-bootstrapped-app.tsx", import.meta.url), "utf8");
const catalog = readFileSync(new URL("./lexigo-scenario-catalog-app.tsx", import.meta.url), "utf8");
const detail = readFileSync(new URL("./lexigo-scenario-app.tsx", import.meta.url), "utf8");
const compatibility = readFileSync(new URL("./lexigo-premium-app.tsx", import.meta.url), "utf8");

function sourceIndex(source: string, marker: string): number {
  const index = source.lastIndexOf(marker);
  expect(index, `missing source marker ${marker}`).toBeGreaterThanOrEqual(0);
  return index;
}

describe("Scenario route island source contract", () => {
  it("loads dedicated Scenario catalog and detail entries", () => {
    expect(bootstrap).toContain('import("./lexigo-scenario-catalog-app")');
    expect(bootstrap).toContain('import("./lexigo-scenario-app")');
    expect(bootstrap).toContain('return pathname === "/scenarios";');
    expect(bootstrap).toContain('return pathname.startsWith("/scenarios/");');
  });

  it("selects authenticated Scenario islands before the compatibility fallback", () => {
    expect(bootstrap).toContain(
      "const useScenarioCatalogIsland = isScenarioCatalogRoute(pathname) && initialSession !== null;",
    );
    expect(bootstrap).toContain(
      "const useScenarioIsland = isScenarioDetailRoute(pathname) && initialSession !== null;",
    );
    expect(catalog).toContain("initialSession: Session;");
    expect(detail).toContain("initialSession: Session;");

    const catalogRender = sourceIndex(bootstrap, "<LexigoScenarioCatalogApp");
    const detailRender = sourceIndex(bootstrap, "<LexigoScenarioApp");
    const compatibilityFallback = sourceIndex(bootstrap, "<LexigoPremiumApp");
    expect(compatibilityFallback).toBeGreaterThan(catalogRender);
    expect(compatibilityFallback).toBeGreaterThan(detailRender);
  });

  it("keeps Scenario route data and lifecycle in the canonical owners", () => {
    const catalogContracts = [
      '"/api/v1/scenarios"',
      "isScenarioCatalogPayload",
      "ScenarioRecommendation",
    ] as const;
    const detailContracts = [
      "scenarioSlugFromPath",
      "isScenarioDetailPayload",
      "isStartScenarioAttemptResponse",
      "isSubmitScenarioStepResponse",
      "scenarioDraftStorageKey",
    ] as const;

    for (const marker of catalogContracts) {
      expect(catalog, `canonical Scenario catalog contract ${marker}`).toContain(marker);
    }
    for (const marker of detailContracts) {
      expect(detail, `canonical Scenario detail contract ${marker}`).toContain(marker);
    }
  });

  it("keeps Scenario route runtime absent from the compatibility app", () => {
    const retiredCompatibilityMarkers = [
      '"/api/v1/scenarios"',
      '"/api/v1/scenario-attempts"',
      "renderScenarios",
      "renderScenario",
      "scenarioCatalog",
      "scenarioAttempt",
      "scenarioDraftStorageKey",
      "isScenarioCatalogPayload",
      "isScenarioDetailPayload",
      "isStartScenarioAttemptResponse",
      "isSubmitScenarioStepResponse",
      'navigation.view === "scenarios"',
      'navigation.view === "scenario"',
    ] as const;

    for (const marker of retiredCompatibilityMarkers) {
      expect(compatibility, `retired Scenario compatibility marker ${marker}`).not.toContain(marker);
    }
  });

  it("preserves guest authentication redirect ownership", () => {
    expect(bootstrap).toContain("isScenarioCatalogRoute(pathname)");
    expect(bootstrap).toContain("isScenarioDetailRoute(pathname)");
    expect(bootstrap).toContain('moveToSessionScreen("required")');
    expect(bootstrap).toContain('params.set("return_to", returnTo);');
    expect(bootstrap).toContain('window.history.replaceState(profileHistoryState(), "", `/profile?${params.toString()}`);');
  });

  it("does not duplicate persistent bootstrap and outbox owners", () => {
    for (const owner of [catalog, detail]) {
      expect(owner).not.toContain("ReviewOutboxRuntime");
      expect(owner).not.toContain("restoreBootstrappedSession");
      expect(owner).not.toContain("ServiceWorkerRegistration");
    }
  });
});
