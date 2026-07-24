import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const stylesheet = fs.readFileSync(
  path.join(process.cwd(), "app", "adaptive-lesson-composer-accessibility.css"),
  "utf8",
);
const layout = fs.readFileSync(path.join(process.cwd(), "app", "layout.tsx"), "utf8");

describe("progressive Lesson Composer accessibility colors", () => {
  it("owns WCAG foregrounds for light and dark recommendation surfaces", () => {
    expect(stylesheet).toContain("--lx-composer-retained-foreground: #176b50;");
    expect(stylesheet).toContain("--lx-composer-milestone-foreground: #7d6200;");
    expect(stylesheet).toContain("--lx-composer-retained-foreground: #72d7b4;");
    expect(stylesheet).toContain("--lx-composer-milestone-foreground: #e7c45e;");
    expect(stylesheet).toContain("color: var(--lx-composer-retained-foreground);");
    expect(stylesheet).toContain("color: var(--lx-composer-milestone-foreground);");
  });

  it("loads after the base composer stylesheet so accessibility ownership wins", () => {
    const baseIndex = layout.indexOf('import "./adaptive-lesson-composer.css";');
    const accessibilityIndex = layout.indexOf('import "./adaptive-lesson-composer-accessibility.css";');

    expect(baseIndex).toBeGreaterThanOrEqual(0);
    expect(accessibilityIndex).toBeGreaterThan(baseIndex);
  });
});
