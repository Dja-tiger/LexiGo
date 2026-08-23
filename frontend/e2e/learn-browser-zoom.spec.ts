import { resolve } from "node:path";

import {
  chromium,
  expect,
  test,
  type CDPSession,
  type Locator,
  type Page,
  type Route,
  type Worker,
} from "@playwright/test";

import {
  captureRuntimeErrors,
  installDeterministicRuntime,
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

const SESSION = {
  user: {
    id: "00000000-0000-0000-0000-000000000421",
    email: "learn-zoom@example.com",
    displayName: "Learn Zoom User",
    createdAt: "2026-01-01T00:00:00Z",
  },
  tokens: {
    accessToken: "learn-zoom-access-token",
    tokenType: "Bearer",
    expiresIn: 900,
  },
};

const EMPTY_MODE = {
  attemptsToday: 0,
  successfulToday: 0,
  attemptsTotal: 0,
  successfulTotal: 0,
};

const PROGRESS = {
  dueNow: 18,
  dueWords: 12,
  duePhrases: 6,
  totalWords: 80,
  totalPhrases: 20,
  newWords: 12,
  learningWords: 22,
  reviewWords: 44,
  masteredWords: 18,
  masteredPhrases: 6,
  reviewsToday: 7,
  successfulToday: 6,
  objectiveReviewsToday: 7,
  objectiveSuccessfulToday: 6,
  reviewsTotal: 340,
  dailyGoal: 30,
  currentStreak: 5,
  longestStreak: 9,
  retainedItemsWeek: 21,
  retainedWordsWeek: 15,
  retainedPhrasesWeek: 6,
  eventSchemaVersion: 2,
  modes: {
    study: EMPTY_MODE,
    recall: EMPTY_MODE,
    choice: EMPTY_MODE,
    legacy: EMPTY_MODE,
  },
};

const WORD = {
  id: 42101,
  kind: "word",
  lemma: "retention",
  translation: "удержание",
  phonetic: "/rɪˈtenʃən/",
  partOfSpeech: "noun",
  topic: "Learning",
  examples: ["Spaced repetition improves retention."],
  note: "A retained item remains available for recall.",
  status: "review",
};

const METADATA = {
  catalogVersion: "sha256:learn-browser-zoom",
  updatedAt: "2026-08-06T00:00:00Z",
  totals: { items: 100, words: 80, phrases: 20 },
  sources: {
    mixed: 100,
    noun: 20,
    verb: 20,
    adjective: 20,
    phrases: 20,
    dailyLife: 10,
    travel: 10,
    dataEngineering: 20,
    backend: 20,
    academicTechnicalEnglish: 20,
  },
  topics: [{ topic: "Learning", count: 1, words: 1, phrases: 0 }],
};

type LessonRequest = {
  source?: string;
  studyMode?: string;
  lessonSize?: string;
};

async function fulfillJSON(route: Route, status: number, body: unknown): Promise<void> {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function installLessonComposerAPI(page: Page): Promise<void> {
  await page.context().addCookies([{
    name: "lexigo_csrf",
    value: "learn-zoom-csrf",
    url: "http://127.0.0.1:3000",
    sameSite: "Lax",
  }]);

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path === "/api/v1/auth/refresh") return fulfillJSON(route, 200, SESSION);
    if (path === "/api/v1/catalog/metadata") return fulfillJSON(route, 200, METADATA);
    if (path === "/api/v1/progress") return fulfillJSON(route, 200, PROGRESS);
    if (path === "/api/v1/lessons/active") {
      return fulfillJSON(route, 404, {
        error: { code: "active_lesson_not_found", message: "active lesson was not found" },
      });
    }
    if (path === "/api/v1/words" || path === "/api/v1/words/due") {
      return fulfillJSON(route, 200, { items: [WORD], count: 1 });
    }
    if (path === "/api/v1/lessons/preview") {
      const input = request.postDataJSON() as LessonRequest;
      return fulfillJSON(route, 200, {
        source: input.source ?? "mixed",
        studyMode: input.studyMode ?? "recall",
        lessonSize: input.lessonSize ?? "15",
        composition: {
          total: 30,
          words: 24,
          phrases: 6,
          due: 18,
          new: 12,
          scheduled: 0,
          availableWords: 80,
          availablePhrases: 20,
        },
      });
    }

    return fulfillJSON(route, 404, {
      error: { code: "not_mocked", message: path },
    });
  });
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

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    viewportWidth: document.documentElement.clientWidth,
    contentWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
  }));
  expect(
    dimensions.contentWidth,
    `Lesson Composer must not overflow horizontally: viewport=${dimensions.viewportWidth}px content=${dimensions.contentWidth}px`,
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
    if (!box) throw new Error(`${label}[${index}] has no layout geometry.`);
    expect(box.x, `${label}[${index}] must not clip on the inline start`).toBeGreaterThanOrEqual(-1);
    expect(
      box.x + box.width,
      `${label}[${index}] must not clip on the inline end`,
    ).toBeLessThanOrEqual(viewportWidth + 1);
  }
}

test.describe("Lesson Composer browser-owned zoom", () => {
  test.describe.configure({ timeout: 90_000 });

  test("desktop 200% browser zoom preserves collapsed and expanded canonical /learn states", async ({}, testInfo) => {
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
      viewport: { width: 1440, height: 1024 },
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    try {
      const page = context.pages()[0] ?? await context.newPage();
      await installDeterministicRuntime(page);
      await installLessonComposerAPI(page);
      const runtimeErrors = captureRuntimeErrors(page);

      await page.goto("/learn", { waitUntil: "domcontentloaded" });

      const main = page.locator('.lx-main-content[aria-label="Обучение"]');
      const recommendation = page.getByRole("article", { name: "Рекомендуемый урок", exact: true });
      const recommendationMetrics = recommendation.locator(".lx-recommended-lesson__metrics");
      const currentParameters = page.getByLabel(/Текущие параметры:/);
      const recommendedStart = page.getByRole("button", {
        name: "Начать рекомендуемый урок",
        exact: true,
      });
      const configure = page.getByRole("button", { name: "Настроить урок", exact: true });
      const manualComposer = page.locator(".lx-manual-lesson-composer");
      const setupCard = manualComposer.locator(".lx-setup-card");
      const modeGroup = page.getByRole("radiogroup", { name: "Режим обучения", exact: true });
      const sourceGroup = page.getByRole("radiogroup", { name: "Раздел обучения", exact: true });
      const sizeGroup = page.getByRole("radiogroup", { name: "Размер урока", exact: true });
      const manualStart = page.getByRole("button", { name: "Начать урок", exact: true });

      await expect(main).toBeVisible();
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(page.locator(".lx-progressive-lesson-composer")).toBeVisible();
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
      await expect(railNavigation).toBeHidden();
      await expect(headerNavigation).toBeHidden();
      await expect(mobileNavigation).toBeVisible();
      await expect(mobileNavigation.getByRole("link")).toHaveCount(4);

      await expect(recommendation).toBeVisible();
      await expect(manualComposer).toBeHidden();
      await expect(configure).toHaveAttribute("aria-expanded", "false");
      await expect(recommendedStart).toBeEnabled();
      await expect(currentParameters).toContainText("Смешанная практика");
      await expect(currentParameters).toContainText("Воспроизведение");
      await expect(currentParameters).toContainText("15 элементов");
      await expect(recommendation.getByText("18", { exact: true })).toBeVisible();
      await expect(recommendation.getByText("12", { exact: true })).toBeVisible();

      await expectHorizontallyContained(main, afterDOM.clientWidth, "Learn main");
      await expectHorizontallyContained(recommendation, afterDOM.clientWidth, "recommended lesson");
      await expectHorizontallyContained(recommendationMetrics, afterDOM.clientWidth, "recommendation metrics");
      await expectHorizontallyContained(currentParameters, afterDOM.clientWidth, "current parameters");
      await expectHorizontallyContained(recommendedStart, afterDOM.clientWidth, "recommended start");
      await expectHorizontallyContained(configure, afterDOM.clientWidth, "configure action");
      await expectHorizontallyContained(mobileNavigation, afterDOM.clientWidth, "route mobile navigation");
      await expectNoHorizontalOverflow(page);

      await expectVisibleFocus(recommendedStart);
      await expectVisibleFocus(configure);
      const dictionaryNavigation = mobileNavigation.getByRole("link", { name: "Словарь", exact: true });
      await expectVisibleFocus(dictionaryNavigation);

      await configure.click();
      const manualSummary = page.getByRole("button", { name: /Ручная настройка/ });
      await expect(recommendation).toBeHidden();
      await expect(manualComposer).toBeVisible();
      await expect(manualSummary).toBeVisible();
      await expect(manualSummary).toHaveAttribute("aria-expanded", "true");
      await expect(modeGroup).toBeVisible();
      await expect(sourceGroup).toBeVisible();
      await expect(sizeGroup).toBeVisible();
      await expect(manualStart).toBeVisible();
      await expect(manualStart).toBeEnabled();

      const responsiveStyles = await setupCard.evaluate((element) => {
        const source = element.querySelector<HTMLElement>(".lx-source-selector");
        const mode = element.querySelector<HTMLElement>(".lx-mode-selector");
        const size = element.querySelector<HTMLElement>(".lx-size-control");
        if (!source || !mode || !size) {
          throw new Error("Lesson Composer responsive control groups are missing.");
        }
        return {
          setupDisplay: window.getComputedStyle(element).display,
          sourceColumns: window.getComputedStyle(source).gridTemplateColumns,
          modeColumns: window.getComputedStyle(mode).gridTemplateColumns,
          sizeColumns: window.getComputedStyle(size).gridTemplateColumns,
        };
      });
      expect(responsiveStyles.setupDisplay).toBe("block");
      expect(responsiveStyles.sourceColumns.split(/\s+/).filter(Boolean)).toHaveLength(1);
      expect(responsiveStyles.modeColumns.split(/\s+/).filter(Boolean)).toHaveLength(3);
      expect(responsiveStyles.sizeColumns.split(/\s+/).filter(Boolean)).toHaveLength(4);

      await expectHorizontallyContained(manualSummary, afterDOM.clientWidth, "manual composer summary");
      await expectHorizontallyContained(setupCard, afterDOM.clientWidth, "manual setup card");
      await expectHorizontallyContained(modeGroup, afterDOM.clientWidth, "mode group");
      await expectHorizontallyContained(sourceGroup, afterDOM.clientWidth, "source group");
      await expectHorizontallyContained(sizeGroup, afterDOM.clientWidth, "size group");
      await expectHorizontallyContained(modeGroup.getByRole("radio"), afterDOM.clientWidth, "mode option");
      await expectHorizontallyContained(sourceGroup.getByRole("radio"), afterDOM.clientWidth, "source option");
      await expectHorizontallyContained(sizeGroup.getByRole("radio"), afterDOM.clientWidth, "size option");
      await expectHorizontallyContained(manualStart, afterDOM.clientWidth, "manual lesson start");
      await expectHorizontallyContained(mobileNavigation, afterDOM.clientWidth, "expanded route mobile navigation");
      await expectNoHorizontalOverflow(page);

      await expectVisibleFocus(manualSummary);
      await expectVisibleFocus(modeGroup.getByRole("radio", { checked: true }));
      await expectVisibleFocus(sourceGroup.getByRole("radio", { checked: true }));
      await expectVisibleFocus(sizeGroup.getByRole("radio", { checked: true }));
      await expectVisibleFocus(manualStart);

      expect(runtimeErrors).toEqual([]);
      await testInfo.attach("learn-browser-zoom-metrics.json", {
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
