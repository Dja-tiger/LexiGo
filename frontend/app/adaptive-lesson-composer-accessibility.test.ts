import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const stylesheet = fs.readFileSync(
  path.join(process.cwd(), "app", "adaptive-lesson-composer-accessibility.css"),
  "utf8",
);
const layout = fs.readFileSync(path.join(process.cwd(), "app", "layout.tsx"), "utf8");

const headingSelector = '.lx-main-content[aria-label="Обучение"] .lx-page-heading h1';

describe("progressive Lesson Composer accessibility colors", () => {
  it("owns WCAG foregrounds for hero, recommendation and preview surfaces", () => {
    expect(stylesheet).toContain("--lx-composer-hero-foreground: #f4f7f5;");
    expect(stylesheet).toContain("--lx-composer-retained-foreground: #176b50;");
    expect(stylesheet).toContain("--lx-composer-milestone-foreground: #7d6200;");
    expect(stylesheet).toContain("--lx-composer-preview-foreground: #72d7b4;");
    expect(stylesheet).toContain("--lx-composer-retained-foreground: #72d7b4;");
    expect(stylesheet).toContain("--lx-composer-milestone-foreground: #e7c45e;");
    expect(stylesheet).toContain("color: var(--lx-composer-hero-foreground);");
    expect(stylesheet).toContain("color: var(--lx-composer-retained-foreground);");
    expect(stylesheet).toContain("color: var(--lx-composer-milestone-foreground);");
    expect(stylesheet).toContain("color: var(--lx-composer-preview-foreground);");
  });

  it("switches the transparent compact hero back to the semantic canvas foreground", () => {
    const fixedHeadingRule = `${headingSelector} {\n  color: var(--lx-composer-hero-foreground);\n}`;
    const compactMediaIndex = stylesheet.indexOf("@media (max-width: 767px)");
    const fixedHeadingIndex = stylesheet.indexOf(fixedHeadingRule);
    const compactHeadingIndex = stylesheet.indexOf(headingSelector, fixedHeadingIndex + headingSelector.length);
    const compactForegroundIndex = stylesheet.indexOf(
      "color: var(--ak-color-text-main);",
      compactHeadingIndex,
    );

    expect(fixedHeadingIndex).toBeGreaterThanOrEqual(0);
    expect(compactMediaIndex).toBeGreaterThan(fixedHeadingIndex);
    expect(compactHeadingIndex).toBeGreaterThan(compactMediaIndex);
    expect(compactForegroundIndex).toBeGreaterThan(compactHeadingIndex);
  });

  it("loads after the base composer stylesheet so accessibility ownership wins", () => {
    const baseIndex = layout.indexOf('import "./adaptive-lesson-composer.css";');
    const accessibilityIndex = layout.indexOf('import "./adaptive-lesson-composer-accessibility.css";');

    expect(baseIndex).toBeGreaterThanOrEqual(0);
    expect(accessibilityIndex).toBeGreaterThan(baseIndex);
  });
});
