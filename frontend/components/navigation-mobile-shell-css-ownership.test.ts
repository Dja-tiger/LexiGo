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
const mobile = readFileSync(path.join(appDirectory, "mobile-pwa-fixes.css"), "utf8");
const adaptive = readFileSync(path.join(appDirectory, "adaptive-navigation.css"), "utf8");
const routedShellChrome = readFileSync(
  path.join(appDirectory, "adaptive-knowledge-coach-home.css"),
  "utf8",
);
const routedApp = readFileSync(
  path.join(componentDirectory, "routed-lexigo-app.tsx"),
  "utf8",
);
const resourceStackRenderers = new Map<string, string>([
  ["home", readFileSync(path.join(componentDirectory, "lexigo-home-app.tsx"), "utf8")],
  ["learn", readFileSync(path.join(componentDirectory, "lexigo-learn-app.tsx"), "utf8")],
  ["progress", readFileSync(path.join(componentDirectory, "lexigo-progress-app.tsx"), "utf8")],
  ["dictionary", readFileSync(path.join(componentDirectory, "lexigo-dictionary-app.tsx"), "utf8")],
  ["active lesson", readFileSync(path.join(componentDirectory, "lexigo-active-lesson-app.tsx"), "utf8")],
  ["compatibility fallback", readFileSync(path.join(componentDirectory, "lexigo-premium-app.tsx"), "utf8")],
]);
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

const CASCADE_SPEC = "e2e/navigation-mobile-shell-cascade.spec.ts";
const PREMIUM_MOBILE_PAIR = "premium-ui.css -> mobile-pwa-fixes.css";
const PREMIUM_ADAPTIVE_PAIR = "premium-ui.css -> adaptive-navigation.css";
const MOBILE_ADAPTIVE_PAIR = "mobile-pwa-fixes.css -> adaptive-navigation.css";
const MOBILE_ROUTED_CHROME_PAIR =
  "mobile-pwa-fixes.css -> adaptive-knowledge-coach-home.css";

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

const manifest = parseManifest(rawManifest);
const scripts = parsePackageScripts(rawPackage);
const premiumMobileItems = manifest.filter((item) => ownerPair(item.id) === PREMIUM_MOBILE_PAIR);
const premiumAdaptiveItems = manifest.filter((item) => ownerPair(item.id) === PREMIUM_ADAPTIVE_PAIR);
const mobileAdaptiveItems = manifest.filter((item) => ownerPair(item.id) === MOBILE_ADAPTIVE_PAIR);
const mobileRoutedChromeItems = manifest.filter(
  (item) => ownerPair(item.id) === MOBILE_ROUTED_CHROME_PAIR,
);

describe("navigation and mobile-shell computed-cascade ownership", () => {
  it("removes every premium/mobile-PWA exact-selector conflict", () => {
    expect(premiumMobileItems).toEqual([]);
  });

  it("creates no replacement conflict with routed-shell chrome", () => {
    expect(mobileRoutedChromeItems).toEqual([]);
  });

  it("removes all premium/adaptive and mobile/adaptive exact-selector conflicts", () => {
    expect(premiumAdaptiveItems).toEqual([]);
    expect(mobileAdaptiveItems).toEqual([]);
  });

  it("keeps production import order and the approved media boundaries explicit", () => {
    const premiumIndex = importIndex("premium-ui.css");
    const mobileIndex = importIndex("mobile-pwa-fixes.css");
    const adaptiveIndex = importIndex("adaptive-navigation.css");
    const routedChromeIndex = importIndex("adaptive-knowledge-coach-home.css");

    expect(premiumIndex).toBeGreaterThanOrEqual(0);
    expect(mobileIndex).toBeGreaterThan(premiumIndex);
    expect(adaptiveIndex).toBeGreaterThan(mobileIndex);
    expect(routedChromeIndex).toBeGreaterThan(adaptiveIndex);

    expect(premium).toContain("@media (max-width: 760px)");
    expect(mobile).toContain("@media (max-width: 760px)");
    expect(mobile).toContain("@media (max-width: 719px)");
    expect(mobile).toContain("@media (display-mode: standalone) and (max-width: 719px)");
    expect(adaptive).toContain("@media (max-width: 719px)");
    expect(adaptive).toContain("@media (min-width: 720px) and (max-width: 1099px)");
    expect(mobile).not.toContain("@media (display-mode: standalone) and (max-width: 760px)");
  });

  it("routes three stylesheet orders through both authoritative UI scripts", () => {
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
      'order: ["globals", "tokens", "premium", "mobile", "adaptive", "routedChrome"]',
    );
    expect(browserSpec).toContain(
      'order: ["globals", "tokens", "routedChrome", "adaptive", "premium", "mobile"]',
    );
    expect(browserSpec).toContain(
      'order: ["globals", "tokens", "mobile", "premium", "routedChrome", "adaptive"]',
    );
    expect(browserSpec).toContain("resourceStackMatchesMainContent");
    expect(browserSpec).toContain("for (const cascade of cascadeOrders)");
    expect(browserSpec).toContain("expect(snapshot).toEqual(referenceSnapshot)");
  });

  it("keeps every live resource stack below the canonical routed ancestor", () => {
    expect(routedApp).toContain(
      '<div className="lx-routed-app" data-app-router-shell="true" data-route-path={pathname}>',
    );
    expect([...resourceStackRenderers.keys()]).toEqual([
      "home",
      "learn",
      "progress",
      "dictionary",
      "active lesson",
      "compatibility fallback",
    ]);
    for (const [owner, source] of resourceStackRenderers) {
      expect(source, `${owner} resource-stack renderer`).toContain("lx-resource-stack");
    }
  });

  it("uses canonical routed owners for live mobile geometry, resource width and spacing", () => {
    expect(classSpecificity(".lx-routed-app .lx-header")).toBeGreaterThan(
      classSpecificity(".lx-header"),
    );
    expect(classSpecificity(".lx-routed-app .lx-avatar")).toBeGreaterThan(
      classSpecificity(".lx-avatar"),
    );
    expect(classSpecificity(".lx-routed-app .lx-view")).toBeGreaterThan(
      classSpecificity(".lx-view"),
    );
    expect(classSpecificity(".lx-routed-app .lx-resource-stack")).toBeGreaterThan(
      classSpecificity(".lx-resource-stack"),
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
      /@media \(min-width: 720px\) and \(max-width: 1099px\)[\s\S]*?\.lx-routed-app \.lx-resource-stack\s*\{\s*width:\s*100%;\s*\}[\s\S]*?\.lx-async-state\s*\{\s*width:\s*100%;\s*\}/,
    );
    expect(adaptive).toMatch(
      /@media \(max-width: 719px\)[\s\S]*?\.lx-routed-app \.lx-mobile-nav\s*\{[\s\S]*?display:\s*grid;[\s\S]*?grid-template-columns:\s*repeat\(5, minmax\(48px, 1fr\)\);/,
    );
    expect(adaptive).toMatch(
      /\.lx-routed-app \.lx-mobile-nav button\.active\s*\{[\s\S]*?color:\s*#c1adff;[\s\S]*?background:\s*rgba\(104, 75, 220, 0\.19\);/,
    );

    expect(occurrenceCount(adaptive, ".lx-routed-app")).toBe(15);
    expect(occurrenceCount(adaptive, "!important")).toBe(3);
    expect(adaptive).toContain(".lx-routed-app .lx-resource-stack");
    expect(adaptive).not.toContain(".lx-routed-app .lx-async-state");
  });

  it("keeps compact geometry, avatar dimensions and view spacing in mobile PWA styles", () => {
    expect(mobile).toMatch(
      /@media \(max-width: 719px\)[\s\S]*?\.lx-routed-app \.lx-header\s*\{[\s\S]*?top:\s*0;[\s\S]*?min-height:\s*58px;[\s\S]*?margin:\s*0 -14px;[\s\S]*?calc\(env\(safe-area-inset-top\) \+ 12px\)[\s\S]*?18px[\s\S]*?11px;/,
    );
    expect(mobile).toMatch(
      /@media \(display-mode: standalone\) and \(max-width: 719px\)[\s\S]*?\.lx-routed-app \.lx-header\s*\{\s*padding-top:\s*calc\(env\(safe-area-inset-top\) \+ 16px\);/,
    );
    expect(mobile).toMatch(
      /\.lx-routed-app \.lx-avatar\s*\{\s*width:\s*42px;\s*height:\s*42px;/,
    );
    expect(mobile).toMatch(/\.lx-routed-app \.lx-view\s*\{\s*padding-top:\s*18px;/);
    expect(mobile).toMatch(/\.lx-brand,\s*\.lx-header-tools\s*\{\s*align-self:\s*end;/);
    expect(mobile).toMatch(
      /\.lx-resource-stack\s*\{[\s\S]*?width:\s*min\(1160px, calc\(100% - 28px\)\);/,
    );

    expect(mobile).not.toContain(".lx-routed-app .lx-logo-mark");
    expect(mobile).not.toMatch(/\.lx-routed-app \.lx-header\s*\{\s*background:/);
    expect(occurrenceCount(mobile, ".lx-routed-app")).toBe(4);
    expect(occurrenceCount(mobile, "!important")).toBe(3);
    expect(mobile).not.toContain(".lx-routed-app .lx-resource-stack");
    expect(mobile).not.toContain(".lx-routed-app .lx-async-state");
  });

  it("protects the stronger routed-shell chrome and premium fallback values", () => {
    expect(routedShellChrome).toMatch(
      /\.lx-routed-app \.lx-header\s*\{[\s\S]*?background:\s*color-mix\(in srgb, var\(--ak-bg\) 90%, transparent\);/,
    );
    expect(routedShellChrome).toMatch(
      /\.lx-routed-app \.lx-logo-mark\s*\{\s*width:\s*34px;\s*height:\s*34px;/,
    );
    expect(routedShellChrome).toMatch(
      /@media \(min-width: 1024px\)[\s\S]*?\.lx-routed-app \.lx-app:not\(\.lx-lesson-focus-mode\) \.lx-header\s*\{[\s\S]*?min-height:\s*96px;/,
    );

    expect(premium).toMatch(
      /\.lx-header\s*\{[\s\S]*?min-height:\s*82px;[\s\S]*?background:\s*rgba\(5, 9, 20, 0\.82\);/,
    );
    expect(premium).toMatch(/\.lx-logo-mark\s*\{[\s\S]*?width:\s*36px;[\s\S]*?height:\s*46px;/);
    expect(premium).toMatch(/\.lx-avatar\s*\{\s*width:\s*44px;\s*height:\s*44px;/);
    expect(premium).toMatch(/\.lx-view\s*\{[\s\S]*?padding-top:\s*24px;/);
  });
});
