import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const touchTargets = readFileSync(new URL("../app/dictionary-catalog-touch-targets.css", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const presentation = readFileSync(new URL("../app/dictionary-catalog.css", import.meta.url), "utf8");
const runtime = readFileSync(new URL("./dictionary-catalog.tsx", import.meta.url), "utf8");
const browserProof = readFileSync(new URL("../e2e/dictionary-catalog-touch-targets.spec.ts", import.meta.url), "utf8");
const packageJSON = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  scripts?: Record<string, string>;
};

describe("Issue #74 Dictionary catalog touch-target ownership", () => {
  it("loads one route-scoped interaction layer after canonical Dictionary presentation", () => {
    const importName = 'import "./dictionary-catalog-touch-targets.css";';
    expect(layout).toContain(importName);
    expect(layout.indexOf('import "./dictionary-catalog.css";')).toBeLessThan(layout.indexOf(importName));
    expect(layout.indexOf('import "./dictionary-search-clear-touch-targets.css";')).toBeLessThan(layout.indexOf(importName));
    expect(layout.indexOf(importName)).toBeLessThan(layout.indexOf('import "./word-detail.css";'));
    expect(layout.match(/dictionary-catalog-touch-targets\.css/g)).toHaveLength(1);
  });

  it("targets only live Dictionary catalog controls that remain below the modality contract", () => {
    for (const runtimeOwner of [
      'className="lx-dictionary-quick-filters"',
      'className="lx-dictionary-filter-panel"',
      'className="lx-dictionary-reset"',
      'label="Навигация по страницам словаря"',
    ]) {
      expect(runtime).toContain(runtimeOwner);
    }

    for (const selector of [
      ".lx-dictionary-quick-filters button",
      ".lx-dictionary-filter-panel button",
      ".lx-dictionary-results-panel .lx-catalog-pagination .lx-button",
    ]) {
      expect(touchTargets).toContain(selector);
    }

    expect(touchTargets).not.toContain(".lx-dictionary-search-clear");
    expect(touchTargets).not.toContain(".lx-dictionary-filter-toggle");
    expect(touchTargets).not.toContain(".lx-dictionary-result > button");
  });

  it("preserves painted 34/38/44 geometry while expanding only transparent block-axis hit ownership", () => {
    expect(presentation).toContain(".lx-dictionary-quick-filters button {\n  min-width: 72px;\n  min-height: 34px;");
    expect(presentation).toContain(".lx-dictionary-filter-panel button {\n  width: 100%;\n  min-height: 38px;");
    expect(touchTargets).toContain("--lx-dictionary-catalog-touch-target: 44px;");
    expect(touchTargets).toContain("--lx-dictionary-catalog-touch-target: 48px;");
    expect(touchTargets).toContain("inset-block: min(0px, calc((100% - var(--lx-dictionary-catalog-touch-target)) / 2));");
    expect(touchTargets).toContain("inset-inline: 0;");
    expect(touchTargets).toContain("border: 0;");
    expect(touchTargets).toContain("background: transparent;");
    expect(touchTargets).toContain("box-shadow: none;");
    expect(touchTargets).toContain("pointer-events: auto;");
    expect(touchTargets).not.toContain(":focus-visible");
  });

  it("reserves positive separation only where expanded stacked targets require it", () => {
    expect(touchTargets).toContain(":is(.lx-dictionary-filter-stack, .lx-dictionary-filter-grid)");
    expect(touchTargets).toContain("row-gap: 12px;");
    expect(touchTargets).toContain("@media (max-width: 340px)");
    expect(touchTargets).toContain("row-gap: 16px;");
    expect(presentation).toContain(".lx-dictionary-filter-stack,\n.lx-dictionary-filter-grid {\n  display: grid;\n  gap: 8px;");
    expect(presentation).toContain("@media (max-width: 340px) {\n  .lx-dictionary-quick-filters {\n    grid-template-columns: repeat(2, minmax(0, 1fr));");
  });

  it("keeps the cross-browser proof in blocking UI and accessibility commands", () => {
    const uiCommand = packageJSON.scripts?.["test:e2e:ui"] ?? "";
    const accessibilityCommand = packageJSON.scripts?.["test:e2e:a11y"] ?? "";
    for (const command of [uiCommand, accessibilityCommand]) {
      expect(command).toContain("e2e/dictionary-catalog-touch-targets.spec.ts");
      expect(command.match(/e2e\/dictionary-catalog-touch-targets\.spec\.ts/g)).toHaveLength(1);
    }

    expect(browserProof).toContain("Issue #74 Dictionary catalog touch targets");
    expect(browserProof).toContain('"desktop-chromium", "android-chromium", "ios-webkit"');
    expect(browserProof).toContain("perimeterHits");
    expect(browserProof).toContain("effectiveRects");
    expect(browserProof).toContain("expectIndependent");
    expect(browserProof).toContain('name: "Слабые", exact: true');
    expect(browserProof).toContain('name: "Следующая →", exact: true');
  });
});
