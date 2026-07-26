import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

async function source(path: string): Promise<string> {
  return readFile(new URL(path, import.meta.url), "utf8");
}

describe("Scenario catalog route ownership", () => {
  it("keeps catalog and focused detail in separate bootstrap owners", async () => {
    const [layout, bootstrap, catalog, detail, navigation, routeChrome, footer, premium] = await Promise.all([
      source("../app/layout.tsx"),
      source("./lexigo-bootstrapped-app.tsx"),
      source("./lexigo-scenario-catalog-app.tsx"),
      source("./lexigo-scenario-app.tsx"),
      source("../lib/navigation.ts"),
      source("./route-primary-navigation.tsx"),
      source("./legal-footer.tsx"),
      source("./lexigo-premium-app.tsx"),
    ]);

    expect(layout).toContain('import "./scenario-catalog.css";');
    expect(bootstrap).toContain('import("./lexigo-scenario-catalog-app")');
    expect(bootstrap).toContain('pathname === "/scenarios"');
    expect(bootstrap).toContain('pathname.startsWith("/scenarios/")');
    expect(bootstrap.match(/<LexigoScenarioCatalogApp\b/g)).toHaveLength(1);
    expect(bootstrap.match(/<LexigoScenarioApp\b/g)).toHaveLength(1);

    expect(catalog).toContain('data-route-client-island="scenario-catalog"');
    expect(catalog).toContain('"/api/v1/scenarios"');
    expect(catalog).toContain("/api/v1/progress?timezoneOffsetMinutes=");
    expect(catalog).toContain("result.data.items");
    expect(catalog).not.toContain(".sort(");
    expect(catalog).not.toContain("localStorage");
    expect(catalog).not.toContain("sessionStorage");

    expect(detail).toContain('className="lx-scenario"');
    expect(detail).toContain("/api/v1/scenario-attempts/");
    expect(detail).not.toContain('data-route-client-island="scenario-catalog"');
    expect(premium).not.toContain("/api/v1/scenarios");

    expect(navigation).toContain('normalized === "/scenarios"');
    expect(navigation).toContain(': "/scenarios";');
    expect(routeChrome).toContain('entry.view === "learn" && activeView === "scenario"');
    expect(routeChrome).toContain('pathname.startsWith("/scenarios/")');
    expect(routeChrome).toContain('pathname === "/learn" ? <LearningSectionSwitch /> : null');
    expect(footer).toContain('pathname.startsWith("/scenarios/")');
    expect(footer).not.toContain('pathname === "/scenarios"');
  });

  it("keeps one four-item primary navigation and a separate Learning subsection switch", async () => {
    const [navigation, routeChrome, catalog] = await Promise.all([
      source("../lib/navigation.ts"),
      source("./route-primary-navigation.tsx"),
      source("./lexigo-scenario-catalog-app.tsx"),
    ]);

    const primaryEntries = navigation.match(/\{ view: "(?:home|learn|library|progress)", label:/g) ?? [];
    expect(primaryEntries).toHaveLength(4);
    expect(navigation).not.toContain('{ view: "scenario", label:');
    expect(routeChrome).toContain('aria-label="Разделы обучения"');
    expect(catalog).toContain('aria-label="Разделы обучения"');
  });
});
