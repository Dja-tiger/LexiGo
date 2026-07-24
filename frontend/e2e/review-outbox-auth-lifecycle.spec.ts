import { expect, test, type BrowserContext, type Page, type Route } from "@playwright/test";

const USER_ID = "00000000-0000-0000-0000-000000000054";
const LESSON_ID = "00000000-0000-0000-0000-000000000540";
const SESSION = {
  user: {
    id: USER_ID,
    email: "login-outbox@example.com",
    displayName: "Login Outbox Tester",
    createdAt: "2026-01-01T00:00:00Z",
  },
  tokens: {
    accessToken: "login-outbox-access-token",
    tokenType: "Bearer",
    expiresIn: 900,
  },
};
const EMPTY_MODE = { attemptsToday: 0, successfulToday: 0, attemptsTotal: 0, successfulTotal: 0 };
const WORD = {
  id: 540,
  kind: "word",
  lemma: "recoverable",
  translation: "восстанавливаемый",
  phonetic: "/rɪˈkʌvərəbl/",
  partOfSpeech: "adjective",
  topic: "Reliability",
  examples: ["The operation must be recoverable."],
  note: "",
  status: "new",
  position: 0,
};

type ServerState = {
  authenticated: boolean;
  activeLesson: boolean;
  lessonCreateAttempts: number;
  reviewAttempts: number;
};

async function json(route: Route, status: number, body: unknown) {
  await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

function progress() {
  return {
    dueNow: 1,
    dueWords: 1,
    duePhrases: 0,
    totalWords: 1,
    totalPhrases: 0,
    newWords: 1,
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
    modes: { study: EMPTY_MODE, recall: EMPTY_MODE, choice: EMPTY_MODE, legacy: EMPTY_MODE },
  };
}

async function installAPI(context: BrowserContext, state: ServerState) {
  await context.addCookies([{
    name: "lexigo_csrf",
    value: "auth-lifecycle-csrf",
    url: "http://127.0.0.1:3000",
    sameSite: "Lax",
  }]);
  await context.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path === "/api/v1/catalog/metadata") {
      return json(route, 200, {
        catalogVersion: "sha256:auth-lifecycle-e2e",
        updatedAt: "2026-07-19T00:00:00Z",
        totals: { items: 1, words: 1, phrases: 0 },
        sources: {
          mixed: 1,
          noun: 0,
          verb: 0,
          adjective: 1,
          phrases: 0,
          dailyLife: 0,
          travel: 0,
          dataEngineering: 0,
          backend: 1, academicTechnicalEnglish: 0,
        },
        topics: [{ topic: "Reliability", count: 1 }],
      });
    }
    if (path === "/api/v1/auth/refresh") {
      return state.authenticated
        ? json(route, 200, SESSION)
        : json(route, 401, { error: { code: "unauthorized", message: "guest" } });
    }
    if (path === "/api/v1/auth/login") {
      state.authenticated = true;
      return json(route, 200, SESSION);
    }
    if (path === "/api/v1/progress") return json(route, 200, progress());
    if (path === "/api/v1/words" || path === "/api/v1/words/due") {
      const phraseRequest = url.searchParams.get("kind") === "phrase";
      return json(route, 200, phraseRequest ? { items: [], count: 0 } : { items: [WORD], count: 1 });
    }
    if (path === "/api/v1/lessons/preview") {
      const body = request.postDataJSON() as { source: string; studyMode: string; lessonSize: string };
      return json(route, 200, {
        source: body.source,
        studyMode: body.studyMode,
        lessonSize: body.lessonSize,
        composition: {
          total: 1,
          words: 1,
          phrases: 0,
          due: 1,
          new: 0,
          scheduled: 0,
          availableWords: 1,
          availablePhrases: 0,
          fallback: "words_only",
        },
      });
    }
    if (path === "/api/v1/lessons/active") {
      if (!state.activeLesson) {
        return json(route, 404, { error: { code: "active_lesson_not_found", message: "none" } });
      }
      return json(route, 200, {
        id: LESSON_ID,
        source: "mixed",
        studyMode: "study",
        lessonSize: "1",
        currentIndex: 0,
        version: 1,
        status: "active",
        items: [WORD],
        createdAt: "2026-07-19T00:00:00Z",
        updatedAt: "2026-07-19T00:00:00Z",
      });
    }
    if (path === "/api/v1/lessons" && request.method() === "POST") {
      state.lessonCreateAttempts += 1;
      return json(route, 500, { error: { code: "unexpected_online_request", message: "lesson start must remain local" } });
    }
    if (path.endsWith(`/lessons/${LESSON_ID}/words/${WORD.id}/review`)) {
      state.reviewAttempts += 1;
      return json(route, 500, { error: { code: "unexpected_online_request", message: "review must remain local" } });
    }
    return json(route, 404, { error: { code: "not_mocked", message: path } });
  });
}

async function queuedReviews(page: Page): Promise<Array<{ userId: string; status: string }>> {
  return page.evaluate(async () => new Promise((resolve, reject) => {
    const request = indexedDB.open("lexigo-review-outbox", 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction("lesson-reviews", "readonly");
      const records = transaction.objectStore("lesson-reviews").getAll();
      records.onerror = () => reject(records.error);
      records.onsuccess = () => resolve(records.result.map((record) => ({
        userId: String(record.userId),
        status: String(record.status),
      })));
      transaction.oncomplete = () => database.close();
    };
  }));
}

test("adopts an in-app login before persisting an offline lesson review", async ({ context, page }) => {
  const state: ServerState = {
    authenticated: false,
    activeLesson: true,
    lessonCreateAttempts: 0,
    reviewAttempts: 0,
  };
  await installAPI(context, state);

  await page.goto("/profile");
  await expect(page.getByRole("heading", { name: "Сохраняйте прогресс на всех устройствах" })).toBeVisible();
  await page.locator("#auth-email").fill(SESSION.user.email);
  await page.locator("#auth-password").fill("correct horse battery staple");
  await page.getByRole("button", { name: "Войти", exact: true }).click();

  await expect(page).toHaveURL((url) => url.pathname === "/" && url.search === "");
  await expect(page.getByText("Сессия истекла", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Продолжить урок", exact: true }).first().click();
  await expect(page.getByText("Слово 1 из 1")).toBeVisible();

  await context.setOffline(true);
  await page.getByRole("button", { name: "Знал", exact: true }).click();
  await expect(page.getByRole("alert", { name: "Ошибка текущего действия" }))
    .toContainText("Ответ сохранён на устройстве.");
  await expect.poll(() => queuedReviews(page)).toEqual([
    { userId: USER_ID, status: "pending" },
  ]);
  expect(state.reviewAttempts).toBe(0);
});

test("blocks a new network lesson with an explicit offline state", async ({ context, page }) => {
  const state: ServerState = {
    authenticated: true,
    activeLesson: false,
    lessonCreateAttempts: 0,
    reviewAttempts: 0,
  };
  await installAPI(context, state);

  await page.goto("/learn");

  if ((page.viewportSize()?.width || 1000) < 768) {
    await page.getByRole("button", { name: "Настроить урок" }).click();
  }

  await expect(page.getByText("1 элемент · 1 слово · 0 фраз")).toBeVisible();
  await context.setOffline(true);
  await expect(page.getByText("Нет подключения к сети", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Начать урок", exact: true }).click();
  await expect(page.getByRole("alert", { name: "Ошибка текущего действия" }))
    .toContainText("Начните новый урок после восстановления соединения.");
  expect(state.lessonCreateAttempts).toBe(0);
});
