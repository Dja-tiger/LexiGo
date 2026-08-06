import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const touchTargets = readFileSync(
  new URL("../app/word-detail-related-phrase-retry-touch-targets.css", import.meta.url),
  "utf8",
);
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const presentation = readFileSync(new URL("../app/word-detail.css", import.meta.url), "utf8");
const runtime = readFileSync(new URL("./word-detail-presentation.tsx", import.meta.url), "utf8");
const routeOwner = readFileSync(new URL("./word-detail-route.tsx", import.meta.url), "utf8");
const browserProof = readFileSync(
  new URL("../e2e/word-detail-related-phrase-retry-touch-targets.spec.ts", import.meta.url),
  "utf8",
);
const packageJSON = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  scripts?: Record<string, string>;
};

const TARGET_SELECTOR = '.lx-routed-app[data-route-path^="/words/"] .lx-word-detail-inline-error button';
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
  /\n\s*gap:/,
] as const;

describe("Issue #74 Word Detail related-phrase retry touch-target ownership", () => {
  it("loads one route-scoped interaction owner after the existing Word Detail target owners", () => {
    const importName = 'import "./word-detail-related-phrase-retry-touch-targets.css";';
    expect(layout).toContain(importName);
    expect(layout.indexOf('import "./word-detail.css";')).toBeLessThan(layout.indexOf(importName));
    expect(layout.indexOf('import "./word-detail-back-touch-targets.css";')).toBeLessThan(
      layout.indexOf(importName),
    );
    expect(layout.indexOf('import "./word-detail-related-phrase-touch-targets.css";')).toBeLessThan(
      layout.indexOf(importName),
    );
    expect(layout.indexOf(importName)).toBeLessThan(layout.indexOf('import "./compact-home.css";'));
    expect(layout.match(/word-detail-related-phrase-retry-touch-targets\.css/g)).toHaveLength(1);
  });

  it("limits ownership to the conditional native retry action and existing retry state", () => {
    expect(runtime).toContain('<div className="lx-word-detail-inline-error" role="status">');
    expect(runtime).toContain(
      '{problem?.retryable ? <button type="button" onClick={onRetry}>Повторить</button> : null}',
    );
    expect(routeOwner).toContain("const [relatedRetry, setRelatedRetry] = useState(0);");
    expect(routeOwner).toContain("loadRelatedPhrases, relatedRetry");
    expect(routeOwner).toContain(
      "onRetryRelated={() => setRelatedRetry((value) => value + 1)}",
    );
    expect(touchTargets).toContain(TARGET_SELECTOR);
    expect(touchTargets).toContain(`${TARGET_SELECTOR}::before`);
    expect(touchTargets).not.toContain(".lx-word-detail-phrase-list");
    expect(touchTargets).not.toContain(".lx-word-detail-back");
    expect(touchTargets).not.toContain(".lx-word-detail-speech");
    expect(touchTargets).not.toContain(".lx-word-detail-practice");
    expect(touchTargets).not.toContain(".lx-word-detail-knowledge");
  });

  it("provides transparent block-axis 44px fine and 48px coarse event surfaces", () => {
    expect(touchTargets).toContain("--lx-word-detail-related-phrase-retry-touch-target: 44px;");
    expect(touchTargets).toContain("@media (pointer: coarse)");
    expect(touchTargets).toContain("--lx-word-detail-related-phrase-retry-touch-target: 48px;");
    expect(touchTargets).toContain("position: relative;");
    expect(touchTargets).toContain("position: absolute;");
    expect(touchTargets).toContain(
      "inset-block: min(0px, calc((100% - var(--lx-word-detail-related-phrase-retry-touch-target)) / 2));",
    );
    expect(touchTargets).toContain("inset-inline: 0;");
    expect(touchTargets).toContain("pointer-events: auto;");
    expect(touchTargets).toContain("touch-action: manipulation;");
  });

  it("preserves the existing 36px painted button and surrounding error layout", () => {
    expect(presentation).toContain(
      ".lx-word-detail-inline-error {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;",
    );
    expect(presentation).toContain(
      ".lx-word-detail-inline-error button {\n  min-height: 36px;\n  padding: 7px 12px;\n  border: 1px solid var(--lx-word-border);\n  border-radius: 10px;",
    );
    expect(presentation).toContain(".lx-word-detail button:focus-visible,");
    expect(presentation).toContain(".lx-word-detail-inline-error button,");
  });

  it("does not take painted presentation, spacing or focus ownership", () => {
    for (const forbiddenDeclaration of FORBIDDEN_VISUAL_DECLARATIONS) {
      expect(touchTargets).not.toMatch(forbiddenDeclaration);
    }
    expect(touchTargets).not.toContain(":hover");
    expect(touchTargets).not.toContain(":focus-visible");
    expect(touchTargets).not.toContain("forced-colors");
  });

  it("keeps the cross-browser proof in blocking UI and accessibility commands", () => {
    const uiCommand = packageJSON.scripts?.["test:e2e:ui"] ?? "";
    const accessibilityCommand = packageJSON.scripts?.["test:e2e:a11y"] ?? "";
    for (const command of [uiCommand, accessibilityCommand]) {
      expect(command).toContain("e2e/word-detail-related-phrase-retry-touch-targets.spec.ts");
      expect(
        command.match(/e2e\/word-detail-related-phrase-retry-touch-targets\.spec\.ts/g),
      ).toHaveLength(1);
    }
    expect(browserProof).toContain("Issue #74 Word Detail related-phrase retry touch target");
    expect(browserProof).toContain('"desktop-chromium", "android-chromium", "ios-webkit"');
    expect(browserProof).toContain("targetHeight");
    expect(browserProof).toContain("perimeterHits");
    expect(browserProof).toContain("messageOverlap");
    expect(browserProof).toContain("relatedRequestCount");
  });
});
