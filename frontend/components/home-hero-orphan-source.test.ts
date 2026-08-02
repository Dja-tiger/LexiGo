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
const homeAppSource = readFileSync(path.join(componentsDirectory, "lexigo-home-app.tsx"), "utf8");
const premiumAppSource = readFileSync(path.join(componentsDirectory, "lexigo-premium-app.tsx"), "utf8");

const RETIRED_HOME_HERO_CLASSES = new Map<string, number>([
  ["lx-hero-copy", 5],
  ["lx-glow", 1],
  ["lx-floating-card", 4],
  ["lx-book-base", 6],
  ["lx-orbit", 3],
]);

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

function occurrences(source: string, value: string): number {
  return source.split(value).length - 1;
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
  it("has no executable TypeScript or TSX consumer for the bounded candidate family", () => {
    for (const className of RETIRED_HOME_HERO_CLASSES.keys()) {
      expect(executableConsumers(className), className).toEqual([]);
    }
  });

  it("confines every candidate to the exact premium stylesheet inventory", () => {
    const styles = stripComments(premiumStyles);

    for (const [className, expectedCount] of RETIRED_HOME_HERO_CLASSES) {
      expect(cssOwners(className), className).toEqual(["app/premium-ui.css"]);
      expect(occurrences(styles, className), className).toBe(expectedCount);
    }

    expect(
      Array.from(RETIRED_HOME_HERO_CLASSES.entries()).reduce(
        (total, [, expectedCount]) => total + expectedCount,
        0,
      ),
    ).toBe(19);
  });

  it("protects the exact legacy decoration blocks until a separate deletion slice", () => {
    expect(premiumStyles).toContain(
      ".lx-hero-copy {\n  position: relative;\n  z-index: 2;\n  align-self: center;\n}",
    );
    expect(premiumStyles).toContain(
      ".lx-glow {\n  position: absolute;\n  right: 7%;\n  bottom: 1%;",
    );
    expect(premiumStyles).toContain(
      ".lx-floating-card span { font-size: 54px; font-weight: 850; letter-spacing: -0.08em; }",
    );
    expect(premiumStyles).toContain(
      ".lx-book-base span:nth-child(1) { top: 0; }\n.lx-book-base span:nth-child(2) { top: 21px; width: 86%; margin: 0 auto; }\n.lx-book-base span:nth-child(3) { top: 42px; width: 72%; margin: 0 auto; }",
    );
    expect(premiumStyles).toContain(
      ".lx-orbit.orbit-one { top: 55px; right: -8px; width: 320px; height: 160px; transform: rotate(-14deg); }\n.lx-orbit.orbit-two { top: 87px; right: 22px; width: 240px; height: 118px; transform: rotate(18deg); }",
    );
    expect(premiumStyles).toContain(
      ".lx-hero-copy h1 { font-size: 40px; }\n  .lx-hero-art { min-height: 220px; }\n  .lx-floating-card { top: 13px; left: 42%; width: 120px; height: 145px; }\n  .lx-book-base { left: 20%; }",
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
  });

  it("preserves live compatibility Lesson and guest authentication owners", () => {
    expect(executableConsumers("lx-resume-strip")).toContain("components/lexigo-premium-app.tsx");
    expect(executableConsumers("lx-auth-card")).toContain("components/lexigo-premium-app.tsx");
    expect(premiumAppSource).toContain("function renderResumeStrip()");
    expect(premiumAppSource).toContain("function renderProfile()");
    expect(premiumAppSource).toContain('<section className="lx-resume-strip">');
    expect(premiumAppSource).toContain('<section className="lx-auth-card">');
    expect(premiumAppSource).not.toContain("function renderHome()");
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
