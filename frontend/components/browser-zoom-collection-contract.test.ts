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
const KEYBOARD_FOCUS_OWNERS = [
  ...STANDALONE_BROWSER_ZOOM_OWNERS,
  PHRASES_VISUAL_OWNER,
  CONSOLIDATED_ROUTE_ZOOM_OWNER,
] as const;

function readE2ESource(fileName: string): string {
  return readFileSync(path.join(e2eRoot, fileName), "utf8");
}

describe("authoritative browser zoom collection", () => {
  it("collects every standalone browser-owned zoom owner", () => {
    for (const owner of STANDALONE_BROWSER_ZOOM_OWNERS) {
      expect(
        visualConfig,
        `${owner} must stay in playwright.visual.config.ts testMatch`,
      ).toContain(`"${owner}"`);
    }
  });

  it("collects the consolidated route browser-zoom parity owner", () => {
    expect(visualConfig).toContain(`"${CONSOLIDATED_ROUTE_ZOOM_OWNER}"`);
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
      expect(source).toContain("setBrowserZoom(serviceWorker, targetURL, 2)");
      expect(source).toContain("cssVisualViewport.zoom");
      expect(source).toContain("rootFontSize");
    }
  });

  it("keeps the consolidated route matrix on true browser zoom with fail-closed evidence", () => {
    const source = readE2ESource(CONSOLIDATED_ROUTE_ZOOM_OWNER);
    expect(source).toContain("browser-owned zoom");
    expect(source).toContain("lexigoBrowserZoomController");
    expect(source).toContain("setBrowserZoom(worker, targetURL, 2)");
    expect(source).toContain("cssVisualViewport.zoom");
    expect(source).toContain("rootFontSize");
    expect(source).toContain('sha256: "REVIEW_REQUIRED"');
    expect(source).toContain("REVIEW_REQUIRED exact Linux 200% browser-zoom evidence");
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

  it("requires global chrome, overflow and partial-focusable containment in the route matrix", () => {
    const source = readE2ESource(CONSOLIDATED_ROUTE_ZOOM_OWNER);
    expect(source).toContain('".lx-route-brand"');
    expect(source).toContain('".lx-route-reminder-entry > summary"');
    expect(source).toContain('button[aria-label="Открыть профиль"]');
    expect(source).toContain("fixedGlobalChrome");
    expect(source).toContain("focusableOffenders");
    expect(source).toContain("document must not overflow horizontally at 200% browser zoom");
    expect(source).toContain("focused route must suppress ordinary RouteChrome at 200% zoom");
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

  it("keeps Home zoom aligned with the shell-owned information architecture and exact 720px boundary", () => {
    const source = readE2ESource("home-browser-zoom.spec.ts");
    expect(source).toContain('page.locator(".lx-home-paths")');
    expect(source).toContain("await expect(paths).toBeHidden()");
    expect(source).toContain("canonical bounded two-column Home action layout");
    expect(source).toContain("canonical two-column Home action layout must top-align");
    expect(source).not.toContain("single-column Home action breakpoint");
    expect(source).not.toContain("responsive progress panel must follow the Home hero in document order");
    expect(source).not.toContain("Home path card");
    expect(source).not.toContain("pathColumns");
  });

  it("keeps Learn zoom focus aligned with roving-tabindex radio semantics", () => {
    const source = readE2ESource("learn-browser-zoom.spec.ts");
    expect(source.match(/getByRole\("radio", \{ checked: true \}\)/g)).toHaveLength(3);
    expect(source).not.toContain('getByRole("radio").first()');
  });

  it("keeps Phrases true browser zoom inside an already-collected visual owner", () => {
    expect(visualConfig).toContain(`"${PHRASES_VISUAL_OWNER}"`);
    const source = readE2ESource(PHRASES_VISUAL_OWNER);
    expect(source).toContain('test.describe("Phrases browser-owned zoom"');
    expect(source).toContain("lexigoBrowserZoomController");
    expect(source).toContain("setBrowserZoom(serviceWorker, targetURL, 2)");
    expect(source).toContain("cssVisualViewport.zoom");
    expect(source).toContain("phrases-browser-zoom-metrics.json");
  });
});
