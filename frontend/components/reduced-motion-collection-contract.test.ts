import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

type FrontendPackage = Readonly<{
  scripts?: Readonly<Record<string, string>>;
}>;

const frontendRoot = process.cwd();
const ownerPath = path.join(frontendRoot, "e2e", "route-reduced-motion-parity.spec.ts");
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

describe("Issue #614 consolidated reduced-motion collection", () => {
  it("keeps the owner in the blocking accessibility command", () => {
    expect(frontendPackage.scripts?.["test:e2e:a11y"]).toContain(
      "e2e/route-reduced-motion-parity.spec.ts",
    );
  });

  it("keeps exactly ten canonical route contracts", () => {
    for (const marker of CANONICAL_ROUTE_MARKERS) expect(ownerSource).toContain(marker);

    const routeBlock = ownerSource.slice(
      ownerSource.indexOf("const ROUTES:"),
      ownerSource.indexOf("const VIEWPORTS:"),
    );
    expect(routeBlock.match(/\{ key: "/g)).toHaveLength(10);
    expect(routeBlock.match(/focused: true/g)).toHaveLength(2);
    expect(routeBlock.match(/focused: false/g)).toHaveLength(8);
  });

  it("keeps compact/desktop and Light/Dark coverage explicit", () => {
    expect(ownerSource).toContain('{ key: "compact", width: 390, height: 844, navigation: "mobile" }');
    expect(ownerSource).toContain('{ key: "desktop", width: 1440, height: 1024, navigation: "rail" }');
    expect(ownerSource).toContain('for (const appearance of ["light", "dark"] as const)');
    expect(ownerSource).toContain('reducedMotion: "reduce"');
  });

  it("does not neutralize production motion with the deterministic visual runtime", () => {
    expect(ownerSource).not.toContain("installDeterministicRuntime");
    expect(ownerSource).not.toContain("waitForTimeout");
  });

  it("fails closed on zero-equivalent CSS motion and active Web Animations", () => {
    expect(ownerSource).toContain("duration > 0.01");
    expect(ownerSource).toContain("duration <= 0.01");
    expect(ownerSource).toContain("element.getAnimations()");
    expect(ownerSource).toContain('animation.playState === "running"');
    expect(ownerSource).toContain("animation.pending");
    expect(ownerSource).toContain("snapshot.activeAnimations");
    expect(ownerSource).toContain("snapshot.violations");
  });

  it("preserves route ownership, instant scrolling and keyboard-visible feedback", () => {
    expect(ownerSource).toContain("RouteChrome ownership must match");
    expect(ownerSource).toContain('contract.focused ? [] : [viewport.navigation]');
    expect(ownerSource).toContain("htmlScrollBehavior");
    expect(ownerSource).toContain("ownerScrollBehavior");
    expect(ownerSource).toContain('matches(":focus-visible")');
    expect(ownerSource).toContain("keyboard target must retain painted feedback");
    expect(ownerSource).toContain("reduced-motion keyboard feedback must not use spatial transform");
  });

  it("owns the broad deterministic matrix once while retaining specialized cross-browser suites", () => {
    expect(ownerSource).toContain('testInfo.project.name !== "desktop-chromium"');
    expect(ownerSource).toContain("existing #65 suites retain specialized Chromium/WebKit/mobile interaction coverage");
  });

  it("keeps machine-readable evidence and runtime-error capture", () => {
    expect(ownerSource).toContain("issue-614-reduced-motion-${contract.key}-${viewport.key}-${appearance}.json");
    expect(ownerSource).toContain("captureRuntimeErrors(page)");
    expect(ownerSource).toContain("runtime errors during reduced-motion audit");
    expect(ownerSource).toContain("parent: 205");
    expect(ownerSource).toContain("related: [65, 461]");
  });
});
