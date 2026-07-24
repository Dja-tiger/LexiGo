import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const appDirectory = path.join(process.cwd(), "app");
const componentDirectory = path.join(process.cwd(), "components");
const libraryDirectory = path.join(process.cwd(), "lib");
const layoutSource = readFileSync(path.join(appDirectory, "layout.tsx"), "utf8");
const styleSource = readFileSync(path.join(appDirectory, "lesson-result.css"), "utf8");
const presentationSource = readFileSync(path.join(componentDirectory, "lesson-result-presentation.tsx"), "utf8");
const premiumAppSource = readFileSync(path.join(componentDirectory, "lexigo-premium-app.tsx"), "utf8");
const modelSource = readFileSync(path.join(libraryDirectory, "lesson-result.ts"), "utf8");

describe("canonical Lesson Result production slice", () => {
  it("loads its isolated presentation layer after Active Lesson styles", () => {
    expect(layoutSource).toContain('import "./lesson-result.css";');
    expect(layoutSource.indexOf('import "./lesson-result.css";')).toBeGreaterThan(
      layoutSource.indexOf('import "./active-lesson.css";'),
    );
  });

  it("uses declared semantic Foundation tokens with an accessible primary pair", () => {
    expect(styleSource).toContain("var(--ak-color-canvas)");
    expect(styleSource).toContain("var(--ak-color-surface)");
    expect(styleSource).toContain("var(--ak-color-primary)");
    expect(styleSource).toContain("var(--ak-color-retained)");
    expect(styleSource).toContain("var(--ak-color-weak)");
    expect(styleSource).toContain("var(--ak-color-milestone)");
    expect(styleSource).toContain(`.lx-lesson-result__primary {
  border: 1px solid var(--ak-color-primary);
  color: var(--ak-color-surface);
  background: var(--ak-color-primary);
}`);
    expect(styleSource).not.toContain("var(--ak-color-on-primary)");
    const cssWithoutComments = styleSource.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(cssWithoutComments).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });

  it("keeps request, session, scheduler, and navigation ownership outside presentation", () => {
    expect(presentationSource).not.toContain("fetch(");
    expect(presentationSource).not.toContain("/api/v1");
    expect(presentationSource).not.toContain("lessonVersion");
    expect(presentationSource).not.toContain("ReviewOutbox");
    expect(presentationSource).not.toContain("authorizedRequest");

    expect(premiumAppSource).toContain("<LessonResultPresentation");
    expect(premiumAppSource).toContain("isDistinctLessonResultCandidate");
    expect(premiumAppSource).toContain('"/api/v1/lessons/preview"');
    expect(premiumAppSource).toContain('"/api/v1/lessons"');
    expect(premiumAppSource).toContain(
      'navigate({ view: target }, false, { allowLessonExit: true, intent: "in_app_navigation" });',
    );
    expect(premiumAppSource).not.toContain(
      'navigate({ view: target }, true, { allowLessonExit: true, intent: "in_app_navigation" });',
    );
  });

  it("separates objective recall, recognition, and activity evidence", () => {
    expect(modelSource).toContain("recall:");
    expect(modelSource).toContain("recognition:");
    expect(modelSource).toContain("activity:");
    expect(presentationSource).toContain("Самостоятельно");
    expect(presentationSource).toContain("С выбором");
    expect(presentationSource).toContain("Просмотрено");
    expect(presentationSource).toContain("не смешиваются");
  });

  it("exposes one primary action hierarchy and reduced-motion behavior", () => {
    expect(presentationSource.match(/lx-lesson-result__primary/g)?.length).toBe(1);
    expect(presentationSource).toContain('data-lesson-result-state={copy.state}');
    expect(styleSource).toContain("@media (prefers-reduced-motion: reduce)");
    expect(styleSource).toContain("transition-duration: 0.00001s !important;");
    expect(styleSource).toContain("env(safe-area-inset-top)");
    expect(styleSource).toContain("env(safe-area-inset-bottom)");
  });
});
