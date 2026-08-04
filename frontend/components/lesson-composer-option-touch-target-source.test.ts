import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const touchTargets = readFileSync(new URL("../app/lesson-composer-option-touch-targets.css", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const presentation = readFileSync(new URL("../app/adaptive-lesson-composer.css", import.meta.url), "utf8");
const focusStyles = readFileSync(new URL("../app/accessibility-focus.css", import.meta.url), "utf8");
const runtime = readFileSync(new URL("./lexigo-learn-app.tsx", import.meta.url), "utf8");
const packageJSON = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  scripts?: Record<string, string>;
};

const GROUP_SELECTORS = [
  ".lx-mode-selector > button",
  ".lx-source-selector > button",
  ".lx-size-control > button",
] as const;

const FORBIDDEN_VISUAL_DECLARATIONS = [
  /\n\s*min-height:/,
  /\n\s*height:/,
  /\n\s*width:/,
  /\n\s*padding(?:-[^:]+)?:/,
  /\n\s*border(?:-[^:]+)?:/,
  /\n\s*background(?:-[^:]+)?:/,
  /\n\s*box-shadow:/,
  /\n\s*transform:/,
  /\n\s*gap:/,
  /\n\s*grid-template[^:]*:/,
] as const;

describe("Issue #74 Lesson Composer option touch-target ownership", () => {
  it("loads one narrow owner after all Lesson Composer presentation and disclosure owners", () => {
    const importName = 'import "./lesson-composer-option-touch-targets.css";';
    expect(layout).toContain(importName);
    expect(layout.indexOf('import "./adaptive-lesson-composer.css";')).toBeLessThan(layout.indexOf(importName));
    expect(layout.indexOf('import "./adaptive-lesson-composer-accessibility.css";')).toBeLessThan(layout.indexOf(importName));
    expect(layout.indexOf('import "./lesson-composer-disclosure-touch-targets.css";')).toBeLessThan(layout.indexOf(importName));
    expect(layout.indexOf(importName)).toBeLessThan(layout.indexOf('import "./active-lesson.css";'));
    expect(layout.match(/lesson-composer-option-touch-targets\.css/g)).toHaveLength(1);
  });

  it("targets every live option radiogroup and no lesson action owner", () => {
    for (const selector of GROUP_SELECTORS) {
      expect(touchTargets).toContain(selector);
    }
    expect(runtime).toContain('className="lx-mode-selector" role="radiogroup" aria-label="Режим обучения"');
    expect(runtime).toContain('className="lx-source-selector" role="radiogroup" aria-label="Раздел обучения"');
    expect(runtime).toContain('<legend id="lesson-size-label">Размер урока</legend>');
    expect(runtime).toContain('className="lx-size-control" role="radiogroup" aria-labelledby="lesson-size-label"');
    expect(runtime).toContain("MODE_OPTIONS.map((option) => {");
    expect(runtime).toContain("sourceOptions.map((option) => {");
    expect(runtime).toContain("SIZE_OPTIONS.map((option) => {");
    expect(runtime).toMatch(/function CollectionCard[\s\S]*?className=\{`lx-themed-selector[\s\S]*?role="radio"[\s\S]*?aria-checked=\{selected\}/);
    expect(runtime).toContain("aria-checked={selected}");
    expect(runtime).toContain("tabIndex={selected ? 0 : -1}");
    expect(touchTargets).not.toContain(".lx-recommended-lesson__start");
    expect(touchTargets).not.toContain(".lx-recommended-lesson__toggle");
    expect(touchTargets).not.toContain(".lx-manual-lesson-composer__summary");
    expect(touchTargets).not.toContain(".lx-setup-submit");
  });

  it("provides 44px fine and 48px coarse block-axis event surfaces", () => {
    expect(touchTargets).toContain("--lx-lesson-composer-option-touch-target: 44px;");
    expect(touchTargets).toContain("@media (max-width: 767px) and (pointer: coarse)");
    expect(touchTargets).toContain("--lx-lesson-composer-option-touch-target: 48px;");
    for (const selector of GROUP_SELECTORS) {
      expect(touchTargets).toContain(`${selector}::before`);
    }
    expect(touchTargets).toContain("position: relative;");
    expect(touchTargets).toContain("position: absolute;");
    expect(touchTargets).toContain("inset-block: min(");
    expect(touchTargets).toContain("calc((100% - var(--lx-lesson-composer-option-touch-target)) / 2)");
    expect(touchTargets).toContain("inset-inline: 0;");
    expect(touchTargets).toContain("pointer-events: auto;");
    expect(touchTargets).toContain("touch-action: manipulation;");

    for (const forbiddenDeclaration of FORBIDDEN_VISUAL_DECLARATIONS) {
      expect(touchTargets).not.toMatch(forbiddenDeclaration);
    }
  });

  it("preserves the existing 44px visual floor, 6px spacing and focus owner", () => {
    expect(presentation).toContain(".lx-mode-selector > button {\n    display: flex;\n    min-height: 44px;");
    expect(presentation).toContain(".lx-source-selector > button {\n    min-height: 44px;");
    expect(presentation).toContain(".lx-size-control button {\n    min-height: 44px;");
    expect(presentation.match(/gap: 6px;/g)?.length ?? 0).toBeGreaterThanOrEqual(3);
    expect(focusStyles).toContain(":focus-visible {");
    expect(focusStyles).toContain("outline: var(--lx-focus-width) solid var(--lx-focus-ring) !important;");
    expect(touchTargets).not.toContain(":focus-visible");
  });

  it("registers the browser proof in blocking UI and accessibility commands", () => {
    for (const commandName of ["test:e2e:ui", "test:e2e:a11y"] as const) {
      const command = packageJSON.scripts?.[commandName] ?? "";
      expect(command).toContain("e2e/lesson-composer-option-touch-targets.spec.ts");
      expect(command.match(/e2e\/lesson-composer-option-touch-targets\.spec\.ts/g)).toHaveLength(1);
    }
  });
});
