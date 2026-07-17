import { expect, test, type Page } from "@playwright/test";

type LessonMode = "study" | "recall" | "choice";

type MockLesson = {
  reviewCalls: () => number;
};

const SESSION = {
  user: {
    id: "00000000-0000-0000-0000-000000000035",
    email: "lesson@example.com",
    displayName: "Lesson Tester",
    createdAt: "2026-01-01T00:00:00Z",
  },
  tokens: { accessToken: "e2e-access-token", tokenType: "Bearer", expiresIn: 900 },
};

const WORDS = [
  { id: 101, lemma: "absolute", translation: "абсолютный", phonetic: "/ˈæbsəluːt/", partOfSpeech: "adjective", topic: "General", examples: ["The value is absolute."], note: "", status: "new" },
  { id: 102, lemma: "build", translation: "собирать", phonetic: "/bɪld/", partOfSpeech: "verb", topic: "Development", examples: ["Build the service."], note: "", status: "new" },
  { id: 103, lemma: "cache", translation: "кэш", phonetic: "/kæʃ/", partOfSpeech: "noun", topic: "Backend", examples: ["Clear the cache."], note: "", status: "new" },
  { id: 104, lemma: "durable", translation: "надёжный", phonetic: "/ˈdjʊərəbl/", partOfSpeech: "adjective", topic: "Data", examples: ["Use durable storage."], note: "", status: "new" },
];

const PROGRESS = {
  dueNow: 0,
  dueWords: 0,
  duePhrases: 0,
  totalWords: 4,
  totalPhrases: 0,
  newWords: 4,
  learningWords: 0,
  reviewWords: 0,
  masteredWords: 0,
  masteredPhrases: 0,
  reviewsToday: 0,
  successfulToday: 0,
  reviewsTotal: 0,
  dailyGoal: 30,
  currentStreak: 0,
  longestStreak: 0,
  retainedItemsWeek: 0,
  retainedWordsWeek: 0,
  retainedPhrasesWeek: 0,
};

function lessonItems(count: number) {
  return WORDS.slice(0, count).map((item, position) => ({ ...item, kind: "word", position }));
}

async function installLessonAPI(page: Page, itemCount: number, reviewDelayMs = 0): Promise<MockLesson> {
  let reviewCalls = 0;
  let reviewedItems = 0;
  const selectedItems = lessonItems(itemCount);

  await page.context().addCookies([{
    name: "lexigo_csrf",
    value: "e2e-csrf-token",
    url: "http://127.0.0.1:3000",
    sameSite: "Lax",
  }]);

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path === "/api/v1/auth/refresh") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SESSION) });
      return;
    }
    if (path === "/api/v1/progress") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PROGRESS) });
      return;
    }
    if ((path === "/api/v1/words" || path === "/api/v1/words/due") && url.searchParams.get("kind") === "phrase") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [], count: 0 }) });
      return;
    }
    if (path === "/api/v1/words" || path === "/api/v1/words/due") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: WORDS, count: WORDS.length }) });
      return;
    }
    if (path === "/api/v1/lessons/active") {
      await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: { code: "not_found", message: "active lesson was not found" } }) });
      return;
    }
    if (path === "/api/v1/lessons" && request.method() === "POST") {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: "00000000-0000-0000-0000-000000000350",
          source: "mixed",
          studyMode: "recall",
          lessonSize: String(itemCount),
          currentIndex: 0,
          status: "active",
          items: selectedItems,
          createdAt: "2026-07-17T00:00:00Z",
          updatedAt: "2026-07-17T00:00:00Z",
        }),
      });
      return;
    }
    if (path.endsWith("/review") && request.method() === "POST") {
      reviewCalls += 1;
      if (reviewDelayMs > 0) await new Promise((resolve) => setTimeout(resolve, reviewDelayMs));
      reviewedItems += 1;
      const completed = reviewedItems === itemCount;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          wordId: selectedItems[Math.min(reviewedItems - 1, selectedItems.length - 1)].id,
          status: "learning",
          easiness: 2.5,
          intervalDays: 1,
          repetitions: reviewedItems,
          dueAt: "2026-07-18T00:00:00Z",
          lastReviewedAt: "2026-07-17T00:00:00Z",
          lessonId: "00000000-0000-0000-0000-000000000350",
          lessonCurrentIndex: reviewedItems,
          lessonCompleted: completed,
          lessonReviewedItems: reviewedItems,
          lessonSkippedItems: 0,
          lessonTotalItems: itemCount,
        }),
      });
      return;
    }

    await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: { code: "not_mocked", message: path } }) });
  });

  return { reviewCalls: () => reviewCalls };
}

async function openLesson(page: Page, mode: LessonMode) {
  await page.goto("/?view=learn");
  await expect(page.getByText("0 элементов готовы")).toBeVisible();

  const modeLabel = mode === "study" ? "Простое изучение слов" : mode === "recall" ? "Вспомнить самому" : "Выбрать вариант";
  await page.getByRole("button", { name: new RegExp(modeLabel) }).click();
  await page.getByRole("button", { name: "Начать урок", exact: true }).click();
  await expect(page).toHaveURL(/view=lesson/);
}

test("study: blocks skip, coalesces double click and completes only after server confirmation", async ({ page }) => {
  const api = await installLessonAPI(page, 2, 350);
  await openLesson(page, "study");

  await expect(page.getByText("Слово 1 из 2")).toBeVisible();
  await expect(page.getByRole("button", { name: "Сначала сохраните оценку", exact: true })).toBeDisabled();

  const known = page.getByRole("button", { name: "Знал", exact: true });
  await known.evaluate((element) => {
    const button = element as HTMLButtonElement;
    button.click();
    button.click();
  });
  await expect(page.getByRole("button", { name: "Сохраняем оценку…", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Дальше", exact: true })).toBeEnabled();
  await expect(page.getByText("Слово 1 из 2")).toBeVisible();
  expect(api.reviewCalls()).toBe(1);

  await page.getByRole("button", { name: "Дальше", exact: true }).click();
  await expect(page.getByText("Слово 2 из 2")).toBeVisible();
  await expect(page.getByRole("button", { name: "Сначала сохраните оценку", exact: true })).toBeDisabled();

  await page.getByRole("button", { name: "Не знал", exact: true }).click();
  await expect(page.getByRole("button", { name: "К результатам", exact: true })).toBeEnabled();
  await expect(page.getByText("Слово 2 из 2")).toBeVisible();
  await page.getByRole("button", { name: "К результатам", exact: true }).click();

  await expect(page.getByText("СЕССИЯ ЗАВЕРШЕНА")).toBeVisible();
  await expect(page.getByText(/Знал: 1\. Почти: 0\. Не знал: 1\. Пропущено: 0\./)).toBeVisible();
});

test("recall: answer reveal does not bypass the required persisted rating", async ({ page }) => {
  await installLessonAPI(page, 1);
  await openLesson(page, "recall");

  await expect(page.getByRole("button", { name: "Сначала сохраните оценку", exact: true })).toBeDisabled();
  await page.locator("#premium-answer").fill("абсолютный");
  await page.getByRole("button", { name: "Сверить ответ", exact: true }).click();
  await expect(page.getByText("Ответ совпал.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Сначала сохраните оценку", exact: true })).toBeDisabled();

  await page.getByRole("button", { name: "Почти", exact: true }).click();
  await expect(page.getByRole("button", { name: "К результатам", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "К результатам", exact: true }).click();
  await expect(page.getByText(/Знал: 0\. Почти: 1\. Не знал: 0\. Пропущено: 0\./)).toBeVisible();
});

test("choice: selecting an option still requires a server-persisted self-rating", async ({ page }) => {
  await installLessonAPI(page, 1);
  await openLesson(page, "choice");

  await expect(page.getByRole("button", { name: "Сначала сохраните оценку", exact: true })).toBeDisabled();
  await page.locator(".lx-answer-grid").getByRole("button", { name: "абсолютный", exact: true }).click();
  await expect(page.getByText("Верный вариант.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Сначала сохраните оценку", exact: true })).toBeDisabled();

  await page.getByRole("button", { name: "Знал", exact: true }).click();
  await expect(page.getByRole("button", { name: "К результатам", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "К результатам", exact: true }).click();
  await expect(page.getByText(/Знал: 1\. Почти: 0\. Не знал: 0\. Пропущено: 0\./)).toBeVisible();
});
