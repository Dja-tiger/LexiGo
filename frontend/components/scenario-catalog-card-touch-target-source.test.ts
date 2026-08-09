import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const touchTargets = readFileSync(new URL("../app/scenario-catalog-card-touch-targets.css", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const presentation = readFileSync(new URL("../app/scenario-catalog.css", import.meta.url), "utf8");
const scenarioCatalog = readFileSync(new URL("./lexigo-scenario-catalog-app.tsx", import.meta.url), "utf8");
const browserProof = readFileSync(new URL("../e2e/scenario-catalog-card-touch-targets.spec.ts", import.meta.url), "utf8");
const packageJSON = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  scripts?: Record<string, string>;
};

describe("Issue #74 Scenario Catalog card-link touch-target ownership", () => {
  it("loads one route interaction layer immediately after Scenario Catalog presentation", () => {
    const presentationImport = 'import "./scenario-catalog.css";';
    const touchImport = 'import "./scenario-catalog-card-touch-targets.css";';
    const nextImport = 'import "./learning-section-switch.css";';

    expect(layout).toContain(touchImport);
    expect(layout.indexOf(presentationImport)).toBeLessThan(layout.indexOf(touchImport));
    expect(layout.indexOf(touchImport)).toBeLessThan(layout.indexOf(nextImport));
    expect(layout.match(/scenario-catalog-card-touch-targets\.css/g)).toHaveLength(1);
  });

  it("proves the canonical runtime owner and excludes already-compliant recommendation actions", () => {
    expect(scenarioCatalog).toContain('className="lx-scenario-catalog-card"');
    expect(scenarioCatalog).toContain('href={scenarioPath(scenario.slug)}');
    expect(scenarioCatalog).toContain('aria-label={`Открыть сценарий «${scenario.title}»`}');
    expect(scenarioCatalog).toContain('<span>Открыть сценарий</span>');
    expect(scenarioCatalog).toContain('className="lx-button primary"');

    expect(presentation).toContain(".lx-scenario-catalog-card > a {\n  min-height: 44px;");
    expect(presentation).toContain(".lx-scenario-catalog-recommendation .lx-button {\n  min-width: 142px;\n  min-height: 48px;");
  });

  it("preserves painted 44px geometry and expands only transparent block-axis hit ownership", () => {
    expect(touchTargets).toContain("--lx-scenario-catalog-card-touch-target: 44px;");
    expect(touchTargets).toContain("--lx-scenario-catalog-card-touch-target: 48px;");
    expect(touchTargets).toContain("@media (pointer: coarse)");
    expect(touchTargets).toContain("inset-block: min(0px, calc((100% - var(--lx-scenario-catalog-card-touch-target)) / 2));");
    expect(touchTargets).toContain("inset-inline: 0;");
    expect(touchTargets).toContain("background: transparent;");
    expect(touchTargets).toContain("border: 0;");
    expect(touchTargets).toContain("box-shadow: none;");
    expect(touchTargets).toContain("pointer-events: auto;");
    expect(touchTargets).not.toContain(":focus-visible");
  });

  it("keeps the cross-browser proof in blocking UI and accessibility commands", () => {
    const uiCommand = packageJSON.scripts?.["test:e2e:ui"] ?? "";
    const accessibilityCommand = packageJSON.scripts?.["test:e2e:a11y"] ?? "";

    for (const command of [uiCommand, accessibilityCommand]) {
      expect(command).toContain("e2e/scenario-catalog-card-touch-targets.spec.ts");
      expect(command.match(/e2e\/scenario-catalog-card-touch-targets\.spec\.ts/g)).toHaveLength(1);
    }

    expect(browserProof).toContain("Issue #74 Scenario Catalog card-link touch targets");
    expect(browserProof).toContain('"desktop-chromium", "android-chromium", "ios-webkit"');
    expect(browserProof).toContain("QUALITY_SCENARIOS");
    expect(browserProof).toContain("perimeterHits");
    expect(browserProof).toContain("expectIndependent");
    expect(browserProof).toContain("window.matchMedia(\"(pointer: coarse)\")");
  });
});
