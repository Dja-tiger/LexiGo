import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const touchTargets = readFileSync(new URL("../app/phrase-detail-touch-targets.css", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const presentation = readFileSync(new URL("../app/phrases.css", import.meta.url), "utf8");
const runtime = readFileSync(new URL("./phrase-detail-presentation.tsx", import.meta.url), "utf8");
const browserProof = readFileSync(new URL("../e2e/phrase-detail-touch-targets.spec.ts", import.meta.url), "utf8");
const packageJSON = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  scripts?: Record<string, string>;
};

describe("Issue #74 Phrase Detail touch-target ownership", () => {
  it("loads one Phrase Detail interaction layer after canonical Phrases target ownership", () => {
    const importName = 'import "./phrase-detail-touch-targets.css";';
    expect(layout).toContain(importName);
    expect(layout.indexOf('import "./phrases.css";')).toBeLessThan(layout.indexOf(importName));
    expect(layout.indexOf('import "./phrases-catalog-touch-targets.css";')).toBeLessThan(layout.indexOf(importName));
    expect(layout.indexOf(importName)).toBeLessThan(layout.indexOf('import "./catalog-enhancements.css";'));
    expect(layout.match(/phrase-detail-touch-targets\.css/g)).toHaveLength(1);
  });

  it("targets exactly the five live Phrase Detail actions outside shared AsyncStatePanel ownership", () => {
    for (const runtimeOwner of [
      'className="lx-phrase-detail-back"',
      'className="lx-phrase-listen"',
      'className="lx-phrase-detail-primary"',
      'className="lx-phrase-detail-secondary"',
      'className="lx-phrase-detail-side"',
    ]) {
      expect(runtime).toContain(runtimeOwner);
    }

    for (const selector of [
      ".lx-phrase-detail-back",
      ".lx-phrase-listen",
      ".lx-phrase-detail-primary",
      ".lx-phrase-detail-secondary",
      ".lx-phrase-detail-side button",
    ]) {
      expect(touchTargets).toContain(selector);
    }

    expect(touchTargets).toContain('[data-route-path^="/phrases/"]');
    expect(touchTargets).not.toContain(".lx-async-state");
    expect(touchTargets).not.toContain(".lx-phrases-topic-chips");
    expect(touchTargets).not.toContain(".lx-phrases-search");
  });

  it("preserves the painted 44px contract while expanding only transparent block-axis hit ownership", () => {
    expect(presentation).toContain(".lx-phrases-reset,\n.lx-phrase-detail-secondary,\n.lx-phrase-detail-back {\n  min-height: 44px;");
    expect(presentation).toContain(".lx-phrase-listen {\n  display: inline-flex;\n  min-height: 44px;");
    expect(presentation).toContain(".lx-phrase-detail-primary,\n.lx-phrase-detail-side button {\n  min-height: 44px;");
    expect(touchTargets).toContain("--lx-phrase-detail-touch-target: 44px;");
    expect(touchTargets).toContain("--lx-phrase-detail-touch-target: 48px;");
    expect(touchTargets).toContain("inset-block: min(0px, calc((100% - var(--lx-phrase-detail-touch-target)) / 2));");
    expect(touchTargets).toContain("inset-inline: 0;");
    expect(touchTargets).toContain("border: 0;");
    expect(touchTargets).toContain("background: transparent;");
    expect(touchTargets).toContain("box-shadow: none;");
    expect(touchTargets).toContain("pointer-events: auto;");
    expect(touchTargets).not.toContain(":focus-visible");
    expect(touchTargets).not.toContain("min-height:");
  });

  it("keeps real-hit and shared-frame non-overlap proof in blocking UI and accessibility commands", () => {
    const uiCommand = packageJSON.scripts?.["test:e2e:ui"] ?? "";
    const accessibilityCommand = packageJSON.scripts?.["test:e2e:a11y"] ?? "";
    for (const command of [uiCommand, accessibilityCommand]) {
      expect(command).toContain("e2e/phrase-detail-touch-targets.spec.ts");
      expect(command.match(/e2e\/phrase-detail-touch-targets\.spec\.ts/g)).toHaveLength(1);
    }

    expect(browserProof).toContain("Issue #74 Phrase Detail touch targets");
    expect(browserProof).toContain('"desktop-chromium", "android-chromium", "ios-webkit"');
    expect(browserProof).toContain("perimeterHits");
    expect(browserProof).toContain("effectiveRects");
    expect(browserProof).toContain("expectIndependentMainActions");
    expect(browserProof).toContain('name: "К списку фраз", exact: true');
    expect(browserProof).toContain('name: "Начать практику", exact: true');
  });
});
