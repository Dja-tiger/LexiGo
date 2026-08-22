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

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    contentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
  }));
  expect(
    dimensions.contentWidth,
    `Home must not overflow horizontally: viewport=${dimensions.viewportWidth}px content=${dimensions.contentWidth}px`,
  ).toBeLessThanOrEqual(dimensions.viewportWidth + 1);
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

test.describe("Home browser-owned zoom", () => {
  test.describe.configure({ timeout: 90_000 });

  test("desktop 200% browser zoom reflows canonical Home without clipping or route-chrome obstruction", async ({}, testInfo) => {
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
      const runtimeErrors = captureRuntimeErrors(page);

      await page.goto("/", { waitUntil: "domcontentloaded" });
      const main = page.getByRole("main", { name: "Главная", exact: true });
      const nextActionRegion = page.getByRole("region", {
        name: "Следующее рекомендуемое действие",
        exact: true,
      });
      const hero = page.locator(".lx-home-next-action .lx-hero-card");
      const progress = page.getByRole("complementary", { name: "Краткий прогресс", exact: true });
      const primaryAction = page.getByRole("button", { name: "Повторить 4", exact: true });
      const processActions = page.getByRole("group", { name: "Другие доступные учебные процессы", exact: true });
      const remediationAction = processActions.getByRole("button", { name: "Разобрать 2 слабых мест", exact: true });
      const studyAction = processActions.getByRole("button", { name: "Изучить 15 новых из 18", exact: true });
      const progressAction = page.getByRole("button", { name: "Открыть прогресс", exact: true });
      const profileAction = page.getByRole("button", { name: "Открыть профиль", exact: true });
      const paths = page.locator(".lx-home-paths");

      await expect(main).toBeVisible();
      await expect(nextActionRegion).toBeVisible();
      await expect(page.getByRole("heading", { level: 1, name: "4 элемента готовы к повторению" })).toBeVisible();
      await expect(page.getByRole("progressbar", { name: "Выполнение дневной цели" })).toHaveAttribute("aria-valuenow", "40");
      await expect(primaryAction).toBeEnabled();
      await expect(processActions).toBeVisible();
      await expect(remediationAction).toBeEnabled();
      await expect(studyAction).toBeEnabled();
      await expect(progressAction).toBeEnabled();
      await expect(profileAction).toBeEnabled();
      await expect(paths).toBeHidden();
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
      await expect(paths).toBeHidden();

      const railNavigation = page.getByRole("navigation", {
        name: "Навигация по разделам",
        exact: true,
      });
      const headerNavigation = page.getByRole("navigation", {
        name: "Основная навигация",
        exact: true,
      });
      const mobileNavigation = page.getByRole("navigation", {
        name: "Мобильная навигация",
        exact: true,
      });
      await expect(railNavigation).toBeVisible();
      await expect(headerNavigation).toBeHidden();
      await expect(mobileNavigation).toBeHidden();
      await expect(railNavigation.getByRole("link")).toHaveCount(4);

      const responsiveStyles = await nextActionRegion.evaluate((element) => ({
        nextActionColumns: window.getComputedStyle(element).gridTemplateColumns,
      }));
      expect(
        responsiveStyles.nextActionColumns.split(/\s+/).filter(Boolean),
        "the exact 1440px/200% boundary must preserve the canonical bounded two-column Home action layout",
      ).toHaveLength(2);

      await expectHorizontallyContained(main, afterDOM.clientWidth, "Home main");
      await expectHorizontallyContained(hero, afterDOM.clientWidth, "Home hero");
      await expectHorizontallyContained(progress, afterDOM.clientWidth, "Home progress panel");
      await expectHorizontallyContained(primaryAction, afterDOM.clientWidth, "Home primary action");
      await expectHorizontallyContained(processActions, afterDOM.clientWidth, "Home secondary process group");
      await expectHorizontallyContained(processActions.getByRole("button"), afterDOM.clientWidth, "Home secondary process action");
      await expectHorizontallyContained(progressAction, afterDOM.clientWidth, "Home progress action");
      await expectHorizontallyContained(profileAction, afterDOM.clientWidth, "Home profile action");
      await expectHorizontallyContained(railNavigation, afterDOM.clientWidth, "route navigation rail");
      await expectNoHorizontalOverflow(page);

      await expectNoOverlap(railNavigation, main, "route navigation rail and Home main");
      await expectNoOverlap(hero, progress, "Home hero and progress panel");
      const [heroBox, progressBox] = await Promise.all([hero.boundingBox(), progress.boundingBox()]);
      expect(heroBox).not.toBeNull();
      expect(progressBox).not.toBeNull();
      if (!heroBox || !progressBox) {
        throw new Error("Home hero or progress panel has no layout geometry.");
      }
      expect(
        Math.abs(progressBox.y - heroBox.y),
        "canonical two-column Home action layout must top-align the hero and progress panel at the exact 720px CSS boundary",
      ).toBeLessThanOrEqual(1);

      await expectVisibleFocus(primaryAction);
      await expectVisibleFocus(remediationAction);
      await expectVisibleFocus(studyAction);
      await expectVisibleFocus(progressAction);
      await expectVisibleFocus(profileAction);
      const dictionaryNavigation = railNavigation.getByRole("link", { name: "Словарь", exact: true });
      await expect(dictionaryNavigation).toBeEnabled();
      await expectVisibleFocus(dictionaryNavigation);

      expect(runtimeErrors).toEqual([]);
      await testInfo.attach("home-browser-zoom-metrics.json", {
        body: Buffer.from(JSON.stringify({
          targetURL,
          normalizedZoom,
          appliedZoom,
          beforeDOM,
          beforeCDP,
          afterDOM,
          afterCDP,
          responsiveStyles,
        }, null, 2)),
        contentType: "application/json",
      });
    } finally {
      await context.close();
    }
  });
});
