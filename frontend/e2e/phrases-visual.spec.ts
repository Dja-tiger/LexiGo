import { createHash } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

import {
  captureRuntimeErrors,
  installDeterministicRuntime,
  installQualityGateAPI,
  QUALITY_PHRASES,
} from "./support/quality-gates";

type ContentAddressedVisualBaseline = {
  name: string;
  width: number;
  height: number;
  sha256: string;
  sourceRun: number;
  sourceHeadSha: string;
};

const PROBE_SHA = "0000000000000000000000000000000000000000000000000000000000000000";
const PROBE_HEAD = "0000000000000000000000000000000000000000";

const PHRASES_VISUAL_BASELINES = {
  catalogCompactLight: {
    name: "phrases-catalog-compact-light.png",
    width: 390,
    height: 1,
    sha256: PROBE_SHA,
    sourceRun: 0,
    sourceHeadSha: PROBE_HEAD,
  },
  catalogCompactDark: {
    name: "phrases-catalog-compact-dark.png",
    width: 390,
    height: 1,
    sha256: PROBE_SHA,
    sourceRun: 0,
    sourceHeadSha: PROBE_HEAD,
  },
  catalogDesktopLight: {
    name: "phrases-catalog-desktop-light.png",
    width: 1440,
    height: 1,
    sha256: PROBE_SHA,
    sourceRun: 0,
    sourceHeadSha: PROBE_HEAD,
  },
  catalogDesktopDark: {
    name: "phrases-catalog-desktop-dark.png",
    width: 1440,
    height: 1,
    sha256: PROBE_SHA,
    sourceRun: 0,
    sourceHeadSha: PROBE_HEAD,
  },
  detailCompactLight: {
    name: "phrase-detail-compact-light.png",
    width: 390,
    height: 1,
    sha256: PROBE_SHA,
    sourceRun: 0,
    sourceHeadSha: PROBE_HEAD,
  },
  detailCompactDark: {
    name: "phrase-detail-compact-dark.png",
    width: 390,
    height: 1,
    sha256: PROBE_SHA,
    sourceRun: 0,
    sourceHeadSha: PROBE_HEAD,
  },
  detailDesktopLight: {
    name: "phrase-detail-desktop-light.png",
    width: 1440,
    height: 1,
    sha256: PROBE_SHA,
    sourceRun: 0,
    sourceHeadSha: PROBE_HEAD,
  },
  detailDesktopDark: {
    name: "phrase-detail-desktop-dark.png",
    width: 1440,
    height: 1,
    sha256: PROBE_SHA,
    sourceRun: 0,
    sourceHeadSha: PROBE_HEAD,
  },
} satisfies Record<string, ContentAddressedVisualBaseline>;

async function prepareStableScreenshot(page: Page): Promise<void> {
  const dimensions = await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo({ top: 0, behavior: "auto" });
    const root = document.documentElement;
    return {
      viewportWidth: root.clientWidth,
      contentWidth: Math.max(root.scrollWidth, document.body.scrollWidth),
    };
  });

  expect(
    dimensions.contentWidth,
    `Phrases must not overflow horizontally: viewport=${dimensions.viewportWidth}px, content=${dimensions.contentWidth}px`,
  ).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
  await page.waitForTimeout(100);
}

async function expectContentAddressedScreenshot(
  page: Page,
  baseline: ContentAddressedVisualBaseline,
): Promise<void> {
  await prepareStableScreenshot(page);
  const profile = page.getByRole("button", { name: "Открыть профиль" });
  const screenshot = await page.screenshot({
    fullPage: true,
    mask: await profile.count() > 0 ? [profile] : [],
  });
  const actual = {
    width: screenshot.readUInt32BE(16),
    height: screenshot.readUInt32BE(20),
    sha256: createHash("sha256").update(screenshot).digest("hex"),
  };
  const expected = {
    width: baseline.width,
    height: baseline.height,
    sha256: baseline.sha256,
  };

  if (
    actual.width !== expected.width
    || actual.height !== expected.height
    || actual.sha256 !== expected.sha256
  ) {
    await test.info().attach(baseline.name, {
      body: screenshot,
      contentType: "image/png",
    });
  }

  expect(
    actual,
    `${baseline.name}: Linux baseline from CI ${baseline.sourceRun} at ${baseline.sourceHeadSha}`,
  ).toEqual(expected);
}

async function openCatalog(page: Page): Promise<void> {
  await page.goto("/phrases", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1, name: "Фразы", exact: true })).toBeVisible();
  await expect(page.getByRole("list", { name: "Результаты каталога фраз" }).getByRole("listitem")).toHaveCount(
    QUALITY_PHRASES.length,
  );
}

async function openDetail(page: Page): Promise<void> {
  await page.goto(`/phrases/${QUALITY_PHRASES[0].slug}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1, name: QUALITY_PHRASES[0].lemma })).toBeVisible();
  await expect(page.locator('[data-route-client-island="phrases"]')).toBeVisible();
}

test.describe("Phrases content-addressed Linux visual baselines", () => {
  test.describe.configure({ timeout: 90_000 });

  test.beforeEach(async ({ context, page }) => {
    await installDeterministicRuntime(page);
    await installQualityGateAPI(context);
  });

  test("catalog compact Light", async ({ page }) => {
    test.skip(page.viewportSize()?.width !== 390, "compact baseline only");
    const runtimeErrors = captureRuntimeErrors(page);
    await openCatalog(page);
    await expectContentAddressedScreenshot(page, PHRASES_VISUAL_BASELINES.catalogCompactLight);
    expect(runtimeErrors).toEqual([]);
  });

  test("catalog compact Dark", async ({ page }) => {
    test.skip(page.viewportSize()?.width !== 390, "compact baseline only");
    const runtimeErrors = captureRuntimeErrors(page);
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await openCatalog(page);
    await expectContentAddressedScreenshot(page, PHRASES_VISUAL_BASELINES.catalogCompactDark);
    expect(runtimeErrors).toEqual([]);
  });

  test("catalog desktop Light", async ({ page }) => {
    test.skip(page.viewportSize()?.width !== 1440, "desktop baseline only");
    const runtimeErrors = captureRuntimeErrors(page);
    await openCatalog(page);
    await expectContentAddressedScreenshot(page, PHRASES_VISUAL_BASELINES.catalogDesktopLight);
    expect(runtimeErrors).toEqual([]);
  });

  test("catalog desktop Dark", async ({ page }) => {
    test.skip(page.viewportSize()?.width !== 1440, "desktop baseline only");
    const runtimeErrors = captureRuntimeErrors(page);
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await openCatalog(page);
    await expectContentAddressedScreenshot(page, PHRASES_VISUAL_BASELINES.catalogDesktopDark);
    expect(runtimeErrors).toEqual([]);
  });

  test("detail compact Light", async ({ page }) => {
    test.skip(page.viewportSize()?.width !== 390, "compact baseline only");
    const runtimeErrors = captureRuntimeErrors(page);
    await openDetail(page);
    await expectContentAddressedScreenshot(page, PHRASES_VISUAL_BASELINES.detailCompactLight);
    expect(runtimeErrors).toEqual([]);
  });

  test("detail compact Dark", async ({ page }) => {
    test.skip(page.viewportSize()?.width !== 390, "compact baseline only");
    const runtimeErrors = captureRuntimeErrors(page);
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await openDetail(page);
    await expectContentAddressedScreenshot(page, PHRASES_VISUAL_BASELINES.detailCompactDark);
    expect(runtimeErrors).toEqual([]);
  });

  test("detail desktop Light", async ({ page }) => {
    test.skip(page.viewportSize()?.width !== 1440, "desktop baseline only");
    const runtimeErrors = captureRuntimeErrors(page);
    await openDetail(page);
    await expectContentAddressedScreenshot(page, PHRASES_VISUAL_BASELINES.detailDesktopLight);
    expect(runtimeErrors).toEqual([]);
  });

  test("detail desktop Dark", async ({ page }) => {
    test.skip(page.viewportSize()?.width !== 1440, "desktop baseline only");
    const runtimeErrors = captureRuntimeErrors(page);
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await openDetail(page);
    await expectContentAddressedScreenshot(page, PHRASES_VISUAL_BASELINES.detailDesktopDark);
    expect(runtimeErrors).toEqual([]);
  });
});
