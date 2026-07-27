import { expect, test, type BrowserContext, type Page, type Route } from "@playwright/test";

const SESSION = {
  user: {
    id: "00000000-0000-0000-0000-000000000250",
    email: "home-island@example.com",
    displayName: "Home Island User",
    createdAt: "2026-01-01T00:00:00Z",
  },
  tokens: {
    accessToken: "home-island-access-token",
    tokenType: "Bearer",
    expiresIn: 900,
  },
};

const WORD = {
  id: 25001,
  kind: "word" as const,
  lemma: "handoff",
  translation: "передача управления",
  aliases: ["transfer"],
  acceptedAnswers: ["передача управления"],
  phonetic: "/ˈhændɒf/",
  partOfSpeech: "noun",
  topic: "Frontend Architecture",
  examples: ["The route handoff preserves the active lesson."],
  note: "A route-island transition must retain the server-owned session.",
  status: "review",
};

const PROGRESS = {
  dueNow: 1,
  dueWords: 1,
  duePhrases: 0,
  totalWords: 1,
  totalPhrases: 0,
  newWords: 0,
  learningWords: 0,
  reviewWords: 1,
  masteredWords: 0,
  masteredPhrases: 0,
  reviewsToday: 0,
  successfulToday: 0,
  reviewsTotal: 1,
  dailyGoal: 30,
  currentStreak: 1,
  longestStreak: 1,
  retainedItemsWeek: 0,
  retainedWordsWeek: 0,
  retainedPhrasesWeek: 0,
};

const METADATA = {
  catalogVersion: "sha256:home-island-e2e",
  updatedAt: "2026-07-27T10:00:00Z",
  totals: { items: 1, words: 1, phrases: 0 },
  sources: {
    mixed: 1,
    noun: 1,
    verb: 0,
    adjective: 0,
    phrases: 0,
    dailyLife: 0,
    travel: 0,
    dataEngineering: 0,
    backend: 0,
    academicTechnicalEnglish: 0,
  },
  topics: [{ topic: "Frontend Architecture", count: 1, words: 1, phrases: 0 }],
};

function lesson() {
  return {
    id: "00000000-0000-0000-0000-000000000251",
    source: "mixed",
    studyMode: "recall",
    lessonSize: "30",
    currentIndex: 0,
    version: 1,
    status: "active",
    items: [{ ...WORD, position: 0 }],
    createdAt: "2026-07-27T10:00:00Z",
    updatedAt: "2026-07-27T10:00:00Z",
  };
}

async function json(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

type FixtureState = {
  refreshes: number;
  lessonCreates: Array<Record<string, unknown>>;
};

async function installAPI(context: BrowserContext): Promise<FixtureState> {
  const state: FixtureState = { refreshes: 0, lessonCreates: [] };
  let activeLesson: ReturnType<typeof lesson> | null = null;

  await context.addCookies([{
    name: "lexigo_csrf",
    value: "home-island-csrf",
    url: "http://127.0.0.1:3000",
    sameSite: "Lax",
  }]);

  await context.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path === "/api/v1/auth/refresh") {
      state.refreshes += 1;
      return json(route, 200, SESSION);
    }
    if (path === "/api/v1/progress") return json(route, 200, PROGRESS);
    if (path === "/api/v1/catalog/metadata") return json(route, 200, METADATA);
    if (path === "/api/v1/lessons/active") {
      return activeLesson
        ? json(route, 200, activeLesson)
        : json(route, 404, { error: { code: "active_lesson_not_found", message: "not found" } });
    }
    if (path === "/api/v1/lessons" && request.method() === "POST") {
      const input = request.postDataJSON() as Record<string, unknown>;
      state.lessonCreates.push(input);
      activeLesson = lesson();
      return json(route, 201, activeLesson);
    }
    if (path === "/api/v1/lessons/preview") {
      return json(route, 200, {
        source: "mixed",
        studyMode: "study",
        lessonSize: "30",
        composition: {
          total: 1,
          words: 1,
          phrases: 0,
          due: 1,
          new: 0,
          scheduled: 0,
          availableWords: 1,
          availablePhrases: 0,
        },
      });
    }
    if (path === "/api/v1/words" || path === "/api/v1/words/due") {
      return json(route, 200, {
        items: [WORD],
        count: 1,
        total: 1,
        page: 1,
        pageSize: 48,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      });
    }

    return json(route, 404, { error: { code: "not_mocked", message: path } });
  });

  return state;
}

function visibleRouteLink(page: Page, view: "home" | "learn" | "library" | "progress") {
  return page.locator(`.lx-route-nav:visible [data-navigation-view="${view}"]`);
}

test.describe.configure({ timeout: 90_000 });

test("Home starts the due lesson and consumes resume=1 without an intermediate gate", async ({ context, page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "The one-time route intent is verified once in Chromium; the shared lesson flow remains covered cross-browser.");
  const state = await installAPI(context);

  await page.goto("/");
  await expect(page.locator('[data-route-client-island="home"]')).toBeVisible();
  await expect(page.getByRole("button", { name: "Повторить сейчас" })).toBeVisible();
  expect(state.refreshes).toBe(1);

  await page.getByRole("button", { name: "Повторить сейчас" }).click();

  await expect(page).toHaveURL((url) => url.pathname === "/lesson/active" && url.search === "");
  await expect(page.locator(".lx-active-lesson")).toBeVisible();
  await expect(page.getByRole("button", { name: "Продолжить урок" })).toHaveCount(0);
  expect(state.lessonCreates).toEqual([{
    source: "mixed",
    studyMode: "recall",
    lessonSize: "30",
  }]);
  expect(state.refreshes).toBe(1);
});

test("Home remains a dedicated entry across Home to product graph navigation and browser history", async ({ context, page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Route-graph ownership is verified once in Chromium; canonical navigation is covered by the full browser matrix.");
  const state = await installAPI(context);

  await page.goto("/");
  await expect(page.locator('[data-route-client-island="home"]')).toBeVisible();

  await visibleRouteLink(page, "learn").click();
  await expect(page).toHaveURL(/\/learn$/);
  await expect(page.getByRole("heading", { name: "Соберите один сфокусированный урок" })).toBeVisible();
  await expect(page.locator('[data-route-client-island="home"]')).toHaveCount(0);

  await visibleRouteLink(page, "home").click();
  await expect(page).toHaveURL((url) => url.pathname === "/" && url.search === "");
  await expect(page.locator('[data-route-client-island="home"]')).toBeVisible();

  await visibleRouteLink(page, "library").click();
  await expect(page).toHaveURL(/\/dictionary$/);
  await expect(page.locator('[data-route-client-island="dictionary"]')).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Словарь" })).toBeVisible();

  await visibleRouteLink(page, "home").click();
  await expect(page).toHaveURL((url) => url.pathname === "/" && url.search === "");
  await expect(page.locator('[data-route-client-island="home"]')).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/dictionary$/);
  await expect(page.locator('[data-route-client-island="dictionary"]')).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL((url) => url.pathname === "/" && url.search === "");
  await expect(page.locator('[data-route-client-island="home"]')).toBeVisible();
  expect(state.refreshes).toBe(1);
});
