import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

type ManifestItem = Readonly<{
  id: string;
  classification: string;
  evidence: string;
}>;

type PackageScripts = Readonly<Record<string, string>>;

const appDirectory = path.join(process.cwd(), "app");
const componentDirectory = path.join(process.cwd(), "components");
const layout = readFileSync(path.join(appDirectory, "layout.tsx"), "utf8");
const premium = readFileSync(path.join(appDirectory, "premium-ui.css"), "utf8");
const adaptive = readFileSync(path.join(appDirectory, "adaptive-layout.css"), "utf8");
const composer = readFileSync(path.join(appDirectory, "adaptive-lesson-composer.css"), "utf8");
const learnApp = readFileSync(path.join(componentDirectory, "lexigo-learn-app.tsx"), "utf8");
const browserSpec = readFileSync(
  path.join(process.cwd(), "e2e", "adaptive-layout-cascade.spec.ts"),
  "utf8",
);
const rawManifest: unknown = JSON.parse(
  readFileSync(path.join(appDirectory, "global-feature-style-overlap-manifest.json"), "utf8"),
);
const rawPackage: unknown = JSON.parse(
  readFileSync(path.join(process.cwd(), "package.json"), "utf8"),
);

const OWNER_PAIR = "premium-ui.css -> adaptive-layout.css";
const CASCADE_SPEC = "e2e/adaptive-layout-cascade.spec.ts";
const CANONICAL_ANCESTRY = '.lx-main-content[aria-label="Обучение"]';

function parseManifest(value: unknown): readonly ManifestItem[] {
  if (!Array.isArray(value)) throw new Error("Overlap manifest must be an array");

  return value.map((item, index) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      throw new Error(`Manifest item ${index} must be an object`);
    }
    const record = item as Record<string, unknown>;
    if (
      typeof record.id !== "string" ||
      typeof record.classification !== "string" ||
      typeof record.evidence !== "string"
    ) {
      throw new Error(`Manifest item ${index} is malformed`);
    }
    return {
      id: record.id,
      classification: record.classification,
      evidence: record.evidence,
    };
  });
}

function parsePackageScripts(value: unknown): PackageScripts {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Frontend package.json must be an object");
  }
  const scripts = (value as Record<string, unknown>).scripts;
  if (typeof scripts !== "object" || scripts === null || Array.isArray(scripts)) {
    throw new Error("Frontend package.json requires scripts");
  }

  return Object.fromEntries(
    Object.entries(scripts).map(([name, command]) => {
      if (typeof command !== "string") {
        throw new Error(`Frontend package script ${name} must be a string`);
      }
      return [name, command];
    }),
  );
}

function ownerPair(id: string): string {
  const match = id.match(
    / -> ([a-z0-9-]+\.css) \[[^\]]+\] = .* -> ([a-z0-9-]+\.css) \[[^\]]+\] = /,
  );
  if (match === null) throw new Error(`Missing stylesheet pair: ${id}`);
  return `${match[1]} -> ${match[2]}`;
}

function selectorProperty(id: string): string {
  const match = id.match(/^(.+?) \| ([a-z-]+) \| (?:normal|important) -> /);
  if (match === null) throw new Error(`Missing selector/property: ${id}`);
  return `${match[1]} | ${match[2]}`;
}

function specificity(selector: string): number {
  const classes = selector.match(/\.[a-z0-9_-]+/gi)?.length ?? 0;
  const attributes = selector.match(/\[[^\]]+\]/g)?.length ?? 0;
  return classes + attributes;
}

const manifest = parseManifest(rawManifest);
const scripts = parsePackageScripts(rawPackage);
const cluster = manifest.filter((item) => ownerPair(item.id) === OWNER_PAIR);

describe("adaptive Lesson Composer CSS ownership", () => {
  it("keeps exactly the six reviewed generic tablet conflicts", () => {
    expect(cluster).toHaveLength(6);
    expect(cluster.every((item) => item.classification === "requires-proof")).toBe(true);
    expect(cluster.map((item) => selectorProperty(item.id)).sort()).toEqual([
      ".lx-setup-footer | grid-template-columns",
      ".lx-setup-submit | display",
      ".lx-source-selector | grid-template-columns",
      ".lx-source-selector | grid-template-columns",
      ".lx-source-selector | grid-template-columns",
      ".lx-source-selector>button | grid-template-columns",
    ]);
  });

  it("keeps production import order explicit", () => {
    const premiumIndex = layout.indexOf('import "./premium-ui.css";');
    const adaptiveIndex = layout.indexOf('import "./adaptive-layout.css";');
    const composerIndex = layout.indexOf('import "./adaptive-lesson-composer.css";');

    expect(premiumIndex).toBeGreaterThanOrEqual(0);
    expect(adaptiveIndex).toBeGreaterThan(premiumIndex);
    expect(composerIndex).toBeGreaterThan(adaptiveIndex);
  });

  it("preserves generic premium and tablet fallbacks", () => {
    expect(premium).toMatch(
      /\.lx-source-selector\s*\{[^}]*grid-template-columns:\s*repeat\(5, minmax\(0, 1fr\)\);/,
    );
    expect(premium).toMatch(
      /\.lx-source-selector > button\s*\{[^}]*grid-template-columns:\s*auto 1fr;/,
    );
    expect(premium).toMatch(
      /\.lx-setup-footer\s*\{[^}]*grid-template-columns:\s*minmax\(270px, \.55fr\) minmax\(0, 1\.45fr\);/,
    );
    expect(premium).toMatch(/\.lx-setup-submit\s*\{[^}]*display:\s*flex;/);

    expect(adaptive).toMatch(
      /@media \(min-width: 720px\) and \(max-width: 1099px\)[\s\S]*?\.lx-source-selector\s*\{\s*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);/,
    );
    expect(adaptive).toMatch(
      /\.lx-source-selector > button\s*\{[^}]*grid-template-columns:\s*auto minmax\(0, 1fr\);/,
    );
    expect(adaptive).toMatch(/\.lx-setup-footer\s*\{\s*grid-template-columns:\s*1fr;/);
    expect(adaptive).toMatch(/\.lx-setup-submit\s*\{\s*display:\s*grid;/);
  });

  it("uses a stronger canonical Learn owner for every affected selector", () => {
    for (const fallback of [
      ".lx-source-selector",
      ".lx-source-selector > button",
      ".lx-setup-footer",
      ".lx-setup-submit",
    ]) {
      expect(specificity(`${CANONICAL_ANCESTRY} ${fallback}`)).toBeGreaterThan(
        specificity(fallback),
      );
      expect(composer).toContain(`${CANONICAL_ANCESTRY} ${fallback}`);
    }
  });

  it("protects the approved 767/768 canonical geometry", () => {
    expect(composer).toMatch(
      /\.lx-main-content\[aria-label="Обучение"\] \.lx-source-selector\s*\{\s*grid-template-columns:\s*repeat\(3, minmax\(0, 1fr\)\);/,
    );
    expect(composer).toMatch(
      /\.lx-main-content\[aria-label="Обучение"\] \.lx-source-selector > button\s*\{[^}]*grid-template-columns:\s*auto minmax\(0, 1fr\);/,
    );
    expect(composer).toMatch(
      /\.lx-main-content\[aria-label="Обучение"\] \.lx-setup-footer\s*\{\s*display:\s*contents;/,
    );
    expect(composer).toMatch(
      /\.lx-main-content\[aria-label="Обучение"\] \.lx-setup-submit\s*\{\s*display:\s*grid;/,
    );
    expect(composer).toMatch(
      /@media \(max-width: 767px\)[\s\S]*?\.lx-main-content\[aria-label="Обучение"\] \.lx-source-selector\s*\{\s*grid-template-columns:\s*1fr;/,
    );
    expect(composer).toMatch(
      /@media \(max-width: 767px\)[\s\S]*?\.lx-main-content\[aria-label="Обучение"\] \.lx-setup-footer\s*\{\s*display:\s*grid;\s*grid-template-columns:\s*1fr;/,
    );
  });

  it("keeps the live Learn renderer under canonical runtime ancestry", () => {
    expect(learnApp).toContain('className="lx-main-content"');
    expect(learnApp).toContain('aria-label={viewTitle("learn")}');
    expect(learnApp).toContain("lx-source-selector");
    expect(learnApp).toContain("lx-setup-footer");
    expect(learnApp).toContain("lx-setup-submit");
  });

  it("runs the computed proof through both authoritative commands", () => {
    expect(scripts["test:e2e:ui"]).toContain(CASCADE_SPEC);
    expect(scripts["test:e2e:responsive"]).toContain(CASCADE_SPEC);
    expect(browserSpec).toContain('name: "canonical-first fallback-last order"');
    expect(browserSpec).toContain('name: "adaptive-first premium-last order"');
    expect(browserSpec).toContain("expect(snapshot).toEqual(referenceSnapshot)");
    expect(browserSpec).toContain("719");
    expect(browserSpec).toContain("768");
    expect(browserSpec).toContain("1100");
  });
});
