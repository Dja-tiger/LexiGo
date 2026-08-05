import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const touchTargets = readFileSync(new URL("../app/word-detail-back-touch-targets.css", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const presentation = readFileSync(new URL("../app/word-detail.css", import.meta.url), "utf8");
const runtime = readFileSync(new URL("./word-detail-presentation.tsx", import.meta.url), "utf8");
const browserProof = readFileSync(new URL("../e2e/word-detail-back-touch-targets.spec.ts", import.meta.url), "utf8");
const packageJSON = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  scripts?: Record<string, string>;
};

const TARGET_SELECTOR = '.lx-routed-app[data-route-path^="/words/"] .lx-word-detail-back';
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
  /\n\s*color:/,
  /\n\s*font(?:-[^:]+)?:/,
] as const;

describe("Issue #74 Word Detail Back touch-target ownership", () => {
  it("loads one route-scoped interaction owner immediately after Word Detail presentation", () => {
    const importName = 'import "./word-detail-back-touch-targets.css";';
    expect(layout).toContain(importName);
    expect(layout.indexOf('import "./word-detail.css";')).toBeLessThan(layout.indexOf(importName));
    expect(layout.indexOf(importName)).toBeLessThan(layout.indexOf('import "./compact-home.css";'));
    expect(layout.match(/word-detail-back-touch-targets\.css/g)).toHaveLength(1);
  });

  it("limits ownership to the live native Back action and preserves responsive names", () => {
    expect(runtime).toMatch(/<button className="lx-word-detail-back" type="button" onClick=\{onBack\}>/);
    expect(runtime).toContain('<span className="lx-word-detail-back-mobile">Слово</span>');
    expect(runtime).toContain('<span className="lx-word-detail-back-desktop">Словарь</span>');
    expect(touchTargets).toContain(TARGET_SELECTOR);
    expect(touchTargets).toContain(`${TARGET_SELECTOR}::before`);
    expect(touchTargets).not.toContain(".lx-word-detail-phrase-list");
    expect(touchTargets).not.toContain(".lx-word-detail-inline-error");
    expect(touchTargets).not.toContain(".lx-word-detail-speech");
    expect(touchTargets).not.toContain(".lx-word-detail-practice");
  });

  it("provides transparent block-axis 44px fine and 48px coarse event surfaces", () => {
    expect(touchTargets).toContain("--lx-word-detail-back-touch-target: 44px;");
    expect(touchTargets).toContain("@media (pointer: coarse)");
    expect(touchTargets).toContain("--lx-word-detail-back-touch-target: 48px;");
    expect(touchTargets).toContain("position: relative;");
    expect(touchTargets).toContain("position: absolute;");
    expect(touchTargets).toContain("inset-block: min(0px, calc((100% - var(--lx-word-detail-back-touch-target)) / 2));");
    expect(touchTargets).toContain("inset-inline: 0;");
    expect(touchTargets).toContain("pointer-events: auto;");
    expect(touchTargets).toContain("touch-action: manipulation;");
  });

  it("does not take painted presentation or focus ownership", () => {
    for (const forbiddenDeclaration of FORBIDDEN_VISUAL_DECLARATIONS) {
      expect(touchTargets).not.toMatch(forbiddenDeclaration);
    }
    expect(touchTargets).not.toContain(":focus-visible");
  });

  it("preserves the existing 42px painted control and Word Detail focus owner", () => {
    expect(presentation).toContain(".lx-word-detail-back {\n  display: inline-flex;");
    expect(presentation).toContain("min-height: 42px;");
    expect(presentation).toContain("padding: 0;");
    expect(presentation).toContain("border: 0;");
    expect(presentation).toContain("background: transparent;");
    expect(presentation).toContain(".lx-word-detail button:focus-visible,");
  });

  it("keeps the cross-browser proof in blocking UI and accessibility commands", () => {
    const uiCommand = packageJSON.scripts?.["test:e2e:ui"] ?? "";
    const accessibilityCommand = packageJSON.scripts?.["test:e2e:a11y"] ?? "";
    for (const command of [uiCommand, accessibilityCommand]) {
      expect(command).toContain("e2e/word-detail-back-touch-targets.spec.ts");
      expect(command.match(/e2e\/word-detail-back-touch-targets\.spec\.ts/g)).toHaveLength(1);
    }
    expect(browserProof).toContain("Issue #74 Word Detail Back touch target");
    expect(browserProof).toContain('"desktop-chromium", "android-chromium", "ios-webkit"');
    expect(browserProof).toContain('name: expectedName');
    expect(browserProof).toContain("targetHeight");
    expect(browserProof).toContain("perimeterHits");
    expect(browserProof).toContain("statusSeparation");
  });
});
