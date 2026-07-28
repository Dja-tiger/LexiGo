import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const frontendDirectory = process.cwd();
const appDirectory = path.join(frontendDirectory, "app");
const componentsDirectory = path.join(frontendDirectory, "components");

function readSource(...segments: string[]): string {
  return readFileSync(path.join(...segments), "utf8");
}

function countOccurrences(source: string, marker: string): number {
  return source.split(marker).length - 1;
}

describe("Issue #70 Active Lesson CSS ownership boundary", () => {
  it("keeps the queued-review compatibility stylesheet after the canonical Active Lesson stylesheet", () => {
    const layout = readSource(appDirectory, "layout.tsx");
    const activeLessonImport = 'import "./active-lesson.css";';
    const queuedReviewImport = 'import "./system-states-lesson.css";';

    expect(countOccurrences(layout, activeLessonImport)).toBe(1);
    expect(countOccurrences(layout, queuedReviewImport)).toBe(1);
    expect(layout.indexOf(activeLessonImport)).toBeLessThan(layout.indexOf(queuedReviewImport));
  });

  it("proves that queued-review selectors have one presentation consumer and one stylesheet owner", () => {
    const presentation = readSource(componentsDirectory, "active-lesson-presentation.tsx");
    const stylesheet = readSource(appDirectory, "system-states-lesson.css");
    const componentSources = readdirSync(componentsDirectory)
      .filter((file) => file.endsWith(".ts") || file.endsWith(".tsx"))
      .map((file) => ({ file, source: readSource(componentsDirectory, file) }));

    const markerConsumers = componentSources
      .filter(({ source }) => source.includes("lx-active-lesson__queued-review"))
      .map(({ file }) => file)
      .sort();

    expect(markerConsumers).toEqual([
      "active-lesson-css-boundary.test.ts",
      "active-lesson-presentation.tsx",
    ]);
    expect(presentation).toContain('className="lx-active-lesson__queued-review"');
    expect(stylesheet).toContain(".lx-active-lesson__queued-review {");
    expect(stylesheet).toContain('@media (forced-colors: active)');
    expect(stylesheet).toContain("background: Canvas;");
    expect(stylesheet).toContain("background: Highlight;");
  });

  it("keeps the compatibility family bounded to queued Active Lesson presentation", () => {
    const stylesheet = readSource(appDirectory, "system-states-lesson.css");

    expect(stylesheet).toContain('data-active-lesson-state="queued"');
    expect(stylesheet).toContain(".lx-active-lesson__saved");
    expect(stylesheet).toContain(".lx-active-lesson__confidence");
    expect(stylesheet).not.toContain(".lx-dictionary");
    expect(stylesheet).not.toContain(".lx-phrases");
    expect(stylesheet).not.toContain(".lx-profile");
    expect(stylesheet).not.toContain(".lx-progress");
  });
});
