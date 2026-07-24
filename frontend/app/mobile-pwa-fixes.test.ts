import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const appDirectory = path.join(process.cwd(), "app");
const mobileStyleSource = readFileSync(path.join(appDirectory, "mobile-pwa-fixes.css"), "utf8");
const activeLessonStyleSource = readFileSync(path.join(appDirectory, "active-lesson.css"), "utf8");
const lessonResultStyleSource = readFileSync(path.join(appDirectory, "lesson-result.css"), "utf8");

const retiredLessonSelectors = [
  "data-study-view",
  ".lx-study-column",
  ".lx-study-tabs",
  ".lx-simple-word",
  ".lx-cloze-note",
] as const;

describe("mobile PWA style ownership", () => {
  it("does not restore retired Active Lesson presentation selectors", () => {
    for (const selector of retiredLessonSelectors) {
      expect(mobileStyleSource, `${selector} must not be owned by mobile-pwa-fixes.css`).not.toContain(selector);
    }
  });

  it("keeps canonical lesson presentation in isolated feature styles", () => {
    expect(activeLessonStyleSource).toContain(".lx-active-lesson");
    expect(lessonResultStyleSource).toContain(".lx-lesson-result");
    expect(mobileStyleSource).not.toContain(".lx-active-lesson");
    expect(mobileStyleSource).not.toContain(".lx-lesson-result");
  });

  it("retains only shared PWA shell and asynchronous-state responsibilities", () => {
    expect(mobileStyleSource).toContain(".lx-bootstrap");
    expect(mobileStyleSource).toContain(".lx-session-notice");
    expect(mobileStyleSource).toContain(".lx-async-state");
    expect(mobileStyleSource).toContain("@media (display-mode: standalone)");
    expect(mobileStyleSource).toContain("@media (prefers-reduced-motion: reduce)");
  });
});
