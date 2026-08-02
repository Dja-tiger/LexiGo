import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const componentsDirectory = path.join(process.cwd(), "components");

function readComponent(file: string): string {
  return readFileSync(path.join(componentsDirectory, file), "utf8");
}

describe("Progress route client-island ownership", () => {
  it("loads the dedicated Progress entry only from the persistent bootstrap layer", () => {
    const bootstrappedApp = readComponent("lexigo-bootstrapped-app.tsx");
    const progressEntryConsumers = readdirSync(componentsDirectory)
      .filter((file) => file.endsWith(".tsx"))
      .filter((file) => readComponent(file).includes("lexigo-progress-app"))
      .sort();

    expect(progressEntryConsumers).toEqual(["lexigo-bootstrapped-app.tsx"]);
    expect(bootstrappedApp).toMatch(
      /const LexigoProgressApp = dynamic\([\s\S]*import\("\.\/lexigo-progress-app"\)[\s\S]*module\.LexigoProgressApp/,
    );
    expect(bootstrappedApp.match(/<LexigoProgressApp\b/g)).toHaveLength(1);
    expect(bootstrappedApp.match(/<ReviewOutboxRuntime\b/g)).toHaveLength(1);
    expect(bootstrappedApp).toContain("restoreBootstrappedSession()");
  });

  it("selects Progress before the compatibility fallback for guest and authenticated entry", () => {
    const bootstrappedApp = readComponent("lexigo-bootstrapped-app.tsx");
    const progressApp = readComponent("lexigo-progress-app.tsx");

    expect(bootstrappedApp).toContain('return normalizedPathname(pathname) === "/progress";');
    expect(bootstrappedApp).toContain("const useProgressIsland = isProgressRoute(pathname);");
    expect(bootstrappedApp).not.toContain("useProgressIsland = initialSession");

    const progressRender = bootstrappedApp.lastIndexOf("<LexigoProgressApp");
    const compatibilityFallback = bootstrappedApp.lastIndexOf("<LexigoPremiumApp");

    expect(progressRender).toBeGreaterThanOrEqual(0);
    expect(compatibilityFallback).toBeGreaterThan(progressRender);
    expect(progressApp).toContain("initialSession: Session | null;");
  });

  it("keeps Progress API and evidence behavior inside the island without shared runtime owners", () => {
    const progressApp = readComponent("lexigo-progress-app.tsx");

    expect(progressApp).toContain('from "../lib/authorized-json"');
    expect(progressApp).toContain('from "./progress-evidence-dashboard"');
    expect(progressApp).toContain('data-route-client-island="progress"');
    expect(progressApp).toContain("/api/v1/progress?timezoneOffsetMinutes=");
    expect(progressApp).not.toContain("lexigo-premium-app");
    expect(progressApp).not.toContain("restoreBootstrappedSession");
    expect(progressApp).not.toContain("refreshSession");
    expect(progressApp).not.toContain("ReviewOutboxRuntime");
    expect(progressApp).not.toContain("navigator.serviceWorker");
  });

  it("removes unreachable compatibility Progress presentation and Profile-only consumers", () => {
    const premiumApp = readComponent("lexigo-premium-app.tsx");
    const retiredMarkers = [
      "function renderProgress()",
      'navigation.view === "progress" ? renderProgress()',
      'showCard={navigation.view === "progress"',
      'navigation.view !== "progress" ? <AsyncResourceNotice label="Прогресс"',
      "normalizedProgressModes",
      "objectiveSuccessRate",
      "GOAL_OPTIONS",
      "nextDueLabel(",
      "progress.dailyGoal",
      'navigate({ view: "progress"',
    ] as const;

    for (const marker of retiredMarkers) {
      expect(premiumApp, `retired compatibility Progress marker ${marker}`).not.toContain(marker);
    }
  });

  it("preserves remaining shared progress consumers outside the route presentation boundary", () => {
    const premiumApp = readComponent("lexigo-premium-app.tsx");
    const sharedMarkers = [
      "const [progress, setProgress]",
      "const [progressStatus, setProgressStatus]",
      "loadProgressResource",
      "latestProgressRef",
      "lessonProgressBeforeRef",
    ] as const;

    for (const marker of sharedMarkers) {
      expect(premiumApp, `shared progress contract ${marker}`).toContain(marker);
    }
  });
});
