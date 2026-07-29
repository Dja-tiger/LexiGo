import { existsSync, readFileSync, readdirSync } from "node:fs";
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
  it("keeps the route-scoped queued-state stylesheet after the canonical Active Lesson stylesheet", () => {
    const layout = readSource(appDirectory, "layout.tsx");
    const activeLessonImport = 'import "./active-lesson.css";';
    const queuedStateImport = 'import "./active-lesson-queued-state.css";';
    const retiredGenericImport = 'import "./system-states-lesson.css";';

    expect(countOccurrences(layout, activeLessonImport)).toBe(1);
    expect(countOccurrences(layout, queuedStateImport)).toBe(1);
    expect(layout.indexOf(activeLessonImport)).toBeLessThan(layout.indexOf(queuedStateImport));
    expect(layout).not.toContain(retiredGenericImport);
    expect(existsSync(path.join(appDirectory, "system-states-lesson.css"))).toBe(false);
  });

  it("proves that queued-review selectors have one presentation consumer and one route-scoped stylesheet owner", () => {
    const presentation = readSource(componentsDirectory, "active-lesson-presentation.tsx");
    const stylesheet = readSource(appDirectory, "active-lesson-queued-state.css");
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
    expect(stylesheet).toContain("@media (forced-colors: active)");
    expect(stylesheet).toContain("background: Canvas;");
    expect(stylesheet).toContain("background: Highlight;");
  });

  it("keeps the queued-state family bounded to Active Lesson presentation", () => {
    const stylesheet = readSource(appDirectory, "active-lesson-queued-state.css");

    expect(stylesheet).toContain('data-active-lesson-state="queued"');
    expect(stylesheet).toContain(".lx-active-lesson__saved");
    expect(stylesheet).toContain(".lx-active-lesson__confidence");
    expect(stylesheet).not.toContain(".lx-dictionary");
    expect(stylesheet).not.toContain(".lx-phrases");
    expect(stylesheet).not.toContain(".lx-profile");
    expect(stylesheet).not.toContain(".lx-progress");
  });
});
