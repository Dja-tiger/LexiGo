import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const frontendDirectory = process.cwd();
const componentsDirectory = path.join(frontendDirectory, "components");
const libDirectory = path.join(frontendDirectory, "lib");

function readComponent(file: string): string {
  return readFileSync(path.join(componentsDirectory, file), "utf8");
}

function readLibrary(file: string): string {
  return readFileSync(path.join(libDirectory, file), "utf8");
}

describe("Learn route client-island ownership", () => {
  it("loads the dedicated Learn entry only from the persistent bootstrap layer", () => {
    const bootstrappedApp = readComponent("lexigo-bootstrapped-app.tsx");
    const learnEntryConsumers = readdirSync(componentsDirectory)
      .filter((file) => file.endsWith(".tsx"))
      .filter((file) => readComponent(file).includes("lexigo-learn-app"))
      .sort();

    expect(learnEntryConsumers).toEqual(["lexigo-bootstrapped-app.tsx"]);
    expect(bootstrappedApp).toMatch(
      /const LexigoLearnApp = dynamic\([\s\S]*import\("\.\/lexigo-learn-app"\)[\s\S]*module\.LexigoLearnApp/,
    );
    expect(bootstrappedApp.match(/<LexigoLearnApp\b/g)).toHaveLength(1);
    expect(bootstrappedApp.match(/<ReviewOutboxRuntime\b/g)).toHaveLength(1);
    expect(bootstrappedApp).toContain("restoreBootstrappedSession()");
    expect(bootstrappedApp).toContain('type RouteGraph = "dictionary" | "home" | "learn" | "product"');
  });

  it("keeps Lesson Composer reads, mutations and presentation inside the island", () => {
    const learnApp = readComponent("lexigo-learn-app.tsx");

    expect(learnApp).toContain('data-route-client-island="learn"');
    expect(learnApp).toContain('from "../lib/authorized-json"');
    expect(learnApp).toContain('from "./lesson-composer-progressive-shell"');
    expect(learnApp).toContain('"/api/v1/catalog/metadata"');
    expect(learnApp).toContain("/api/v1/progress?timezoneOffsetMinutes=");
    expect(learnApp).toContain('"/api/v1/lessons/active"');
    expect(learnApp).toContain('"/api/v1/lessons/preview"');
    expect(learnApp).toContain('"/api/v1/lessons"');
    expect(learnApp).toContain('method: "DELETE"');
    expect(learnApp).toContain('headers: { "If-Match": `"${activeLesson.version}"` }');
    expect(learnApp).toContain("lessonResumeURL()");
    expect(learnApp).not.toContain("lexigo-premium-app");
    expect(learnApp).not.toContain("restoreBootstrappedSession");
    expect(learnApp).not.toContain("refreshSession");
    expect(learnApp).not.toContain("ReviewOutboxRuntime");
    expect(learnApp).not.toContain("navigator.serviceWorker");
  });

  it("keeps the Learn graph owner consistent across bootstrap, route chrome and History", () => {
    const bootstrappedApp = readComponent("lexigo-bootstrapped-app.tsx");
    const routeNavigation = readComponent("route-primary-navigation.tsx");
    const routedApp = readComponent("routed-lexigo-app.tsx");
    const navigationHistory = readLibrary("navigation-history.ts");

    expect(bootstrappedApp).toContain('if (isLearnRoute(pathname)) return "learn"');
    expect(bootstrappedApp).toContain('if (isLearnRoute(pathname)) return "learn"');
    expect(routeNavigation).toContain('if (target.view === "learn") return "learn"');
    expect(routeNavigation).toContain('if (island === "learn") return "learn"');
    expect(routedApp).toContain('new Set(["/", "/learn", "/progress", "/scenarios"])');
    expect(navigationHistory).toContain('"dictionary" | "home" | "learn" | "product"');
    expect(navigationHistory).toContain('candidate === "learn"');
  });

  it("preserves source/topic URL state and server-authoritative Active Lesson handoff", () => {
    const learnApp = readComponent("lexigo-learn-app.tsx");

    expect(learnApp).toContain("parseNavigationLocation(window.location)");
    expect(learnApp).toContain("writePersistedNavigation(window.localStorage, target)");
    expect(learnApp).toContain('[ROUTE_GRAPH_HISTORY_KEY]: "learn"');
    expect(learnApp).toContain('requestRouteGraph("product", targetURL)');
    expect(learnApp).toContain('router.push(targetURL, { scroll: false })');
    expect(learnApp).toContain('return_to: returnTo');
    expect(learnApp).not.toContain("sessionStorage.setItem");
    expect(learnApp).not.toContain("localStorage.setItem");
  });
});
