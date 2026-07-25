import { expect, test, type Page, type Route } from "@playwright/test";

import {
  installScenarioFixture,
  SCENARIO_DETAIL,
  SCENARIO_SESSION,
  startScenario,
} from "./support/scenario-fixture";

const PROGRESS_BASE = {
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
};

const METADATA = {
  catalogVersion: "sha256:scenario-progress",
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

async function fulfillJSON(route: Route, status: number, body: unknown): Promise<void> {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function installProgressFixture(page: Page, progress: Record<string, unknown>): Promise<void> {
  await page.context().addCookies([{
    name: "lexigo_csrf",
    value: "scenario-progress-csrf",
    url: "http://127.0.0.1:3000",
    sameSite: "Lax",
  }]);

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;

    if (path === "/api/v1/auth/refresh") return fulfillJSON(route, 200, SCENARIO_SESSION);
    if (path === "/api/v1/catalog/metadata") return fulfillJSON(route, 200, METADATA);
    if (path === "/api/v1/progress") return fulfillJSON(route, 200, progress);
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

test.describe("Scenario progress recommendation", () => {
  test("keeps due Recall above the available Scenario recommendation", async ({ page }, testInfo) => {
    test.skip(!relevantBrowser(testInfo.project.name), "Focused contract runs in desktop Chromium and iOS WebKit.");
    await installProgressFixture(page, {
      ...PROGRESS_BASE,
      dueNow: 3,
      dueWords: 2,
      duePhrases: 1,
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
    });

    await page.goto("/progress", { waitUntil: "domcontentloaded" });

    const action = page.locator('[data-progress-next-action="due-recall"]');
    await expect(action).toBeVisible();
    await expect(action.getByRole("button", { name: "Повторить 3 элемента", exact: true })).toBeVisible();
    await expect(action).not.toContainText("Продолжить сценарий");
    await expect(page.getByText("1 сценарий", { exact: false })).toBeVisible();
  });

  test("opens the exact server-recommended Scenario when the due queue is empty", async ({ page }, testInfo) => {
    test.skip(!relevantBrowser(testInfo.project.name), "Focused contract runs in desktop Chromium and iOS WebKit.");
    await installProgressFixture(page, {
      ...PROGRESS_BASE,
      scenarios: {
        completedThisWeek: 1,
        completedTotal: 1,
        recommendation: {
          slug: SCENARIO_DETAIL.slug,
          type: SCENARIO_DETAIL.type,
          title: SCENARIO_DETAIL.title,
          estimatedMinutes: SCENARIO_DETAIL.estimatedMinutes,
          reason: "first_uncompleted",
          action: "start",
          completedCount: 0,
        },
      },
    });

    await page.goto("/progress", { waitUntil: "domcontentloaded" });

    const action = page.locator('[data-progress-next-action="scenario"]');
    await expect(action).toContainText(`Начните рабочий сценарий «${SCENARIO_DETAIL.title}»`);
    await action.getByRole("button", { name: "Начать сценарий", exact: true }).click();
    await expect(page).toHaveURL(`/scenarios/${SCENARIO_DETAIL.slug}`);
  });

  test("routes a server-confirmed completed Scenario to Progress", async ({ page }, testInfo) => {
    test.skip(!relevantBrowser(testInfo.project.name), "Focused contract runs in desktop Chromium and iOS WebKit.");
    await installScenarioFixture(page, { initialPosition: 2 });
    await startScenario(page);

    await page.getByRole("textbox", { name: "Рабочая формулировка на английском" }).fill(
      "The next checkpoint is at 18:00 UTC, the incident owner is the data platform lead, and rollback remains the decision boundary.",
    );
    await page.getByRole("button", { name: "Отправить ответ", exact: true }).click();
    await page.getByRole("button", { name: "Показать результат", exact: true }).click();

    const progress = page.getByRole("button", { name: "Открыть прогресс", exact: true });
    await expect(progress).toBeVisible();
    await progress.click();
    await expect(page).toHaveURL("/progress");
  });
});
