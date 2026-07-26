import { createHash } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

import {
  captureRuntimeErrors,
  installDeterministicRuntime,
  installQualityGateAPI,
} from "./support/quality-gates";
import {
  CANONICAL_WORD_DETAIL,
  installCanonicalWordDetailFixture,
} from "./support/word-detail-fixture";

type ContentAddressedVisualBaseline = {
  name: string;
  width: number;
  height: number;
  sha256: string;
  sourceRun: number;
  sourceHeadSha: string;
};

const WORD_DETAIL_VISUAL_BASELINES = {
  compactLight: {
    name: "word-detail-compact-light.png",
    width: 390,
    height: 0,
    sha256: "pending-linux-calibration",
    sourceRun: 0,
    sourceHeadSha: "pending-linux-calibration",
  },
  compactDark: {
    name: "word-detail-compact-dark.png",
    width: 390,
    height: 0,
    sha256: "pending-linux-calibration",
    sourceRun: 0,
    sourceHeadSha: "pending-linux-calibration",
  },
  desktopLight: {
    name: "word-detail-desktop-light.png",
    width: 1440,
    height: 0,
    sha256: "pending-linux-calibration",
    sourceRun: 0,
    sourceHeadSha: "pending-linux-calibration",
  },
  desktopDark: {
    name: "word-detail-desktop-dark.png",
    width: 1440,
    height: 0,
    sha256: "pending-linux-calibration",
    sourceRun: 0,
    sourceHeadSha: "pending-linux-calibration",
  },
} satisfies Record<string, ContentAddressedVisualBaseline>;

async function prepareStableWordDetail(page: Page): Promise<void> {
  await page.goto("/words/101?source=backend&topic=Release&status=review&page=2", {
    waitUntil: "domcontentloaded",
  });
  await expect(page.getByRole("heading", { level: 1, name: CANONICAL_WORD_DETAIL.lemma })).toBeVisible();
  await expect(page.getByText("Следующее повторение", { exact: true })).toBeVisible();
  await expect(page.getByRole("list", { name: "Связанные фразы" })).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo({ top: 0, behavior: "auto" });
  });
  const dimensions = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    contentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
  }));
  expect(
    dimensions.contentWidth,
    `Word Detail must not overflow horizontally: viewport=${dimensions.viewportWidth}px content=${dimensions.contentWidth}px`,
  ).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
  await page.waitForTimeout(100);
}

async function expectContentAddressedWordDetail(
  page: Page,
  baseline: ContentAddressedVisualBaseline,
): Promise<void> {
  await prepareStableWordDetail(page);
  const screenshot = await page.screenshot({ fullPage: true });
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

test.describe("Word Detail visual baselines", () => {
  test.describe.configure({ timeout: 90_000 });

  test.beforeEach(async ({ context, page }) => {
    await installDeterministicRuntime(page);
    await installQualityGateAPI(context);
    await installCanonicalWordDetailFixture(page);
  });

  test("compact Light", async ({ page }) => {
    test.skip(page.viewportSize()?.width !== 390, "compact Word Detail baseline only");
    const runtimeErrors = captureRuntimeErrors(page);
    await expectContentAddressedWordDetail(page, WORD_DETAIL_VISUAL_BASELINES.compactLight);
    expect(runtimeErrors).toEqual([]);
  });

  test("compact Dark", async ({ page }) => {
    test.skip(page.viewportSize()?.width !== 390, "compact dark Word Detail baseline only");
    const runtimeErrors = captureRuntimeErrors(page);
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await expectContentAddressedWordDetail(page, WORD_DETAIL_VISUAL_BASELINES.compactDark);
    expect(runtimeErrors).toEqual([]);
  });

  test("desktop Light", async ({ page }) => {
    test.skip(page.viewportSize()?.width !== 1440, "desktop Word Detail baseline only");
    const runtimeErrors = captureRuntimeErrors(page);
    await expectContentAddressedWordDetail(page, WORD_DETAIL_VISUAL_BASELINES.desktopLight);
    expect(runtimeErrors).toEqual([]);
  });

  test("desktop Dark", async ({ page }) => {
    test.skip(page.viewportSize()?.width !== 1440, "desktop dark Word Detail baseline only");
    const runtimeErrors = captureRuntimeErrors(page);
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await expectContentAddressedWordDetail(page, WORD_DETAIL_VISUAL_BASELINES.desktopDark);
    expect(runtimeErrors).toEqual([]);
  });
});
