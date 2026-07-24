import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const appDirectory = path.join(process.cwd(), "app");
const componentDirectory = path.join(process.cwd(), "components");
const layoutSource = readFileSync(path.join(appDirectory, "layout.tsx"), "utf8");
const styleSource = readFileSync(path.join(appDirectory, "adaptive-lesson-composer.css"), "utf8");
const shellSource = readFileSync(path.join(componentDirectory, "lesson-composer-progressive-shell.tsx"), "utf8");
const premiumAppSource = readFileSync(path.join(componentDirectory, "lexigo-premium-app.tsx"), "utf8");

describe("progressive Lesson Composer", () => {
  it("loads its isolated Figma presentation layer last", () => {
    expect(layoutSource).toContain('import "./adaptive-lesson-composer.css";');
    expect(layoutSource.indexOf('import "./adaptive-lesson-composer.css";')).toBeGreaterThan(
      layoutSource.indexOf('import "./adaptive-knowledge-coach-accessibility.css";'),
    );
  });

  it("keeps recommendation-first disclosure below 768px and full desktop controls", () => {
    expect(styleSource).toContain("@media (max-width: 767px)");
    expect(styleSource).toContain('.lx-progressive-lesson-composer[data-mobile-expanded="true"] .lx-manual-lesson-composer');
    expect(styleSource).toMatch(/\.lx-manual-lesson-composer\s*\{[\s\S]*?display:\s*none;/);
    expect(styleSource).toContain("grid-template-columns: minmax(0, 1fr) 360px;");
  });

  it("uses native disclosure controls and semantic state", () => {
    expect(shellSource).toContain("aria-expanded={expanded}");
    expect(shellSource).toContain('aria-controls="lesson-composer-settings"');
    expect(shellSource).toContain('aria-controls="lesson-composer-controls"');
    expect(shellSource).toContain('data-mobile-expanded={expanded ? "true" : "false"}');
    expect(shellSource).not.toContain("onKeyDown");
  });

  it("keeps lesson API ownership in the production app", () => {
    expect(premiumAppSource).toContain('useState<StudyMode>("recall")');
    expect(premiumAppSource).toContain("<LessonComposerProgressiveShell");
    expect(premiumAppSource).toContain('onStart={() => void startLesson(session, { topic: lessonTopic, journeyIntent: "lesson_start" })}');
    expect(shellSource).not.toContain("fetch(");
    expect(shellSource).not.toContain("/api/");
  });

  it("removes optional motion under reduced-motion preferences", () => {
    expect(styleSource).toContain("@media (prefers-reduced-motion: reduce)");
    expect(styleSource).toContain("animation: none !important;");
    expect(styleSource).toContain("transition: none !important;");
  });
});
