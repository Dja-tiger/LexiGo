import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const SESSION = {
  user: {
    id: "00000000-0000-0000-0000-000000000037",
    email: "pwa-dictionary@example.com",
    displayName: "PWA Dictionary",
    createdAt: "2026-01-01T00:00:00Z",
  },
  tokens: { accessToken: "pwa-dictionary-access-token", tokenType: "Bearer", expiresIn: 900 },
};

const PROGRESS = {
  dueNow: 0,
  dueWords: 0,
  duePhrases: 0,
  totalWords: 799,
  totalPhrases: 3,
  newWords: 3,
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

const WORDS = [
  { id: 101, kind: "word", lemma: "absolute", translation: "абсолютный", phonetic: "/ˈæbsəluːt/", partOfSpeech: "adjective", topic: "General", examples: ["The value is absolute."], note: "", status: "new" },
  { id: 102, kind: "word", lemma: "build", translation: "собирать", phonetic: "/bɪld/", partOfSpeech: "verb", topic: "Development", examples: ["Build the service."], note: "", status: "new" },
  { id: 103, kind: "word", lemma: "cache", translation: "кэш", phonetic: "/kæʃ/", partOfSpeech: "noun", topic: "Backend", examples: ["Clear the cache."], note: "", status: "new" },
];

const PHRASES = [
  { id: 201, kind: "phrase", slug: "root-cause", lemma: "root cause", translation: "корневая причина", phonetic: "", partOfSpeech: "phrase", topic: "Incident", examples: ["We found the root cause."], note: "", status: "new" },
  { id: 202, kind: "phrase", slug: "data-pipeline", lemma: "data pipeline", translation: "пайплайн данных", phonetic: "", partOfSpeech: "phrase", topic: "Data Engineering", examples: ["The data pipeline is healthy."], note: "", status: "new" },
  { id: 203, kind: "phrase", slug: "deploy-service", lemma: "deploy the service", translation: "развернуть сервис", phonetic: "", partOfSpeech: "phrase", topic: "Release", examples: ["Deploy the service."], note: "", status: "new" },
];

const CATEGORIES = [
  { source: "mixed", label: "Все слова", view: "learn" },
  { source: "noun", label: "Существительные", view: "learn" },
  { source: "verb", label: "Глаголы", view: "learn" },
  { source: "adjective", label: "Прилагательные", view: "learn" },
  { source: "phrases", label: "Технические фразы", view: "phrases" },
  { source: "daily-life", label: "Бытовой английский", view: "learn" },
  { source: "travel", label: "Для путешествий", view: "learn" },
  { source: "data-engineering", label: "Data Engineer", view: "learn" },
  { source: "backend", label: "Backend Development", view: "learn" },
] as const;

async function emulateStandaloneMode(context: BrowserContext) {
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "standalone", {
      configurable: true,
      get: () => true,
    });

    const nativeMatchMedia = window.matchMedia.bind(window);
    window.matchMedia = (query: string) => {
      if (query !== "(display-mode: standalone)") return nativeMatchMedia(query);
      return {
        matches: true,
        media: query,
        onchange: null,
        addListener() {},
        removeListener() {},
        addEventListener() {},
        removeEventListener() {},
        dispatchEvent: () => true,
      } as MediaQueryList;
    };
  });
}

async function installAPI(context: BrowserContext) {
  await context.addCookies([{
    name: "lexigo_csrf",
    value: "pwa-dictionary-csrf",
    url: "http://127.0.0.1:3000",
    sameSite: "Lax",
  }]);

  await context.route("**/api/v1/**", async (route) => {
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
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: PHRASES, count: PHRASES.length }) });
      return;
    }
    if (path === "/api/v1/words" || path === "/api/v1/words/due") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: WORDS, count: WORDS.length }) });
      return;
    }
    if (path === "/api/v1/lessons/preview") {
      const input = request.postDataJSON() as { source?: string; studyMode?: string; lessonSize?: string };
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        source: input.source ?? "mixed", studyMode: input.studyMode ?? "study", lessonSize: input.lessonSize ?? "30",
        composition: { total: 2, words: 1, phrases: 1, due: 2, new: 0, scheduled: 0, availableWords: 1, availablePhrases: 1 },
      }) });
    }
    if (path === "/api/v1/lessons/active") {
      await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: { code: "not_found", message: "active lesson was not found" } }) });
      return;
    }

    await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: { code: "not_mocked", message: path } }) });
  });
}

function watchRuntimeErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    const expectedMissingActiveLesson = text.includes("Failed to load resource") && text.includes("404");
    if (!expectedMissingActiveLesson) errors.push(`console: ${text}`);
  });
  return errors;
}

async function expectLibrary(page: Page) {
  await expect(page).toHaveURL(/view=library/);
  await expect(page.getByRole("heading", { name: "Материалы, организованные по учебной задаче" })).toBeVisible();
  await expect(page.locator("[data-lexigo-dictionary-source]")).toHaveCount(9);
  await expect(page.locator(".lx-app")).toBeVisible();
  await expect(page.locator(".lx-view")).not.toBeEmpty();
}

async function expectCategory(page: Page, category: typeof CATEGORIES[number]) {
  if (category.view === "phrases") {
    await expect(page).toHaveURL(/view=phrases/);
    await expect(page.getByRole("heading", { name: "Готовые формулировки для работы" })).toBeVisible();
  } else {
    await expect(page).toHaveURL(new RegExp(`view=learn&source=${category.source}`));
    await expect(page.getByRole("heading", { name: "Настройте урок под текущую задачу" })).toBeVisible();
    await expect(page.locator(`[data-lexigo-source="${category.source}"]`)).toHaveAttribute("aria-pressed", "true");
  }
  await expect(page.locator(".lx-app")).toBeVisible();
  await expect(page.locator(".lx-view")).not.toBeEmpty();
  await expect(page.getByTestId("application-error-boundary")).toHaveCount(0);
}

test("iOS standalone dictionary opens every category, preserves history and restores the last source", async ({ context, page }, testInfo) => {
  test.skip(testInfo.project.name !== "ios-webkit", "Dedicated iOS PWA regression");

  await emulateStandaloneMode(context);
  await installAPI(context);
  let runtimeErrors = watchRuntimeErrors(page);

  await page.goto("/?view=library");
  await expectLibrary(page);

  for (const category of CATEGORIES) {
    await page.locator(`[data-lexigo-dictionary-source="${category.source}"]`).click();
    await expectCategory(page, category);

    await page.goBack();
    await expectLibrary(page);

    await page.goForward();
    await expectCategory(page, category);

    await page.goBack();
    await expectLibrary(page);
  }

  await page.locator('[data-lexigo-dictionary-source="travel"]').click();
  await expectCategory(page, CATEGORIES.find((category) => category.source === "travel")!);
  expect(runtimeErrors).toEqual([]);

  await page.close();
  const relaunchedPage = await context.newPage();
  runtimeErrors = watchRuntimeErrors(relaunchedPage);
  await relaunchedPage.goto("/");

  await expectCategory(relaunchedPage, CATEGORIES.find((category) => category.source === "travel")!);
  expect(runtimeErrors).toEqual([]);
});
