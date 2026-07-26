import { mkdir, writeFile } from "node:fs/promises";

import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";

import bundleBudgets from "../bundle-budgets.json";
import {
  QUALITY_SESSION,
  QUALITY_WORDS,
  captureRuntimeErrors,
  installQualityGateAPI,
} from "./support/quality-gates";
import { SCENARIO_DETAIL } from "./support/scenario-fixture";

type RoutePath = keyof typeof bundleBudgets.routes;

type JavaScriptAsset = {
  path: string;
  bytes: number;
};

type RouteBundleResult = {
  route: RoutePath;
  initialRequests: number;
  javascriptBytes: number;
  javascriptAssets: JavaScriptAsset[];
};

type RouteCase = {
  route: RoutePath;
  waitUntilReady: (page: Page) => Promise<void>;
};

const SCENARIO_CATALOG_ITEM = {
  slug: SCENARIO_DETAIL.slug,
  type: SCENARIO_DETAIL.type,
  title: SCENARIO_DETAIL.title,
  summary: SCENARIO_DETAIL.summary,
  userRole: SCENARIO_DETAIL.userRole,
  workplaceGoal: SCENARIO_DETAIL.workplaceGoal,
  completionCriterion: SCENARIO_DETAIL.completionCriterion,
  constraints: SCENARIO_DETAIL.constraints,
  requiresFactHypothesis: SCENARIO_DETAIL.requiresFactHypothesis,
  estimatedMinutes: SCENARIO_DETAIL.estimatedMinutes,
  version: SCENARIO_DETAIL.version,
  stepCount: SCENARIO_DETAIL.stepCount,
};

const ROUTES: RouteCase[] = [
  {
    route: "/",
    waitUntilReady: async (page) => {
      await expect(page.getByRole("heading", {
        level: 1,
        name: /Продолжите с сохранённой позиции|готов(?:ы)? к повторению|Добавьте новые слова|Соберите первый учебный блок|Настройте урок под текущую задачу/,
      })).toBeVisible();
    },
  },
  {
    route: "/learn",
    waitUntilReady: async (page) => {
      await expect(page.getByRole("heading", { level: 1, name: "Соберите один сфокусированный урок" })).toBeVisible();
    },
  },
  {
    route: "/phrases",
    waitUntilReady: async (page) => {
      await expect(page.getByRole("heading", { level: 1, name: "Находите готовые формулировки" })).toBeVisible();
    },
  },
  {
    route: "/dictionary",
    waitUntilReady: async (page) => {
      await expect(page.getByRole("heading", { level: 1, name: "Находите и изучайте материал в контексте" })).toBeVisible();
    },
  },
  {
    route: "/progress",
    waitUntilReady: async (page) => {
      await expect(page.getByRole("heading", { level: 1, name: "Прогресс", exact: true })).toBeVisible();
    },
  },
  {
    route: "/profile",
    waitUntilReady: async (page) => {
      await expect(page.getByRole("heading", { name: QUALITY_SESSION.user.displayName })).toBeVisible();
    },
  },
  {
    route: "/lesson/active",
    waitUntilReady: async (page) => {
      await expect(page.getByRole("button", { name: "Продолжить урок" })).toBeVisible();
    },
  },
  {
    route: "/scenarios",
    waitUntilReady: async (page) => {
      await expect(page.getByRole("heading", { level: 1, name: "Рабочие сценарии" })).toBeVisible();
    },
  },
  {
    route: "/scenarios/incident-update",
    waitUntilReady: async (page) => {
      await expect(page.getByRole("heading", { level: 1, name: SCENARIO_DETAIL.title })).toBeVisible();
    },
  },
];

async function installActiveLesson(context: BrowserContext): Promise<void> {
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
}

async function installScenarioCatalog(context: BrowserContext): Promise<void> {
  await context.route("**/api/v1/scenarios", async (route) => {
    if (route.request().method() !== "GET") {
      await route.fallback();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [SCENARIO_CATALOG_ITEM], count: 1 }),
    });
  });
}

async function installScenarioDetail(context: BrowserContext): Promise<void> {
  await context.route(`**/api/v1/scenarios/${SCENARIO_DETAIL.slug}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(SCENARIO_DETAIL),
    });
  });
}

async function createColdRoutePage(browser: Browser): Promise<{
  context: BrowserContext;
  page: Page;
}> {
  const context = await browser.newContext({
    viewport: { width: 393, height: 851 },
    deviceScaleFactor: 2.75,
    isMobile: true,
    hasTouch: true,
    userAgent: "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 Chrome/140.0 Mobile Safari/537.36",
    reducedMotion: "reduce",
    serviceWorkers: "block",
  });
  await installQualityGateAPI(context);
  await installActiveLesson(context);
  await installScenarioCatalog(context);
  await installScenarioDetail(context);
  const page = await context.newPage();
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

async function measureRoute(browser: Browser, routeCase: RouteCase): Promise<RouteBundleResult> {
  const { context, page } = await createColdRoutePage(browser);
  const errors = captureRuntimeErrors(page);
  try {
    await page.goto(routeCase.route, { waitUntil: "domcontentloaded" });
    await routeCase.waitUntilReady(page);
    await page.waitForTimeout(1_500);

    const measurement = await page.evaluate(() => {
      const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
      const transferredBytes = (resource: PerformanceResourceTiming) => Math.max(
        resource.transferSize,
        resource.encodedBodySize,
      );
      const javascriptAssets = resources
        .filter((resource) => (
          resource.initiatorType === "script"
          || /\/_next\/static\/chunks\/.*\.js(?:\?|$)/.test(resource.name)
        ))
        .map((resource) => ({
          path: new URL(resource.name).pathname,
          bytes: transferredBytes(resource),
        }))
        .sort((left, right) => left.path.localeCompare(right.path));
      return {
        initialRequests: resources.length + 1,
        javascriptAssets,
      };
    });

    expect(errors, `${routeCase.route}: runtime errors`).toEqual([]);
    return {
      route: routeCase.route,
      initialRequests: measurement.initialRequests,
      javascriptBytes: measurement.javascriptAssets.reduce((total, asset) => total + asset.bytes, 0),
      javascriptAssets: measurement.javascriptAssets,
    };
  } finally {
    await context.close();
  }
}

async function writeRouteBundleReport(results: RouteBundleResult[]): Promise<void> {
  await mkdir("test-results", { recursive: true });
  await writeFile(
    "test-results/route-bundle-budget-report.json",
    `${JSON.stringify({
      generatedAt: new Date().toISOString(),
      measurement: bundleBudgets.measurement,
      budgets: bundleBudgets.routes,
      results,
    }, null, 2)}\n`,
    "utf8",
  );
}

test("canonical routes stay within cold-browser JavaScript budgets", async ({ browser }) => {
  test.setTimeout(420_000);
  const results: RouteBundleResult[] = [];
  await writeRouteBundleReport(results);

  for (const routeCase of ROUTES) {
    const result = await measureRoute(browser, routeCase);
    results.push(result);
    await writeRouteBundleReport(results);

    const budget = bundleBudgets.routes[routeCase.route];
    expect.soft(result.initialRequests, `${routeCase.route}: initial request count`).toBeGreaterThan(0);
    expect.soft(result.initialRequests, `${routeCase.route}: initial request count`).toBeLessThanOrEqual(
      budget.maxInitialRequests,
    );
    expect.soft(result.javascriptBytes, `${routeCase.route}: initial JavaScript transfer`).toBeGreaterThan(0);
    expect.soft(result.javascriptBytes, `${routeCase.route}: initial JavaScript transfer`).toBeLessThanOrEqual(
      budget.maxJavascriptBytes,
    );
  }
});
