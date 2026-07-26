import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const frontendDirectory = process.cwd();
const appDirectory = path.join(frontendDirectory, "app");
const componentsDirectory = path.join(frontendDirectory, "components");

const productionAppFiles = [
  "lexigo-bootstrapped-app.tsx",
  "lexigo-dictionary-app.tsx",
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
    expect(routedApp.match(/<LexigoBootstrappedApp\s+pathname=\{pathname\}\s*\/>/g)).toHaveLength(1);

    expect(bootstrappedApp).not.toContain('from "next/navigation"');
    expect(bootstrappedApp).toContain('import("./lexigo-premium-app")');
    expect(bootstrappedApp).toContain('import("./lexigo-dictionary-app")');
    expect(bootstrappedApp).toContain('import("./lexigo-progress-app")');
    expect(bootstrappedApp).toContain('import("./lexigo-profile-app")');
    expect(bootstrappedApp).toContain('import("./lexigo-scenario-catalog-app")');
    expect(bootstrappedApp).toContain('import("./lexigo-scenario-app")');
    expect(bootstrappedApp.match(/<LexigoPremiumApp\b/g)).toHaveLength(1);
    expect(bootstrappedApp.match(/<LexigoDictionaryApp\b/g)).toHaveLength(1);
    expect(bootstrappedApp.match(/<LexigoProgressApp\b/g)).toHaveLength(1);
    expect(bootstrappedApp.match(/<LexigoProfileApp\b/g)).toHaveLength(1);
    expect(bootstrappedApp.match(/<LexigoScenarioCatalogApp\b/g)).toHaveLength(1);
    expect(bootstrappedApp.match(/<LexigoScenarioApp\b/g)).toHaveLength(1);
    expect(bootstrappedApp).toMatch(/restoreBootstrappedSession\(\)[\s\S]*\}, \[pathname, restoreAttempt\]\);/);
  });

  it("allows only the bootstrap layer to load route application entries", () => {
    const sources = componentSources();
    const productGraphConsumers = sources
      .filter(({ source }) => source.includes("lexigo-premium-app"))
      .map(({ file }) => file)
      .sort();
    const dictionaryGraphConsumers = sources
      .filter(({ source }) => source.includes("lexigo-dictionary-app"))
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
    expect(dictionaryGraphConsumers).toEqual(["lexigo-bootstrapped-app.tsx"]);
    expect(progressGraphConsumers).toEqual(["lexigo-bootstrapped-app.tsx"]);
    expect(profileGraphConsumers).toEqual(["lexigo-bootstrapped-app.tsx"]);
    expect(scenarioCatalogGraphConsumers).toEqual(["lexigo-bootstrapped-app.tsx"]);
    expect(scenarioGraphConsumers).toEqual(["lexigo-bootstrapped-app.tsx"]);
  });

  it("keeps dictionary code inside its route island", () => {
    const dictionaryApp = readSource(componentsDirectory, "lexigo-dictionary-app.tsx");

    expect(dictionaryApp).toContain('from "./dictionary-catalog"');
    expect(dictionaryApp).toContain('data-route-client-island="dictionary"');
    expect(dictionaryApp).not.toContain("lexigo-premium-app");
    expect(dictionaryApp).not.toContain("restoreSession");
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
