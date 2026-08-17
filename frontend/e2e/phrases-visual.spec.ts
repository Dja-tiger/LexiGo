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

const PHRASES_VISUAL_BASELINES = {
  catalogCompactLight: {
    name: "phrases-catalog-compact-light.png",
    width: 390,
    height: 1616,
    sha256: "aad18d61ac457b4c24dc792e93fe777f09807edcaf3ec338c532d1dd38424ba7",
    sourceRun: 32048818693,
    sourceHeadSha: "be2bf0341bc85bdb3f860e5e7ba3226f2cedbc25",
  },
  catalogCompactDark: {
    name: "phrases-catalog-compact-dark.png",
    width: 390,
    height: 1616,
    sha256: "eaa1a08ddc79dca246210fe4b857d75b899a9e1e9aab2ad66d67db05f4319ee5",
    sourceRun: 32048818693,
    sourceHeadSha: "be2bf0341bc85bdb3f860e5e7ba3226f2cedbc25",
  },
  catalogDesktopLight: {
    name: "phrases-catalog-desktop-light.png",
    width: 1440,
    height: 1185,
    sha256: "99a3a64a2f4f35c0b08091ed1b013cacedaf7b2969ad87e1eb0d1788e05640fd",
    sourceRun: 32048818693,
    sourceHeadSha: "be2bf0341bc85bdb3f860e5e7ba3226f2cedbc25",
  },
  catalogDesktopDark: {
    name: "phrases-catalog-desktop-dark.png",
    width: 1440,
    height: 1185,
    sha256: "074ca37ecb034e479116789d97624ecb21e39a5b0deed30d36c50267e24f0968",
    sourceRun: 32048818693,
    sourceHeadSha: "be2bf0341bc85bdb3f860e5e7ba3226f2cedbc25",
  },
  detailCompactLight: {
    name: "phrase-detail-compact-light.png",
    width: 390,
    height: 2147,
    sha256: "2711b5666b0cc39cd6eb2db3bae42137d37ae6cb3eb1226683d3763b6fedb045",
    sourceRun: 32048818693,
    sourceHeadSha: "be2bf0341bc85bdb3f860e5e7ba3226f2cedbc25",
  },
  detailCompactDark: {
    name: "phrase-detail-compact-dark.png",
    width: 390,
    height: 2147,
    sha256: "77b7c4e7ad4bbaf21513b23ca3909a7b7fdaa48bdc55cbc22b6a34791c63f569",
    sourceRun: 32048818693,
    sourceHeadSha: "be2bf0341bc85bdb3f860e5e7ba3226f2cedbc25",
  },
  detailDesktopLight: {
    name: "phrase-detail-desktop-light.png",
    width: 1440,
    height: 1413,
    sha256: "9e717ef2e3fbad371f6fed5b7275ad9a415dd23517b1adb936dd552e2921dfbf",
    sourceRun: 32048818693,
    sourceHeadSha: "be2bf0341bc85bdb3f860e5e7ba3226f2cedbc25",
  },
  detailDesktopDark: {
    name: "phrase-detail-desktop-dark.png",
    width: 1440,
    height: 1413,
    sha256: "25df3fd8913b362256a84f593c4812112abb61e6d86092bf88da91f50a86f9e8",
    sourceRun: 32048818693,
    sourceHeadSha: "be2bf0341bc85bdb3f860e5e7ba3226f2cedbc25",
  },
} satisfies Record<string, ContentAddressedVisualBaseline>;

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    contentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
  }));
  expect(
    dimensions.contentWidth,
    `Phrases must not overflow horizontally: viewport=${dimensions.viewportWidth}px, content=${dimensions.contentWidth}px`,
  ).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
}

async function prepareStableScreenshot(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo({ top: 0, behavior: "auto" });
  });
  await expectNoHorizontalOverflow(page);
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

async function expectVisibleFocus(locator: Locator): Promise<void> {
  const page = locator.page();
  await locator.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
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
  const visibleOutline = focus.outlineWidth >= 2 && focus.outlineStyle !== "none";
  const visibleShadow = focus.boxShadow !== "none";
  expect(
    visibleOutline || visibleShadow,
    `Focused Phrases control must expose an outline or focus ring: ${JSON.stringify(focus)}`,
  ).toBe(true);
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
    if (!box) throw new Error(`${label}[${index}] has no layout geometry.`);
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
  if (!leftBox || !rightBox) throw new Error(`${label}: missing layout geometry.`);
  expect(rectanglesOverlap(leftBox, rightBox), `${label}: elements must not overlap`).toBe(false);
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

test.describe("Phrases browser-owned zoom", () => {
  test.describe.configure({ timeout: 90_000 });

  test("desktop 200% browser zoom preserves canonical catalog discovery and practice actions", async ({}, testInfo) => {
    test.skip(testInfo.project.name !== "visual-desktop", "true browser zoom runs once in authoritative desktop Chromium");

    const extensionPath = resolve(process.cwd(), "e2e/support/browser-zoom-extension");
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
      const runtimeErrors = captureRuntimeErrors(page);

      await openCatalog(page);
      await page.evaluate(async () => {
        await document.fonts.ready;
        window.scrollTo({ top: 0, behavior: "auto" });
      });

      let serviceWorker = context.serviceWorkers().find((worker) => (
        worker.url().startsWith("chrome-extension://")
      ));
      if (!serviceWorker) {
        serviceWorker = await context.waitForEvent("serviceworker", {
          predicate: (worker) => worker.url().startsWith("chrome-extension://"),
        });
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

      const main = page.locator('#lexigo-main-content[aria-label="Технические фразы"]');
      const catalog = page.locator(".lx-phrases-catalog");
      const search = page.getByRole("search", { name: "Поиск по фразам", exact: true });
      const searchInput = search.getByRole("searchbox");
      const searchSubmit = search.getByRole("button", { name: "Найти", exact: true });
      const topics = page.getByRole("navigation", { name: "Быстрый выбор темы", exact: true });
      const firstTopic = topics.getByRole("button").first();
      const sort = page.getByRole("combobox", { name: "Сортировка каталога", exact: true });
      const resultsPanel = page.locator(".lx-phrases-results-panel");
      const results = page.getByRole("list", { name: "Результаты каталога фраз", exact: true });
      const firstResult = results.getByRole("link").first();
      const lessonAction = page.getByRole("button", { name: "Урок по теме", exact: true });
      const railNavigation = page.getByRole("navigation", {
        name: "Навигация по разделам",
        exact: true,
      });

      await expect(main).toBeVisible();
      await expect(catalog).toBeVisible();
      await expect(search).toBeVisible();
      await expect(searchInput).toBeEnabled();
      await expect(searchSubmit).toBeEnabled();
      await expect(topics).toBeVisible();
      await expect(firstTopic).toBeEnabled();
      await expect(sort).toBeEnabled();
      await expect(resultsPanel).toBeVisible();
      await expect(firstResult).toBeEnabled();
      await expect(lessonAction).toBeEnabled();
      await expect(railNavigation).toBeVisible();

      await expectHorizontallyContained(main, afterDOM.clientWidth, "Phrases main");
      await expectHorizontallyContained(catalog, afterDOM.clientWidth, "Phrases catalog");
      await expectHorizontallyContained(search, afterDOM.clientWidth, "Phrases search");
      await expectHorizontallyContained(searchInput, afterDOM.clientWidth, "Phrases search input");
      await expectHorizontallyContained(searchSubmit, afterDOM.clientWidth, "Phrases search submit");
      await expectHorizontallyContained(topics, afterDOM.clientWidth, "Phrases topic navigation");
      await expectHorizontallyContained(sort, afterDOM.clientWidth, "Phrases sort");
      await expectHorizontallyContained(resultsPanel, afterDOM.clientWidth, "Phrases results panel");
      await expectHorizontallyContained(firstResult, afterDOM.clientWidth, "Phrases first result");
      await expectHorizontallyContained(lessonAction, afterDOM.clientWidth, "Phrases lesson action");
      await expectHorizontallyContained(railNavigation, afterDOM.clientWidth, "route navigation rail");
      await expectNoHorizontalOverflow(page);

      await expectNoOverlap(railNavigation, main, "route navigation rail and Phrases main");
      await expectNoOverlap(search, topics, "Phrases search and topic navigation");
      await expectNoOverlap(topics, resultsPanel, "Phrases topic navigation and results panel");

      await expectVisibleFocus(searchInput);
      await expectVisibleFocus(searchSubmit);
      await expectVisibleFocus(firstTopic);
      await expectVisibleFocus(sort);
      await expectVisibleFocus(firstResult);
      await expectVisibleFocus(lessonAction);

      expect(runtimeErrors).toEqual([]);
      await testInfo.attach("phrases-browser-zoom-metrics.json", {
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

test.describe("Phrases canonical Figma parity", () => {
  type ExplicitAppearance = "light" | "dark";
  type KnownRouteNavigation = "mobile" | "rail" | "header";
  type CanonicalPhrasesState = "default" | "travel-search" | "empty-search";
  type CanonicalPhrasesCase = {
    name: string;
    width: number;
    height: number;
    appearance: ExplicitAppearance;
    canvas: string;
    figmaNode: "255:10" | "257:2" | "255:81" | "257:74";
    designContract: string;
    project: "visual-compact" | "visual-desktop";
    path: string;
    expectedNavigation: "mobile" | "rail";
    state: CanonicalPhrasesState;
    expectedQuery?: string;
    expectedTopic?: string;
  };

  const canonicalCases: readonly CanonicalPhrasesCase[] = [
    {
      name: "mobile Light default",
      width: 390,
      height: 844,
      appearance: "light",
      canvas: "#f4f7f5",
      figmaNode: "255:10",
      designContract: "Figma 255:10 — mobile Phrases catalog Light/default",
      project: "visual-compact",
      path: "/phrases",
      expectedNavigation: "mobile",
      state: "default",
    },
    {
      name: "mobile Dark Travel search",
      width: 390,
      height: 844,
      appearance: "dark",
      canvas: "#10211d",
      figmaNode: "257:2",
      designContract: "Figma 257:2 — mobile Phrases catalog Dark/search + Travel filter",
      project: "visual-compact",
      path: "/phrases?topic=Travel&query=photo",
      expectedNavigation: "mobile",
      state: "travel-search",
      expectedQuery: "photo",
      expectedTopic: "Travel",
    },
    {
      name: "desktop Light default",
      width: 1440,
      height: 1024,
      appearance: "light",
      canvas: "#f4f7f5",
      figmaNode: "255:81",
      designContract: "Figma 255:81 — desktop Phrases catalog Light/default",
      project: "visual-desktop",
      path: "/phrases",
      expectedNavigation: "rail",
      state: "default",
    },
    {
      name: "desktop Dark empty search",
      width: 1440,
      height: 1024,
      appearance: "dark",
      canvas: "#10211d",
      figmaNode: "257:74",
      designContract: "Figma 257:74 — desktop Phrases catalog Dark/empty search",
      project: "visual-desktop",
      path: "/phrases?query=canonical-parity-no-match",
      expectedNavigation: "rail",
      state: "empty-search",
      expectedQuery: "canonical-parity-no-match",
    },
  ] as const;

  async function installAppearance(page: Page, appearance: ExplicitAppearance): Promise<void> {
    await page.addInitScript((value) => {
      window.localStorage.setItem("lexigo.appearance.v1", value);
    }, appearance);
  }

  async function openCanonicalCatalog(page: Page, canonicalCase: CanonicalPhrasesCase): Promise<void> {
    await page.goto(canonicalCase.path, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", {
      level: 1,
      name: "Находите готовые формулировки",
    })).toBeVisible();
    await expect(page.locator('[data-route-client-island="phrases"]')).toBeVisible();
  }

  async function expectCanonicalCatalog(
    page: Page,
    canonicalCase: CanonicalPhrasesCase,
  ): Promise<KnownRouteNavigation> {
    const url = new URL(page.url());
    expect(url.pathname).toBe("/phrases");
    expect(url.searchParams.get("query")).toBe(canonicalCase.expectedQuery ?? null);
    expect(url.searchParams.get("topic")).toBe(canonicalCase.expectedTopic ?? null);

    const island = page.locator('[data-route-client-island="phrases"]');
    const main = page.locator('#lexigo-main-content[aria-label="Технические фразы"]');
    const catalog = page.locator(".lx-phrases-catalog");
    const search = page.getByRole("search", { name: "Поиск по фразам", exact: true });
    const searchInput = search.getByRole("searchbox");
    const topics = page.getByRole("navigation", { name: "Быстрый выбор темы", exact: true });
    const resultsPanel = page.locator(".lx-phrases-results-panel");
    const visibleNavigation = page.locator("[data-route-navigation]:visible");

    await expect(island).toHaveCount(1);
    await expect(island).toBeVisible();
    await expect(main).toBeVisible();
    await expect(catalog).toBeVisible();
    await expect(search).toBeVisible();
    await expect(searchInput).toBeEnabled();
    await expect(topics).toBeVisible();
    await expect(resultsPanel).toBeVisible();

    await expect(page.locator("html")).toHaveAttribute("data-lexigo-appearance", canonicalCase.appearance);
    await expect(page.locator("html")).toHaveAttribute(
      "data-lexigo-resolved-appearance",
      canonicalCase.appearance,
    );
    const canvas = await page.locator("html").evaluate((element) => (
      window.getComputedStyle(element).getPropertyValue("--ak-color-canvas").trim()
    ));
    expect(canvas).toBe(canonicalCase.canvas);

    if (canonicalCase.state === "default") {
      const results = page.getByRole("list", { name: "Результаты каталога фраз", exact: true });
      await expect(results).toBeVisible();
      expect(await results.getByRole("listitem").count()).toBeGreaterThan(0);
      await expect(searchInput).toHaveValue("");
    } else if (canonicalCase.state === "travel-search") {
      const results = page.getByRole("list", { name: "Результаты каталога фраз", exact: true });
      await expect(searchInput).toHaveValue(canonicalCase.expectedQuery ?? "");
      await expect(page.locator('input[name="phrase-topic"][value="Travel"]')).toBeChecked();
      await expect(results).toBeVisible();
      await expect(page.getByText("Could you take a photo of me?", { exact: true })).toBeVisible();
    } else {
      await expect(searchInput).toHaveValue(canonicalCase.expectedQuery ?? "");
      await expect(page.getByText("По заданным условиям фразы не найдены", { exact: true })).toBeVisible();
      await expect(page.getByRole("list", { name: "Результаты каталога фраз", exact: true })).toHaveCount(0);
    }

    await expectNoHorizontalOverflow(page);
    await expectHorizontallyContained(main, canonicalCase.width, "Phrases semantic main");
    await expectHorizontallyContained(catalog, canonicalCase.width, "Phrases catalog surface");
    await expectHorizontallyContained(search, canonicalCase.width, "Phrases search");
    await expectHorizontallyContained(topics, canonicalCase.width, "Phrases topic navigation");
    await expectHorizontallyContained(resultsPanel, canonicalCase.width, "Phrases results panel");

    await expect(visibleNavigation).toHaveCount(1);
    await expectHorizontallyContained(
      visibleNavigation,
      canonicalCase.width,
      "Phrases visible RouteChrome owner",
    );
    const navigation = await visibleNavigation.getAttribute("data-route-navigation");
    expect(["mobile", "rail", "header"]).toContain(navigation);
    expect(navigation).toBe(canonicalCase.expectedNavigation);

    return navigation as KnownRouteNavigation;
  }

  test.describe.configure({ timeout: 90_000 });

  for (const canonicalCase of canonicalCases) {
    test(`${canonicalCase.name} uses canonical Phrases catalog ownership (${canonicalCase.designContract})`, async ({
      context,
      page,
    }, testInfo) => {
      test.skip(
        testInfo.project.name !== canonicalCase.project,
        `Canonical ${canonicalCase.name} Phrases Figma parity runs only in ${canonicalCase.project}.`,
      );

      testInfo.annotations.push({
        type: "figma",
        description: `${canonicalCase.figmaNode}: ${canonicalCase.designContract}`,
      });

      await page.setViewportSize({ width: canonicalCase.width, height: canonicalCase.height });
      await installDeterministicRuntime(page);
      await installQualityGateAPI(context, { authenticated: false });
      await installAppearance(page, canonicalCase.appearance);
      const runtimeErrors = captureRuntimeErrors(page);

      await openCanonicalCatalog(page, canonicalCase);
      const initialNavigation = await expectCanonicalCatalog(page, canonicalCase);

      await page.reload({ waitUntil: "domcontentloaded" });
      const reloadedNavigation = await expectCanonicalCatalog(page, canonicalCase);
      expect(reloadedNavigation).toBe(initialNavigation);
      expect(runtimeErrors).toEqual([]);

      await testInfo.attach("phrases-canonical-runtime.json", {
        body: Buffer.from(JSON.stringify({
          figmaNode: canonicalCase.figmaNode,
          designContract: canonicalCase.designContract,
          viewport: { width: canonicalCase.width, height: canonicalCase.height },
          appearance: canonicalCase.appearance,
          canvas: canonicalCase.canvas,
          state: canonicalCase.state,
          path: canonicalCase.path,
          navigation: initialNavigation,
        }, null, 2)),
        contentType: "application/json",
      });
    });
  }
});

test.describe("Phrase Detail canonical Figma parity", () => {
  type ExplicitAppearance = "light" | "dark";
  type KnownRouteNavigation = "mobile" | "rail" | "header";
  type CanonicalPhraseDetailContent = {
    slug: string;
    prompt: string;
    translation: string;
    topic: string;
    example: string;
    note: string;
    cloze: string;
    clozeAnswer: string;
  };
  type CanonicalPhraseDetailCase = {
    name: string;
    width: number;
    height: number;
    appearance: ExplicitAppearance;
    canvas: string;
    figmaNode: "255:55" | "257:47" | "255:162" | "257:159";
    designContract: string;
    project: "visual-compact" | "visual-desktop";
    expectedNavigation: "mobile" | "rail";
    authenticated: boolean;
    variant: "daily" | "travel" | "technical";
    apiId?: number;
    content: CanonicalPhraseDetailContent;
  };

  const dailyContent: CanonicalPhraseDetailContent = {
    slug: "could-you-help-me-with-this",
    prompt: "Could you help me with this?",
    translation: "Не могли бы вы помочь мне с этим?",
    topic: "Daily Life",
    example: "Could you help me with this form?",
    note: "Вежливая универсальная просьба о помощи.",
    cloze: "Could you _____ me with this?",
    clozeAnswer: "help",
  };
  const travelContent: CanonicalPhraseDetailContent = {
    slug: "could-you-take-a-photo-of-me",
    prompt: "Could you take a photo of me?",
    translation: "Не могли бы вы меня сфотографировать?",
    topic: "Travel",
    example: "Could you take a photo of me with the building behind me?",
    note: "take a photo — сфотографировать.",
    cloze: "Could you take a _____ of me?",
    clozeAnswer: "photo",
  };
  const technicalContent: CanonicalPhraseDetailContent = {
    slug: "root-cause",
    prompt: "We need to identify the root cause.",
    translation: "Нам нужно определить первопричину.",
    topic: "Incidents",
    example: "Before applying another workaround, we need to identify the root cause.",
    note: "root cause — первопричина, а не просто наблюдаемый симптом",
    cloze: "We need to identify the _____ cause.",
    clozeAnswer: "root",
  };

  const canonicalCases: readonly CanonicalPhraseDetailCase[] = [
    {
      name: "mobile Dark daily",
      width: 390,
      height: 844,
      appearance: "dark",
      canvas: "#10211d",
      figmaNode: "255:55",
      designContract: "Figma 255:55 — mobile Phrase Detail Dark/daily",
      project: "visual-compact",
      expectedNavigation: "mobile",
      authenticated: false,
      variant: "daily",
      content: dailyContent,
    },
    {
      name: "mobile Light travel",
      width: 390,
      height: 844,
      appearance: "light",
      canvas: "#f4f7f5",
      figmaNode: "257:47",
      designContract: "Figma 257:47 — mobile Phrase Detail Light/travel",
      project: "visual-compact",
      expectedNavigation: "mobile",
      authenticated: false,
      variant: "travel",
      content: travelContent,
    },
    {
      name: "desktop Dark technical",
      width: 1440,
      height: 1024,
      appearance: "dark",
      canvas: "#10211d",
      figmaNode: "255:162",
      designContract: "Figma 255:162 — desktop Phrase Detail Dark/technical",
      project: "visual-desktop",
      expectedNavigation: "rail",
      authenticated: true,
      variant: "technical",
      apiId: 9201,
      content: technicalContent,
    },
    {
      name: "desktop Light daily",
      width: 1440,
      height: 1024,
      appearance: "light",
      canvas: "#f4f7f5",
      figmaNode: "257:159",
      designContract: "Figma 257:159 — desktop Phrase Detail Light/daily",
      project: "visual-desktop",
      expectedNavigation: "rail",
      authenticated: true,
      variant: "daily",
      apiId: 9202,
      content: dailyContent,
    },
  ] as const;

  async function installAppearance(page: Page, appearance: ExplicitAppearance): Promise<void> {
    await page.addInitScript((value) => {
      window.localStorage.setItem("lexigo.appearance.v1", value);
    }, appearance);
  }

  async function installExactDetailFixture(
    page: Page,
    canonicalCase: CanonicalPhraseDetailCase,
    requests: string[],
  ): Promise<void> {
    if (!canonicalCase.authenticated) return;
    const expectedPath = `/api/v1/phrases/${encodeURIComponent(canonicalCase.content.slug)}`;
    await page.route(`**${expectedPath}`, async (route) => {
      const request = route.request();
      const requestURL = new URL(request.url());
      requests.push(`${request.method()} ${requestURL.pathname}${requestURL.search}`);
      expect(request.method()).toBe("GET");
      expect(requestURL.pathname).toBe(expectedPath);
      expect(requestURL.search).toBe("");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: canonicalCase.apiId,
          kind: "phrase",
          slug: canonicalCase.content.slug,
          lemma: canonicalCase.content.prompt,
          translation: canonicalCase.content.translation,
          phonetic: "",
          partOfSpeech: "phrase",
          topic: canonicalCase.content.topic,
          examples: [canonicalCase.content.example],
          note: canonicalCase.content.note,
          status: "review",
          cloze: canonicalCase.content.cloze,
          clozeAnswer: canonicalCase.content.clozeAnswer,
        }),
      });
    });
  }

  async function openCanonicalDetail(page: Page, canonicalCase: CanonicalPhraseDetailCase): Promise<void> {
    await page.goto(`/phrases/${canonicalCase.content.slug}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", {
      level: 1,
      name: canonicalCase.content.prompt,
      exact: true,
    })).toBeVisible();
    await expect(page.locator('[data-route-client-island="phrases"]')).toBeVisible();
  }

  async function expectCanonicalDetail(
    page: Page,
    canonicalCase: CanonicalPhraseDetailCase,
  ): Promise<KnownRouteNavigation> {
    const url = new URL(page.url());
    expect(url.pathname).toBe(`/phrases/${canonicalCase.content.slug}`);
    expect(url.search).toBe("");

    const island = page.locator('[data-route-client-island="phrases"]');
    const main = page.locator('#lexigo-main-content[aria-label="Карточка фразы"]');
    const detail = page.locator(".lx-phrase-detail");
    const layout = page.locator(".lx-detail-card.lx-phrase-detail-layout");
    const detailMain = page.locator(".lx-phrase-detail-main");
    const detailSide = page.locator('.lx-phrase-detail-side[aria-label="Практика фразы"]');
    const back = page.getByRole("button", { name: "К списку фраз", exact: true });
    const primaryAction = page.locator(".lx-phrase-detail-primary");
    const visibleNavigation = page.locator("[data-route-navigation]:visible");

    await expect(island).toHaveCount(1);
    await expect(island).toBeVisible();
    await expect(main).toBeVisible();
    await expect(detail).toBeVisible();
    await expect(layout).toBeVisible();
    await expect(detailMain).toBeVisible();
    if (canonicalCase.expectedNavigation === "mobile") {
      await expect(detailSide).toBeHidden();
    } else {
      await expect(detailSide).toBeVisible();
    }
    await expect(back).toBeEnabled();

    await expect(page.getByRole("heading", {
      level: 1,
      name: canonicalCase.content.prompt,
      exact: true,
    })).toBeVisible();
    await expect(page.getByText(canonicalCase.content.translation, { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Смысл и употребление", exact: true })).toBeVisible();
    await expect(page.getByText(canonicalCase.content.note, { exact: true })).toBeVisible();
    await expect(page.locator(".lx-phrase-cloze")).toBeVisible();
    await expect(page.getByText(canonicalCase.content.cloze, { exact: true })).toBeVisible();
    await expect(page.getByText(canonicalCase.content.clozeAnswer, { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Примеры в контексте", exact: true })).toBeVisible();
    await expect(page.getByRole("listitem").filter({ hasText: canonicalCase.content.example })).toBeVisible();
    await expect(page.locator('aside[aria-label="Подсказка по использованию"]')).toBeVisible();

    const expectedPrimaryAction = canonicalCase.authenticated ? "Настроить урок" : "Войти и сохранить прогресс";
    const expectedPracticeAction = canonicalCase.authenticated ? "Начать практику" : "Войти и сохранить прогресс";
    await expect(primaryAction).toHaveText(expectedPrimaryAction);
    await expect(primaryAction).toBeVisible();
    await expect(primaryAction).toBeEnabled();
    const practiceAction = detailSide.getByRole("button", { name: expectedPracticeAction, exact: true });
    if (canonicalCase.expectedNavigation === "mobile") {
      await expect(practiceAction).toBeHidden();
    } else {
      await expect(practiceAction).toBeEnabled();
    }
    if (canonicalCase.authenticated) {
      await expect(page.getByText(/Демо-режим:/)).toHaveCount(0);
    } else {
      await expect(page.getByText(/Демо-режим: карточку можно просматривать без аккаунта/)).toBeVisible();
    }

    await expect(page.locator("html")).toHaveAttribute("data-lexigo-appearance", canonicalCase.appearance);
    await expect(page.locator("html")).toHaveAttribute(
      "data-lexigo-resolved-appearance",
      canonicalCase.appearance,
    );
    const canvas = await page.locator("html").evaluate((element) => (
      window.getComputedStyle(element).getPropertyValue("--ak-color-canvas").trim()
    ));
    expect(canvas).toBe(canonicalCase.canvas);

    await expectNoHorizontalOverflow(page);
    await expectHorizontallyContained(main, canonicalCase.width, "Phrase Detail semantic main");
    await expectHorizontallyContained(detail, canonicalCase.width, "Phrase Detail surface");
    await expectHorizontallyContained(layout, canonicalCase.width, "Phrase Detail layout");
    await expectHorizontallyContained(detailMain, canonicalCase.width, "Phrase Detail content");
    if (canonicalCase.expectedNavigation !== "mobile") {
      await expectHorizontallyContained(detailSide, canonicalCase.width, "Phrase Detail practice panel");
    }
    await expectHorizontallyContained(back, canonicalCase.width, "Phrase Detail back action");
    await expectHorizontallyContained(primaryAction, canonicalCase.width, "Phrase Detail lesson action");

    await expect(visibleNavigation).toHaveCount(1);
    await expectHorizontallyContained(
      visibleNavigation,
      canonicalCase.width,
      "Phrase Detail visible RouteChrome owner",
    );
    const navigation = await visibleNavigation.getAttribute("data-route-navigation");
    expect(["mobile", "rail", "header"]).toContain(navigation);
    expect(navigation).toBe(canonicalCase.expectedNavigation);

    return navigation as KnownRouteNavigation;
  }

  test.describe.configure({ timeout: 90_000 });

  for (const canonicalCase of canonicalCases) {
    test(`${canonicalCase.name} uses canonical Phrase Detail ownership (${canonicalCase.designContract})`, async ({
      context,
      page,
    }, testInfo) => {
      test.skip(
        testInfo.project.name !== canonicalCase.project,
        `Canonical ${canonicalCase.name} Phrase Detail Figma parity runs only in ${canonicalCase.project}.`,
      );

      testInfo.annotations.push({
        type: "figma",
        description: `${canonicalCase.figmaNode}: ${canonicalCase.designContract}`,
      });

      await page.setViewportSize({ width: canonicalCase.width, height: canonicalCase.height });
      await installDeterministicRuntime(page);
      await installQualityGateAPI(context, { authenticated: canonicalCase.authenticated });
      await installAppearance(page, canonicalCase.appearance);
      const detailRequests: string[] = [];
      await installExactDetailFixture(page, canonicalCase, detailRequests);
      const observedDetailRequests: string[] = [];
      page.on("request", (request) => {
        const requestURL = new URL(request.url());
        if (requestURL.pathname.startsWith("/api/v1/phrases/")) {
          observedDetailRequests.push(`${request.method()} ${requestURL.pathname}${requestURL.search}`);
        }
      });
      const runtimeErrors = captureRuntimeErrors(page);

      await openCanonicalDetail(page, canonicalCase);
      const initialNavigation = await expectCanonicalDetail(page, canonicalCase);

      await page.reload({ waitUntil: "domcontentloaded" });
      const reloadedNavigation = await expectCanonicalDetail(page, canonicalCase);
      expect(reloadedNavigation).toBe(initialNavigation);

      const expectedDetailRequest = `GET /api/v1/phrases/${encodeURIComponent(canonicalCase.content.slug)}`;
      if (canonicalCase.authenticated) {
        expect(detailRequests).toEqual([expectedDetailRequest, expectedDetailRequest]);
        expect(observedDetailRequests).toEqual([expectedDetailRequest, expectedDetailRequest]);
      } else {
        expect(detailRequests).toEqual([]);
        expect(observedDetailRequests).toEqual([]);
      }
      expect(runtimeErrors).toEqual([]);

      await testInfo.attach("phrase-detail-canonical-runtime.json", {
        body: Buffer.from(JSON.stringify({
          figmaNode: canonicalCase.figmaNode,
          designContract: canonicalCase.designContract,
          viewport: { width: canonicalCase.width, height: canonicalCase.height },
          appearance: canonicalCase.appearance,
          canvas: canonicalCase.canvas,
          variant: canonicalCase.variant,
          authenticated: canonicalCase.authenticated,
          path: `/phrases/${canonicalCase.content.slug}`,
          navigation: initialNavigation,
          exactDetailFixture: canonicalCase.authenticated ? expectedDetailRequest : null,
          detailRequests,
        }, null, 2)),
        contentType: "application/json",
      });
    });
  }
});