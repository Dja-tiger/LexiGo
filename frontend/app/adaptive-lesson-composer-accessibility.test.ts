import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const stylesheet = fs.readFileSync(
  path.join(process.cwd(), "app", "adaptive-lesson-composer-accessibility.css"),
  "utf8",
);
const layout = fs.readFileSync(path.join(process.cwd(), "app", "layout.tsx"), "utf8");

const headingSelector = '.lx-main-content[aria-label="Обучение"] .lx-page-heading h1';
const explicitLightHeadingSelector = `html[data-lexigo-appearance="light"] ${headingSelector}`;

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

  it("switches only explicit Light compact Learn to the semantic canvas foreground", () => {
    const fixedHeadingRule = `${headingSelector} {\n  color: var(--lx-composer-hero-foreground);\n}`;
    const explicitLightHeadingRule = `${explicitLightHeadingSelector} {\n    color: var(--ak-color-text-main);\n  }`;
    const fixedHeadingIndex = stylesheet.indexOf(fixedHeadingRule);
    const compactMediaIndex = stylesheet.indexOf("@media (max-width: 767px)");
    const compactStylesheet = stylesheet.slice(compactMediaIndex);

    expect(fixedHeadingIndex).toBeGreaterThanOrEqual(0);
    expect(compactMediaIndex).toBeGreaterThan(fixedHeadingIndex);
    expect(compactStylesheet).toContain(explicitLightHeadingRule);
    expect(compactStylesheet).not.toContain(
      `\n  ${headingSelector} {\n    color: var(--ak-color-text-main);\n  }`,
    );
    expect(compactStylesheet).not.toContain("data-lexigo-resolved-appearance");
  });

  it("loads after the base composer stylesheet so accessibility ownership wins", () => {
    const baseIndex = layout.indexOf('import "./adaptive-lesson-composer.css";');
    const accessibilityIndex = layout.indexOf('import "./adaptive-lesson-composer-accessibility.css";');

    expect(baseIndex).toBeGreaterThanOrEqual(0);
    expect(accessibilityIndex).toBeGreaterThan(baseIndex);
  });
});