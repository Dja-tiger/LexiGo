import { expect, test, type Page, type Route } from "@playwright/test";

const SESSION = {
  user: {
    id: "00000000-0000-0000-0000-000000000106",
    email: "resume@example.com",
    displayName: "Resume User",
    createdAt: "2026-01-01T00:00:00Z",
  },
  tokens: {
    accessToken: "resume-access-token",
    tokenType: "Bearer",
    expiresIn: 900,
  },
};

const PROGRESS = {
  dueNow: 2,
  dueWords: 1,
  duePhrases: 1,
  totalWords: 10,
  totalPhrases: 5,
  newWords: 8,
  learningWords: 1,
  reviewWords: 1,
  masteredWords: 0,
  masteredPhrases: 0,
  reviewsToday: 0,
  successfulToday: 0,
  reviewsTotal: 0,
  dailyGoal: 15,
  currentStreak: 0,
  longestStreak: 0,
  retainedItemsWeek: 0,
  retainedWordsWeek: 0,
  retainedPhrasesWeek: 0,
};

const METADATA = {
  catalogVersion: "sha256:session-resume-pwa",
  updatedAt: "2026-07-19T00:00:00Z",
  totals: { items: 15, words: 10, phrases: 5 },
  sources: {
    mixed: 15,
    noun: 4,
    verb: 3,
    adjective: 3,
    phrases: 5,
    dailyLife: 3,
    travel: 3,
    dataEngineering: 3,
    backend: 3, academicTechnicalEnglish: 0,
  },
  topics: [],
};

type InitialRefreshFailure = "offline" | "server";

async function fulfillJSON(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

function homeProcessPreview(input: {
  source?: string;
  studyMode?: string;
  sessionKind?: string;
  lessonSize?: string;
}) {
  const backlog = input.sessionKind === "review"
    ? 2
    : input.sessionKind === "study"
      ? 8
      : 0;
  return {
    source: input.source ?? "mixed",
    studyMode: input.studyMode ?? "study",
    sessionKind: input.sessionKind,
    lessonSize: input.lessonSize ?? "15",
    composition: {
      total: backlog,
      words: backlog,
      phrases: 0,
      due: input.sessionKind === "review" ? backlog : 0,
      new: input.sessionKind === "study" ? backlog : 0,
      scheduled: 0,
      availableWords: backlog,
      availablePhrases: 0,
    },
  };
}

async function installSessionMocks(page: Page, initialFailure: InitialRefreshFailure) {
  let refreshRequests = 0;
  let refreshMaySucceed = false;

  await page.context().addCookies([{
    name: "lexigo_csrf",
    value: "resume-csrf",
    url: "http://127.0.0.1:3000",
    sameSite: "Lax",
  }]);

  // Keep the bounded automatic timer dormant until the test emits the exact
  // lifecycle signal under test. This avoids a race on slow CI runners.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
  });

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;

    if (path === "/api/v1/auth/refresh") {
      refreshRequests += 1;
      if (!refreshMaySucceed) {
        if (initialFailure === "offline") {
          await route.abort("internetdisconnected");
        } else {
          await fulfillJSON(route, 503, {
            error: { code: "temporarily_unavailable", message: "temporary bootstrap failure" },
          });
        }
        return;
      }
      await fulfillJSON(route, 200, SESSION);
      return;
    }

    if (path === "/api/v1/catalog/metadata") {
      await fulfillJSON(route, 200, METADATA);
      return;
    }
    if (path === "/api/v1/progress") {
      await fulfillJSON(route, 200, PROGRESS);
      return;
    }
    if (path === "/api/v1/lessons/active") {
      await fulfillJSON(route, 404, { error: { code: "not_found", message: "not found" } });
      return;
    }
    if (path === "/api/v1/lessons/preview" && request.method() === "POST") {
      const input = request.postDataJSON() as {
        source?: string;
        studyMode?: string;
        sessionKind?: string;
        lessonSize?: string;
      };
      await fulfillJSON(route, 200, homeProcessPreview(input));
      return;
    }

    await fulfillJSON(route, 404, { error: { code: "not_mocked", message: path } });
  });

  return {
    refreshRequests: () => refreshRequests,
    allowRefreshSuccess: () => {
      refreshMaySucceed = true;
    },
  };
}

async function expectRecoverableBootstrap(page: Page) {
  const recoverable = page.getByRole("alert").filter({
    hasText: "Сессия не удалена. Пароль вводить заново не нужно.",
  });
  await expect(recoverable).toBeVisible();
  await expect(recoverable.getByRole("button", { name: "Повторить восстановление" })).toBeVisible();
  await expect(page).not.toHaveURL(/\/profile\?session=/);
}

test("iOS PWA restores the session automatically after the network returns", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "ios-webkit", "The regression is specific to installed iOS WebKit lifecycle behavior.");

  const requests = await installSessionMocks(page, "offline");
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expectRecoverableBootstrap(page);
  const failedRefreshes = requests.refreshRequests();
  expect(failedRefreshes).toBeGreaterThan(0);

  requests.allowRefreshSuccess();
  await page.evaluate(() => {
    Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
    window.dispatchEvent(new Event("online"));
  });

  await expect(page.getByRole("heading", { name: /Продолжите с сохранённой позиции|готов(?:ы)? к повторению|Добавьте новые слова|Соберите первый учебный блок|Настройте урок под текущую задачу/ })).toBeVisible();
  await expect.poll(requests.refreshRequests).toBeGreaterThan(failedRefreshes);
  await expect(page.getByText("Сессия не удалена. Пароль вводить заново не нужно.")).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
});

test("iOS pageshow resumes a recoverable session after a transient server failure", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "ios-webkit", "The regression is specific to installed iOS WebKit lifecycle behavior.");

  const requests = await installSessionMocks(page, "server");
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expectRecoverableBootstrap(page);
  const failedRefreshes = requests.refreshRequests();
  expect(failedRefreshes).toBeGreaterThan(0);

  requests.allowRefreshSuccess();
  await page.evaluate(() => {
    Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
    window.dispatchEvent(new Event("pageshow"));
  });

  await expect(page.getByRole("heading", { name: /Продолжите с сохранённой позиции|готов(?:ы)? к повторению|Добавьте новые слова|Соберите первый учебный блок|Настройте урок под текущую задачу/ })).toBeVisible();
  await expect.poll(requests.refreshRequests).toBeGreaterThan(failedRefreshes);
  await expect(page).not.toHaveURL(/\/profile\?session=/);
  await expect(page).toHaveURL(/\/$/);
});