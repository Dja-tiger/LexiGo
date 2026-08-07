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
const KEYBOARD_FOCUS_OWNERS = [
  ...STANDALONE_BROWSER_ZOOM_OWNERS,
  PHRASES_VISUAL_OWNER,
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
    expect(source).not.toContain("single-column Home action breakpoint");
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
