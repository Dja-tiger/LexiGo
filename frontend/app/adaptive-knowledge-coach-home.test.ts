import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

type PackageManifest = {
  scripts?: Record<string, string>;
};

const appDirectory = path.join(process.cwd(), "app");
const componentDirectory = path.join(process.cwd(), "components");
const designTokenSource = readFileSync(
  path.join(appDirectory, "design-tokens.css"),
  "utf8",
);
const styleSource = readFileSync(
  path.join(appDirectory, "adaptive-knowledge-coach-home.css"),
  "utf8",
);
const accessibilitySource = readFileSync(
  path.join(appDirectory, "adaptive-knowledge-coach-accessibility.css"),
  "utf8",
);
const routedAppSource = readFileSync(
  path.join(componentDirectory, "routed-lexigo-app.tsx"),
  "utf8",
);
const layoutSource = readFileSync(path.join(appDirectory, "layout.tsx"), "utf8");
const packageManifest = JSON.parse(
  readFileSync(path.join(process.cwd(), "package.json"), "utf8"),
) as PackageManifest;

describe("Adaptive Knowledge Coach shell and Home styles", () => {
  it("loads formalized design tokens before the presentation layers", () => {
    expect(layoutSource).toContain('import "./design-tokens.css";');
    expect(layoutSource).toContain('import "./compact-home.css";');
    expect(layoutSource).toContain('import "./adaptive-knowledge-coach-home.css";');
    expect(layoutSource).toContain('import "./adaptive-knowledge-coach-accessibility.css";');
    expect(layoutSource.indexOf('import "./design-tokens.css";')).toBeLessThan(
      layoutSource.indexOf('import "./compact-home.css";'),
    );
    expect(layoutSource.indexOf('import "./adaptive-knowledge-coach-home.css";')).toBeGreaterThan(
      layoutSource.indexOf('import "./compact-home.css";'),
    );
    expect(layoutSource.indexOf('import "./adaptive-knowledge-coach-accessibility.css";')).toBeGreaterThan(
      layoutSource.indexOf('import "./adaptive-knowledge-coach-home.css";'),
    );
  });

  it("keeps Foundation V1 values in the token module and consumes them through semantic aliases", () => {
    expect(designTokenSource).toContain("--ak-color-canvas: #f4f7f5;");
    expect(designTokenSource).toContain("--ak-color-surface: #ffffff;");
    expect(designTokenSource).toContain("--ak-color-primary: #2557c7;");
    expect(designTokenSource).toContain("@media (prefers-color-scheme: dark)");
    expect(designTokenSource).toContain("--ak-color-canvas: #10211d;");
    expect(designTokenSource).toContain("--ak-color-surface: #18302b;");

    expect(styleSource).toContain("--ak-bg: var(--ak-color-canvas);");
    expect(styleSource).toContain("--ak-surface: var(--ak-color-surface);");
    expect(styleSource).toContain("--ak-primary: var(--ak-color-primary);");
    expect(styleSource).toContain("--ak-brand: var(--ak-color-retained);");

    expect(designTokenSource).not.toMatch(/(^|})\s*body\s*\{/m);
    expect(styleSource).not.toMatch(/(^|})\s*body\s*\{/m);
  });

  it("keeps route navigation as the only application shell owner", () => {
    expect(styleSource).toContain(".lx-route-nav--rail");
    expect(styleSource).toContain("width: var(--ak-shell-rail-width);");
    expect(styleSource).toContain(".lx-route-nav--mobile");
    expect(styleSource).toContain("env(safe-area-inset-bottom)");
    expect(styleSource).not.toContain("history.pushState");
    expect(styleSource).toContain(':not([data-route-client-island="dictionary"])');
    expect(styleSource).toContain('.lx-app:not([data-route-client-island="dictionary"]) .lx-main-content');
    expect(styleSource).toContain('.lx-app:not([data-route-client-island="dictionary"]) .lx-view');
  });

  it("does not recolor unfinished routes and keeps external account panels clear of the rail", () => {
    const routedAppBlock = styleSource.match(/\.lx-routed-app\s*\{[\s\S]*?\}/)?.[0] ?? "";
    expect(routedAppBlock).not.toContain("--lx-panel:");
    expect(styleSource).toContain('.lx-main-content[aria-label="Главная"] {');
    expect(routedAppSource).toContain("data-route-path={pathname}");
    expect(accessibilitySource).toContain('.lx-routed-app:not([data-route-path="/"])');
    expect(accessibilitySource).toMatch(/\.lx-routed-app:not\(\[data-route-path="\/"\]\)\s*\{[\s\S]*?background:\s*transparent;/);
    expect(styleSource).toContain("calc(100vw - var(--ak-shell-rail-width) - 80px)");
    expect(styleSource).toContain("box-sizing: border-box;");
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

  it("keeps the Home browser contract in the UI gate without weakening PWA isolation", () => {
    const scripts = packageManifest.scripts ?? {};

    expect(scripts["test:e2e:ui"]).toContain("e2e/adaptive-knowledge-coach-home.spec.ts");
    expect(scripts["test:e2e:pwa"]).toContain("npm run test:e2e:pwa:dictionary");
    expect(scripts["test:e2e:pwa"]).toContain("npm run test:e2e:pwa:session");
    expect(scripts["test:e2e:pwa:dictionary"]).toContain("--workers=1");
    expect(scripts["test:e2e:pwa:session"]).toContain("--workers=1");
  });
});
