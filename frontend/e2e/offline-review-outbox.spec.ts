import { expect, test, type BrowserContext, type Page, type Route } from "@playwright/test";

const USER_ID = "00000000-0000-0000-0000-000000000053";
const LESSON_ID = "00000000-0000-0000-0000-000000000530";
const SESSION = {
  user: { id: USER_ID, email: "offline@example.com", displayName: "Offline Tester", createdAt: "2026-01-01T00:00:00Z" },
  tokens: { accessToken: "offline-access-token", tokenType: "Bearer", expiresIn: 900 },
};
const EMPTY_MODE = { attemptsToday: 0, successfulToday: 0, attemptsTotal: 0, successfulTotal: 0 };
const WORD = {
  id: 530,
  kind: "word",
  lemma: "durable",
  translation: "надёжный",
  phonetic: "/ˈdjʊərəbl/",
  partOfSpeech: "adjective",
  topic: "Data",
  examples: ["Use durable storage."],
  note: "",
  status: "new",
  position: 0,
};

type ReviewServer = {
  logicalEvents: number;
  attempts: number;
  committed: boolean;
  loseFirstResponse: boolean;
  allowReplay: boolean;
  idempotencyKeys: string[];
  storedResponse: string;
};

function progress(reviews: number) {
  return {
    dueNow: reviews ? 0 : 1,
    dueWords: reviews ? 0 : 1,
    duePhrases: 0,
    totalWords: 1,
    totalPhrases: 0,
    newWords: reviews ? 0 : 1,
    learningWords: reviews ? 1 : 0,
    reviewWords: 0,
    masteredWords: 0,
    masteredPhrases: 0,
    reviewsToday: reviews,
    successfulToday: reviews,
    objectiveReviewsToday: 0,
    objectiveSuccessfulToday: 0,
    reviewsTotal: reviews,
    dailyGoal: 30,
    currentStreak: reviews,
    longestStreak: reviews,
    retainedItemsWeek: 0,
    retainedWordsWeek: 0,
    retainedPhrasesWeek: 0,
    eventSchemaVersion: 2,
    modes: { study: EMPTY_MODE, recall: EMPTY_MODE, choice: EMPTY_MODE, legacy: EMPTY_MODE },
  };
}

async function installReviewServer(context: BrowserContext, state: ReviewServer) {
  await context.addCookies([{ name: "lexigo_csrf", value: "e2e-csrf-token", url: "http://127.0.0.1:3000", sameSite: "Lax" }]);
  await context.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    if (path === "/api/v1/auth/refresh") return json(route, 200, SESSION);
    if (path === "/api/v1/catalog/metadata") return json(route, 200, {
      catalogVersion: "sha256:offline-e2e",
      updatedAt: "2026-07-19T00:00:00Z",
      totals: { items: 1, words: 1, phrases: 0 },
      sources: { mixed: 1, noun: 0, verb: 0, adjective: 1, phrases: 0, dailyLife: 0, travel: 0, dataEngineering: 1, backend: 0 },
      topics: [{ topic: "Data", count: 1 }],
    });
    if (path === "/api/v1/progress") return json(route, 200, progress(state.logicalEvents));
    if (path === "/api/v1/words" || path === "/api/v1/words/due") {
      return json(route, 200, { items: [WORD], count: 1 });
    }
    if (path === "/api/v1/lessons/active") {
      if (state.committed) return json(route, 404, { error: { code: "active_lesson_not_found", message: "completed" } });
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
    if (path.endsWith(`/lessons/${LESSON_ID}/words/${WORD.id}/review`) && request.method() === "POST") {
      state.attempts += 1;
      const key = request.headers()["idempotency-key"] ?? "";
      state.idempotencyKeys.push(key);
      if (!key) return json(route, 422, { error: { code: "invalid_idempotency_key", message: "missing" } });

      if (state.committed) {
        if (!state.allowReplay) return json(route, 503, { error: { code: "temporarily_unavailable", message: "retry later" } });
        return route.fulfill({ status: 200, contentType: "application/json", body: state.storedResponse });
      }

      state.logicalEvents += 1;
      state.committed = true;
      state.storedResponse = JSON.stringify({
        wordId: WORD.id,
        status: "learning",
        easiness: 2.5,
        intervalDays: 0,
        repetitions: 0,
        dueAt: "2026-07-20T00:00:00Z",
        lastReviewedAt: "2026-07-19T00:00:00Z",
        lessonId: LESSON_ID,
        lessonCurrentIndex: 1,
        lessonVersion: 2,
        lessonCompleted: true,
        lessonReviewedItems: 1,
        lessonSkippedItems: 0,
        lessonTotalItems: 1,
      });
      if (state.loseFirstResponse) {
        state.loseFirstResponse = false;
        return route.abort("failed");
      }
      return route.fulfill({ status: 200, contentType: "application/json", body: state.storedResponse });
    }
    return json(route, 404, { error: { code: "not_mocked", message: path } });
  });
}

async function json(route: Route, status: number, body: unknown) {
  await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

async function openPersistedLesson(page: Page) {
  await page.goto("/lesson/active");
  await page.getByRole("button", { name: "Продолжить урок", exact: true }).click();
  await expect(page.getByRole("button", { name: "Знал", exact: true })).toBeVisible();
}

async function outboxRecords(page: Page): Promise<Array<{ status: string; idempotencyKey: string }>> {
  return page.evaluate(async () => new Promise((resolve, reject) => {
    const request = indexedDB.open("lexigo-review-outbox", 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const database = request.result;
      const transaction = database.transaction("lesson-reviews", "readonly");
      const records = transaction.objectStore("lesson-reviews").getAll();
      records.onerror = () => reject(records.error);
      records.onsuccess = () => resolve(records.result.map((record) => ({
        status: String(record.status),
        idempotencyKey: String(record.idempotencyKey),
      })));
      transaction.oncomplete = () => database.close();
    };
  }));
}

test("queues a rating offline and replays it automatically when connectivity returns", async ({ context, page }) => {
  const state: ReviewServer = {
    logicalEvents: 0,
    attempts: 0,
    committed: false,
    loseFirstResponse: false,
    allowReplay: true,
    idempotencyKeys: [],
    storedResponse: "",
  };
  await installReviewServer(context, state);
  await openPersistedLesson(page);

  await context.setOffline(true);
  await page.getByRole("button", { name: "Знал", exact: true }).click();
  await expect(page.getByRole("alert", { name: "Ошибка текущего действия" }))
    .toContainText("Ответ сохранён на устройстве.");
  await expect.poll(() => outboxRecords(page)).toEqual([
    expect.objectContaining({ status: "pending", idempotencyKey: expect.any(String) }),
  ]);
  expect(state.attempts).toBe(0);
  expect(state.logicalEvents).toBe(0);

  await context.setOffline(false);
  await expect.poll(() => outboxRecords(page), { timeout: 15_000 }).toEqual([
    expect.objectContaining({ status: "synced", idempotencyKey: expect.any(String) }),
  ]);
  expect(state.attempts).toBe(1);
  expect(state.logicalEvents).toBe(1);
});

test("replays the same idempotency key after a lost response and tab close", async ({ context, page }) => {
  const state: ReviewServer = {
    logicalEvents: 0,
    attempts: 0,
    committed: false,
    loseFirstResponse: true,
    allowReplay: false,
    idempotencyKeys: [],
    storedResponse: "",
  };
  await installReviewServer(context, state);
  await openPersistedLesson(page);

  await page.getByRole("button", { name: "Знал", exact: true }).click();
  await expect(page.getByRole("alert", { name: "Ошибка текущего действия" }))
    .toContainText("Ответ сохранён на устройстве.");
  await expect.poll(() => outboxRecords(page)).toEqual([
    expect.objectContaining({ status: "pending", idempotencyKey: expect.any(String) }),
  ]);
  expect(state.logicalEvents).toBe(1);

  await page.close();
  const restoredPage = await context.newPage();
  await restoredPage.goto("/");
  await expect(restoredPage.getByText("Ответ ожидает синхронизации", { exact: false })).toBeVisible();
  await expect.poll(() => outboxRecords(restoredPage)).toEqual([
    expect.objectContaining({ status: "pending", idempotencyKey: expect.any(String) }),
  ]);

  state.allowReplay = true;
  await restoredPage.getByRole("button", { name: "Повторить сейчас", exact: true }).click();
  await expect.poll(() => outboxRecords(restoredPage)).toEqual([
    expect.objectContaining({ status: "synced", idempotencyKey: expect.any(String) }),
  ]);
  expect(state.logicalEvents).toBe(1);
  expect(new Set(state.idempotencyKeys).size).toBe(1);
  expect(state.attempts).toBeGreaterThanOrEqual(3);
});
