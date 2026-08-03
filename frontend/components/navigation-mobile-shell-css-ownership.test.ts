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
const layout = readFileSync(path.join(appDirectory, "layout.tsx"), "utf8");
const premium = readFileSync(path.join(appDirectory, "premium-ui.css"), "utf8");
const mobile = readFileSync(path.join(appDirectory, "mobile-pwa-fixes.css"), "utf8");
const adaptive = readFileSync(path.join(appDirectory, "adaptive-navigation.css"), "utf8");
const routedApp = readFileSync(
  path.join(process.cwd(), "components", "routed-lexigo-app.tsx"),
  "utf8",
);
const browserSpec = readFileSync(
  path.join(process.cwd(), "e2e", "navigation-mobile-shell-cascade.spec.ts"),
  "utf8",
);
const visualConfig = readFileSync(
  path.join(process.cwd(), "playwright.visual.config.ts"),
  "utf8",
);
const rawManifest: unknown = JSON.parse(
  readFileSync(path.join(appDirectory, "global-feature-style-overlap-manifest.json"), "utf8"),
);
const rawPackage: unknown = JSON.parse(
  readFileSync(path.join(process.cwd(), "package.json"), "utf8"),
);

const CASCADE_SPEC = "e2e/navigation-mobile-shell-cascade.spec.ts";
const SKIA_BASELINE_ARG = "--disable-skia-runtime-opts";
const PREMIUM_MOBILE_PAIR = "premium-ui.css -> mobile-pwa-fixes.css";
const PREMIUM_ADAPTIVE_PAIR = "premium-ui.css -> adaptive-navigation.css";
const MOBILE_ADAPTIVE_PAIR = "mobile-pwa-fixes.css -> adaptive-navigation.css";
const RESOURCE_STACK_CONFLICT_ID =
  '.lx-resource-stack | width | normal -> mobile-pwa-fixes.css [global] = "min(1160px, calc(100% - 28px))" -> adaptive-navigation.css [@media (min-width: 720px) and (max-width: 1099px)] = "100%"';

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
    throw new Error("Frontend package.json requires a scripts object");
  }

  const parsed: Record<string, string> = {};
  for (const [name, command] of Object.entries(scripts)) {
    if (typeof command !== "string") {
      throw new Error(`Frontend package script ${name} must be a string`);
    }
    parsed[name] = command;
  }
  return parsed;
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

function importIndex(file: string): number {
  return layout.indexOf(`import "./${file}";`);
}

function occurrenceCount(source: string, token: string): number {
  return source.split(token).length - 1;
}

function classSpecificity(selector: string): number {
  return selector.match(/\.[a-z0-9_-]+/gi)?.length ?? 0;
}

function visualLaunchArguments(): readonly string[] {
  const launchOptions = visualConfig.match(
    /launchOptions:\s*\{[\s\S]*?args:\s*\[([^\]]*)\][\s\S]*?\}/,
  );
  if (launchOptions === null) {
    throw new Error("Visual Playwright config requires explicit launchOptions.args");
  }

  return [...launchOptions[1].matchAll(/"([^"]+)"/g)].map((match) => match[1]);
}

const manifest = parseManifest(rawManifest);
const scripts = parsePackageScripts(rawPackage);
const premiumMobileItems = manifest.filter((item) => ownerPair(item.id) === PREMIUM_MOBILE_PAIR);
const premiumAdaptiveItems = manifest.filter((item) => ownerPair(item.id) === PREMIUM_ADAPTIVE_PAIR);
const mobileAdaptiveItems = manifest.filter((item) => ownerPair(item.id) === MOBILE_ADAPTIVE_PAIR);

describe("navigation and mobile-shell computed-cascade ownership", () => {
  it("keeps the exact 10-item premium/mobile unresolved boundary", () => {
    expect(premiumMobileItems).toHaveLength(10);
    expect(premiumMobileItems.every((item) => item.classification === "requires-proof")).toBe(true);
  });

  it("removes all premium/adaptive conflicts and preserves only resource-stack width separately", () => {
    expect(premiumAdaptiveItems).toEqual([]);
    expect(mobileAdaptiveItems).toEqual([
      {
        id: RESOURCE_STACK_CONFLICT_ID,
        classification: "requires-proof",
        evidence: "Separate computed-cascade proof required for this owner pair.",
      },
    ]);
  });

  it("keeps production import order and the approved media boundaries explicit", () => {
    const premiumIndex = importIndex("premium-ui.css");
    const mobileIndex = importIndex("mobile-pwa-fixes.css");
    const adaptiveIndex = importIndex("adaptive-navigation.css");

    expect(premiumIndex).toBeGreaterThanOrEqual(0);
    expect(mobileIndex).toBeGreaterThan(premiumIndex);
    expect(adaptiveIndex).toBeGreaterThan(mobileIndex);

    expect(premium).toContain("@media (max-width: 760px)");
    expect(mobile).toContain("@media (max-width: 760px)");
    expect(adaptive).toContain("@media (max-width: 719px)");
    expect(adaptive).toContain("@media (min-width: 720px) and (max-width: 1099px)");
  });

  it("routes production and adaptive-first browser proofs through both UI scripts", () => {
    const uiCommand = scripts["test:e2e:ui"];
    const responsiveCommand = scripts["test:e2e:responsive"];

    expect(uiCommand).toBeDefined();
    expect(responsiveCommand).toBeDefined();
    expect(occurrenceCount(uiCommand, CASCADE_SPEC)).toBe(1);
    expect(occurrenceCount(responsiveCommand, CASCADE_SPEC)).toBe(1);
    expect(browserSpec).toContain(
      '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    );
    expect(browserSpec).toContain(
      'order: ["globals", "tokens", "premium", "mobile", "adaptive"]',
    );
    expect(browserSpec).toContain(
      'order: ["globals", "tokens", "adaptive", "premium", "mobile"]',
    );
    expect(browserSpec).toContain("await page.setViewportSize({ width: current.width, height: 800 });");
  });

  it("pins visual Chromium to the exact deterministic Skia baseline path", () => {
    expect(visualLaunchArguments()).toEqual([SKIA_BASELINE_ARG]);
    expect(occurrenceCount(visualConfig, SKIA_BASELINE_ARG)).toBe(1);
    expect(visualConfig).not.toContain("maxDiffPixels:");
  });

  it("uses the canonical routed ancestor only for competing adaptive selectors", () => {
    expect(routedApp).toContain('<div className="lx-routed-app"');
    expect(classSpecificity(".lx-routed-app .lx-header")).toBeGreaterThan(
      classSpecificity(".lx-header"),
    );
    expect(classSpecificity(".lx-routed-app .lx-mobile-nav button.active")).toBeGreaterThan(
      classSpecificity(".lx-mobile-nav button.active"),
    );

    expect(adaptive).toMatch(
      /@media \(min-width: 720px\) and \(max-width: 1099px\)[\s\S]*?\.lx-routed-app \.lx-header\s*\{[\s\S]*?min-height:\s*calc\(76px \+ env\(safe-area-inset-top\)\);[\s\S]*?margin:\s*0;[\s\S]*?padding:\s*env\(safe-area-inset-top\) 0 0;[\s\S]*?grid-template-columns:\s*auto minmax\(0, 1fr\) auto;/,
    );
    expect(adaptive).toMatch(
      /\.lx-routed-app \.lx-brand,\s*\.lx-routed-app \.lx-header-tools\s*\{\s*align-self:\s*center;/,
    );
    expect(adaptive).toMatch(
      /@media \(max-width: 719px\)[\s\S]*?\.lx-routed-app \.lx-mobile-nav\s*\{[\s\S]*?display:\s*grid;[\s\S]*?grid-template-columns:\s*repeat\(5, minmax\(48px, 1fr\)\);/,
    );
    expect(adaptive).toMatch(
      /\.lx-routed-app \.lx-mobile-nav button\.active\s*\{[\s\S]*?color:\s*#c1adff;[\s\S]*?background:\s*rgba\(104, 75, 220, 0\.19\);/,
    );

    expect(occurrenceCount(adaptive, ".lx-routed-app")).toBe(14);
    expect(occurrenceCount(adaptive, "!important")).toBe(3);
    expect(adaptive).not.toContain(".lx-routed-app .lx-resource-stack");
    expect(adaptive).not.toContain(".lx-routed-app .lx-async-state");
  });

  it("preserves the mobile-PWA values that remain effective through 760px", () => {
    expect(mobile).toMatch(
      /@media \(max-width: 760px\)[\s\S]*?\.lx-header\s*\{[\s\S]*?min-height:\s*58px;[\s\S]*?margin:\s*0 -14px;[\s\S]*?background:\s*rgba\(5, 9, 20, 0\.96\);/,
    );
    expect(mobile).toMatch(
      /\.lx-brand,\s*\.lx-header-tools\s*\{\s*align-self:\s*end;/,
    );
    expect(mobile).toMatch(/\.lx-logo-mark\s*\{\s*width:\s*30px;\s*height:\s*38px;/);
    expect(mobile).toMatch(/\.lx-avatar\s*\{\s*width:\s*42px;\s*height:\s*42px;/);
  });

  it("preserves the premium values that become effective again above 760px", () => {
    expect(premium).toMatch(
      /\.lx-header\s*\{[\s\S]*?min-height:\s*82px;[\s\S]*?background:\s*rgba\(5, 9, 20, 0\.82\);/,
    );
    expect(premium).toMatch(/\.lx-logo-mark\s*\{[\s\S]*?width:\s*36px;[\s\S]*?height:\s*46px;/);
    expect(premium).toMatch(/\.lx-avatar\s*\{\s*width:\s*44px;\s*height:\s*44px;/);
  });
});
