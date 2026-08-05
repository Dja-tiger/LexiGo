import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const touchTargets = readFileSync(new URL("../app/home-progress-touch-targets.css", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const presentation = readFileSync(new URL("../app/adaptive-knowledge-coach-home.css", import.meta.url), "utf8");
const focusStyles = readFileSync(new URL("../app/accessibility-focus.css", import.meta.url), "utf8");
const runtime = readFileSync(new URL("./lexigo-home-app.tsx", import.meta.url), "utf8");
const browserProof = readFileSync(new URL("../e2e/adaptive-knowledge-coach-home.spec.ts", import.meta.url), "utf8");
const packageJSON = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  scripts?: Record<string, string>;
};

const TARGET_SELECTOR = '.lx-routed-app .lx-main-content[aria-label="Главная"] .lx-progress-panel > .lx-button';
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
  /\n\s*gap:/,
  /\n\s*display:/,
] as const;

describe("Issue #74 canonical Home progress CTA touch-target ownership", () => {
  it("loads one narrow owner after Home presentation and accessibility styles", () => {
    const importName = 'import "./home-progress-touch-targets.css";';
    expect(layout).toContain(importName);
    expect(layout.indexOf('import "./adaptive-knowledge-coach-home.css";')).toBeLessThan(layout.indexOf(importName));
    expect(layout.indexOf('import "./adaptive-knowledge-coach-accessibility.css";')).toBeLessThan(layout.indexOf(importName));
    expect(layout.indexOf(importName)).toBeLessThan(layout.indexOf('import "./adaptive-lesson-composer.css";'));
    expect(layout.match(/home-progress-touch-targets\.css/g)).toHaveLength(1);
  });

  it("targets only the exposed direct progress-panel action", () => {
    expect(runtime).toMatch(/<button className="lx-button ghost" type="button" onClick=\{\(\) => navigate\(\{ view: "progress" \}\)\}>\s*Открыть прогресс\s*<\/button>/);
    expect(touchTargets).toContain(TARGET_SELECTOR);
    expect(touchTargets).toContain(`${TARGET_SELECTOR}::before`);
    expect(touchTargets).not.toContain(".lx-home-paths");
    expect(touchTargets).not.toContain(".lx-home-next-action-copy");
    expect(touchTargets).not.toContain(".lx-streak");
    expect(touchTargets).not.toContain(".lx-avatar");
  });

  it("provides 44px fine and 48px coarse block-axis event surfaces", () => {
    expect(touchTargets).toContain("--lx-home-progress-touch-target: 44px;");
    expect(touchTargets).toContain("@media (pointer: coarse)");
    expect(touchTargets).toContain("--lx-home-progress-touch-target: 48px;");
    expect(touchTargets).toContain("position: relative;");
    expect(touchTargets).toContain("position: absolute;");
    expect(touchTargets).toContain("inset-block: min(0px, calc((100% - var(--lx-home-progress-touch-target)) / 2));");
    expect(touchTargets).toContain("inset-inline: 0;");
    expect(touchTargets).toContain("pointer-events: auto;");
    expect(touchTargets).toContain("touch-action: manipulation;");

    for (const forbiddenDeclaration of FORBIDDEN_VISUAL_DECLARATIONS) {
      expect(touchTargets).not.toMatch(forbiddenDeclaration);
    }
  });

  it("preserves Home visibility, painted geometry and shared focus ownership", () => {
    expect(presentation).toContain('.lx-routed-app .lx-main-content[aria-label="Главная"] .lx-home-paths {\n  display: none;');
    expect(presentation).toContain('.lx-routed-app .lx-main-content[aria-label="Главная"] .lx-home-next-action-copy .lx-button.primary {\n  width: 100%;\n  min-height: 48px;');
    expect(presentation).toContain('.lx-routed-app .lx-main-content[aria-label="Главная"] .lx-progress-panel > .lx-button {\n  width: 100%;');
    expect(presentation).toContain(".lx-routed-app .lx-button {\n  min-width: 0;\n  min-height: 44px;");
    expect(focusStyles).toContain(":focus-visible {");
    expect(touchTargets).not.toContain(":focus-visible");
  });

  it("keeps the cross-browser proof in the blocking Home UI command", () => {
    const command = packageJSON.scripts?.["test:e2e:ui"] ?? "";
    expect(command).toContain("e2e/adaptive-knowledge-coach-home.spec.ts");
    expect(command.match(/e2e\/adaptive-knowledge-coach-home\.spec\.ts/g)).toHaveLength(1);
    expect(browserProof).toContain("Issue #74 Home progress CTA touch target");
    expect(browserProof).toContain('name: "Открыть прогресс"');
    expect(browserProof).toContain('"desktop-chromium", "android-chromium", "ios-webkit"');
  });
});
