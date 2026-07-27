import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const componentsDirectory = path.join(process.cwd(), "components");

function readComponent(file: string): string {
  return readFileSync(path.join(componentsDirectory, file), "utf8");
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
    expect(bootstrappedApp).toContain('type RouteGraph = "dictionary" | "home" | "product"');
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
});
