import { createHash } from "node:crypto";
import { resolve } from "node:path";

import {
  chromium,
  expect,
  test,
  type CDPSession,
  type Locator,
  type Page,
  type Worker,
} from "@playwright/test";

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

type BrowserZoomResult = {
  tabId: number;
  url: string;
  previousZoom: number;
  zoom: number;
  mode: string | null;
  scope: string | null;
};

type BrowserLayoutMetrics = {
  cssLayoutViewport: {
    clientWidth: number;
    clientHeight: number;
  };
  cssVisualViewport: {
    clientWidth: number;
    clientHeight: number;
    scale: number;
    zoom: number;
  };
};

type DOMZoomMetrics = {
  innerWidth: number;
  innerHeight: number;
  clientWidth: number;
  documentWidth: number;
  bodyWidth: number;
  rootFontSize: number;
  visualViewportScale: number;
};

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
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

async function expectHorizontallyContained(
  locator: Locator,
  viewportWidth: number,
  label: string,
): Promise<void> {
  const count = await locator.count();
  expect(count, `${label} must resolve at least one element`).toBeGreaterThan(0);

  for (let index = 0; index < count; index += 1) {
    const item = locator.nth(index);
    await expect(item, `${label}[${index}] must be visible`).toBeVisible();
    const box = await item.boundingBox();
    expect(box, `${label}[${index}] must have layout geometry`).not.toBeNull();
    if (!box) {
      throw new Error(`${label}[${index}] has no layout geometry.`);
    }
    expect(box.x, `${label}[${index}] must not clip on the inline start`).toBeGreaterThanOrEqual(-1);
    expect(
      box.x + box.width,
      `${label}[${index}] must not clip on the inline end`,
    ).toBeLessThanOrEqual(viewportWidth + 1);
  }
}

function rectanglesOverlap(left: Rect, right: Rect): boolean {
  return (
    left.x < right.x + right.width
    && left.x + left.width > right.x
    && left.y < right.y + right.height
    && left.y + left.height > right.y
  );
}

async function expectNoOverlap(left: Locator, right: Locator, label: string): Promise<void> {
  const [leftBox, rightBox] = await Promise.all([left.boundingBox(), right.boundingBox()]);
  expect(leftBox, `${label}: left element must have geometry`).not.toBeNull();
  expect(rightBox, `${label}: right element must have geometry`).not.toBeNull();
  if (!leftBox || !rightBox) {
    throw new Error(`${label}: missing layout geometry.`);
  }
  expect(rectanglesOverlap(leftBox, rightBox), `${label}: elements must not overlap`).toBe(false);
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

async function setBrowserZoom(
  worker: Worker,
  targetURL: string,
  zoomFactor: number,
): Promise<BrowserZoomResult> {
  return worker.evaluate(async ({ targetURL: exactTargetURL, zoomFactor: exactZoomFactor }) => {
    type ZoomController = {
      setZoomForURL: (url: string, factor: number) => Promise<BrowserZoomResult>;
    };
    const controller = (
      globalThis as typeof globalThis & { lexigoBrowserZoomController?: ZoomController }
    ).lexigoBrowserZoomController;

    if (!controller) {
      throw new Error("LexiGo browser zoom extension controller is unavailable.");
    }

    return controller.setZoomForURL(exactTargetURL, exactZoomFactor);
  }, { targetURL, zoomFactor });
}

async function readBrowserLayoutMetrics(cdp: CDPSession): Promise<BrowserLayoutMetrics> {
  return await cdp.send("Page.getLayoutMetrics") as BrowserLayoutMetrics;
}

async function readDOMZoomMetrics(page: Page): Promise<DOMZoomMetrics> {
  return page.evaluate(() => ({
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    clientWidth: document.documentElement.clientWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
    rootFontSize: Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize),
    visualViewportScale: window.visualViewport?.scale ?? 1,
  }));
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

test.describe("Word Detail browser-owned zoom", () => {
  test.describe.configure({ timeout: 90_000 });

  test("desktop 200% browser zoom reflows without clipping, overlap or sticky obstruction", async ({}, testInfo) => {
    test.skip(testInfo.project.name !== "visual-desktop", "true browser zoom runs once in authoritative desktop Chromium");

    const extensionPath = resolve(
      process.cwd(),
      "e2e/support/browser-zoom-extension",
    );
    const context = await chromium.launchPersistentContext("", {
      baseURL: "http://127.0.0.1:3000",
      channel: "chromium",
      headless: true,
      locale: "ru-RU",
      colorScheme: "light",
      reducedMotion: "reduce",
      serviceWorkers: "allow",
      viewport: { width: 1440, height: 900 },
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    try {
      const page = context.pages()[0] ?? await context.newPage();
      await installDeterministicRuntime(page);
      await installQualityGateAPI(context);
      await installCanonicalWordDetailFixture(page);
      const runtimeErrors = captureRuntimeErrors(page);

      await openWordDetail(page);
      await page.evaluate(async () => {
        await document.fonts.ready;
        window.scrollTo({ top: 0, behavior: "auto" });
      });

      let [serviceWorker] = context.serviceWorkers();
      if (!serviceWorker) {
        serviceWorker = await context.waitForEvent("serviceworker");
      }
      expect(serviceWorker.url()).toMatch(/^chrome-extension:\/\/[a-z]+\/background\.js$/);

      const targetURL = page.url();
      const cdp = await context.newCDPSession(page);
      const normalizedZoom = await setBrowserZoom(serviceWorker, targetURL, 1);
      expect(normalizedZoom.url).toBe(targetURL);
      expect(normalizedZoom.zoom).toBeCloseTo(1, 5);
      expect(normalizedZoom.mode).toBe("automatic");
      expect(normalizedZoom.scope).toBe("per-tab");

      const beforeDOM = await readDOMZoomMetrics(page);
      const beforeCDP = await readBrowserLayoutMetrics(cdp);
      expect(beforeCDP.cssVisualViewport.zoom).toBeCloseTo(1, 5);
      expect(beforeDOM.rootFontSize).toBeGreaterThanOrEqual(16);

      const appliedZoom = await setBrowserZoom(serviceWorker, targetURL, 2);
      expect(appliedZoom.url).toBe(targetURL);
      expect(appliedZoom.previousZoom).toBeCloseTo(1, 5);
      expect(appliedZoom.zoom).toBeCloseTo(2, 5);
      expect(appliedZoom.mode).toBe("automatic");
      expect(appliedZoom.scope).toBe("per-tab");

      await expect.poll(async () => (
        await readBrowserLayoutMetrics(cdp)
      ).cssVisualViewport.zoom).toBeCloseTo(2, 4);
      await expect.poll(async () => (
        await readDOMZoomMetrics(page)
      ).innerWidth).toBeLessThanOrEqual(Math.ceil(beforeDOM.innerWidth / 1.9));

      const afterDOM = await readDOMZoomMetrics(page);
      const afterCDP = await readBrowserLayoutMetrics(cdp);
      expect(afterDOM.rootFontSize).toBeCloseTo(beforeDOM.rootFontSize, 5);
      expect(afterDOM.visualViewportScale).toBeCloseTo(1, 5);
      expect(afterDOM.innerWidth).toBeGreaterThanOrEqual(Math.floor(beforeDOM.innerWidth / 2.1));
      expect(afterDOM.innerWidth).toBeLessThanOrEqual(Math.ceil(beforeDOM.innerWidth / 1.9));
      expect(afterCDP.cssVisualViewport.zoom).toBeCloseTo(2, 4);
      expect(afterCDP.cssLayoutViewport.clientWidth).toBeCloseTo(afterDOM.innerWidth, 0);
      expect(afterCDP.cssVisualViewport.clientWidth).toBeCloseTo(afterDOM.innerWidth, 0);
      expect(afterDOM.documentWidth).toBeLessThanOrEqual(afterDOM.clientWidth + 1);
      expect(afterDOM.bodyWidth).toBeLessThanOrEqual(afterDOM.clientWidth + 1);

      const routeHeader = page.locator(".lx-word-detail-route-header");
      const back = page.getByRole("button", { name: /Слово|Словарь/ });
      const status = page.locator(".lx-word-detail-status-chip");
      const layout = page.locator(".lx-word-detail-layout");
      const card = page.locator(".lx-word-detail-card");
      const term = page.locator(".lx-word-detail-term");
      const speech = page.getByRole("button", {
        name: /Произнести: rollback|Произношение недоступно: rollback/,
      });
      const meaning = page.locator(".lx-word-detail-meaning");
      const related = page.getByRole("list", { name: "Связанные фразы" });
      const relatedButtons = related.getByRole("button");
      const practice = page.locator(".lx-word-detail-practice");
      const knowledge = page.locator(".lx-word-detail-knowledge");

      await expect(page.getByRole("heading", { level: 1, name: CANONICAL_WORD_DETAIL.lemma })).toBeVisible();
      await expect(page.getByText(CANONICAL_WORD_DETAIL.translation, { exact: true })).toBeVisible();
      await expect(practice).toHaveCount(1);
      await expect(practice).toHaveAccessibleName("Повторить сейчас");
      await expect(practice).toBeEnabled();
      await expect(back).toBeEnabled();
      await expect(relatedButtons).toHaveCount(3);

      const responsiveStyles = await layout.evaluate((element) => {
        const style = window.getComputedStyle(element);
        return {
          gridColumns: style.gridTemplateColumns,
        };
      });
      expect(
        responsiveStyles.gridColumns.split(/\s+/).filter(Boolean),
        "200% browser zoom must activate the single-column Word Detail breakpoint",
      ).toHaveLength(1);
      await expect(knowledge).toHaveCSS("position", "static");

      await expectHorizontallyContained(routeHeader, afterDOM.clientWidth, "route header");
      await expectHorizontallyContained(term, afterDOM.clientWidth, "term block");
      await expectHorizontallyContained(speech, afterDOM.clientWidth, "speech control");
      await expectHorizontallyContained(meaning, afterDOM.clientWidth, "meaning block");
      await expectHorizontallyContained(relatedButtons, afterDOM.clientWidth, "related phrase action");
      await expectHorizontallyContained(practice, afterDOM.clientWidth, "primary practice action");
      await expectHorizontallyContained(knowledge, afterDOM.clientWidth, "knowledge panel");
      await expectNoHorizontalOverflow(page);

      await expectNoOverlap(back, status, "route Back and status chip");
      await expectNoOverlap(term, speech, "term and pronunciation control");
      await expectNoOverlap(card, knowledge, "content card and de-sticky knowledge panel");
      const [cardBox, knowledgeBox] = await Promise.all([card.boundingBox(), knowledge.boundingBox()]);
      expect(cardBox).not.toBeNull();
      expect(knowledgeBox).not.toBeNull();
      if (!cardBox || !knowledgeBox) {
        throw new Error("Word Detail card or knowledge panel has no layout geometry.");
      }
      expect(
        knowledgeBox.y,
        "de-sticky knowledge panel must follow the content card in document order",
      ).toBeGreaterThanOrEqual(cardBox.y + cardBox.height - 1);

      await expectVisibleFocus(back);
      await expectVisibleFocus(practice);
      for (let index = 0; index < await relatedButtons.count(); index += 1) {
        const relatedButton = relatedButtons.nth(index);
        await expect(relatedButton).toBeEnabled();
        await expectVisibleFocus(relatedButton);
      }
      if (await speech.isEnabled()) {
        await expectVisibleFocus(speech);
      } else {
        await expect(speech).toHaveAccessibleName("Произношение недоступно: rollback");
      }

      expect(runtimeErrors).toEqual([]);
      await testInfo.attach("word-detail-browser-zoom-metrics.json", {
        body: Buffer.from(JSON.stringify({
          targetURL,
          normalizedZoom,
          appliedZoom,
          beforeDOM,
          beforeCDP,
          afterDOM,
          afterCDP,
        }, null, 2)),
        contentType: "application/json",
      });
    } finally {
      await context.close();
    }
  });
});
