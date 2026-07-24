import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const appDirectory = path.join(process.cwd(), "app");
const componentDirectory = path.join(process.cwd(), "components");
const layoutSource = readFileSync(path.join(appDirectory, "layout.tsx"), "utf8");
const styleSource = readFileSync(path.join(appDirectory, "active-lesson.css"), "utf8");
const presentationSource = readFileSync(path.join(componentDirectory, "active-lesson-presentation.tsx"), "utf8");
const premiumAppSource = readFileSync(path.join(componentDirectory, "lexigo-premium-app.tsx"), "utf8");

describe("canonical Active Lesson production slice", () => {
  it("loads an isolated presentation layer after the existing product styles", () => {
    expect(layoutSource).toContain('import "./active-lesson.css";');
    expect(layoutSource.indexOf('import "./active-lesson.css";')).toBeGreaterThan(
      layoutSource.indexOf('import "./adaptive-lesson-composer-accessibility.css";'),
    );
  });

  it("uses Foundation semantic tokens instead of introducing raw feature colors", () => {
    expect(styleSource).toContain("var(--ak-color-canvas)");
    expect(styleSource).toContain("var(--ak-color-surface)");
    expect(styleSource).toContain("var(--ak-color-primary)");
    expect(styleSource).toContain("var(--ak-color-retained)");
    expect(styleSource).toContain("var(--ak-color-weak)");
    const cssWithoutComments = styleSource.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(cssWithoutComments).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });

  it("keeps API, server position, completion and outbox ownership outside presentation", () => {
    expect(presentationSource).not.toContain("fetch(");
    expect(presentationSource).not.toContain("/api/v1");
    expect(presentationSource).not.toContain("lessonVersion");
    expect(presentationSource).not.toContain("ReviewOutbox");
    expect(presentationSource).not.toContain("decideLessonAdvance");

    expect(premiumAppSource).toContain('"/api/v1/lessons/active"');
    expect(premiumAppSource).toContain("lessonVersion: activeLesson.version");
    expect(premiumAppSource).toContain("serverNextIndex");
    expect(premiumAppSource).toContain("serverLessonCompleted");
    expect(premiumAppSource).toContain("<ActiveLessonPresentation");
  });

  it("renders Choice independently from the Recall textbox and exposes semantic option states", () => {
    expect(presentationSource).toContain('mode === "recall"');
    expect(presentationSource).toContain('id="premium-answer"');
    expect(presentationSource).toContain('role="group" aria-label="Варианты ответа"');
    expect(presentationSource).toContain("верный вариант");
    expect(presentationSource).toContain("выбран неверно");
  });

  it("provides compact, medium, desktop, dark-token and reduced-motion behavior", () => {
    expect(styleSource).toContain("@media (max-width: 1040px)");
    expect(styleSource).toContain("@media (max-width: 767px)");
    expect(styleSource).toContain("@media (max-width: 359px)");
    expect(styleSource).toContain("@media (prefers-reduced-motion: reduce)");
    expect(styleSource).toContain("transition-duration: 0.01ms !important;");
    expect(styleSource).toContain("env(safe-area-inset-top)");
    expect(styleSource).toContain("env(safe-area-inset-bottom)");
  });
});
