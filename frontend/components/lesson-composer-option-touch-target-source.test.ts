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

const GROUPS = [
  { selector: ".lx-mode-selector > button", name: "Режим обучения" },
  { selector: ".lx-source-selector > button", name: "Раздел обучения" },
  { selector: ".lx-size-control > button", name: "Размер урока" },
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
    for (const group of GROUPS) {
      expect(touchTargets).toContain(group.selector);
      expect(runtime).toContain(`aria-label="${group.name}"`);
    }
    expect(runtime.match(/role="radiogroup"/g)).toHaveLength(3);
    expect(runtime.match(/role="radio"/g)).toHaveLength(3);
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
    for (const group of GROUPS) {
      expect(touchTargets).toContain(`${group.selector}::before`);
    }
    expect(touchTargets).toContain("position: relative;");
    expect(touchTargets).toContain("position: absolute;");
    expect(touchTargets).toContain("inset-block: min(");
    expect(touchTargets).toContain("calc((100% - var(--lx-lesson-composer-option-touch-target)) / 2)");
    expect(touchTargets).toContain("inset-inline: 0;");
    expect(touchTargets).toContain("pointer-events: auto;");
    expect(touchTargets).toContain("touch-action: manipulation;");

    for (const forbidden of ["min-height:", "height:", "width:", "padding:", "border:", "background:", "box-shadow:", "transform:", "gap:", "grid-template"] as const) {
      expect(touchTargets).not.toContain(forbidden);
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
