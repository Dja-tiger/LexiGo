import { mkdir, writeFile } from "node:fs/promises";

import { expect, test, type Browser, type BrowserContext, type Locator, type Page } from "@playwright/test";

import {
  QUALITY_WORDS,
  installQualityGateAPI,
} from "./support/quality-gates";

const BUDGETS = {
  javascriptBytes: 700_000,
  cssBytes: 180_000,
  lcpMs: 5_000,
  cls: 0.1,
  longTaskTotalMs: 1_000,
  longTaskMaxMs: 300,
  actionToPaintMs: 350,
} as const;

type ScenarioName = "home" | "dictionary" | "lesson";

type ScenarioResult = {
  scenario: ScenarioName;
  route: string;
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
    const javascriptBytes = resources
      .filter((resource) => resource.initiatorType === "script" || resource.name.includes("/_next/static/chunks/"))
      .reduce((total, resource) => total + resource.encodedBodySize, 0);
    const cssBytes = resources
      .filter((resource) => resource.initiatorType === "link" && resource.name.includes("/_next/static/css/"))
      .reduce((total, resource) => total + resource.encodedBodySize, 0);
    const longTaskTotalMs = collector.longTasks.reduce((total, duration) => total + duration, 0);
    return {
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
      await expect(page.getByRole("heading", { name: /Продолжайте учиться/ })).toBeVisible();
    } else if (scenario === "dictionary") {
      await expect(page.getByRole("heading", { name: "Каталог слов и терминов" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Открыть карточку: rollback" })).toBeVisible();
    } else {
      const continueLesson = page.getByRole("button", { name: "Продолжить урок" });
      if (await continueLesson.isVisible()) await continueLesson.click();
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

function enforceBudgets(result: ScenarioResult): void {
  expect.soft(result.javascriptBytes, `${result.scenario}: initial JavaScript bytes`).toBeLessThanOrEqual(BUDGETS.javascriptBytes);
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

test("critical routes stay within the low-end mobile performance budget", async ({ browser }) => {
  test.setTimeout(120_000);
  const results: ScenarioResult[] = [];
  for (const scenario of ["home", "dictionary", "lesson"] as const) {
    results.push(await profileScenario(browser, scenario));
  }

  await mkdir("test-results", { recursive: true });
  await writeFile(
    "test-results/performance-budget-report.json",
    `${JSON.stringify({ generatedAt: new Date().toISOString(), profile: "4x CPU + simulated 3G", budgets: BUDGETS, results }, null, 2)}\n`,
    "utf8",
  );

  for (const result of results) enforceBudgets(result);
});
