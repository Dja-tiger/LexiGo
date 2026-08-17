import { createHash } from "node:crypto";

import { expect, test, type Page, type TestInfo } from "@playwright/test";

import {
  captureRuntimeErrors,
  installDeterministicRuntime,
  installQualityGateAPI,
  QUALITY_PHRASES,
} from "./support/quality-gates";

type Appearance = "light" | "dark";
type RouteKey = "phrases" | "profile";

type ReviewedBaseline = Readonly<{
  width: 768;
  height: number;
  sha256: string;
  sourceRun: number;
  sourceHeadSha: string;
}>;

const BASELINES: Record<`${RouteKey}.${Appearance}`, ReviewedBaseline> = {
  "phrases.light": {
    width: 768,
    height: 1593,
    sha256: "1888474ef81dc4f577eb6d60e7824345633f5fd00d85ee317f9906e29e1da30e",
    sourceRun: 32048818693,
    sourceHeadSha: "be2bf0341bc85bdb3f860e5e7ba3226f2cedbc25",
  },
  "phrases.dark": {
    width: 768,
    height: 1593,
    sha256: "b121949056aed463ee7bacb94b8425764989fdb11d4c9243d532d0c192e7c98a",
    sourceRun: 32048818693,
    sourceHeadSha: "be2bf0341bc85bdb3f860e5e7ba3226f2cedbc25",
  },
  "profile.light": {
    width: 768,
    height: 4229,
    sha256: "4e03f171ad8dca2abfff40fd1e1368b9a42358de72d653b66fd4209a1b34bde4",
    sourceRun: 32048818693,
    sourceHeadSha: "be2bf0341bc85bdb3f860e5e7ba3226f2cedbc25",
  },
  "profile.dark": {
    width: 768,
    height: 4229,
    sha256: "e8c4a7a37df7d1227212915ab083611097bbb63a65933462a267d02c752ab1af",
    sourceRun: 32048818693,
    sourceHeadSha: "be2bf0341bc85bdb3f860e5e7ba3226f2cedbc25",
  },
};

async function installAppearance(page: Page, appearance: Appearance): Promise<void> {
  await page.addInitScript((value) => {
    window.localStorage.setItem("lexigo.appearance.v1", value);
  }, appearance);
  await page.emulateMedia({
    colorScheme: appearance,
    reducedMotion: "reduce",
  });
}

async function settle(page: Page, appearance: Appearance): Promise<void> {
  await expect(page.locator("html")).toHaveAttribute("data-lexigo-appearance", appearance);
  await expect(page.locator("html")).toHaveAttribute("data-lexigo-resolved-appearance", appearance);
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo({ top: 0, behavior: "auto" });
  });
  await page.waitForTimeout(100);
}

async function expectSharedTabletGeometry(page: Page): Promise<void> {
  const geometry = await page.evaluate(() => {
    const root = document.documentElement;
    const rail = document.querySelector<HTMLElement>('[data-route-navigation="rail"]');
    if (!rail) throw new Error("Expected tablet RouteChrome rail");
    const railStyle = window.getComputedStyle(rail);
    const railRect = rail.getBoundingClientRect();

    return {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      clientWidth: root.clientWidth,
      documentWidth: Math.max(root.scrollWidth, document.body.scrollWidth),
      railDisplay: railStyle.display,
      railLeft: railRect.left,
      railRight: railRect.right,
    };
  });

  expect(geometry.innerWidth).toBe(768);
  expect(geometry.innerHeight).toBe(1024);
  expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.clientWidth + 1);
  expect(geometry.railDisplay).toBe("flex");
  expect(geometry.railLeft).toBeGreaterThanOrEqual(-1);
  expect(geometry.railRight).toBeLessThanOrEqual(geometry.clientWidth + 1);
}

async function expectPhrasesGeometry(page: Page): Promise<void> {
  const geometry = await page.evaluate(() => {
    const workspace = document.querySelector<HTMLElement>(".lx-phrases-workspace");
    const filters = document.querySelector<HTMLElement>(".lx-phrases-filters");
    const results = document.querySelector<HTMLElement>(".lx-phrases-results-panel");
    const rail = document.querySelector<HTMLElement>('[data-route-navigation="rail"]');
    if (!workspace || !filters || !results || !rail) {
      throw new Error("Missing Phrases tablet owners");
    }

    const workspaceStyle = window.getComputedStyle(workspace);
    const filtersRect = filters.getBoundingClientRect();
    const resultsRect = results.getBoundingClientRect();
    const railRect = rail.getBoundingClientRect();

    return {
      columns: workspaceStyle.gridTemplateColumns.split(/\s+/).filter(Boolean).length,
      filtersDisplay: window.getComputedStyle(filters).display,
      filtersLeft: filtersRect.left,
      filtersRight: filtersRect.right,
      filtersWidth: filtersRect.width,
      resultsLeft: resultsRect.left,
      resultsRight: resultsRect.right,
      resultsWidth: resultsRect.width,
      railRight: railRect.right,
      clientWidth: document.documentElement.clientWidth,
    };
  });

  expect(geometry.columns).toBe(1);
  expect(geometry.filtersDisplay).not.toBe("none");
  expect(geometry.filtersWidth).toBeGreaterThan(400);
  expect(geometry.resultsWidth).toBeGreaterThan(400);
  expect(geometry.filtersLeft).toBeGreaterThanOrEqual(geometry.railRight + 8);
  expect(geometry.resultsLeft).toBeGreaterThanOrEqual(geometry.railRight + 8);
  expect(geometry.filtersRight).toBeLessThanOrEqual(geometry.clientWidth + 1);
  expect(geometry.resultsRight).toBeLessThanOrEqual(geometry.clientWidth + 1);
}

async function expectProfileGeometry(page: Page): Promise<void> {
  const geometry = await page.evaluate(() => {
    const main = document.querySelector<HTMLElement>(".lx-profile-app .lx-main-content");
    const rail = document.querySelector<HTMLElement>('[data-route-navigation="rail"]');
    if (!main || !rail) throw new Error("Missing Profile tablet owners");

    const mainRect = main.getBoundingClientRect();
    const railRect = rail.getBoundingClientRect();
    return {
      mainLeft: mainRect.left,
      mainRight: mainRect.right,
      railRight: railRect.right,
      clientWidth: document.documentElement.clientWidth,
    };
  });

  expect(geometry.mainLeft).toBeGreaterThanOrEqual(geometry.railRight + 8);
  expect(geometry.mainRight).toBeLessThanOrEqual(geometry.clientWidth + 1);
}

async function captureReviewedEvidence(
  page: Page,
  testInfo: TestInfo,
  routeKey: RouteKey,
  appearance: Appearance,
): Promise<void> {
  const baselineKey = `${routeKey}.${appearance}` as const;
  const baseline = BASELINES[baselineKey];
  const profileButton = page.getByRole("button", { name: "Открыть профиль" });
  const screenshot = await page.screenshot({
    animations: "disabled",
    caret: "hide",
    fullPage: true,
    mask: await profileButton.count() > 0 ? [profileButton] : [],
    scale: "css",
  });

  const actual = {
    width: screenshot.readUInt32BE(16),
    height: screenshot.readUInt32BE(20),
    sha256: createHash("sha256").update(screenshot).digest("hex"),
  };

  if (
    actual.width !== baseline.width
    || actual.height !== baseline.height
    || actual.sha256 !== baseline.sha256
  ) {
    await testInfo.attach(`tablet-layout-${routeKey}-${appearance}.png`, {
      body: screenshot,
      contentType: "image/png",
    });
    await testInfo.attach(`tablet-layout-${routeKey}-${appearance}.json`, {
      body: Buffer.from(JSON.stringify({
        routeKey,
        appearance,
        viewport: { width: 768, height: 1024 },
        actual,
        approved: baseline,
      }, null, 2)),
      contentType: "application/json",
    });
  }

  expect(
    actual,
    `${baselineKey}: Linux baseline from CI ${baseline.sourceRun} at ${baseline.sourceHeadSha}`,
  ).toEqual({
    width: baseline.width,
    height: baseline.height,
    sha256: baseline.sha256,
  });
}

test.describe("Issue #571 tablet layout visual evidence", () => {
  test.describe.configure({ timeout: 90_000 });

  test.beforeEach(async ({ context, page }) => {
    await installDeterministicRuntime(page);
    await installQualityGateAPI(context);
  });

  for (const appearance of ["light", "dark"] as const) {
    test(`Phrases 768×1024 ${appearance}`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "visual-medium", "Dedicated 768×1024 evidence only");
      expect(page.viewportSize()).toEqual({ width: 768, height: 1024 });

      await installAppearance(page, appearance);
      const runtimeErrors = captureRuntimeErrors(page);
      await page.goto("/phrases", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { level: 1, name: "Находите готовые формулировки" })).toBeVisible();
      await expect(
        page.getByRole("list", { name: "Результаты каталога фраз" }).getByRole("listitem"),
      ).toHaveCount(QUALITY_PHRASES.length);
      await settle(page, appearance);
      await expectSharedTabletGeometry(page);
      await expectPhrasesGeometry(page);
      expect(runtimeErrors).toEqual([]);
      await captureReviewedEvidence(page, testInfo, "phrases", appearance);
    });

    test(`Profile 768×1024 ${appearance}`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== "visual-medium", "Dedicated 768×1024 evidence only");
      expect(page.viewportSize()).toEqual({ width: 768, height: 1024 });

      await installAppearance(page, appearance);
      const runtimeErrors = captureRuntimeErrors(page);
      await page.goto("/profile", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { level: 1, name: "Профиль", exact: true })).toBeVisible();
      await expect(page.getByText("12 из 30 ответов сегодня", { exact: true })).toBeVisible();
      await settle(page, appearance);
      await expectSharedTabletGeometry(page);
      await expectProfileGeometry(page);
      expect(runtimeErrors).toEqual([]);
      await captureReviewedEvidence(page, testInfo, "profile", appearance);
    });
  }
});