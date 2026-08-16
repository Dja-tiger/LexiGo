import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const frontendDirectory = process.cwd();
const appDirectory = path.join(frontendDirectory, "app");
const componentsDirectory = path.join(frontendDirectory, "components");

const productionAppFiles = [
  "lexigo-active-lesson-app.tsx",
  "lexigo-bootstrapped-app.tsx",
  "lexigo-dictionary-app.tsx",
  "lexigo-guest-home-app.tsx",
  "lexigo-home-app.tsx",
  "lexigo-learn-app.tsx",
  "lexigo-onboarding-app.tsx",
  "lexigo-phrases-app.tsx",
  "lexigo-premium-app.tsx",
  "lexigo-profile-app.tsx",
  "lexigo-progress-app.tsx",
  "lexigo-scenario-app.tsx",
  "lexigo-scenario-catalog-app.tsx",
  "routed-lexigo-app.tsx",
] as const;

const retiredAppFiles = [
  "lexigo-app.tsx",
  "lexigo-learning-app.tsx",
  "lexigo-product-app.tsx",
  "lexigo-resumable-app.tsx",
] as const;

function readSource(...segments: string[]): string {
  return readFileSync(path.join(...segments), "utf8");
}

function componentSources(): Array<{ file: string; source: string }> {
  return readdirSync(componentsDirectory)
    .filter((file) => file.endsWith(".tsx"))
    .map((file) => ({
      file,
      source: readSource(componentsDirectory, file),
    }));
}

describe("production frontend application entry", () => {
  it("keeps one audited application-root file set", () => {
    const applicationRootFiles = readdirSync(componentsDirectory)
      .filter((file) => file.includes("lexigo") && file.endsWith("-app.tsx"))
      .sort();

    expect(applicationRootFiles).toEqual([...productionAppFiles].sort());
  });

  it("keeps the root chain layout -> routed shell -> bootstrap -> route graph", () => {
    const layout = readSource(appDirectory, "layout.tsx");
    const routedApp = readSource(componentsDirectory, "routed-lexigo-app.tsx");
    const bootstrappedApp = readSource(componentsDirectory, "lexigo-bootstrapped-app.tsx");

    expect(layout).toMatch(/import\s+\{\s*RoutedLexigoApp\s*\}\s+from\s+["']@\/components\/routed-lexigo-app["']/);
    expect(layout.match(/<RoutedLexigoApp\s*\/>/g)).toHaveLength(1);

    expect(routedApp).toMatch(/import\s+\{\s*LexigoBootstrappedApp\s*\}\s+from\s+["']\.\/lexigo-bootstrapped-app["']/);
    expect(routedApp).toContain('import { usePathname, useRouter } from "next/navigation"');
    expect(routedApp).toContain('router.replace("/", { scroll: false })');
    expect(routedApp).toMatch(/<LexigoBootstrappedApp\s+pathname=\{pathname\}\s+onNavigateHome=\{navigateHome\}\s*\/>/);

    expect(bootstrappedApp).not.toContain('from "next/navigation"');
    expect(bootstrappedApp).toContain('import("./lexigo-premium-app")');
    expect(bootstrappedApp).toContain('import("./lexigo-guest-home-app")');
    expect(bootstrappedApp).toContain('import("./lexigo-home-app")');
    expect(bootstrappedApp).toContain('import("./lexigo-onboarding-app")');
    expect(bootstrappedApp).toContain('import("./lexigo-learn-app")');
    expect(bootstrappedApp).toContain('import("./lexigo-active-lesson-app")');
    expect(bootstrappedApp).toContain('import("./lexigo-dictionary-app")');
    expect(bootstrappedApp).toContain('import("./lexigo-phrases-app")');
    expect(bootstrappedApp).toContain('import("./lexigo-progress-app")');
    expect(bootstrappedApp).toContain('import("./lexigo-profile-app")');
    expect(bootstrappedApp).toContain('import("./lexigo-scenario-catalog-app")');
    expect(bootstrappedApp).toContain('import("./lexigo-scenario-app")');
    expect(bootstrappedApp.match(/<LexigoPremiumApp\b/g)).toHaveLength(1);
    expect(bootstrappedApp.match(/<LexigoGuestHomeApp\b/g)).toHaveLength(1);
    expect(bootstrappedApp.match(/<LexigoHomeApp\b/g)).toHaveLength(1);
    expect(bootstrappedApp.match(/<LexigoOnboardingApp\b/g)).toHaveLength(1);
    expect(bootstrappedApp.match(/<LexigoLearnApp\b/g)).toHaveLength(1);
    expect(bootstrappedApp.match(/<LexigoActiveLessonApp\b/g)).toHaveLength(1);
    expect(bootstrappedApp.match(/<LexigoDictionaryApp\b/g)).toHaveLength(1);
    expect(bootstrappedApp.match(/<LexigoPhrasesApp\b/g)).toHaveLength(1);
    expect(bootstrappedApp.match(/<LexigoProgressApp\b/g)).toHaveLength(1);
    expect(bootstrappedApp.match(/<LexigoProfileApp\b/g)).toHaveLength(1);
    expect(bootstrappedApp.match(/<LexigoScenarioCatalogApp\b/g)).toHaveLength(1);
    expect(bootstrappedApp.match(/<LexigoScenarioApp\b/g)).toHaveLength(1);
    expect(bootstrappedApp).toMatch(/restoreBootstrappedSession\(\)[\s\S]*\}, \[pathname, restoreAttempt, sessionRestoreSuppressed\]\);/);
  });

  it("renders the explicit History graph owner without an intermediate pending graph", () => {
    const bootstrappedApp = readSource(componentsDirectory, "lexigo-bootstrapped-app.tsx");

    expect(bootstrappedApp).toContain('type RouteGraph = "dictionary" | "home" | "learn" | "product"');
    expect(bootstrappedApp).toContain('const ROUTE_GRAPH_HISTORY_KEY = "lexigoRouteGraph"');
    expect(bootstrappedApp).toContain("historyRouteGraph(window.location.pathname, event.state)");
    expect(bootstrappedApp).toContain("const effectiveRouteGraph = routeGraphRequest?.pathname === normalizedCurrentPath");
    expect(bootstrappedApp).toContain("mergedNavigationHistoryState(canonicalTarget, expectedGraph)");
    expect(bootstrappedApp).not.toContain("routeGraphPending");
    expect(bootstrappedApp).not.toContain("setRouteGraph(");
  });

  it("allows only the bootstrap layer to load route application entries", () => {
    const sources = componentSources();
    const productGraphConsumers = sources
      .filter(({ source }) => source.includes("lexigo-premium-app"))
      .map(({ file }) => file)
      .sort();
    const guestHomeGraphConsumers = sources
      .filter(({ source }) => source.includes("lexigo-guest-home-app"))
      .map(({ file }) => file)
      .sort();
    const homeGraphConsumers = sources
      .filter(({ source }) => source.includes("lexigo-home-app"))
      .map(({ file }) => file)
      .sort();
    const onboardingGraphConsumers = sources
      .filter(({ source }) => source.includes("lexigo-onboarding-app"))
      .map(({ file }) => file)
      .sort();
    const learnGraphConsumers = sources
      .filter(({ source }) => source.includes("lexigo-learn-app"))
      .map(({ file }) => file)
      .sort();
    const activeLessonGraphConsumers = sources
      .filter(({ source }) => source.includes("lexigo-active-lesson-app"))
      .map(({ file }) => file)
      .sort();
    const dictionaryGraphConsumers = sources
      .filter(({ source }) => source.includes("lexigo-dictionary-app"))
      .map(({ file }) => file)
      .sort();
    const phrasesGraphConsumers = sources
      .filter(({ source }) => source.includes("lexigo-phrases-app"))
      .map(({ file }) => file)
      .sort();
    const progressGraphConsumers = sources
      .filter(({ source }) => source.includes("lexigo-progress-app"))
      .map(({ file }) => file)
      .sort();
    const profileGraphConsumers = sources
      .filter(({ source }) => source.includes("lexigo-profile-app"))
      .map(({ file }) => file)
      .sort();
    const scenarioCatalogGraphConsumers = sources
      .filter(({ source }) => source.includes("lexigo-scenario-catalog-app"))
      .map(({ file }) => file)
      .sort();
    const scenarioGraphConsumers = sources
      .filter(({ source }) => source.includes("lexigo-scenario-app"))
      .map(({ file }) => file)
      .sort();

    expect(productGraphConsumers).toEqual(["lexigo-bootstrapped-app.tsx"]);
    expect(guestHomeGraphConsumers).toEqual(["lexigo-bootstrapped-app.tsx"]);
    expect(homeGraphConsumers).toEqual(["lexigo-bootstrapped-app.tsx"]);
    expect(onboardingGraphConsumers).toEqual(["lexigo-bootstrapped-app.tsx"]);
    expect(learnGraphConsumers).toEqual(["lexigo-bootstrapped-app.tsx"]);
    expect(activeLessonGraphConsumers).toEqual(["lexigo-bootstrapped-app.tsx"]);
    expect(dictionaryGraphConsumers).toEqual(["lexigo-bootstrapped-app.tsx"]);
    expect(phrasesGraphConsumers).toEqual(["lexigo-bootstrapped-app.tsx"]);
    expect(progressGraphConsumers).toEqual(["lexigo-bootstrapped-app.tsx"]);
    expect(profileGraphConsumers).toEqual(["lexigo-bootstrapped-app.tsx"]);
    expect(scenarioCatalogGraphConsumers).toEqual(["lexigo-bootstrapped-app.tsx"]);
    expect(scenarioGraphConsumers).toEqual(["lexigo-bootstrapped-app.tsx"]);
  });

  it("keeps guest Home truthful and account-state free", () => {
    const guestHomeApp = readSource(componentsDirectory, "lexigo-guest-home-app.tsx");

    expect(guestHomeApp).toContain('data-route-client-island="guest-home"');
    expect(guestHomeApp).toContain('authenticationURL({ view: "onboarding" })');
    expect(guestHomeApp).toContain('navigationURL({ view: "learn" })');
    expect(guestHomeApp).not.toContain("/api/v1/progress");
    expect(guestHomeApp).not.toContain("/api/v1/lessons/active");
    expect(guestHomeApp).not.toContain("authorizedJSON");
  });

  it("keeps Home progress, active lesson resolution and presentation inside its authenticated route island", () => {
    const homeApp = readSource(componentsDirectory, "lexigo-home-app.tsx");

    expect(homeApp).toContain('data-route-client-island="home"');
    expect(homeApp).toContain("/api/v1/progress?timezoneOffsetMinutes=");
    expect(homeApp).toContain('"/api/v1/lessons/active"');
    expect(homeApp).toContain('"/api/v1/lessons"');
    expect(homeApp).toContain("lessonResumeURL()");
    expect(homeApp).toContain('data-figma-home-desktop="194:249"');
    expect(homeApp).toContain('data-figma-home-mobile="196:223"');
    expect(homeApp).not.toContain("lexigo-premium-app");
    expect(homeApp).not.toContain("restoreSession");
    expect(homeApp).not.toContain("ReviewOutboxRuntime");
    expect(homeApp).not.toContain("ServiceWorkerRegistration");
  });

  it("keeps onboarding state, reveal sequencing and mutations inside its route island", () => {
    const onboardingApp = readSource(componentsDirectory, "lexigo-onboarding-app.tsx");

    expect(onboardingApp).toContain('data-route-client-island="onboarding"');
    expect(onboardingApp).toContain('"/api/v1/onboarding"');
    expect(onboardingApp).toContain('"/api/v1/onboarding/start"');
    expect(onboardingApp).toContain('/api/v1/onboarding/items/${wordID}/mark');
    expect(onboardingApp).toContain('"/api/v1/onboarding/complete"');
    expect(onboardingApp).toContain('"/api/v1/onboarding/skip"');
    expect(onboardingApp).not.toContain("localStorage");
    expect(onboardingApp).not.toContain("sessionStorage");
    expect(onboardingApp).not.toContain("lexigo-premium-app");
  });

  it("keeps Learn preview, composition and lesson mutations inside its route island", () => {
    const learnApp = readSource(componentsDirectory, "lexigo-learn-app.tsx");

    expect(learnApp).toContain('data-route-client-island="learn"');
    expect(learnApp).toContain('from "./lesson-composer-progressive-shell"');
    expect(learnApp).toContain('"/api/v1/catalog/metadata"');
    expect(learnApp).toContain('"/api/v1/lessons/active"');
    expect(learnApp).toContain('"/api/v1/lessons/preview"');
    expect(learnApp).toContain('"/api/v1/lessons"');
    expect(learnApp).toContain('method: "DELETE"');
    expect(learnApp).toContain("lessonResumeURL()");
    expect(learnApp).not.toContain("lexigo-premium-app");
    expect(learnApp).not.toContain("restoreSession");
    expect(learnApp).not.toContain("ReviewOutboxRuntime");
    expect(learnApp).not.toContain("ServiceWorkerRegistration");
  });

  it("keeps Active Lesson review, result and safe-exit state inside its route island", () => {
    const activeLessonApp = readSource(componentsDirectory, "lexigo-active-lesson-app.tsx");

    expect(activeLessonApp).toContain('data-route-client-island="active-lesson"');
    expect(activeLessonApp).toContain('from "./active-lesson-presentation"');
    expect(activeLessonApp).toContain('from "./lesson-result-presentation"');
    expect(activeLessonApp).toContain('"/api/v1/lessons/active"');
    expect(activeLessonApp).toContain("/review`");
    expect(activeLessonApp).toContain("buildLessonResultSnapshot");
    expect(activeLessonApp).toContain("isDistinctLessonResultCandidate");
    expect(activeLessonApp).not.toContain("lexigo-premium-app");
    expect(activeLessonApp).not.toContain("restoreBootstrappedSession");
    expect(activeLessonApp).not.toContain("ReviewOutboxRuntime");
    expect(activeLessonApp).not.toContain("ServiceWorkerRegistration");
  });

  it("keeps dictionary code inside its route island", () => {
    const dictionaryApp = readSource(componentsDirectory, "lexigo-dictionary-app.tsx");

    expect(dictionaryApp).toContain('from "./dictionary-catalog"');
    expect(dictionaryApp).toContain('data-route-client-island="dictionary"');
    expect(dictionaryApp).not.toContain("lexigo-premium-app");
    expect(dictionaryApp).not.toContain("restoreSession");
  });

  it("keeps Phrases catalog and detail inside its route island", () => {
    const phrasesApp = readSource(componentsDirectory, "lexigo-phrases-app.tsx");

    expect(phrasesApp).toContain('from "./phrases-catalog"');
    expect(phrasesApp).toContain('from "./phrase-detail-presentation"');
    expect(phrasesApp).toContain('data-route-client-island="phrases"');
    expect(phrasesApp).toContain('kind: "phrase"');
    expect(phrasesApp).toContain('source: "phrases"');
    expect(phrasesApp).toContain("/api/v1/phrases/");
    expect(phrasesApp).not.toContain("lexigo-premium-app");
    expect(phrasesApp).not.toContain("restoreSession");
    expect(phrasesApp).not.toContain("ReviewOutboxRuntime");
    expect(phrasesApp).not.toContain("ServiceWorkerRegistration");
  });

  it("keeps Progress API and evidence presentation inside its route island", () => {
    const progressApp = readSource(componentsDirectory, "lexigo-progress-app.tsx");

    expect(progressApp).toContain('from "./progress-evidence-dashboard"');
    expect(progressApp).toContain('data-route-client-island="progress"');
    expect(progressApp).toContain("/api/v1/progress?timezoneOffsetMinutes=");
    expect(progressApp).not.toContain("lexigo-premium-app");
    expect(progressApp).not.toContain("restoreSession");
  });

  it("keeps authenticated Profile preferences inside its route island", () => {
    const profileApp = readSource(componentsDirectory, "lexigo-profile-app.tsx");

    expect(profileApp).toContain('data-route-client-island="profile"');
    expect(profileApp).toContain("/api/v1/progress?timezoneOffsetMinutes=");
    expect(profileApp).toContain("/api/v1/progress/goal?timezoneOffsetMinutes=");
    expect(profileApp).toContain('from "../lib/appearance-preference"');
    expect(profileApp).not.toContain("lexigo-premium-app");
    expect(profileApp).not.toContain("restoreSession");
  });

  it("keeps Scenario catalog reads and presentation inside its route island", () => {
    const catalogApp = readSource(componentsDirectory, "lexigo-scenario-catalog-app.tsx");

    expect(catalogApp).toContain('from "../lib/scenarios"');
    expect(catalogApp).toContain('data-route-client-island="scenario-catalog"');
    expect(catalogApp).toContain('"/api/v1/scenarios"');
    expect(catalogApp).toContain("/api/v1/progress?timezoneOffsetMinutes=");
    expect(catalogApp).not.toContain("lexigo-premium-app");
    expect(catalogApp).not.toContain("restoreSession");
    expect(catalogApp).not.toContain("localStorage");
    expect(catalogApp).not.toContain("sessionStorage");
  });

  it("keeps Scenario lifecycle and evidence presentation inside its route island", () => {
    const scenarioApp = readSource(componentsDirectory, "lexigo-scenario-app.tsx");

    expect(scenarioApp).toContain('from "../lib/scenarios"');
    expect(scenarioApp).toContain("/api/v1/scenario-attempts/");
    expect(scenarioApp).toContain('from "./accessible-dialog"');
    expect(scenarioApp).not.toContain("lexigo-premium-app");
    expect(scenarioApp).not.toContain("restoreSession");
  });

  it("keeps retired alternative roots outside the production tree", () => {
    const restoredAlternatives = retiredAppFiles.filter((file) => (
      existsSync(path.join(componentsDirectory, file))
    ));

    expect(restoredAlternatives).toEqual([]);
  });
});