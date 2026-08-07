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
