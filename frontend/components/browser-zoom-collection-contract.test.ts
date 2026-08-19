import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

type FrontendPackage = Readonly<{
  scripts?: Readonly<Record<string, string>>;
}>;

const frontendRoot = process.cwd();
const e2eRoot = path.join(frontendRoot, "e2e");
const visualConfig = readFileSync(
  path.join(frontendRoot, "playwright.visual.config.ts"),
  "utf8",
);
const frontendPackage = JSON.parse(
  readFileSync(path.join(frontendRoot, "package.json"), "utf8"),
) as FrontendPackage;

const STANDALONE_BROWSER_ZOOM_OWNERS = [
  "home-browser-zoom.spec.ts",
  "learn-browser-zoom.spec.ts",
  "active-lesson-browser-zoom.spec.ts",
] as const;
const PHRASES_VISUAL_OWNER = "phrases-visual.spec.ts";
const CONSOLIDATED_ROUTE_ZOOM_OWNER = "route-browser-zoom-parity.spec.ts";
const ISSUE_603_ZOOM_OWNER = "issue-603-browser-zoom-reflow.spec.ts";
const KEYBOARD_FOCUS_OWNERS = [
  ...STANDALONE_BROWSER_ZOOM_OWNERS,
  PHRASES_VISUAL_OWNER,
  CONSOLIDATED_ROUTE_ZOOM_OWNER,
] as const;

function readE2ESource(fileName: string): string {
  return readFileSync(path.join(e2eRoot, fileName), "utf8");
}

function readVisualProjectSource(projectName: string): string {
  const marker = `name: "${projectName}"`;
  const start = visualConfig.indexOf(marker);
  expect(start, `${projectName} must exist in playwright.visual.config.ts`).toBeGreaterThanOrEqual(0);
  const next = visualConfig.indexOf('name: "visual-', start + marker.length);
  return visualConfig.slice(start, next === -1 ? undefined : next);
}

describe("authoritative browser zoom collection", () => {
  it("collects standalone, consolidated and delivered Issue #603 browser-zoom owners", () => {
    for (const owner of [
      ...STANDALONE_BROWSER_ZOOM_OWNERS,
      PHRASES_VISUAL_OWNER,
      CONSOLIDATED_ROUTE_ZOOM_OWNER,
      ISSUE_603_ZOOM_OWNER,
    ]) {
      expect(visualConfig, `${owner} must stay in playwright.visual.config.ts testMatch`).toContain(`"${owner}"`);
    }
  });

  it("runs the consolidated route matrix only from the canonical desktop visual project", () => {
    const desktopOnlyIgnore = 'testIgnore: ["**/route-browser-zoom-parity.spec.ts"]';
    expect(readVisualProjectSource("visual-compact")).toContain(desktopOnlyIgnore);
    expect(readVisualProjectSource("visual-medium")).toContain(desktopOnlyIgnore);
    expect(readVisualProjectSource("visual-desktop")).not.toContain(desktopOnlyIgnore);
    expect(readVisualProjectSource("visual-desktop")).toContain("viewport: { width: 1440, height: 900 }");
  });

  it("keeps the canonical visual command bound to the authoritative config", () => {
    expect(frontendPackage.scripts?.["test:e2e:visual"]).toBe(
      "playwright test --config=playwright.visual.config.ts",
    );
  });

  it("keeps standalone owners as true browser zoom contracts rather than text scaling", () => {
    for (const owner of STANDALONE_BROWSER_ZOOM_OWNERS) {
      const source = readE2ESource(owner);
      expect(source).toContain("browser-owned zoom");
      expect(source).toContain("lexigoBrowserZoomController");
      expect(source).toContain("cssVisualViewport.zoom");
      expect(source).toContain("rootFontSize");
    }
  });

  it("keeps the consolidated matrix on true browser zoom with fail-closed CDP-normalized evidence", () => {
    const source = readE2ESource(CONSOLIDATED_ROUTE_ZOOM_OWNER);

    expect(source).toContain("browser-owned zoom");
    expect(source).toContain("lexigoBrowserZoomController");
    expect(source).toContain("setBrowserZoom(worker, targetURL, 2)");
    expect(source).toContain('cdp.send("Page.getLayoutMetrics")');
    expect(source).toContain('cdp.send("Page.captureScreenshot"');
    expect(source).toContain("cssVisualViewport.zoom");
    expect(source).toContain("cssContentSize.height * zoom");
    expect(source).toContain("scale: 1 / zoom");
    expect(source).toContain('viewport: { width: 1440, height: 900 }');
    expect(source).toContain('sha256: "REVIEW_REQUIRED"');
    expect(source).toContain("REVIEW_REQUIRED exact Linux 200% browser-zoom evidence");
    expect(source).not.toMatch(/page\.screenshot\s*\(/);
    expect(source).not.toContain("font-size: 200%");
    expect(source).not.toContain("--update-snapshots");
  });

  it("keeps all ten canonical route owners in the consolidated 200% matrix", () => {
    const source = readE2ESource(CONSOLIDATED_ROUTE_ZOOM_OWNER);
    for (const pathName of [
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
    ]) {
      expect(source).toContain(pathName);
    }
  });

  it("pins the exact 720px responsive ownership contract instead of accepting any navigation variant", () => {
    const source = readE2ESource(CONSOLIDATED_ROUTE_ZOOM_OWNER);

    expect(source).toContain('expectedNavigation: "rail"');
    expect(source.match(/expectedNavigation: "mobile"/g)).toHaveLength(7);
    expect(source.match(/expectedNavigation: "none"/g)).toHaveLength(2);
    expect(source).toContain("true 200% browser zoom must land on exact 720px boundary");
    expect(source).toContain(".toBe(720)");
    expect(source).toContain("exact 720px RouteChrome owner must match reviewed responsive ownership");
  });

  it("requires global chrome, route-owner, text-range and focusable containment in the route matrix", () => {
    const source = readE2ESource(CONSOLIDATED_ROUTE_ZOOM_OWNER);
    expect(source).toContain('".lx-route-brand"');
    expect(source).toContain('".lx-route-reminder-entry > summary"');
    expect(source).toContain('button[aria-label="Открыть профиль"]');
    expect(source).toContain("boxOffenders");
    expect(source).toContain("textOffenders");
    expect(source).toContain("document must not horizontally overflow");
    expect(source).toContain("visible text ranges must not clip inside route/container owners");
  });

  it("requires keyboard-originated focus evidence in every browser-zoom owner", () => {
    for (const owner of KEYBOARD_FOCUS_OWNERS) {
      const source = readE2ESource(owner);
      expect(source, `${owner} must move focus with the keyboard before focus-visible checks`).toContain(
        'keyboard.press("Tab")',
      );
      expect(source, `${owner} must return focus with keyboard navigation`).toContain(
        'keyboard.press("Shift+Tab")',
      );
      expect(source).toContain('matches(":focus-visible")');
    }
  });

  it("keeps Home zoom aligned with the shell-owned exact-720 rail contract", () => {
    const source = readE2ESource("home-browser-zoom.spec.ts");
    expect(source).toContain('page.locator(".lx-home-paths")');
    expect(source).toContain("await expect(paths).toBeHidden()");
    expect(source).toContain("canonical bounded two-column Home action layout");
    expect(source).not.toContain("single-column Home action breakpoint");
  });

  it("keeps Learn zoom focus aligned with roving-tabindex radio semantics", () => {
    const source = readE2ESource("learn-browser-zoom.spec.ts");
    expect(source.match(/getByRole\("radio", \{ checked: true \}\)/g)).toHaveLength(3);
    expect(source).not.toContain('getByRole("radio").first()');
  });

  it("keeps Phrases true browser zoom inside an already-collected visual owner", () => {
    const source = readE2ESource(PHRASES_VISUAL_OWNER);
    expect(source).toContain('test.describe("Phrases browser-owned zoom"');
    expect(source).toContain("lexigoBrowserZoomController");
    expect(source).toContain("cssVisualViewport.zoom");
    expect(source).toContain("phrases-browser-zoom-metrics.json");
  });
});
