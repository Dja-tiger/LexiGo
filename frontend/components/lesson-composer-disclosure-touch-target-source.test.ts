import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const touchTargets = readFileSync(new URL("../app/lesson-composer-disclosure-touch-targets.css", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const presentation = readFileSync(new URL("../app/adaptive-lesson-composer.css", import.meta.url), "utf8");
const focusStyles = readFileSync(new URL("../app/accessibility-focus.css", import.meta.url), "utf8");
const runtime = readFileSync(new URL("./lesson-composer-progressive-shell.tsx", import.meta.url), "utf8");
const packageJSON = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  scripts?: Record<string, string>;
};

const COLLAPSED_SELECTOR = ".lx-recommended-lesson__toggle";
const EXPANDED_SELECTOR = ".lx-manual-lesson-composer__summary";

describe("Issue #74 Lesson Composer disclosure touch-target ownership", () => {
  it("loads one narrow owner after the existing Lesson Composer presentation owners", () => {
    const importName = 'import "./lesson-composer-disclosure-touch-targets.css";';
    expect(layout).toContain(importName);
    expect(layout.indexOf('import "./adaptive-lesson-composer.css";')).toBeLessThan(layout.indexOf(importName));
    expect(layout.indexOf('import "./adaptive-lesson-composer-accessibility.css";')).toBeLessThan(layout.indexOf(importName));
    expect(layout.indexOf(importName)).toBeLessThan(layout.indexOf('import "./active-lesson.css";'));
    expect(layout.match(/lesson-composer-disclosure-touch-targets\.css/g)).toHaveLength(1);
  });

  it("targets only the two live mutually exclusive disclosure buttons", () => {
    expect(runtime).toContain(`className="${COLLAPSED_SELECTOR.slice(1)}"`);
    expect(runtime).toContain("<span>Настроить урок</span>");
    expect(runtime).toContain(`className="${EXPANDED_SELECTOR.slice(1)}"`);
    expect(runtime).toContain("<strong>Ручная настройка</strong>");
    expect(runtime.match(/aria-expanded=\{expanded\}/g)).toHaveLength(2);
    expect(runtime).toContain('aria-controls="lesson-composer-settings"');
    expect(runtime).toContain('aria-controls="lesson-composer-controls"');
    expect(touchTargets).toContain(COLLAPSED_SELECTOR);
    expect(touchTargets).toContain(EXPANDED_SELECTOR);
    expect(touchTargets).not.toContain(".lx-mode-selector");
    expect(touchTargets).not.toContain(".lx-source-selector");
    expect(touchTargets).not.toContain(".lx-size-control");
  });

  it("provides 44px fine and 48px coarse event surfaces without visual declarations", () => {
    expect(touchTargets).toContain("--lx-lesson-composer-disclosure-touch-target: 44px;");
    expect(touchTargets).toContain("@media (max-width: 767px) and (pointer: coarse)");
    expect(touchTargets).toContain("--lx-lesson-composer-disclosure-touch-target: 48px;");
    expect(touchTargets).toContain(`${COLLAPSED_SELECTOR}::before`);
    expect(touchTargets).toContain(`${EXPANDED_SELECTOR}::before`);
    expect(touchTargets).toContain("position: relative;");
    expect(touchTargets).toContain("position: absolute;");
    expect(touchTargets).toContain("inset-block: min(");
    expect(touchTargets).toContain("calc((100% - var(--lx-lesson-composer-disclosure-touch-target)) / 2)");
    expect(touchTargets).toContain("inset-inline: 0;");
    expect(touchTargets).toContain("pointer-events: auto;");
    expect(touchTargets).toContain("touch-action: manipulation;");

    for (const forbidden of ["min-height:", "height:", "padding:", "border:", "background:", "box-shadow:", "transform:"]) {
      expect(touchTargets).not.toContain(forbidden);
    }
  });

  it("preserves existing painted and focus owners", () => {
    expect(presentation).toContain(`${COLLAPSED_SELECTOR},\n  ${EXPANDED_SELECTOR} {`);
    expect(presentation).toContain("min-height: 44px;");
    expect(presentation).toContain(`${EXPANDED_SELECTOR} {\n    justify-content: space-between;`);
    expect(focusStyles).toContain(":focus-visible {");
    expect(focusStyles).toContain("outline: var(--lx-focus-width) solid var(--lx-focus-ring) !important;");
    expect(touchTargets).not.toContain(":focus-visible");
  });

  it("registers the browser proof in blocking UI and accessibility commands", () => {
    for (const commandName of ["test:e2e:ui", "test:e2e:a11y"] as const) {
      const command = packageJSON.scripts?.[commandName] ?? "";
      expect(command).toContain("e2e/lesson-composer-disclosure-touch-targets.spec.ts");
      expect(command.match(/e2e\/lesson-composer-disclosure-touch-targets\.spec\.ts/g)).toHaveLength(1);
    }
  });
});
