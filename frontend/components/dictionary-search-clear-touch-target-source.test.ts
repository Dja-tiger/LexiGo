import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const touchTargets = readFileSync(new URL("../app/dictionary-search-clear-touch-targets.css", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const presentation = readFileSync(new URL("../app/dictionary-catalog.css", import.meta.url), "utf8");
const runtime = readFileSync(new URL("./dictionary-catalog.tsx", import.meta.url), "utf8");
const browserProof = readFileSync(new URL("../e2e/dictionary-search-clear-touch-targets.spec.ts", import.meta.url), "utf8");
const packageJSON = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  scripts?: Record<string, string>;
};

const TARGET_SELECTOR = '.lx-routed-app[data-route-path="/dictionary"] .lx-dictionary-search-clear';
const FORBIDDEN_VISUAL_DECLARATIONS = [
  /\n\s*min-height:/,
  /\n\s*height:/,
  /\n\s*width:/,
  /\n\s*padding(?:-[^:]+)?:/,
  /\n\s*margin(?:-[^:]+)?:/,
  /\n\s*border(?:-[^:]+)?:/,
  /\n\s*background(?:-[^:]+)?:/,
  /\n\s*box-shadow:/,
  /\n\s*transform:/,
  /\n\s*top:/,
  /\n\s*right:/,
  /\n\s*bottom:/,
  /\n\s*left:/,
] as const;

describe("Issue #74 Dictionary search-clear touch-target ownership", () => {
  it("loads one route-scoped interaction owner immediately after Dictionary presentation", () => {
    const importName = 'import "./dictionary-search-clear-touch-targets.css";';
    expect(layout).toContain(importName);
    expect(layout.indexOf('import "./dictionary-catalog.css";')).toBeLessThan(layout.indexOf(importName));
    expect(layout.indexOf(importName)).toBeLessThan(layout.indexOf('import "./word-detail.css";'));
    expect(layout.match(/dictionary-search-clear-touch-targets\.css/g)).toHaveLength(1);
  });

  it("limits ownership to the authenticated conditional clear action", () => {
    expect(runtime).toMatch(/searchInput \? \(\s*<button\s+className="lx-dictionary-search-clear"\s+type="button"\s+aria-label="Очистить поиск"\s+onClick=\{\(\) => \{[\s\S]*?setSearchInput\(""\);[\s\S]*?updateFilters\(\{ query: "", page: 1 \}\);[\s\S]*?\}\}/);
    expect(touchTargets).toContain(TARGET_SELECTOR);
    expect(touchTargets).toContain(`${TARGET_SELECTOR}::before`);
    expect(touchTargets).not.toContain(".lx-dictionary-quick-filters");
    expect(touchTargets).not.toContain(".lx-dictionary-filter-toggle");
    expect(touchTargets).not.toContain(".lx-dictionary-filter-panel");
    expect(touchTargets).not.toContain(".lx-dictionary-result");
  });

  it("provides transparent 44px fine and 48px coarse square event surfaces", () => {
    expect(touchTargets).toContain("--lx-dictionary-search-clear-touch-target: 44px;");
    expect(touchTargets).toContain("@media (pointer: coarse)");
    expect(touchTargets).toContain("--lx-dictionary-search-clear-touch-target: 48px;");
    expect(touchTargets).toContain("position: absolute;");
    expect(touchTargets).toContain("inset: min(0px, calc((100% - var(--lx-dictionary-search-clear-touch-target)) / 2));");
    expect(touchTargets).toContain("pointer-events: auto;");
    expect(touchTargets).toContain("touch-action: manipulation;");
  });

  it("does not take painted presentation or focus ownership", () => {
    for (const forbiddenDeclaration of FORBIDDEN_VISUAL_DECLARATIONS) {
      expect(touchTargets).not.toMatch(forbiddenDeclaration);
    }
    expect(touchTargets).not.toContain(":focus-visible");
  });

  it("preserves the existing 48px field, 36px painted control, inset and focus owner", () => {
    expect(presentation).toContain(".lx-dictionary-search input {\n  width: 100%;\n  min-height: 48px;");
    expect(presentation).toContain(".lx-dictionary-search-clear {\n  position: absolute;\n  right: 7px;");
    expect(presentation).toContain("width: 36px;\n  min-height: 36px;");
    expect(presentation).toContain("top: 50%;");
    expect(presentation).toContain("transform: translateY(-50%);");
    expect(presentation).toContain(".lx-dictionary-catalog button:focus-visible,");
  });

  it("keeps the cross-browser proof in blocking UI and accessibility commands", () => {
    const uiCommand = packageJSON.scripts?.["test:e2e:ui"] ?? "";
    const accessibilityCommand = packageJSON.scripts?.["test:e2e:a11y"] ?? "";
    for (const command of [uiCommand, accessibilityCommand]) {
      expect(command).toContain("e2e/dictionary-search-clear-touch-targets.spec.ts");
      expect(command.match(/e2e\/dictionary-search-clear-touch-targets\.spec\.ts/g)).toHaveLength(1);
    }
    expect(browserProof).toContain("Issue #74 Dictionary search-clear touch target");
    expect(browserProof).toContain('name: "Очистить поиск"');
    expect(browserProof).toContain('"desktop-chromium", "android-chromium", "ios-webkit"');
    expect(browserProof).toContain("targetHeight");
    expect(browserProof).toContain("perimeterHits");
  });
});
