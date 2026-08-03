import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const frontendDirectory = process.cwd();
const appDirectory = path.join(frontendDirectory, "app");
const componentsDirectory = path.join(frontendDirectory, "components");
const libDirectory = path.join(frontendDirectory, "lib");

const layoutSource = readFileSync(path.join(appDirectory, "layout.tsx"), "utf8");
const premiumStyles = readFileSync(path.join(appDirectory, "premium-ui.css"), "utf8");
const compactHomeStyles = readFileSync(path.join(appDirectory, "compact-home.css"), "utf8");
const adaptiveHomeStyles = readFileSync(
  path.join(appDirectory, "adaptive-knowledge-coach-home.css"),
  "utf8",
);
const homeAppSource = readFileSync(path.join(componentsDirectory, "lexigo-home-app.tsx"), "utf8");
const premiumAppSource = readFileSync(path.join(componentsDirectory, "lexigo-premium-app.tsx"), "utf8");

const RETIRED_HOME_HERO_CLASSES = [
  "lx-hero-copy",
  "lx-glow",
  "lx-floating-card",
  "lx-book-base",
  "lx-orbit",
] as const;

function filesMatching(directory: string, pattern: RegExp): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const absolutePath = path.join(directory, entry);
    const stats = statSync(absolutePath);

    if (stats.isDirectory()) return filesMatching(absolutePath, pattern);
    return pattern.test(entry) ? [absolutePath] : [];
  });
}

function executableSourceFiles(directory: string): string[] {
  return filesMatching(directory, /\.(?:ts|tsx)$/).filter(
    (file) => !/\.(?:test|spec)\.(?:ts|tsx)$/.test(file),
  );
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function executableConsumers(value: string): string[] {
  return [appDirectory, componentsDirectory, libDirectory]
    .flatMap(executableSourceFiles)
    .filter((file) => stripComments(readFileSync(file, "utf8")).includes(value))
    .map((file) => path.relative(frontendDirectory, file))
    .sort();
}

function cssOwners(value: string): string[] {
  return filesMatching(appDirectory, /\.css$/)
    .filter((file) => stripComments(readFileSync(file, "utf8")).includes(value))
    .map((file) => path.relative(frontendDirectory, file))
    .sort();
}

describe("legacy Home hero-decoration CSS reachability", () => {
  it("has no executable TypeScript or TSX consumer for the retired family", () => {
    for (const className of RETIRED_HOME_HERO_CLASSES) {
      expect(executableConsumers(className), className).toEqual([]);
    }
  });

  it("requires physical CSS absence for every retired class", () => {
    for (const className of RETIRED_HOME_HERO_CLASSES) {
      expect(cssOwners(className), className).toEqual([]);
      expect(stripComments(premiumStyles), className).not.toContain(className);
    }
  });

  it("preserves the canonical Home hero shell declarations", () => {
    expect(premiumStyles).toContain(
      ".lx-hero-card {\n  position: relative;\n  display: grid;\n  min-height: 350px;\n  grid-template-columns: minmax(0, 1.1fr) minmax(250px, 0.9fr);",
    );
    expect(premiumStyles).toContain(
      ".lx-hero-card::before {\n  position: absolute;\n  inset: 0;",
    );
    expect(premiumStyles).toContain(
      ".lx-hero-art {\n  position: relative;\n  z-index: 1;\n  min-height: 280px;\n}",
    );
    expect(premiumStyles).toContain(
      ".lx-hero-actions,\n.lx-page-actions {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 12px;\n  margin-top: 25px;\n}",
    );
    expect(premiumStyles).toContain(
      ".lx-hero-card { min-height: 520px; grid-template-columns: 1fr; padding: 26px 22px; }\n  .lx-hero-art { min-height: 220px; }",
    );
  });

  it("preserves the canonical Home hero shell and compact presentation owners", () => {
    expect(executableConsumers("lx-hero-card")).toContain("components/lexigo-home-app.tsx");
    expect(executableConsumers("lx-hero-art")).toContain("components/lexigo-home-app.tsx");
    expect(executableConsumers("lx-word-preview")).toContain("components/lexigo-home-app.tsx");
    expect(executableConsumers("lx-home-next-action-copy")).toContain("components/lexigo-home-app.tsx");
    expect(executableConsumers("lx-progress-panel")).toContain("components/lexigo-home-app.tsx");

    expect(homeAppSource).toContain('data-route-client-island="home"');
    expect(homeAppSource).toContain('<article className="lx-hero-card">');
    expect(homeAppSource).toContain('<div className="lx-hero-art" aria-hidden="true">');
    expect(homeAppSource).toContain('<div className="lx-word-preview">');
    expect(compactHomeStyles).toContain(".lx-home-next-action .lx-hero-card {");
    expect(compactHomeStyles).toContain(".lx-home-next-action .lx-hero-art {");
    expect(adaptiveHomeStyles).toContain(
      '.lx-routed-app .lx-main-content[aria-label="Главная"] .lx-hero-card {',
    );
  });

  it("preserves live compatibility Lesson and guest authentication owners", () => {
    expect(executableConsumers("lx-resume-strip")).toContain("components/lexigo-premium-app.tsx");
    expect(executableConsumers("lx-auth-card")).toContain("components/lexigo-premium-app.tsx");
    expect(premiumAppSource).toContain("function renderResumeStrip()");
    expect(premiumAppSource).toContain("function renderProfile()");
    expect(premiumAppSource).toContain('<section className="lx-resume-strip">');
    expect(premiumAppSource).toContain('<section className="lx-auth-card">');
    expect(premiumAppSource).not.toContain("function renderHome()");
    expect(premiumStyles).toContain(".lx-resume-strip {");
    expect(premiumStyles).toContain(".lx-auth-card { display: grid;");
  });

  it("keeps the global stylesheet ownership order unchanged", () => {
    const premiumIndex = layoutSource.indexOf('import "./premium-ui.css";');
    const compactHomeIndex = layoutSource.indexOf('import "./compact-home.css";');
    const adaptiveHomeIndex = layoutSource.indexOf('import "./adaptive-knowledge-coach-home.css";');

    expect(premiumIndex).toBeGreaterThan(-1);
    expect(compactHomeIndex).toBeGreaterThan(premiumIndex);
    expect(adaptiveHomeIndex).toBeGreaterThan(compactHomeIndex);
  });
});
