import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const routeNavigation = readFileSync(new URL("../app/route-navigation.css", import.meta.url), "utf8");
const adaptiveHome = readFileSync(new URL("../app/adaptive-knowledge-coach-home.css", import.meta.url), "utf8");
const designTokens = readFileSync(new URL("../app/design-tokens.css", import.meta.url), "utf8");
const tabletParity = readFileSync(new URL("../e2e/route-tablet-parity.spec.ts", import.meta.url), "utf8");
const visualConfig = readFileSync(new URL("../playwright.visual.config.ts", import.meta.url), "utf8");

function between(source: string, start: string, end: string): string {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);

  expect(startIndex, `missing start marker: ${start}`).toBeGreaterThanOrEqual(0);
  expect(endIndex, `missing end marker after: ${start}`).toBeGreaterThan(startIndex);

  return source.slice(startIndex, endIndex);
}

describe("Issue #678 semantic tablet RouteChrome ownership", () => {
  const tabletOwner = between(
    routeNavigation,
    "@media (min-width: 720px) and (max-width: 1099px) {",
    "@media (max-width: 719px) {",
  );

  it("closes the 720-1023 palette gap without changing navigation geometry ownership", () => {
    expect(adaptiveHome).toContain("@media (min-width: 1024px)");
    expect(adaptiveHome).toContain("@media (max-width: 719px)");
    expect(routeNavigation).toContain("@media (min-width: 720px) and (max-width: 1099px)");

    // Keep the existing tablet rail geometry while changing only painted presentation.
    for (const geometryContract of [
      "top: calc(94px + env(safe-area-inset-top));",
      "width: var(--lx-navigation-rail-width);",
      "gap: 7px;",
      "border-radius: 20px;",
      "padding: 8px;",
      "min-height: 68px;",
      "border-radius: 15px;",
      "padding: 9px 6px;",
      "left: -9px;",
      "width: 3px;",
    ]) {
      expect(tabletOwner).toContain(geometryContract);
    }
  });

  it("uses the active OpenPencil semantic appearance tokens for every tablet rail paint role", () => {
    for (const semanticToken of [
      "--ak-color-surface",
      "--ak-color-subtle",
      "--ak-color-primary",
      "--ak-color-primary-soft",
      "--ak-color-text-main",
      "--ak-color-text-muted",
    ]) {
      expect(designTokens).toContain(semanticToken);
      expect(tabletOwner).toContain(`var(${semanticToken})`);
    }

    expect(tabletOwner).toContain("color: var(--ak-color-text-main);");
    expect(tabletOwner).toContain("background: color-mix(in srgb, var(--ak-color-surface) 96%, transparent);");
    expect(tabletOwner).toContain("color: var(--ak-color-text-muted);");
    expect(tabletOwner).toContain("background: var(--ak-color-subtle);");
    expect(tabletOwner).toContain("color: var(--ak-color-primary);");
    expect(tabletOwner).toContain("background: var(--ak-color-primary-soft);");
    expect(tabletOwner).toContain("background: var(--ak-color-primary);");
  });

  it("cannot regress to the legacy premium navy/purple/cyan tablet rail", () => {
    for (const legacyPaint of [
      "rgba(8, 14, 27, 0.84)",
      "rgba(139, 92, 246",
      "rgba(112, 79, 232",
      "rgba(27, 40, 69",
      "#8b67ff",
      "#33a8ff",
      "#a989ff",
    ]) {
      expect(tabletOwner.toLowerCase()).not.toContain(legacyPaint.toLowerCase());
    }
  });

  it("keeps exact Linux 768x1024 effective visual/cascade evidence registered", () => {
    expect(tabletParity).toContain("const TABLET_VIEWPORT: RouteViewport = {");
    expect(tabletParity).toContain("width: 768,");
    expect(tabletParity).toContain("height: 1024,");
    expect(tabletParity).toContain("const TABLET_VISUAL_BASELINES");
    expect(tabletParity).toContain("await expectParityOwnership(page, contract, TABLET_VIEWPORT);");
    expect(tabletParity).toContain("await captureTabletEvidence(page, testInfo, contract, appearance);");

    for (const routeKey of [
      "home",
      "learn",
      "active-lesson",
      "progress",
      "dictionary",
      "word-detail",
      "phrases",
      "phrase-detail",
      "profile",
      "onboarding",
    ]) {
      expect(tabletParity).toContain(`key: \"${routeKey}\"`);
    }

    expect(visualConfig).toContain('"route-tablet-parity.spec.ts"');
    expect(visualConfig).toContain('name: "visual-medium"');
    expect(visualConfig).toContain("viewport: { width: 768, height: 1024 }");
  });
});
