import { expect, test, type Page, type Route } from "@playwright/test";

import { SCENARIO_DETAIL, SCENARIO_SESSION } from "./support/scenario-fixture";

const TROUBLESHOOTING_SCENARIO = {
  slug: "troubleshooting-plan",
  type: "troubleshooting",
  title: "Troubleshooting plan",
  summary: "Separate confirmed evidence from hypotheses and propose the next checks.",
  userRole: "backend engineer",
  workplaceGoal: "Propose a testable diagnostic plan.",
  completionCriterion: "The team can execute the next diagnostic steps.",
  constraints: ["Keep hypotheses qualified", "Name the next checkpoint"],
  requiresFactHypothesis: true,
  estimatedMinutes: 15,
  version: 1,
  stepCount: 5,
} as const;

const SCENARIO_SUMMARY = {
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
} as const;

const CATALOG_ITEMS = [TROUBLESHOOTING_SCENARIO, SCENARIO_SUMMARY] as const;

const PROGRESS = {
  dueNow: 0,
  dueWords: 0,
  duePhrases: 0,
  totalWords: 12,
  totalPhrases: 3,
  newWords: 2,
  learningWords: 3,
  reviewWords: 7,
  masteredWords: 4,
  masteredPhrases: 1,
  reviewsToday: 2,
  successfulToday: 2,
  objectiveReviewsToday: 2,
  objectiveSuccessfulToday: 2,
  reviewsTotal: 18,
  dailyGoal: 15,
  currentStreak: 2,
  longestStreak: 5,
  retainedItemsWeek: 3,
  retainedWordsWeek: 2,
  retainedPhrasesWeek: 1,
  eventSchemaVersion: 2,
  scenarios: {
    completedThisWeek: 1,
    completedTotal: 2,
    recommendation: {
      slug: SCENARIO_DETAIL.slug,
      type: SCENARIO_DETAIL.type,
      title: SCENARIO_DETAIL.title,
      estimatedMinutes: SCENARIO_DETAIL.estimatedMinutes,
      reason: "resume_in_progress",
      action: "resume",
      completedCount: 1,
      lastCompletedAt: "2026-07-19T12:00:00Z",
    },
  },
};

const METADATA = {
  catalogVersion: "sha256:scenario-catalog",
  updatedAt: "2026-07-25T00:00:00Z",
  totals: { items: 15, words: 12, phrases: 3 },
  sources: {
    mixed: 15,
    noun: 4,
    verb: 3,
    adjective: 2,
    phrases: 3,
    dailyLife: 0,
    travel: 0,
    dataEngineering: 3,
    backend: 0,
    academicTechnicalEnglish: 0,
  },
  topics: [],
};

type CatalogFixtureOptions = {
  catalogItems?: readonly unknown[];
  failCatalogOnce?: boolean;
  failProgress?: boolean;
};

async function fulfillJSON(route: Route, status: number, body: unknown): Promise<void> {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function installCatalogFixture(page: Page, options: CatalogFixtureOptions = {}): Promise<void> {
  let catalogFailures = options.failCatalogOnce ? 1 : 0;
  const catalogItems = options.catalogItems ?? CATALOG_ITEMS;

  await page.context().addCookies([{
    name: "lexigo_csrf",
    value: "scenario-catalog-csrf",
    url: "http://127.0.0.1:3000",
    sameSite: "Lax",
  }]);

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;

    if (path === "/api/v1/auth/refresh") return fulfillJSON(route, 200, SCENARIO_SESSION);
    if (path === "/api/v1/scenarios" && request.method() === "GET") {
      if (catalogFailures > 0) {
        catalogFailures -= 1;
        return fulfillJSON(route, 503, {
          error: { code: "scenario_catalog_unavailable", message: "temporary catalog failure" },
        });
      }
      return fulfillJSON(route, 200, { items: catalogItems, count: catalogItems.length });
    }
    if (path === `/api/v1/scenarios/${SCENARIO_DETAIL.slug}` && request.method() === "GET") {
      return fulfillJSON(route, 200, SCENARIO_DETAIL);
    }
    if (path === "/api/v1/progress") {
      if (options.failProgress) {
        return fulfillJSON(route, 503, {
          error: { code: "progress_unavailable", message: "temporary progress failure" },
        });
      }
      return fulfillJSON(route, 200, PROGRESS);
    }
    if (path === "/api/v1/catalog/metadata") return fulfillJSON(route, 200, METADATA);
    if (path === "/api/v1/lessons/active") {
      return fulfillJSON(route, 404, {
        error: { code: "active_lesson_not_found", message: "active lesson was not found" },
      });
    }
    if (path === "/api/v1/product/journey") return fulfillJSON(route, 202, { accepted: true });

    return fulfillJSON(route, 404, {
      error: { code: "not_mocked", message: `${request.method()} ${path}` },
    });
  });
}

function relevantBrowser(projectName: string): boolean {
  return projectName === "desktop-chromium" || projectName === "ios-webkit";
}

test.describe("Scenario catalog", () => {
  test("preserves server order, recommendation ownership and catalog-to-detail history", async ({ page }, testInfo) => {
    test.skip(!relevantBrowser(testInfo.project.name), "Focused contract runs in desktop Chromium and iOS WebKit.");
    await installCatalogFixture(page);

    await page.goto("/scenarios", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "Рабочие сценарии", exact: true })).toBeVisible();
    await expect(page.locator("[data-scenario-catalog-order]")).toHaveAttribute(
      "data-scenario-catalog-order",
      "troubleshooting-plan,incident-update",
    );
    await expect(page.getByRole("heading", { name: TROUBLESHOOTING_SCENARIO.title, exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: SCENARIO_DETAIL.title, exact: true })).toBeVisible();

    const recommendation = page.getByRole("region", { name: "Следующее действие" });
    await expect(recommendation).toContainText(SCENARIO_DETAIL.title);
    await expect(recommendation.getByRole("link", { name: "Продолжить", exact: true })).toHaveAttribute(
      "href",
      `/scenarios/${SCENARIO_DETAIL.slug}`,
    );

    for (const variant of ["header", "rail", "mobile"]) {
      await expect(page.locator(`[data-route-navigation="${variant}"] a`)).toHaveCount(4);
    }
    await expect(page.locator('[data-route-navigation="header"] a[aria-current="page"]')).toContainText("Обучение");

    await page.getByRole("link", { name: `Открыть сценарий «${SCENARIO_DETAIL.title}»` }).click();
    await expect(page).toHaveURL(`/scenarios/${SCENARIO_DETAIL.slug}`);
    await expect(page.getByRole("heading", { name: SCENARIO_DETAIL.title, exact: true })).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL("/scenarios");
    await expect(page.getByRole("heading", { name: "Рабочие сценарии", exact: true })).toBeVisible();
    await expect(page.locator("#lexigo-main-content")).toBeFocused();
  });

  test("keeps discovery usable when Progress is unavailable", async ({ page }, testInfo) => {
    test.skip(!relevantBrowser(testInfo.project.name), "Focused contract runs in desktop Chromium and iOS WebKit.");
    await installCatalogFixture(page, { failProgress: true });

    await page.goto("/scenarios", { waitUntil: "domcontentloaded" });

    await expect(page.getByText("Персональная рекомендация временно недоступна.", { exact: false })).toBeVisible();
    await expect(page.getByRole("heading", { name: TROUBLESHOOTING_SCENARIO.title, exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: SCENARIO_DETAIL.title, exact: true })).toBeVisible();
  });

  test("retries a transient catalog failure without replacing server content", async ({ page }, testInfo) => {
    test.skip(!relevantBrowser(testInfo.project.name), "Focused contract runs in desktop Chromium and iOS WebKit.");
    await installCatalogFixture(page, { failCatalogOnce: true });

    await page.goto("/scenarios", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "Сервис временно недоступен", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Повторить загрузку", exact: true }).click();
    await expect(page.locator("[data-scenario-catalog-order]")).toHaveAttribute(
      "data-scenario-catalog-order",
      "troubleshooting-plan,incident-update",
    );
  });

  test("renders an explicit server-empty state", async ({ page }, testInfo) => {
    test.skip(!relevantBrowser(testInfo.project.name), "Focused contract runs in desktop Chromium and iOS WebKit.");
    await installCatalogFixture(page, { catalogItems: [] });

    await page.goto("/scenarios", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "Доступных сценариев пока нет", exact: true })).toBeVisible();
    await expect(page.getByText("Каталог пуст на сервере.", { exact: false })).toBeVisible();
    await expect(page.locator("[data-scenario-catalog-order]")).toHaveCount(0);
  });

  test("opens the catalog from the Learning subsection without adding a fifth primary item", async ({ page }, testInfo) => {
    test.skip(!relevantBrowser(testInfo.project.name), "Focused contract runs in desktop Chromium and iOS WebKit.");
    await installCatalogFixture(page);

    await page.goto("/learn", { waitUntil: "domcontentloaded" });

    const switcher = page.getByRole("navigation", { name: "Разделы обучения" });
    await expect(switcher.getByRole("link", { name: "Уроки", exact: true })).toHaveAttribute("aria-current", "page");
    await switcher.getByRole("link", { name: "Сценарии", exact: true }).click();
    await expect(page).toHaveURL("/scenarios");
    await expect(page.getByRole("heading", { name: "Рабочие сценарии", exact: true })).toBeVisible();
    await expect(page.locator('[data-route-navigation="mobile"] a')).toHaveCount(4);
  });
});
