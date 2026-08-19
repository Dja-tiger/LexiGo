import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

type FrontendPackage = Readonly<{
  scripts?: Readonly<Record<string, string>>;
}>;

const frontendRoot = process.cwd();
const ownerPath = path.join(frontendRoot, "e2e", "route-keyboard-focus-parity.spec.ts");
const ownerSource = readFileSync(ownerPath, "utf8");
const frontendPackage = JSON.parse(
  readFileSync(path.join(frontendRoot, "package.json"), "utf8"),
) as FrontendPackage;

const CANONICAL_ROUTE_MARKERS = [
  'path: "/"',
  'path: "/learn"',
  'path: "/lesson/active"',
  'path: "/progress"',
  'path: "/dictionary"',
  'path: "/words/101"',
  'path: "/phrases"',
  'path: `/phrases/${QUALITY_PHRASES[0].slug}`',
  'path: "/profile"',
  'path: "/onboarding"',
] as const;

describe("Issue #608 consolidated keyboard/focus collection", () => {
  it("keeps the owner in the blocking accessibility command", () => {
    expect(frontendPackage.scripts?.["test:e2e:a11y"]).toContain(
      "e2e/route-keyboard-focus-parity.spec.ts",
    );
  });

  it("keeps exactly ten canonical route contracts", () => {
    for (const marker of CANONICAL_ROUTE_MARKERS) {
      expect(ownerSource).toContain(marker);
    }

    const routeBlock = ownerSource.slice(
      ownerSource.indexOf("const ROUTES:"),
      ownerSource.indexOf("const VIEWPORTS:"),
    );
    expect(routeBlock.match(/\{ key: "/g)).toHaveLength(10);
    expect(routeBlock.match(/focused: true/g)).toHaveLength(2);
    expect(routeBlock.match(/focused: false/g)).toHaveLength(8);
  });

  it("keeps the compact/desktop Light/Dark matrix explicit", () => {
    expect(ownerSource).toContain('{ key: "compact", width: 390, height: 844, navigation: "mobile" }');
    expect(ownerSource).toContain('{ key: "desktop", width: 1440, height: 1024, navigation: "rail" }');
    expect(ownerSource).toContain('for (const appearance of ["light", "dark"] as const)');
  });

  it("owns deterministic sequential traversal once in desktop Chromium", () => {
    expect(ownerSource).toContain('testInfo.project.name !== "desktop-chromium"');
    expect(ownerSource).toContain('page.keyboard.press("Tab")');
    expect(ownerSource).toContain('page.keyboard.press("Shift+Tab")');
    expect(ownerSource).not.toMatch(/\.focus\s*\(/);
  });

  it("fails closed on focus visibility, hidden ownership and geometry", () => {
    for (const marker of [
      'matches(":focus-visible")',
      'active.closest("[inert]")',
      'active.closest(\'[aria-hidden="true"]\')',
      "positive tabindex must remain forbidden",
      "painted inline focus indicator must not clip at viewport edges",
      "focus indicator must not be clipped by overflow ownership",
      "RouteChrome must not obscure focused route content",
      "focused target center must remain pointer-visible/unobscured",
    ]) {
      expect(ownerSource).toContain(marker);
    }
  });

  it("keeps exact RouteChrome ownership and reduced-motion evidence", () => {
    expect(ownerSource).toContain("RouteChrome ownership must match");
    expect(ownerSource).toContain('contract.focused ? [] : [viewport.navigation]');
    expect(ownerSource).toContain('window.matchMedia("(prefers-reduced-motion: reduce)").matches');
  });

  it("keeps machine-readable route/theme/viewport focus traces and runtime-error evidence", () => {
    expect(ownerSource).toContain("issue-608-keyboard-focus-${contract.key}-${viewport.key}-${appearance}.json");
    expect(ownerSource).toContain("sequentialStops: trace");
    expect(ownerSource).toContain("reverseStop");
    expect(ownerSource).toContain("restoredTarget");
    expect(ownerSource).toContain("captureRuntimeErrors(page)");
    expect(ownerSource).toContain("runtime errors during keyboard audit");
  });
});
