import { expect, test, type Page, type Route } from "@playwright/test";

const SESSION = {
  user: {
    id: "00000000-0000-0000-0000-000000000058",
    email: "logout@example.com",
    displayName: "Logout Tester",
    createdAt: "2026-01-01T00:00:00Z",
  },
  tokens: {
    accessToken: "logout-access-token",
    tokenType: "Bearer",
    expiresIn: 900,
  },
};

const METADATA = {
  catalogVersion: "sha256:logout-e2e",
  updatedAt: "2026-07-20T00:00:00Z",
  totals: { items: 0, words: 0, phrases: 0 },
  sources: {
    mixed: 0,
    noun: 0,
    verb: 0,
    adjective: 0,
    phrases: 0,
    dailyLife: 0,
    travel: 0,
    dataEngineering: 0,
    backend: 0, academicTechnicalEnglish: 0,
  },
  topics: [],
};

const EMPTY_MODE = {
  attemptsToday: 0,
  successfulToday: 0,
  attemptsTotal: 0,
  successfulTotal: 0,
};

const PROGRESS = {
  dueNow: 0,
  dueWords: 0,
  duePhrases: 0,
  totalWords: 0,
  totalPhrases: 0,
  newWords: 0,
  learningWords: 0,
  reviewWords: 0,
  masteredWords: 0,
  masteredPhrases: 0,
  reviewsToday: 0,
  successfulToday: 0,
  objectiveReviewsToday: 0,
  objectiveSuccessfulToday: 0,
  reviewsTotal: 0,
  dailyGoal: 30,
  currentStreak: 0,
  longestStreak: 0,
  retainedItemsWeek: 0,
  retainedWordsWeek: 0,
  retainedPhrasesWeek: 0,
  eventSchemaVersion: 2,
  modes: {
    study: EMPTY_MODE,
    recall: EMPTY_MODE,
    choice: EMPTY_MODE,
    legacy: EMPTY_MODE,
  },
};

async function json(route: Route, status: number, body: unknown): Promise<void> {
  await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

async function installLogoutAPI(page: Page) {
  let authenticated = true;
  let logoutRequests = 0;

  await page.context().addCookies([{
    name: "lexigo_csrf",
    value: "logout-csrf",
    url: "http://127.0.0.1:3000",
    sameSite: "Lax",
  }]);

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path === "/api/v1/auth/refresh") {
      if (authenticated) return json(route, 200, SESSION);
      return json(route, 401, { error: { code: "unauthorized", message: "logged out" } });
    }
    if (path === "/api/v1/auth/logout" && request.method() === "POST") {
      logoutRequests += 1;
      expect(request.headers()["x-csrf-token"]).toBe("logout-csrf");
      authenticated = false;
      await route.fulfill({ status: 204, body: "" });
      return;
    }
    if (path === "/api/v1/catalog/metadata") return json(route, 200, METADATA);
    if (path === "/api/v1/progress") return json(route, 200, PROGRESS);
    if (path === "/api/v1/lessons/active") {
      return json(route, 404, { error: { code: "active_lesson_not_found", message: "not found" } });
    }
    if (path === "/api/v1/words" || path === "/api/v1/words/due") {
      return json(route, 200, {
        items: [],
        count: 0,
        total: 0,
        page: 1,
        pageSize: 48,
        totalPages: 0,
        hasPrevious: false,
        hasNext: false,
      });
    }
    if (path === "/api/v1/auth/sessions") return json(route, 200, { sessions: [] });
    if (path === "/api/v1/auth/audit-events") return json(route, 200, { events: [] });

    return json(route, 404, { error: { code: "not_mocked", message: path } });
  });

  return {
    logoutRequests: () => logoutRequests,
  };
}

test("logout invalidates the browser session and returns to the truthful Guest Home", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "The logout mutation contract is verified once in the deterministic desktop profile.");
  const api = await installLogoutAPI(page);
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  await page.goto("/profile");
  await expect(page.getByRole("heading", { name: "Logout Tester" })).toBeVisible();
  await page.getByRole("button", { name: "Выйти", exact: true }).click();

  await expect(page).toHaveURL((url) => url.pathname === "/");
  const guest = page.locator('[data-route-client-island="guest-home"]');
  await expect(guest).toBeVisible();
  await expect(guest.getByRole("heading", { name: "Первый полезный урок — без длинной настройки" })).toBeVisible();
  await expect(page.getByRole("status", { name: "Персональный прогресс доступен после входа" })).toHaveCount(0);

  await page.goto("/profile");
  await expect(page.getByRole("heading", { name: "Сохраняйте прогресс на всех устройствах" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Войти", exact: true })).toBeVisible();
  expect(api.logoutRequests()).toBe(1);
  expect(runtimeErrors).toEqual([]);
});
