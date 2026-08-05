import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const touchTargets = readFileSync(new URL("../app/phrases-search-clear-touch-targets.css", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const presentation = readFileSync(new URL("../app/phrases.css", import.meta.url), "utf8");
const runtime = readFileSync(new URL("./phrases-catalog.tsx", import.meta.url), "utf8");
const browserProof = readFileSync(new URL("../e2e/phrases-search-clear-touch-targets.spec.ts", import.meta.url), "utf8");
const packageJSON = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  scripts?: Record<string, string>;
};

const TARGET_SELECTOR = '.lx-routed-app[data-route-path="/phrases"] .lx-phrases-search-clear';
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

describe("Issue #74 Phrases search-clear touch-target ownership", () => {
  it("loads one route-scoped interaction owner immediately after Phrases presentation", () => {
    const importName = 'import "./phrases-search-clear-touch-targets.css";';
    expect(layout).toContain(importName);
    expect(layout.indexOf('import "./phrases.css";')).toBeLessThan(layout.indexOf(importName));
    expect(layout.indexOf(importName)).toBeLessThan(layout.indexOf('import "./catalog-enhancements.css";'));
    expect(layout.match(/phrases-search-clear-touch-targets\.css/g)).toHaveLength(1);
  });

  it("targets only the conditionally exposed search-clear icon control", () => {
    expect(runtime).toMatch(/searchInput \? \(\s*<button className="lx-phrases-search-clear" type="button" onClick=\{onSearchClear\} aria-label="Очистить поиск">×<\/button>\s*\) : null/);
    expect(touchTargets).toContain(TARGET_SELECTOR);
    expect(touchTargets).toContain(`${TARGET_SELECTOR}::before`);
    expect(touchTargets).not.toContain(".lx-phrases-topic-chips");
    expect(touchTargets).not.toContain(".lx-phrases-search-submit");
    expect(touchTargets).not.toContain(".lx-phrases-filters");
  });

  it("provides transparent 44px fine and 48px coarse square event surfaces", () => {
    expect(touchTargets).toContain("--lx-phrases-search-clear-touch-target: 44px;");
    expect(touchTargets).toContain("@media (pointer: coarse)");
    expect(touchTargets).toContain("--lx-phrases-search-clear-touch-target: 48px;");
    expect(touchTargets).toContain("position: absolute;");
    expect(touchTargets).toContain("inset: min(0px, calc((100% - var(--lx-phrases-search-clear-touch-target)) / 2));");
    expect(touchTargets).toContain("pointer-events: auto;");
    expect(touchTargets).toContain("touch-action: manipulation;");

    for (const forbiddenDeclaration of FORBIDDEN_VISUAL_DECLARATIONS) {
      expect(touchTargets).not.toMatch(forbiddenDeclaration);
    }
  });

  it("preserves the existing painted box, input clearance, responsive positioning and focus owner", () => {
    expect(presentation).toContain(".lx-phrases-search input {\n  width: 100%;\n  min-height: 48px;");
    expect(presentation).toContain(".lx-phrases-search-clear {\n  position: absolute;");
    expect(presentation).toContain("width: 36px;\n  min-height: 36px;");
    expect(presentation).toContain("top: 6px;");
    expect(presentation).toContain(".lx-phrases-search-clear {\n    right: 70px;\n    top: 6px;");
    expect(presentation).toContain(".lx-phrases-catalog button:focus-visible,");
    expect(touchTargets).not.toContain(":focus-visible");
  });

  it("keeps the cross-browser proof in blocking UI and accessibility commands", () => {
    const uiCommand = packageJSON.scripts?.["test:e2e:ui"] ?? "";
    const accessibilityCommand = packageJSON.scripts?.["test:e2e:a11y"] ?? "";
    for (const command of [uiCommand, accessibilityCommand]) {
      expect(command).toContain("e2e/phrases-search-clear-touch-targets.spec.ts");
      expect(command.match(/e2e\/phrases-search-clear-touch-targets\.spec\.ts/g)).toHaveLength(1);
    }
    expect(browserProof).toContain("Issue #74 Phrases search-clear touch target");
    expect(browserProof).toContain('name: "Очистить поиск"');
    expect(browserProof).toContain('"desktop-chromium", "android-chromium", "ios-webkit"');
  });
});
