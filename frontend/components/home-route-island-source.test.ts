import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const componentsDirectory = path.join(process.cwd(), "components");

function readComponent(file: string): string {
  return readFileSync(path.join(componentsDirectory, file), "utf8");
}

function sourceIndex(source: string, marker: string): number {
  const index = source.indexOf(marker);
  expect(index, `missing source marker ${marker}`).toBeGreaterThanOrEqual(0);
  return index;
}

describe("Home route client-island ownership", () => {
  it("loads the dedicated Home entry only from the persistent bootstrap layer", () => {
    const bootstrappedApp = readComponent("lexigo-bootstrapped-app.tsx");
    const homeEntryConsumers = readdirSync(componentsDirectory)
      .filter((file) => file.endsWith(".tsx"))
      .filter((file) => readComponent(file).includes("lexigo-home-app"))
      .sort();

    expect(homeEntryConsumers).toEqual(["lexigo-bootstrapped-app.tsx"]);
    expect(bootstrappedApp).toMatch(
      /const LexigoHomeApp = dynamic\([\s\S]*import\("\.\/lexigo-home-app"\)[\s\S]*module\.LexigoHomeApp/,
    );
    expect(bootstrappedApp.match(/<LexigoHomeApp\b/g)).toHaveLength(1);
    expect(bootstrappedApp.match(/<ReviewOutboxRuntime\b/g)).toHaveLength(1);
    expect(bootstrappedApp).toContain("restoreBootstrappedSession()");
    expect(bootstrappedApp).toContain('type RouteGraph = "dictionary" | "home" | "learn" | "product"');
  });

  it("forces the root pathname onto the Home graph before the compatibility fallback", () => {
    const bootstrappedApp = readComponent("lexigo-bootstrapped-app.tsx");

    expect(bootstrappedApp).toContain('function isHomeRoute(pathname: string): boolean');
    expect(bootstrappedApp).toContain('if (isHomeRoute(pathname)) return "home"');
    expect(bootstrappedApp).toContain('const useHomeIsland = effectiveRouteGraph === "home" && isHomeRoute(pathname)');

    const homeBranch = sourceIndex(bootstrappedApp, "{useHomeIsland ? (");
    const homeEntry = sourceIndex(bootstrappedApp, "<LexigoHomeApp");
    const compatibilityFallback = sourceIndex(bootstrappedApp, "<LexigoPremiumApp");

    expect(homeBranch).toBeLessThan(homeEntry);
    expect(homeEntry).toBeLessThan(compatibilityFallback);
  });

  it("keeps Home reads, next-action resolution and Figma presentation inside the island", () => {
    const homeApp = readComponent("lexigo-home-app.tsx");

    expect(homeApp).toContain('from "../lib/authorized-json"');
    expect(homeApp).toContain('data-route-client-island="home"');
    expect(homeApp).toContain('data-figma-home-desktop="194:249"');
    expect(homeApp).toContain('data-figma-home-mobile="196:223"');
    expect(homeApp).toContain("/api/v1/progress?timezoneOffsetMinutes=");
    expect(homeApp).toContain('"/api/v1/lessons/active"');
    expect(homeApp).toContain('"/api/v1/lessons"');
    expect(homeApp).toContain("lessonResumeURL()");
    expect(homeApp).toContain('data-journey-intent="home_next_action"');
    expect(homeApp).toContain('aria-label="Следующее рекомендуемое действие"');
    expect(homeApp).toContain('aria-label="Краткий прогресс"');
    expect(homeApp).not.toContain("lexigo-premium-app");
    expect(homeApp).not.toContain("restoreBootstrappedSession");
    expect(homeApp).not.toContain("refreshSession");
    expect(homeApp).not.toContain("ReviewOutboxRuntime");
    expect(homeApp).not.toContain("navigator.serviceWorker");
  });

  it("keeps the transient lesson intent and cross-graph destination explicit", () => {
    const asyncState = readComponent("async-state.tsx");
    const routeNavigation = readComponent("route-primary-navigation.tsx");
    const homeApp = readComponent("lexigo-home-app.tsx");

    expect(asyncState).toContain("consumeLessonResumeIntent(window.location, window.history)");
    expect(asyncState).toContain('actionLabel !== "Продолжить урок"');
    expect(routeNavigation).toContain('target.view === "home"');
    expect(routeNavigation).toContain("pathname: transition.nextPathname");
    expect(routeNavigation).toContain("routeGraph: transition.nextGraph");
    expect(homeApp).toContain("function requestProductGraph(targetURL: string): void");
    expect(homeApp).toContain('routeGraph: "product"');
  });

  it("records the bounded legacy Home presentation candidate without deleting shared owners", () => {
    const compatibilityApp = readComponent("lexigo-premium-app.tsx");
    const candidateMarkers = [
      "function renderHome()",
      'navigation.view === "home" ? renderHome()',
      'className="lx-home-next-action"',
      'className="lx-home-paths"',
      'aria-label="Краткий прогресс"',
    ] as const;
    const preservedSharedMarkers = [
      "function renderResumeStrip()",
      "function renderLearn()",
      "function renderLibrary()",
      "function renderProfile()",
      "function renderLesson()",
      "loadProgressResource",
      "resumeLesson",
      "startLesson",
      "requestAuthentication",
    ] as const;

    for (const marker of candidateMarkers) {
      expect(compatibilityApp, `legacy Home candidate ${marker}`).toContain(marker);
    }
    for (const marker of preservedSharedMarkers) {
      expect(compatibilityApp, `shared compatibility owner ${marker}`).toContain(marker);
    }
  });
});
