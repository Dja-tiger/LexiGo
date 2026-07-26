import { mkdir, writeFile } from "node:fs/promises";

import { expect, test, type Browser, type BrowserContext, type Locator, type Page } from "@playwright/test";

import {
  QUALITY_WORDS,
  installQualityGateAPI,
} from "./support/quality-gates";

const BUDGETS = {
  initialRequests: 50,
  javascriptBytes: 700_000,
  cssBytes: 180_000,
  lcpMs: 5_000,
  cls: 0.1,
  longTaskTotalMs: 1_000,
  longTaskMaxMs: 300,
  actionToPaintMs: 350,
} as const;

const TIMING_CONFIRMATION_SAMPLE_COUNT = 3;

type ScenarioName = "home" | "dictionary" | "lesson";

type ScenarioResult = {
  scenario: ScenarioName;
  route: string;
  initialRequests: number;
  javascriptBytes: number;
  cssBytes: number;
  lcpMs: number;
  cls: number;
  longTaskCount: number;
  longTaskTotalMs: number;
  longTaskMaxMs: number;
  actionToPaintMs: number | null;
};

type BrowserCollector = {
  lcpMs: number;
  cls: number;
  longTasks: number[];
};

async function installPerformanceCollector(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const scope = window as Window & { __lexigoPerformanceBudget?: BrowserCollector };
    scope.__lexigoPerformanceBudget = { lcpMs: 0, cls: 0, longTasks: [] };

    if (typeof PerformanceObserver === "undefined") return;
    if (PerformanceObserver.supportedEntryTypes.includes("largest-contentful-paint")) {
      new PerformanceObserver((list) => {
        const state = scope.__lexigoPerformanceBudget;
        if (!state) return;
        for (const entry of list.getEntries()) state.lcpMs = Math.max(state.lcpMs, entry.startTime);
      }).observe({ type: "largest-contentful-paint", buffered: true });
    }
    if (PerformanceObserver.supportedEntryTypes.includes("layout-shift")) {
      new PerformanceObserver((list) => {
        const state = scope.__lexigoPerformanceBudget;
        if (!state) return;
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
          if (!shift.hadRecentInput) state.cls += shift.value ?? 0;
        }
      }).observe({ type: "layout-shift", buffered: true });
    }
    if (PerformanceObserver.supportedEntryTypes.includes("longtask")) {
      new PerformanceObserver((list) => {
        const state = scope.__lexigoPerformanceBudget;
        if (!state) return;
        for (const entry of list.getEntries()) state.longTasks.push(entry.duration);
      }).observe({ type: "longtask", buffered: true });
    }
  });
}

async function installPerformanceAPI(context: BrowserContext): Promise<void> {
  await installQualityGateAPI(context);
  await context.route("**/api/v1/performance/rum", async (route) => {
    await route.fulfill({ status: 202, body: "" });
  });
  await context.route("**/api/v1/lessons/active", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "00000000-0000-0000-0000-000000000590",
        source: "mixed",
        studyMode: "study",
        lessonSize: "1",
        currentIndex: 0,
        version: 1,
        status: "active",
        items: [{ ...QUALITY_WORDS[0], position: 0 }],
        createdAt: "2026-07-20T08:00:00Z",
        updatedAt: "2026-07-20T08:00:00Z",
      }),
    });
  });
  await context.route(/\/api\/v1\/lessons\/[^/]+\/words\/[^/]+\/review$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        wordId: QUALITY_WORDS[0].id,
        status: "learning",
        easiness: 2.5,
        intervalDays: 1,
        repetitions: 1,
        dueAt: "2026-07-21T08:00:00Z",
        lastReviewedAt: "2026-07-20T08:00:00Z",
        lessonId: "00000000-0000-0000-0000-000000000590",
        lessonCurrentIndex: 1,
        lessonVersion: 2,
        lessonCompleted: true,
        lessonReviewedItems: 1,
        lessonSkippedItems: 0,
        lessonTotalItems: 1,
      }),
    });
  });
}

async function createThrottledPage(browser: Browser): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({
    viewport: { width: 393, height: 851 },
    deviceScaleFactor: 2.75,
    isMobile: true,
    hasTouch: true,
    userAgent: "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36",
    reducedMotion: "reduce",
    serviceWorkers: "block",
  });
  await installPerformanceAPI(context);
  const page = await context.newPage();
  await installPerformanceCollector(page);

  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 100,
    downloadThroughput: 200_000,
    uploadThroughput: 100_000,
    connectionType: "cellular3g",
  });
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  return { context, page };
}

async function measureActionToPaint(locator: Locator): Promise<number> {
  await expect(locator).toBeVisible();
  return locator.evaluate((element) => new Promise<number>((resolve) => {
    const started = performance.now();
    (element as HTMLElement).click();
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve(performance.now() - started));
    });
  }));
}

async function readScenarioMetrics(page: Page): Promise<Omit<ScenarioResult, "scenario" | "route" | "actionToPaintMs">> {
  return page.evaluate(() => {
    const scope = window as Window & { __lexigoPerformanceBudget?: BrowserCollector };
    const collector = scope.__lexigoPerformanceBudget ?? { lcpMs: 0, cls: 0, longTasks: [] };
    const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    const transferredBytes = (resource: PerformanceResourceTiming) => Math.max(resource.transferSize, resource.encodedBodySize);
    const javascriptBytes = resources
      .filter((resource) => resource.initiatorType === "script" || /\/_next\/static\/chunks\/.*\.js(?:\?|$)/.test(resource.name))
      .reduce((total, resource) => total + transferredBytes(resource), 0);
    const cssBytes = resources
      .filter((resource) => /\/_next\/static\/css\/.*\.css(?:\?|$)/.test(resource.name) || /\.css(?:\?|$)/.test(resource.name))
      .reduce((total, resource) => total + transferredBytes(resource), 0);
    const longTaskTotalMs = collector.longTasks.reduce((total, duration) => total + duration, 0);
    return {
      initialRequests: resources.length + 1,
      javascriptBytes,
      cssBytes,
      lcpMs: collector.lcpMs,
      cls: collector.cls,
      longTaskCount: collector.longTasks.length,
      longTaskTotalMs,
      longTaskMaxMs: Math.max(0, ...collector.longTasks),
    };
  });
}

async function profileScenario(browser: Browser, scenario: ScenarioName): Promise<ScenarioResult> {
  const { context, page } = await createThrottledPage(browser);
  try {
    const route = scenario === "home" ? "/" : scenario === "dictionary" ? "/dictionary" : "/lesson/active";
    await page.goto(route, { waitUntil: "domcontentloaded" });

    if (scenario === "home") {
      await expect(page.getByRole("heading", { name: /Продолжите с сохранённой позиции|готов(?:ы)? к повторению|Добавьте новые слова|Соберите первый учебный блок|Настройте урок под текущую задачу/ })).toBeVisible();
    } else if (scenario === "dictionary") {
      await expect(page.getByRole("heading", { level: 1, name: "Словарь", exact: true })).toBeVisible();
      await expect(page.getByRole("button", { name: "Открыть карточку: rollback" })).toBeVisible();
    } else {
      const continueLesson = page.getByRole("button", { name: "Продолжить урок" });
      await expect(continueLesson).toBeVisible();
      await continueLesson.click();
      await expect(page.getByRole("heading", { name: "rollback" })).toBeVisible();
    }

    await page.waitForTimeout(1_500);
    const metrics = await readScenarioMetrics(page);
    let actionToPaintMs: number | null = null;
    if (scenario === "dictionary") {
      actionToPaintMs = await measureActionToPaint(page.getByRole("button", { name: "Открыть карточку: rollback" }));
    } else if (scenario === "lesson") {
      actionToPaintMs = await measureActionToPaint(page.getByRole("button", { name: "Знал", exact: true }));
    }

    return { scenario, route, ...metrics, actionToPaintMs };
  } finally {
    await context.close();
  }
}

function median(values: number[]): number {
  if (values.length === 0) throw new Error("cannot calculate a median without samples");
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
}

function needsTimingConfirmation(result: ScenarioResult): boolean {
  return result.lcpMs > BUDGETS.lcpMs
    || result.longTaskTotalMs > BUDGETS.longTaskTotalMs
    || result.longTaskMaxMs > BUDGETS.longTaskMaxMs
    || (result.actionToPaintMs !== null && result.actionToPaintMs > BUDGETS.actionToPaintMs);
}

function aggregateScenarioSamples(samples: ScenarioResult[]): ScenarioResult {
  const first = samples[0];
  if (!first) throw new Error("cannot aggregate an empty scenario sample set");
  if (samples.some((sample) => sample.scenario !== first.scenario || sample.route !== first.route)) {
    throw new Error("cannot aggregate samples from different scenarios");
  }

  const actionSamples = samples.flatMap((sample) => (
    sample.actionToPaintMs === null ? [] : [sample.actionToPaintMs]
  ));

  return {
    scenario: first.scenario,
    route: first.route,
    initialRequests: Math.max(...samples.map((sample) => sample.initialRequests)),
    javascriptBytes: Math.max(...samples.map((sample) => sample.javascriptBytes)),
    cssBytes: Math.max(...samples.map((sample) => sample.cssBytes)),
    lcpMs: median(samples.map((sample) => sample.lcpMs)),
    cls: Math.max(...samples.map((sample) => sample.cls)),
    longTaskCount: Math.round(median(samples.map((sample) => sample.longTaskCount))),
    longTaskTotalMs: median(samples.map((sample) => sample.longTaskTotalMs)),
    longTaskMaxMs: median(samples.map((sample) => sample.longTaskMaxMs)),
    actionToPaintMs: actionSamples.length === 0 ? null : median(actionSamples),
  };
}

async function writePerformanceReport(
  results: ScenarioResult[],
  samples: Partial<Record<ScenarioName, ScenarioResult[]>>,
): Promise<void> {
  await mkdir("test-results", { recursive: true });
  await writeFile(
    "test-results/performance-budget-report.json",
    `${JSON.stringify({ generatedAt: new Date().toISOString(), profile: "4x CPU + simulated 3G, cache disabled", budgets: BUDGETS, results, samples }, null, 2)}\n`,
    "utf8",
  );
}

function enforceBudgets(result: ScenarioResult): void {
  expect.soft(result.initialRequests, `${result.scenario}: initial request count`).toBeGreaterThan(0);
  expect.soft(result.initialRequests, `${result.scenario}: initial request count`).toBeLessThanOrEqual(BUDGETS.initialRequests);
  expect.soft(result.javascriptBytes, `${result.scenario}: initial JavaScript bytes`).toBeGreaterThan(0);
  expect.soft(result.javascriptBytes, `${result.scenario}: initial JavaScript bytes`).toBeLessThanOrEqual(BUDGETS.javascriptBytes);
  expect.soft(result.cssBytes, `${result.scenario}: initial CSS bytes`).toBeGreaterThan(0);
  expect.soft(result.cssBytes, `${result.scenario}: initial CSS bytes`).toBeLessThanOrEqual(BUDGETS.cssBytes);
  expect.soft(result.lcpMs, `${result.scenario}: low-end mobile LCP`).toBeGreaterThan(0);
  expect.soft(result.lcpMs, `${result.scenario}: low-end mobile LCP`).toBeLessThanOrEqual(BUDGETS.lcpMs);
  expect.soft(result.cls, `${result.scenario}: CLS`).toBeLessThanOrEqual(BUDGETS.cls);
  expect.soft(result.longTaskTotalMs, `${result.scenario}: total long-task time`).toBeLessThanOrEqual(BUDGETS.longTaskTotalMs);
  expect.soft(result.longTaskMaxMs, `${result.scenario}: longest task`).toBeLessThanOrEqual(BUDGETS.longTaskMaxMs);
  if (result.actionToPaintMs !== null) {
    expect.soft(result.actionToPaintMs, `${result.scenario}: action-to-paint`).toBeLessThanOrEqual(BUDGETS.actionToPaintMs);
  }
}

test("performance sampling confirms timing outliers without relaxing budgets", () => {
  const sample = (overrides: Partial<ScenarioResult> = {}): ScenarioResult => ({
    scenario: "dictionary",
    route: "/dictionary",
    initialRequests: 17,
    javascriptBytes: 236_000,
    cssBytes: 22_000,
    lcpMs: 2_900,
    cls: 0,
    longTaskCount: 10,
    longTaskTotalMs: 900,
    longTaskMaxMs: 260,
    actionToPaintMs: 150,
    ...overrides,
  });

  const samples = [
    sample({ initialRequests: 18, longTaskTotalMs: 1_064, longTaskMaxMs: 307 }),
    sample({ javascriptBytes: 237_000, longTaskTotalMs: 877, longTaskMaxMs: 260 }),
    sample({ cssBytes: 23_000, longTaskTotalMs: 920, longTaskMaxMs: 280 }),
  ];
  expect(needsTimingConfirmation(samples[0])).toBe(true);

  const aggregate = aggregateScenarioSamples(samples);
  expect(aggregate).toMatchObject({
    initialRequests: 18,
    javascriptBytes: 237_000,
    cssBytes: 23_000,
    longTaskTotalMs: 920,
    longTaskMaxMs: 280,
  });
  expect(needsTimingConfirmation(aggregate)).toBe(false);

  const persistentRegression = aggregateScenarioSamples([
    sample({ longTaskTotalMs: 1_040, longTaskMaxMs: 310 }),
    sample({ longTaskTotalMs: 1_080, longTaskMaxMs: 320 }),
    sample({ longTaskTotalMs: 1_120, longTaskMaxMs: 330 }),
  ]);
  expect(persistentRegression.longTaskTotalMs).toBeGreaterThan(BUDGETS.longTaskTotalMs);
  expect(persistentRegression.longTaskMaxMs).toBeGreaterThan(BUDGETS.longTaskMaxMs);
  expect(needsTimingConfirmation(persistentRegression)).toBe(true);
});

test("critical routes stay within the low-end mobile performance budget", async ({ browser }) => {
  test.setTimeout(300_000);
  const results: ScenarioResult[] = [];
  const samples: Partial<Record<ScenarioName, ScenarioResult[]>> = {};
  await writePerformanceReport(results, samples);

  for (const scenario of ["home", "dictionary", "lesson"] as const) {
    const scenarioSamples = [await profileScenario(browser, scenario)];
    if (needsTimingConfirmation(scenarioSamples[0])) {
      while (scenarioSamples.length < TIMING_CONFIRMATION_SAMPLE_COUNT) {
        scenarioSamples.push(await profileScenario(browser, scenario));
      }
    }
    samples[scenario] = scenarioSamples;
    results.push(aggregateScenarioSamples(scenarioSamples));
    await writePerformanceReport(results, samples);
  }

  for (const result of results) enforceBudgets(result);
});
