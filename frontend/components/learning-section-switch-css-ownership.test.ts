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
const scenarioCatalog = readFileSync(path.join(appDirectory, "scenario-catalog.css"), "utf8");
const learningSwitch = readFileSync(path.join(appDirectory, "learning-section-switch.css"), "utf8");
const routeNavigation = readFileSync(
  path.join(componentDirectory, "route-primary-navigation.tsx"),
  "utf8",
);
const scenarioApp = readFileSync(
  path.join(componentDirectory, "lexigo-scenario-catalog-app.tsx"),
  "utf8",
);
const browserSpec = readFileSync(
  path.join(process.cwd(), "e2e", "navigation-mobile-shell-cascade.spec.ts"),
  "utf8",
);
const rawManifest: unknown = JSON.parse(
  readFileSync(path.join(appDirectory, "global-feature-style-overlap-manifest.json"), "utf8"),
);
const rawPackage: unknown = JSON.parse(
  readFileSync(path.join(process.cwd(), "package.json"), "utf8"),
);

const OWNER_PAIR = "scenario-catalog.css -> learning-section-switch.css";
const ROUTED_SELECTOR =
  '.lx-routed-app[data-route-path="/learn"] .lx-learning-section-switch--learn';
const CASCADE_SPEC = "e2e/navigation-mobile-shell-cascade.spec.ts";

function parseManifest(value: unknown): readonly ManifestItem[] {
  if (!Array.isArray(value)) {
    throw new Error("Global feature-style overlap manifest must be an array");
  }

  return value.map((item, index) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      throw new Error(`Manifest item ${index} must be an object`);
    }

    const record = item as Record<string, unknown>;
    if (typeof record.id !== "string" || record.id.length === 0) {
      throw new Error(`Manifest item ${index} requires an id`);
    }
    if (typeof record.classification !== "string") {
      throw new Error(`Manifest item ${index} requires a classification`);
    }
    if (typeof record.evidence !== "string" || record.evidence.length === 0) {
      throw new Error(`Manifest item ${index} requires evidence`);
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
  if (match === null) {
    throw new Error(`Conflict id does not contain a canonical stylesheet pair: ${id}`);
  }
  return `${match[1]} -> ${match[2]}`;
}

function occurrenceCount(source: string, token: string): number {
  return source.split(token).length - 1;
}

function classSpecificity(selector: string): number {
  return selector.match(/\.[a-z0-9_-]+/gi)?.length ?? 0;
}

const manifest = parseManifest(rawManifest);
const scripts = parsePackageScripts(rawPackage);
const switchItems = manifest.filter((item) => ownerPair(item.id) === OWNER_PAIR);

describe("Learn section-switch CSS ownership", () => {
  it("keeps the eight reviewed fallback conflicts explicitly paired with proof", () => {
    expect(switchItems).toHaveLength(8);
    expect(switchItems.every((item) => item.classification === "requires-proof")).toBe(true);
    expect(switchItems.every((item) => item.id.includes(".lx-learning-section-switch--learn"))).toBe(
      true,
    );
    expect(
      new Set(
        switchItems.map((item) => {
          const match = item.id.match(/\.lx-learning-section-switch--learn \| ([a-z-]+) \|/);
          if (match === null) throw new Error(`Missing placement property in ${item.id}`);
          return match[1];
        }),
      ),
    ).toEqual(new Set(["margin-left", "margin-right", "width"]));
  });

  it("keeps production import order while making the routed owner more specific", () => {
    const scenarioIndex = layout.indexOf('import "./scenario-catalog.css";');
    const learningIndex = layout.indexOf('import "./learning-section-switch.css";');

    expect(scenarioIndex).toBeGreaterThanOrEqual(0);
    expect(learningIndex).toBeGreaterThan(scenarioIndex);
    expect(classSpecificity(ROUTED_SELECTOR)).toBeGreaterThan(
      classSpecificity(".lx-learning-section-switch--learn"),
    );
    expect(occurrenceCount(learningSwitch, ROUTED_SELECTOR)).toBe(5);
    expect(learningSwitch.match(/\.lx-learning-section-switch--learn\s*\{/g)).toHaveLength(5);
  });

  it("keeps every Learn placement range under canonical route ancestry", () => {
    expect(learningSwitch).toMatch(
      /\.lx-routed-app\[data-route-path="\/learn"\] \.lx-learning-section-switch--learn\s*\{\s*margin-top:\s*calc\(84px \+ env\(safe-area-inset-top\)\);/,
    );
    expect(learningSwitch).toMatch(
      /@media \(min-width: 720px\) and \(max-width: 1099px\)[\s\S]*?\.lx-routed-app\[data-route-path="\/learn"\] \.lx-learning-section-switch--learn\s*\{[\s\S]*?var\(--lx-navigation-rail-width\)[\s\S]*?860px[\s\S]*?margin-right:\s*24px;[\s\S]*?margin-left:\s*calc\(var\(--lx-navigation-rail-width\) \+ 48px\);/,
    );
    expect(learningSwitch).toMatch(
      /@media \(min-width: 1024px\)[\s\S]*?\.lx-routed-app\[data-route-path="\/learn"\] \.lx-learning-section-switch--learn\s*\{[\s\S]*?1180px[\s\S]*?var\(--ak-shell-rail-width\)[\s\S]*?margin-right:\s*40px;[\s\S]*?margin-left:\s*max\(/,
    );
    expect(learningSwitch).toMatch(
      /@media \(max-width: 719px\)[\s\S]*?\.lx-routed-app\[data-route-path="\/learn"\] \.lx-learning-section-switch--learn\s*\{[\s\S]*?width:\s*calc\(100% - 48px\);[\s\S]*?margin-top:\s*calc\(76px \+ env\(safe-area-inset-top\)\);[\s\S]*?margin-right:\s*auto;[\s\S]*?margin-left:\s*auto;/,
    );
    expect(learningSwitch).toMatch(
      /@media \(max-width: 360px\)[\s\S]*?\.lx-routed-app\[data-route-path="\/learn"\] \.lx-learning-section-switch--learn\s*\{\s*width:\s*calc\(100% - 32px\);/,
    );
    expect(learningSwitch).not.toContain("!important");
  });

  it("preserves Scenario Catalog as visual and compatibility-fallback owner", () => {
    expect(scenarioCatalog).toMatch(
      /\.lx-learning-section-switch\s*\{[\s\S]*?display:\s*grid;[\s\S]*?grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\);/,
    );
    expect(scenarioCatalog).toMatch(
      /\.lx-learning-section-switch--learn\s*\{\s*width:\s*min\(calc\(100% - 48px\), 1180px\);\s*margin:\s*0 auto 20px;/,
    );
    expect(scenarioCatalog).toMatch(
      /@media \(max-width: 719px\)[\s\S]*?\.lx-learning-section-switch,\s*\.lx-learning-section-switch--learn\s*\{\s*width:\s*100%;\s*margin-right:\s*0;\s*margin-left:\s*0;/,
    );
  });

  it("keeps Learn and Scenario renderers semantically separate", () => {
    expect(routeNavigation).toContain('pathname === "/learn"');
    expect(routeNavigation).toContain(
      'className="lx-learning-section-switch lx-learning-section-switch--learn"',
    );
    expect(scenarioApp).toContain(
      'className="lx-learning-section-switch lx-learning-section-switch--scenarios"',
    );
    expect(scenarioApp).not.toContain("lx-learning-section-switch--learn");
  });

  it("runs the adversarial switch proof through both authoritative UI commands", () => {
    expect(scripts["test:e2e:ui"]).toContain(CASCADE_SPEC);
    expect(scripts["test:e2e:responsive"]).toContain(CASCADE_SPEC);
    expect(browserSpec).toContain('scenarioCatalog: readFileSync');
    expect(browserSpec).toContain('learningSwitch: readFileSync');
    expect(browserSpec).toContain('name: "learning-first scenario-last adversarial order"');
    expect(browserSpec).toContain('name: "scenario-first mobile-first adversarial order"');
    expect(browserSpec).toContain("switchMarginLeft");
    expect(browserSpec).toContain("switchMarginRight");
    expect(browserSpec).toContain("switchWidth");
    expect(browserSpec).toContain("expect(snapshot).toEqual(referenceSnapshot)");
  });
});
