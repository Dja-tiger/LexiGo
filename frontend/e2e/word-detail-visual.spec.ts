import { createHash } from "node:crypto";

import { expect, test, type Locator, type Page } from "@playwright/test";

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
    height: 1749,
    sha256: "c0370ebe2bb3e5b14b802889603d00bd9a43d33f63fe67ea87ddcf071e8a6112",
    sourceRun: 2913,
    sourceHeadSha: "f417d52aa742100cddb56007925ce994fa3b8850",
  },
  compactDark: {
    name: "word-detail-compact-dark.png",
    width: 390,
    height: 1749,
    sha256: "1587a40a287e26e8806a25ca146051e470f2e0aa3db0a89329ed0af99611c3fb",
    sourceRun: 2913,
    sourceHeadSha: "f417d52aa742100cddb56007925ce994fa3b8850",
  },
  desktopLight: {
    name: "word-detail-desktop-light.png",
    width: 1440,
    height: 1160,
    sha256: "64258a07b5010045dcc4929110f5635d072c995bfaf315d9140aee0e6a3abf72",
    sourceRun: 1955,
    sourceHeadSha: "7f00019d372a3daf2fd7bd14bac39c3abc69d27c",
  },
  desktopDark: {
    name: "word-detail-desktop-dark.png",
    width: 1440,
    height: 1160,
    sha256: "0d5f69b6b4ecb530bd51b421e20f5fcd66f4bc01d60bb20969b592e9a95fde24",
    sourceRun: 1955,
    sourceHeadSha: "7f00019d372a3daf2fd7bd14bac39c3abc69d27c",
  },
} satisfies Record<string, ContentAddressedVisualBaseline>;

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    contentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
  }));
  expect(
    dimensions.contentWidth,
    `Word Detail must not overflow horizontally: viewport=${dimensions.viewportWidth}px content=${dimensions.contentWidth}px`,
  ).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
}

async function expectVisibleFocus(locator: Locator): Promise<void> {
  await locator.focus();
  await expect(locator).toBeFocused();
  const focus = await locator.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      focusVisible: element.matches(":focus-visible"),
      outlineWidth: Number.parseFloat(style.outlineWidth),
      outlineStyle: style.outlineStyle,
      boxShadow: style.boxShadow,
    };
  });
  expect(focus.focusVisible).toBe(true);
  expect(focus.outlineWidth).toBeGreaterThanOrEqual(3);
  expect(focus.outlineStyle).not.toBe("none");
  expect(focus.boxShadow).not.toBe("none");
}

async function openWordDetail(page: Page): Promise<void> {
  await page.goto("/words/101?source=backend&topic=Release&status=review&page=2", {
    waitUntil: "domcontentloaded",
  });
  await expect(page.getByRole("heading", { level: 1, name: CANONICAL_WORD_DETAIL.lemma })).toBeVisible();
  await expect(page.getByText("Следующее повторение", { exact: true })).toBeVisible();
  await expect(page.getByRole("list", { name: "Связанные фразы" })).toBeVisible();
}

async function prepareStableWordDetail(page: Page): Promise<void> {
  await openWordDetail(page);
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo({ top: 0, behavior: "auto" });
  });
  await expectNoHorizontalOverflow(page);
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

  test("compact 200% text reflow keeps reading, navigation and practice usable", async ({ page }) => {
    test.skip(page.viewportSize()?.width !== 390, "compact 200% Word Detail contract only");
    const runtimeErrors = captureRuntimeErrors(page);
    await openWordDetail(page);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    await expect(page.getByRole("heading", { level: 1, name: CANONICAL_WORD_DETAIL.lemma })).toBeVisible();
    await expect(page.getByText(CANONICAL_WORD_DETAIL.translation, { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Повторить сейчас" }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectVisibleFocus(page.getByRole("button", { name: /Слово|Словарь/ }).first());
    await expectVisibleFocus(page.getByRole("button", { name: "Повторить сейчас" }).first());
    expect(runtimeErrors).toEqual([]);
  });

  test("unsupported speech leaves the word and practice path available", async ({ page }) => {
    test.skip(page.viewportSize()?.width !== 390, "compact speech fallback contract only");
    await page.addInitScript(() => {
      Object.defineProperty(window, "SpeechSynthesisUtterance", {
        configurable: true,
        value: undefined,
      });
    });
    const runtimeErrors = captureRuntimeErrors(page);
    await openWordDetail(page);
    const speech = page.getByRole("button", { name: /Произношение недоступно: rollback/ });
    await expect(speech).toBeDisabled();
    await expect(page.getByText(/Озвучивание недоступно в этом браузере/)).toBeVisible();
    await expect(page.getByRole("heading", { level: 1, name: CANONICAL_WORD_DETAIL.lemma })).toBeVisible();
    await expect(page.getByRole("button", { name: "Повторить сейчас" }).first()).toBeEnabled();
    expect(runtimeErrors).toEqual([]);
  });

  test("forced colors preserve semantic controls without overflow", async ({ page }) => {
    test.skip(page.viewportSize()?.width !== 390, "compact forced-colors Word Detail contract only");
    const runtimeErrors = captureRuntimeErrors(page);
    await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
    await openWordDetail(page);
    await expectNoHorizontalOverflow(page);
    await expect(page.getByRole("button", { name: "Повторить сейчас" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: /Произнести: rollback|Произношение недоступно: rollback/ })).toBeVisible();
    expect(runtimeErrors).toEqual([]);
  });
});
