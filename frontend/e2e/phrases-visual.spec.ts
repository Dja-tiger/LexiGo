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

const PHRASES_VISUAL_BASELINES = {
  catalogCompactLight: {
    name: "phrases-catalog-compact-light.png",
    width: 390,
    height: 1628,
    sha256: "450b3e369ab535cd09c082ea826429c11d64375eede8ccee9084d63cdf13a046",
    sourceRun: 31009993569,
    sourceHeadSha: "6ba40fbdafccc4cd34ad3869a7004a6c0c4ea9c2",
  },
  catalogCompactDark: {
    name: "phrases-catalog-compact-dark.png",
    width: 390,
    height: 1628,
    sha256: "1e4573dba7271fdc600c6a50f14a628f3ac9086d6e0723e75e88b5cfa0fcba5f",
    sourceRun: 31009993569,
    sourceHeadSha: "6ba40fbdafccc4cd34ad3869a7004a6c0c4ea9c2",
  },
  catalogDesktopLight: {
    name: "phrases-catalog-desktop-light.png",
    width: 1440,
    height: 1185,
    sha256: "53d83a62f566a6ba44680161b6f32038e5e443ef441153d67e2044287f3f0e43",
    sourceRun: 30366489438,
    sourceHeadSha: "dc22918ffe99bc8e52116d885ab0baf961762d00",
  },
  catalogDesktopDark: {
    name: "phrases-catalog-desktop-dark.png",
    width: 1440,
    height: 1185,
    sha256: "fd9525c2521674657cd764eff8ecca593295b5b4f86a721c5e185b3481bd2d90",
    sourceRun: 30366489438,
    sourceHeadSha: "dc22918ffe99bc8e52116d885ab0baf961762d00",
  },
  detailCompactLight: {
    name: "phrase-detail-compact-light.png",
    width: 390,
    height: 2147,
    sha256: "c52f59889bf73573ac257e01a415f392adaa5a7f18508f7348b6063100e4c58c",
    sourceRun: 31009993569,
    sourceHeadSha: "6ba40fbdafccc4cd34ad3869a7004a6c0c4ea9c2",
  },
  detailCompactDark: {
    name: "phrase-detail-compact-dark.png",
    width: 390,
    height: 2147,
    sha256: "e096e2b80303000cf31ca09907e8484f730d28528b19787fc1c1f0057d046c3f",
    sourceRun: 31009993569,
    sourceHeadSha: "6ba40fbdafccc4cd34ad3869a7004a6c0c4ea9c2",
  },
  detailDesktopLight: {
    name: "phrase-detail-desktop-light.png",
    width: 1440,
    height: 1413,
    sha256: "3e507cad9f8a1eab1df0dd5f1ff51a8b6cabd899f6a665eb3b850aec9d0a8f29",
    sourceRun: 30366489438,
    sourceHeadSha: "dc22918ffe99bc8e52116d885ab0baf961762d00",
  },
  detailDesktopDark: {
    name: "phrase-detail-desktop-dark.png",
    width: 1440,
    height: 1413,
    sha256: "805a2093d131d8561b8d78306de84749d50163dd24f9834fb6181f1eda4bea6e",
    sourceRun: 30366489438,
    sourceHeadSha: "dc22918ffe99bc8e52116d885ab0baf961762d00",
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
  await expect(page.getByRole("heading", { level: 1, name: "Находите готовые формулировки" })).toBeVisible();
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
