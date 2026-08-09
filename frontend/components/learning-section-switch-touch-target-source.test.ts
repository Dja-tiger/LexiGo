import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const touchTargets = readFileSync(new URL("../app/learning-section-switch-touch-targets.css", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const presentation = readFileSync(new URL("../app/scenario-catalog.css", import.meta.url), "utf8");
const routeChrome = readFileSync(new URL("./route-primary-navigation.tsx", import.meta.url), "utf8");
const scenarioCatalog = readFileSync(new URL("./lexigo-scenario-catalog-app.tsx", import.meta.url), "utf8");
const browserProof = readFileSync(new URL("../e2e/learning-section-switch-touch-targets.spec.ts", import.meta.url), "utf8");
const packageJSON = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  scripts?: Record<string, string>;
};

describe("Issue #74 Learning section switch touch-target ownership", () => {
  it("loads one shared interaction layer after both switch presentation owners", () => {
    const presentationImport = 'import "./scenario-catalog.css";';
    const placementImport = 'import "./learning-section-switch.css";';
    const touchImport = 'import "./learning-section-switch-touch-targets.css";';

    expect(layout).toContain(touchImport);
    expect(layout.indexOf(presentationImport)).toBeLessThan(layout.indexOf(touchImport));
    expect(layout.indexOf(placementImport)).toBeLessThan(layout.indexOf(touchImport));
    expect(layout.indexOf(touchImport)).toBeLessThan(layout.indexOf('import "./scenario-lessons.css";'));
    expect(layout.match(/learning-section-switch-touch-targets\.css/g)).toHaveLength(1);
  });

  it("proves both canonical runtime owners use the same semantic switch", () => {
    expect(routeChrome).toContain('function LearningSectionSwitch()');
    expect(routeChrome).toContain('className="lx-learning-section-switch lx-learning-section-switch--learn"');
    expect(routeChrome).toContain('aria-label="Разделы обучения"');
    expect(routeChrome).toContain('target={{ view: "learn" }}');
    expect(routeChrome).toContain('target={{ view: "scenario" }}');

    expect(scenarioCatalog).toContain('className="lx-learning-section-switch"');
    expect(scenarioCatalog).toContain('<Link href="/learn" prefetch={false}>Уроки</Link>');
    expect(scenarioCatalog).toContain('href="/scenarios"');
    expect(scenarioCatalog).toContain('aria-current="page"');
  });

  it("preserves the painted 44px geometry and expands only transparent block-axis hit ownership", () => {
    expect(presentation).toContain("grid-template-columns: repeat(2, minmax(120px, 1fr));");
    expect(presentation).toContain(".lx-learning-section-switch a {\n  min-height: 44px;");
    expect(touchTargets).toContain("--lx-learning-section-touch-target: 44px;");
    expect(touchTargets).toContain("--lx-learning-section-touch-target: 48px;");
    expect(touchTargets).toContain("@media (pointer: coarse)");
    expect(touchTargets).toContain("inset-block: min(0px, calc((100% - var(--lx-learning-section-touch-target)) / 2));");
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
      expect(command).toContain("e2e/learning-section-switch-touch-targets.spec.ts");
      expect(command.match(/e2e\/learning-section-switch-touch-targets\.spec\.ts/g)).toHaveLength(1);
    }

    expect(browserProof).toContain("Issue #74 Learning section switch touch targets");
    expect(browserProof).toContain('"desktop-chromium", "android-chromium", "ios-webkit"');
    expect(browserProof).toContain('"/learn"');
    expect(browserProof).toContain('"/scenarios"');
    expect(browserProof).toContain("perimeterHits");
    expect(browserProof).toContain("expectIndependent");
    expect(browserProof).toContain("window.matchMedia(\"(pointer: coarse)\")");
  });
});
