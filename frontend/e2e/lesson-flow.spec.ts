import { expect, test, type Page } from "@playwright/test";

type LessonMode = "study" | "recall" | "choice";
type RequestRecord = Record<string, unknown>;

type MockLesson = {
  reviewCalls: () => number;
  lessonRequests: () => RequestRecord[];
  reviewRequests: () => RequestRecord[];
};

const SESSION = {
  user: { id: "00000000-0000-0000-0000-000000000035", email: "lesson@example.com", displayName: "Lesson Tester", createdAt: "2026-01-01T00:00:00Z" },
  tokens: { accessToken: "e2e-access-token", tokenType: "Bearer", expiresIn: 900 },
};
const EMPTY_MODE = { attemptsToday: 0, successfulToday: 0, attemptsTotal: 0, successfulTotal: 0 };
const PROGRESS = {
  dueNow: 0, dueWords: 0, duePhrases: 0, totalWords: 4, totalPhrases: 0, newWords: 4, learningWords: 0,
  reviewWords: 0, masteredWords: 0, masteredPhrases: 0, reviewsToday: 0, successfulToday: 0,
  objectiveReviewsToday: 0, objectiveSuccessfulToday: 0, reviewsTotal: 0, dailyGoal: 30, currentStreak: 0,
  longestStreak: 0, retainedItemsWeek: 0, retainedWordsWeek: 0, retainedPhrasesWeek: 0, eventSchemaVersion: 2,
  modes: { study: EMPTY_MODE, recall: EMPTY_MODE, choice: EMPTY_MODE, legacy: EMPTY_MODE },
};
const PHRASE = { id: 201, kind: "phrase" as const, slug: "roll-back", lemma: "roll back", translation: "откатить", phonetic: "", partOfSpeech: "phrase", topic: "Release", examples: ["Roll back the release."], note: "", cloze: "roll ____", clozeAnswer: "back", status: "new" };

const WORDS = [
  { id: 101, lemma: "absolute", translation: "абсолютный", phonetic: "/ˈæbsəluːt/", partOfSpeech: "adjective", topic: "General", examples: ["The value is absolute."], note: "", status: "new" },
  { id: 102, lemma: "build", translation: "собирать", phonetic: "/bɪld/", partOfSpeech: "verb", topic: "Development", examples: ["Build the service."], note: "", status: "new" },
  { id: 103, lemma: "cache", translation: "кэш", phonetic: "/kæʃ/", partOfSpeech: "noun", topic: "Backend", examples: ["Clear the cache."], note: "", status: "new" },
  { id: 104, lemma: "durable", translation: "надёжный", phonetic: "/ˈdjʊərəbl/", partOfSpeech: "adjective", topic: "Data", examples: ["Use durable storage."], note: "", status: "new" },
];

function lessonItems(count: number, ratings: Record<number, "again" | "almost" | "known"> = {}) {
  return WORDS.slice(0, count).map((item, position) => ({ ...item, kind: "word", position, ...(ratings[item.id] ? { rating: ratings[item.id], reviewedAt: "2026-07-17T00:00:00Z" } : {}) }));
}

async function installBaseRoutes(page: Page) {
  await page.context().addCookies([{ name: "lexigo_csrf", value: "e2e-csrf-token", url: "http://127.0.0.1:3000", sameSite: "Lax" }]);
}

async function installLessonAPI(page: Page, itemCount: number, reviewDelayMs = 0, itemOverride?: ReturnType<typeof lessonItems>): Promise<MockLesson> {
  let reviewCalls = 0;
  let reviewedItems = 0;
  let version = 1;
  const selectedItems = itemOverride ?? lessonItems(itemCount);
  const lessonRequests: RequestRecord[] = [];
  const reviewRequests: RequestRecord[] = [];
  await installBaseRoutes(page);

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    if (path === "/api/v1/auth/refresh") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SESSION) });
    if (path === "/api/v1/progress") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PROGRESS) });
    if ((path === "/api/v1/words" || path === "/api/v1/words/due") && url.searchParams.get("kind") === "phrase") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [], count: 0 }) });
    if (path === "/api/v1/words" || path === "/api/v1/words/due") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: WORDS, count: WORDS.length }) });
    if (path === "/api/v1/lessons/preview") {
      const input = request.postDataJSON() as { source?: string; studyMode?: string; lessonSize?: string };
      const phraseCount = selectedItems.filter((item) => item.kind === "phrase").length;
      const wordCount = selectedItems.length - phraseCount;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        source: input.source ?? "mixed", studyMode: input.studyMode ?? "study", lessonSize: input.lessonSize ?? "30",
        composition: { total: selectedItems.length, words: wordCount, phrases: phraseCount, due: selectedItems.length, new: 0, scheduled: 0, availableWords: wordCount, availablePhrases: phraseCount, ...(phraseCount === 0 ? { fallback: "words_only" } : {}) },
      }) });
    }
    if (path === "/api/v1/lessons/active") return route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: { code: "active_lesson_not_found", message: "active lesson was not found" } }) });
    if (path === "/api/v1/lessons" && request.method() === "POST") {
      const payload = request.postDataJSON() as RequestRecord;
      lessonRequests.push(payload);
      return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({
        id: "00000000-0000-0000-0000-000000000350", source: "mixed", studyMode: payload.studyMode, lessonSize: String(itemCount),
        currentIndex: 0, version: 1, status: "active", items: selectedItems, createdAt: "2026-07-17T00:00:00Z", updatedAt: "2026-07-17T00:00:00Z",
      }) });
    }
    if (path.endsWith("/review") && request.method() === "POST") {
      const payload = request.postDataJSON() as RequestRecord;
      reviewCalls += 1;
      reviewRequests.push(payload);
      if (payload.lessonVersion !== version) return route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ error: { code: "lesson_version_conflict", message: "stale" } }) });
      if (reviewDelayMs > 0) await new Promise((resolve) => setTimeout(resolve, reviewDelayMs));
      reviewedItems += 1;
      version += 1;
      const completed = reviewedItems === itemCount;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        wordId: selectedItems[Math.min(reviewedItems - 1, selectedItems.length - 1)].id, status: "learning", easiness: 2.5,
        intervalDays: 1, repetitions: reviewedItems, dueAt: "2026-07-18T00:00:00Z", lastReviewedAt: "2026-07-17T00:00:00Z",
        lessonId: "00000000-0000-0000-0000-000000000350", lessonCurrentIndex: reviewedItems, lessonVersion: version,
        lessonCompleted: completed, lessonReviewedItems: reviewedItems, lessonSkippedItems: 0, lessonTotalItems: itemCount,
      }) });
    }
    return route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: { code: "not_mocked", message: path } }) });
  });
  return { reviewCalls: () => reviewCalls, lessonRequests: () => lessonRequests, reviewRequests: () => reviewRequests };
}

async function openLesson(page: Page, mode: LessonMode) {
  await page.goto("/?view=learn");
  await expect(page.getByText("0 элементов готовы")).toBeVisible();
  const label = mode === "study" ? "Простое изучение слов" : mode === "recall" ? "Вспомнить самому" : "Выбрать вариант";
  await page.getByRole("button", { name: new RegExp(label) }).click();
  await page.getByRole("button", { name: "Начать урок", exact: true }).click();
  await expect(page).toHaveURL(/view=lesson/);
}

test("study: persists exposure with the current lesson version", async ({ page }) => {
  const api = await installLessonAPI(page, 2, 350);
  await openLesson(page, "study");
  expect(api.lessonRequests()[0]).toMatchObject({ studyMode: "study", source: "mixed" });
  expect(api.lessonRequests()[0]).not.toHaveProperty("wordIds");
  await expect(page.getByRole("button", { name: "← Предыдущее недоступно", exact: true })).toBeDisabled();

  const known = page.getByRole("button", { name: "Знал", exact: true });
  await known.evaluate((element) => { const button = element as HTMLButtonElement; button.click(); button.click(); });
  await expect(page.getByRole("button", { name: "Дальше", exact: true })).toBeEnabled();
  expect(api.reviewCalls()).toBe(1);
  expect(api.reviewRequests()[0]).toMatchObject({ lessonVersion: 1, answerMode: "study", answerRevealed: true });
  expect(api.reviewRequests()[0]).not.toHaveProperty("correct");

  await page.getByRole("button", { name: "Дальше", exact: true }).click();
  await page.getByRole("button", { name: "Не знал", exact: true }).click();
  expect(api.reviewRequests()[1]).toMatchObject({ lessonVersion: 2 });
  await expect(page.getByRole("button", { name: "К результатам", exact: true })).toBeEnabled();
});

test("recall and choice send versioned objective payloads", async ({ page }) => {
  const recall = await installLessonAPI(page, 1);
  await openLesson(page, "recall");
  await page.locator("#premium-answer").fill("абсолютный");
  await page.getByRole("button", { name: "Сверить ответ", exact: true }).click();
  await page.getByRole("button", { name: "Почти", exact: true }).click();
  expect(recall.reviewRequests()[0]).toMatchObject({ lessonVersion: 1, answerMode: "recall", correct: true });
});

type SharedState = { version: number; currentIndex: number; ratings: Record<number, "known">; reviewEvents: number };

async function installSharedAPI(page: Page, state: SharedState) {
  await installBaseRoutes(page);
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === "/api/v1/auth/refresh") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SESSION) });
    if (path === "/api/v1/progress") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PROGRESS) });
    if (path === "/api/v1/words" || path === "/api/v1/words/due") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: WORDS, count: WORDS.length }) });
    if (path === "/api/v1/lessons/active") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      id: "00000000-0000-0000-0000-000000000390", source: "mixed", studyMode: "study", lessonSize: "2",
      currentIndex: state.currentIndex, version: state.version, status: "active", items: lessonItems(2, state.ratings),
      createdAt: "2026-07-17T00:00:00Z", updatedAt: "2026-07-17T00:00:00Z",
    }) });
    if (path.endsWith("/review") && request.method() === "POST") {
      const payload = request.postDataJSON() as RequestRecord;
      if (payload.lessonVersion !== state.version) return route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ error: { code: "lesson_version_conflict", message: "stale lesson" } }) });
      const word = WORDS[state.currentIndex];
      state.ratings[word.id] = "known";
      state.currentIndex += 1;
      state.version += 1;
      state.reviewEvents += 1;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        wordId: word.id, status: "learning", easiness: 2.5, intervalDays: 0, repetitions: 0, dueAt: "2026-07-18T00:00:00Z",
        lastReviewedAt: "2026-07-17T00:00:00Z", lessonId: "00000000-0000-0000-0000-000000000390",
        lessonCurrentIndex: state.currentIndex, lessonVersion: state.version, lessonCompleted: false,
        lessonReviewedItems: state.currentIndex, lessonSkippedItems: 0, lessonTotalItems: 2,
      }) });
    }
    return route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: { code: "not_mocked", message: path } }) });
  });
}

async function resumeFromHome(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Продолжить урок", exact: true }).first().click();
  await expect(page).toHaveURL(/view=lesson/);
}

test("stale device resynchronizes to the server position without duplicate review", async ({ context }) => {
  const state: SharedState = { version: 1, currentIndex: 0, ratings: {}, reviewEvents: 0 };
  const first = await context.newPage();
  const second = await context.newPage();
  await installSharedAPI(first, state);
  await installSharedAPI(second, state);

  await resumeFromHome(first);
  await resumeFromHome(second);
  await expect(first.getByText("Слово 1 из 2")).toBeVisible();
  await expect(second.getByText("Слово 1 из 2")).toBeVisible();

  await first.getByRole("button", { name: "Знал", exact: true }).click();
  expect(state.reviewEvents).toBe(1);

  await second.getByRole("button", { name: "Знал", exact: true }).click();
  await expect(second.locator(".lx-error[role=\"alert\"]")).toContainText("Урок изменён на другом устройстве");
  await expect(second.getByText("Слово 2 из 2")).toBeVisible();
  expect(state.reviewEvents).toBe(1);
  await expect(second.getByRole("button", { name: "← Предыдущее недоступно", exact: true })).toBeDisabled();
  await expect(second.getByRole("button", { name: /absolute: уже оценено/ })).toHaveCount(0);
  await expect(second.getByLabel("absolute: уже оценено")).toBeVisible();

  await second.reload();
  await second.getByRole("button", { name: "Продолжить урок", exact: true }).click();
  await expect(second.getByText("Слово 2 из 2")).toBeVisible();
  expect(state.reviewEvents).toBe(1);
});


test("mixed practice previews and opens both words and phrases", async ({ page }) => {
  const mixedItems = [
    lessonItems(1)[0],
    { ...PHRASE, position: 1 },
  ];
  const api = await installLessonAPI(page, 2, 0, mixedItems);
  await page.goto("/?view=learn");
  await expect(page.getByText("2 элемента · 1 слово · 1 фраза")).toBeVisible();
  await page.getByRole("button", { name: /Вспомнить самому/ }).click();
  await page.getByRole("button", { name: "Начать урок", exact: true }).click();
  expect(api.lessonRequests()[0]).not.toHaveProperty("wordIds");
  await expect(page.getByText("ПЕРЕВЕДИТЕ СЛОВО")).toBeVisible();
  await page.locator("#premium-answer").fill("абсолютный");
  await page.getByRole("button", { name: "Сверить ответ", exact: true }).click();
  await page.getByRole("button", { name: "Знал", exact: true }).click();
  await page.getByRole("button", { name: "Дальше", exact: true }).click();
  await expect(page.getByText("Техническая фраза", { exact: true })).toBeVisible();
});
