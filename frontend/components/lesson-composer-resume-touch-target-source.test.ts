import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const touchTargets = readFileSync(new URL("../app/lesson-composer-resume-touch-targets.css", import.meta.url), "utf8");
const layout = readFileSync(new URL("../app/layout.tsx", import.meta.url), "utf8");
const presentation = readFileSync(new URL("../app/premium-ui.css", import.meta.url), "utf8");
const focusStyles = readFileSync(new URL("../app/accessibility-focus.css", import.meta.url), "utf8");
const runtime = readFileSync(new URL("./lexigo-learn-app.tsx", import.meta.url), "utf8");
const packageJSON = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")) as {
  scripts?: Record<string, string>;
};

const TARGET_SELECTOR = '.lx-main-content[aria-label="Обучение"] .lx-resume-actions > .lx-button';
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
  /\n\s*display:/,
  /\n\s*grid-template[^:]*:/,
] as const;

describe("Issue #74 Learn resume-action touch-target ownership", () => {
  it("loads one narrow owner after Lesson Composer presentation and option owners", () => {
    const importName = 'import "./lesson-composer-resume-touch-targets.css";';
    expect(layout).toContain(importName);
    expect(layout.indexOf('import "./adaptive-lesson-composer.css";')).toBeLessThan(layout.indexOf(importName));
    expect(layout.indexOf('import "./lesson-composer-option-touch-targets.css";')).toBeLessThan(layout.indexOf(importName));
    expect(layout.indexOf(importName)).toBeLessThan(layout.indexOf('import "./active-lesson.css";'));
    expect(layout.match(/lesson-composer-resume-touch-targets\.css/g)).toHaveLength(1);
  });

  it("targets only the two live unfinished-lesson actions", () => {
    expect(runtime).toContain('className="lx-resume-actions"');
    expect(runtime).toMatch(/className="lx-button ghost"[\s\S]*?onClick=\{\(\) => void discardActiveLesson\(\)\}>Сбросить<\/button>/);
    expect(runtime).toMatch(/className="lx-button primary"[\s\S]*?onClick=\{\(\) => openLesson\("lesson_start"\)\}>Продолжить урок<\/button>/);
    expect(touchTargets).toContain(TARGET_SELECTOR);
    expect(touchTargets).toContain(`${TARGET_SELECTOR}::before`);
    expect(touchTargets).not.toContain(".lx-recommended-lesson__start");
    expect(touchTargets).not.toContain(".lx-setup-submit");
    expect(touchTargets).not.toContain(".lx-recommended-lesson__toggle");
    expect(touchTargets).not.toContain(".lx-manual-lesson-composer__summary");
  });

  it("provides 44px fine and 48px coarse block-axis event surfaces", () => {
    expect(touchTargets).toContain("--lx-learn-resume-action-touch-target: 44px;");
    expect(touchTargets).toContain("@media (pointer: coarse)");
    expect(touchTargets).toContain("--lx-learn-resume-action-touch-target: 48px;");
    expect(touchTargets).toContain("position: relative;");
    expect(touchTargets).toContain("position: absolute;");
    expect(touchTargets).toContain("inset-block: min(");
    expect(touchTargets).toContain("calc((100% - var(--lx-learn-resume-action-touch-target)) / 2)");
    expect(touchTargets).toContain("inset-inline: 0;");
    expect(touchTargets).toContain("pointer-events: auto;");
    expect(touchTargets).toContain("touch-action: manipulation;");

    for (const forbiddenDeclaration of FORBIDDEN_VISUAL_DECLARATIONS) {
      expect(touchTargets).not.toMatch(forbiddenDeclaration);
    }
  });

  it("preserves painted button geometry, action separation and the shared focus owner", () => {
    expect(presentation).toContain(".lx-button {\n  display: inline-flex;\n  min-height: 44px;");
    expect(presentation).toContain(".lx-button.large { min-height: 54px;");
    expect(presentation).toContain(".lx-resume-actions { display: flex; gap: 10px; }");
    expect(focusStyles).toContain(":focus-visible {");
    expect(focusStyles).toContain("outline: var(--lx-focus-width) solid var(--lx-focus-ring) !important;");
    expect(touchTargets).not.toContain(":focus-visible");
  });

  it("keeps the shared browser geometry proof in blocking UI and accessibility commands", () => {
    for (const commandName of ["test:e2e:ui", "test:e2e:a11y"] as const) {
      const command = packageJSON.scripts?.[commandName] ?? "";
      expect(command).toContain("e2e/lesson-composer-option-touch-targets.spec.ts");
      expect(command.match(/e2e\/lesson-composer-option-touch-targets\.spec\.ts/g)).toHaveLength(1);
    }
  });
});