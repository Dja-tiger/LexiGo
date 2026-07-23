import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const appDirectory = path.join(process.cwd(), "app");
const styleSource = readFileSync(
  path.join(appDirectory, "adaptive-knowledge-coach-home.css"),
  "utf8",
);
const layoutSource = readFileSync(path.join(appDirectory, "layout.tsx"), "utf8");

describe("Adaptive Knowledge Coach shell and Home styles", () => {
  it("loads the design layer after the previous Home presentation layer", () => {
    expect(layoutSource).toContain('import "./compact-home.css";');
    expect(layoutSource).toContain('import "./adaptive-knowledge-coach-home.css";');
    expect(layoutSource.indexOf('import "./adaptive-knowledge-coach-home.css";')).toBeGreaterThan(
      layoutSource.indexOf('import "./compact-home.css";'),
    );
  });

  it("defines semantic Light and Dark tokens without taking ownership of body", () => {
    expect(styleSource).toContain("--ak-bg: #f4f7f5;");
    expect(styleSource).toContain("--ak-surface-strong: #14362e;");
    expect(styleSource).toContain("@media (prefers-color-scheme: dark)");
    expect(styleSource).toContain("--ak-bg: #0b211b;");
    expect(styleSource).not.toMatch(/(^|})\s*body\s*\{/m);
  });

  it("keeps route navigation as the only application shell owner", () => {
    expect(styleSource).toContain(".lx-route-nav--rail");
    expect(styleSource).toContain("width: var(--ak-shell-rail-width);");
    expect(styleSource).toContain(".lx-route-nav--mobile");
    expect(styleSource).toContain("env(safe-area-inset-bottom)");
    expect(styleSource).not.toContain("history.pushState");
    expect(styleSource).not.toContain("data-route-client-island");
  });

  it("keeps Home focused on a single next-best action", () => {
    expect(styleSource).toContain('.lx-main-content[aria-label="Главная"] .lx-home-paths');
    expect(styleSource).toMatch(/\.lx-home-paths\s*\{[\s\S]*?display:\s*none;/);
    expect(styleSource).toContain('.lx-main-content[aria-label="Главная"] .lx-home-next-action-copy .lx-button.primary');
    expect(styleSource).toContain("width: 100%;");
  });

  it("preserves reduced-motion semantics", () => {
    expect(styleSource).toContain("@media (prefers-reduced-motion: reduce)");
    expect(styleSource).toContain("transition: none !important;");
    expect(styleSource).toContain("animation: none !important;");
  });
});
