import { expect, test } from "@playwright/test";

const SESSION = {
  user: { id: "00000000-0000-0000-0000-000000000177", email: "next@example.com", displayName: "Next Lesson", createdAt: "2026-01-01T00:00:00Z" },
  tokens: { accessToken: "next-lesson-token", tokenType: "Bearer", expiresIn: 900 },
};
const EMPTY_MODE = { attemptsToday: 0, successfulToday: 0, attemptsTotal: 0, successfulTotal: 0 };
const PROGRESS = {
  dueNow: 0, dueWords: 0, duePhrases: 0, totalWords: 2, totalPhrases: 0, newWords: 2, learningWords: 0,
  reviewWords: 0, masteredWords: 0, masteredPhrases: 0, reviewsToday: 0, successfulToday: 0,
  objectiveReviewsToday: 0, objectiveSuccessfulToday: 0, reviewsTotal: 0, dailyGoal: 15, currentStreak: 0,
  longestStreak: 0, retainedItemsWeek: 0, retainedWordsWeek: 0, retainedPhrasesWeek: 0, eventSchemaVersion: 2,
  modes: { study: EMPTY_MODE, recall: EMPTY_MODE, choice: EMPTY_MODE, legacy: EMPTY_MODE },
};
const BLOCKS = [
  [{ id: 101, kind: "word", position: 0, lemma: "absolute", translation: "абсолютный", phonetic: "", partOfSpeech: "adjective", topic: "General", examples: ["The value is absolute."], note: "", status: "learning" }],
  [{ id: 102, kind: "word", position: 0, lemma: "build", translation: "собирать", phonetic: "", partOfSpeech: "verb", topic: "Development", examples: ["Build the service."], note: "", status: "new" }],
];
const WORDS = BLOCKS.flat().map(({ position: _position, ...item }) => item);

test("completed block advances once to a distinct server lesson", async ({ page }) => {
  test.setTimeout(45_000);
  let createCalls = 0;
  await page.context().addCookies([{ name: "lexigo_csrf", value: "e2e-csrf-token", url: "http://127.0.0.1:3000", sameSite: "Lax" }]);
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    if (path === "/api/v1/auth/refresh") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SESSION) });
    if (path === "/api/v1/progress") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PROGRESS) });
    if (path === "/api/v1/catalog/metadata") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      catalogVersion: "sha256:next-lesson", updatedAt: "2026-07-23T00:00:00Z",
      totals: { items: 2, words: 2, phrases: 0 },
      sources: { mixed: 2, noun: 0, verb: 1, adjective: 1, phrases: 0, dailyLife: 0, travel: 0, dataEngineering: 0, backend: 0 , academicTechnicalEnglish: 0},
      topics: [{ topic: "General", count: 1 }, { topic: "Development", count: 1 }],
    }) });
    if ((path === "/api/v1/words" || path === "/api/v1/words/due") && url.searchParams.get("kind") === "phrase") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [], count: 0 }) });
    }
    if (path === "/api/v1/words" || path === "/api/v1/words/due") {
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: WORDS, count: WORDS.length }) });
    }
    if (path === "/api/v1/lessons/active") return route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: { code: "active_lesson_not_found", message: "none" } }) });
    if (path === "/api/v1/lessons/preview") {
      const input = request.postDataJSON() as { source?: string; studyMode?: string; lessonSize?: string };
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        source: input.source ?? "mixed", studyMode: input.studyMode ?? "study", lessonSize: input.lessonSize ?? "15",
        composition: { total: 1, words: 1, phrases: 0, due: 0, new: 1, scheduled: 0, availableWords: 2, availablePhrases: 0, fallback: "words_only" },
      }) });
    }
    if (path === "/api/v1/lessons" && request.method() === "POST") {
      const blockIndex = Math.min(createCalls, BLOCKS.length - 1);
      const items = BLOCKS[blockIndex];
      createCalls += 1;
      if (blockIndex === 1) await new Promise((resolve) => setTimeout(resolve, 150));
      return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({
        id: `00000000-0000-0000-0000-00000000017${blockIndex + 7}`,
        source: "mixed", studyMode: "study", lessonSize: "15", currentIndex: 0, version: 1,
        status: "active", items, createdAt: "2026-07-23T00:00:00Z", updatedAt: "2026-07-23T00:00:00Z",
      }) });
    }
    if (path.endsWith("/review") && request.method() === "POST") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      wordId: 101, status: "learning", easiness: 2.5, intervalDays: 0, repetitions: 0,
      dueAt: "2026-07-24T00:00:00Z", lastReviewedAt: "2026-07-23T00:00:00Z",
      requestedRating: "known", effectiveRating: "known", judgementSource: "study", judgementReason: "passive_exposure",
      reviewEventId: 1, suggestionAvailable: false, lessonId: "00000000-0000-0000-0000-000000000177",
      lessonCurrentIndex: 1, lessonVersion: 2, lessonCompleted: true, lessonReviewedItems: 1, lessonSkippedItems: 0, lessonTotalItems: 1,
    }) });
    return route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: { code: "not_mocked", message: path } }) });
  });

  await page.goto("/learn");
  await page.getByRole("radio", { name: /Простое изучение слов/ }).click();
  const start = page.getByRole("button", { name: "Начать урок", exact: true });
  await expect(start).toBeEnabled({ timeout: 15_000 });
  await start.click();
  await expect(page.getByText("absolute", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Знал", exact: true }).click();
  await page.getByRole("button", { name: "К результатам", exact: true }).click();
  const next = page.getByRole("button", { name: "Следующий блок", exact: true });
  await next.evaluate((element) => { const button = element as HTMLButtonElement; button.click(); button.click(); });
  await expect(page.getByText("build", { exact: true })).toBeVisible();
  await expect(page.getByText("absolute", { exact: true })).toHaveCount(0);
  expect(createCalls).toBe(2);
});
