import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const touchTargets = readFileSync(
  new URL("../app/word-detail-related-phrase-touch-targets.css", import.meta.url),
  "utf8",
);
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const presentation = readFileSync(new URL("../app/word-detail.css", import.meta.url), "utf8");
const runtime = readFileSync(new URL("./word-detail-presentation.tsx", import.meta.url), "utf8");
const navigationOwner = readFileSync(new URL("./dictionary-catalog.tsx", import.meta.url), "utf8");
const browserProof = readFileSync(
  new URL("../e2e/word-detail-related-phrase-touch-targets.spec.ts", import.meta.url),
  "utf8",
);
const packageJSON = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  scripts?: Record<string, string>;
};

const TARGET_SELECTOR = '.lx-routed-app[data-route-path^="/words/"] .lx-word-detail-phrase-list button';
const LIST_SELECTOR = '.lx-routed-app[data-route-path^="/words/"] .lx-word-detail-phrase-list';
const FORBIDDEN_VISUAL_DECLARATIONS = [
  /\n\s*min-height:/,
  /\n\s*height:/,
  /\n\s*width:/,
  /\n\s*padding(?:-[^:]+)?:/,
  /\n\s*margin(?:-[^:]+)?:/,
  /\n\s*border(?:-[^:]+)?:/,
  /\n\s*border-radius:/,
  /\n\s*background(?:-[^:]+)?:/,
  /\n\s*box-shadow:/,
  /\n\s*transform:/,
  /\n\s*color:/,
  /\n\s*font(?:-[^:]+)?:/,
] as const;

describe("Issue #74 Word Detail related-phrase touch-target ownership", () => {
  it("loads one route-scoped interaction owner after the existing Word Detail owners", () => {
    const importName = 'import "./word-detail-related-phrase-touch-targets.css";';
    expect(layout).toContain(importName);
    expect(layout.indexOf('import "./word-detail.css";')).toBeLessThan(layout.indexOf(importName));
    expect(layout.indexOf('import "./word-detail-back-touch-targets.css";')).toBeLessThan(
      layout.indexOf(importName),
    );
    expect(layout.indexOf(importName)).toBeLessThan(layout.indexOf('import "./compact-home.css";'));
    expect(layout.match(/word-detail-related-phrase-touch-targets\.css/g)).toHaveLength(1);
  });

  it("limits ownership to the live mapped native phrase actions and canonical slug handoff", () => {
    expect(runtime).toContain('<ul className="lx-word-detail-phrase-list" aria-label="Связанные фразы">');
    expect(runtime).toContain("{phrases.map((phrase) => (");
    expect(runtime).toMatch(
      /<button\s+type="button"\s+lang="en"\s+onClick=\{\(\) => onOpen\(phrase\)\}/,
    );
    expect(navigationOwner).toContain("onOpenPhrase={(phrase) => {");
    expect(navigationOwner).toContain("if (!phrase.slug) return;");
    expect(navigationOwner).toContain(
      'onNavigate({ view: "phrases", detail: phrase.slug }, false, undefined, "catalog_open_detail");',
    );
    expect(touchTargets).toContain(TARGET_SELECTOR);
    expect(touchTargets).toContain(`${TARGET_SELECTOR}::before`);
    expect(touchTargets).not.toContain(".lx-word-detail-inline-error");
    expect(touchTargets).not.toContain(".lx-word-detail-back");
    expect(touchTargets).not.toContain(".lx-word-detail-speech");
    expect(touchTargets).not.toContain(".lx-word-detail-practice");
    expect(touchTargets).not.toContain(".lx-word-detail-knowledge");
  });

  it("provides transparent block-axis 44px fine and 48px coarse event surfaces", () => {
    expect(touchTargets).toContain("--lx-word-detail-related-phrase-touch-target: 44px;");
    expect(touchTargets).toContain("@media (pointer: coarse)");
    expect(touchTargets).toContain("--lx-word-detail-related-phrase-touch-target: 48px;");
    expect(touchTargets).toContain("position: relative;");
    expect(touchTargets).toContain("position: absolute;");
    expect(touchTargets).toContain(
      "inset-block: min(0px, calc((100% - var(--lx-word-detail-related-phrase-touch-target)) / 2));",
    );
    expect(touchTargets).toContain("inset-inline: 0;");
    expect(touchTargets).toContain("pointer-events: auto;");
    expect(touchTargets).toContain("touch-action: manipulation;");
  });

  it("reserves the exact coarse-pointer wrapped-row separation without changing painted pills", () => {
    expect(touchTargets).toContain(`${LIST_SELECTOR} {\n    row-gap: 14px;`);
    expect(presentation).toContain(".lx-word-detail-phrase-list {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 10px;");
    expect(presentation).toContain(
      ".lx-word-detail-phrase-list button {\n  max-width: 100%;\n  min-height: 34px;\n  padding: 7px 16px;",
    );
    expect(presentation).toContain("border-radius: 999px;");
    expect(presentation).toContain(".lx-word-detail button:focus-visible,");
  });

  it("does not take painted presentation or focus ownership", () => {
    for (const forbiddenDeclaration of FORBIDDEN_VISUAL_DECLARATIONS) {
      expect(touchTargets).not.toMatch(forbiddenDeclaration);
    }
    expect(touchTargets).not.toContain(":hover");
    expect(touchTargets).not.toContain(":focus-visible");
  });

  it("keeps the cross-browser proof in blocking UI and accessibility commands", () => {
    const uiCommand = packageJSON.scripts?.["test:e2e:ui"] ?? "";
    const accessibilityCommand = packageJSON.scripts?.["test:e2e:a11y"] ?? "";
    for (const command of [uiCommand, accessibilityCommand]) {
      expect(command).toContain("e2e/word-detail-related-phrase-touch-targets.spec.ts");
      expect(command.match(/e2e\/word-detail-related-phrase-touch-targets\.spec\.ts/g)).toHaveLength(1);
    }
    expect(browserProof).toContain("Issue #74 Word Detail related-phrase touch targets");
    expect(browserProof).toContain('"desktop-chromium", "android-chromium", "ios-webkit"');
    expect(browserProof).toContain("targetHeight");
    expect(browserProof).toContain("perimeterHits");
    expect(browserProof).toContain("targetOverlap");
    expect(browserProof).toContain("rowGap");
    expect(browserProof).toContain("prepare-a-rollback-plan");
  });
});
