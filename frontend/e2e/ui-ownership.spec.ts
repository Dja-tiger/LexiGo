import { expect, test, type Page } from "@playwright/test";

const SESSION = {
  user: {
    id: "00000000-0000-0000-0000-000000000036",
    email: "ui-owner@example.com",
    displayName: "UI Owner",
    createdAt: "2026-01-01T00:00:00Z",
  },
  tokens: { accessToken: "ui-owner-access-token", tokenType: "Bearer", expiresIn: 900 },
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
  { id: 101, kind: "word", lemma: "absolute", translation: "абсолютный", phonetic: "/ˈæbsəluːt/", partOfSpeech: "adjective", topic: "General", examples: ["The value is absolute."], note: "Used for an unrestricted value.", status: "new" },
  { id: 102, kind: "word", lemma: "build", translation: "собирать", phonetic: "/bɪld/", partOfSpeech: "verb", topic: "Development", examples: ["Build the service."], note: "Compile or assemble a system.", status: "new" },
  { id: 103, kind: "word", lemma: "cache", translation: "кэш", phonetic: "/kæʃ/", partOfSpeech: "noun", topic: "Backend", examples: ["Clear the cache."], note: "Temporary fast storage.", status: "new" },
];

const PHRASES = [
  { id: 201, kind: "phrase", slug: "zulu-cache", lemma: "Zulu cache", translation: "кэш Zulu", phonetic: "", partOfSpeech: "phrase", topic: "Backend", examples: ["Zulu cache is warm."], note: "", status: "new" },
  { id: 202, kind: "phrase", slug: "alpha-pipeline", lemma: "alpha pipeline", translation: "альфа-пайплайн", phonetic: "", partOfSpeech: "phrase", topic: "Data Engineering", examples: ["The alpha pipeline is healthy."], note: "", status: "new" },
  { id: 203, kind: "phrase", slug: "build-release", lemma: "Build release", translation: "собрать релиз", phonetic: "", partOfSpeech: "phrase", topic: "Release", examples: ["Build release artifacts."], note: "", status: "new" },
];

async function installBrowserMocks(page: Page) {
  await page.addInitScript(() => {
    class MockSpeechSynthesisUtterance {
      text: string;
      voice: { lang: string } | null = null;
      lang = "";
      rate = 1;
      pitch = 1;
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: (() => void) | null = null;

      constructor(text: string) {
        this.text = text;
      }
    }

    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: MockSpeechSynthesisUtterance,
    });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        cancel() {},
        resume() {},
        getVoices() {
          return [{ lang: "en-US" }];
        },
        speak(utterance: MockSpeechSynthesisUtterance) {
          utterance.onstart?.();
          window.setTimeout(() => utterance.onend?.(), 1_200);
        },
      },
    });
  });

  await page.context().addCookies([{
    name: "lexigo_csrf",
    value: "ui-owner-csrf",
    url: "http://127.0.0.1:3000",
    sameSite: "Lax",
  }]);

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path === "/api/v1/catalog/metadata") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        catalogVersion: "sha256:e2e-catalog",
        updatedAt: "2026-07-18T00:00:00Z",
        totals: { items: 6, words: 3, phrases: 3 },
        sources: { mixed: 6, noun: 1, verb: 1, adjective: 1, phrases: 3, dailyLife: 1, travel: 1, dataEngineering: 1, backend: 1 , academicTechnicalEnglish: 0},
        topics: [{ topic: "Backend", count: 2 }],
      }) });
      return;
    }
    if (path === "/api/v1/auth/refresh") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SESSION) });
      return;
    }
    if (path === "/api/v1/progress") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PROGRESS) });
      return;
    }
    if ((path === "/api/v1/words" || path === "/api/v1/words/due") && url.searchParams.get("kind") === "phrase") {
      const sort = url.searchParams.get("sort") ?? "default";
      const items = [...PHRASES];
      if (sort === "az") items.sort((left, right) => left.lemma.localeCompare(right.lemma, "en"));
      if (sort === "za") items.sort((left, right) => right.lemma.localeCompare(left.lemma, "en"));
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        items,
        count: items.length,
        total: items.length,
        page: 1,
        pageSize: 48,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      }) });
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
    if (path === "/api/v1/lessons" && request.method() === "POST") {
      const input = request.postDataJSON() as { source: string; studyMode: string; lessonSize: string; wordIds?: number[] };
      const selected = input.wordIds
        ? WORDS.filter((item) => input.wordIds?.includes(item.id))
        : [WORDS[0], PHRASES[0]];
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: "00000000-0000-0000-0000-000000000360",
          source: input.source,
          studyMode: input.studyMode,
          lessonSize: input.lessonSize,
          currentIndex: 0,
          version: 1,
          status: "active",
          items: selected.map((item, position) => ({ ...item, position })),
          createdAt: "2026-07-17T00:00:00Z",
          updatedAt: "2026-07-17T00:00:00Z",
        }),
      });
      return;
    }

    await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: { code: "not_mocked", message: path } }) });
  });
}

function visibleNavigation(page: Page) {
  return page.locator(".lx-route-nav:visible");
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

async function phrasePrompts(page: Page) {
  return page
    .getByRole("list", { name: "Результаты каталога фраз" })
    .getByRole("link")
    .locator("strong")
    .allTextContents();
}

test.describe.configure({ timeout: 60_000 });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const install = () => {
      if (document.getElementById("lexigo-e2e-reduced-motion")) return;
      const style = document.createElement("style");
      style.id = "lexigo-e2e-reduced-motion";
      style.nonce = document.querySelector<HTMLElement>("[nonce]")?.nonce ?? "";
      style.textContent = "*, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }";
      (document.head ?? document.documentElement).append(style);
    };
    if (document.documentElement) install();
    else document.addEventListener("DOMContentLoaded", install, { once: true });
  });
  await installBrowserMocks(page);
});

test("home intent cards, dictionary catalog and composer collections remain unique through React navigation", async ({ page }) => {
  const runtimeErrors = watchRuntimeErrors(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Продолжите с сохранённой позиции|готов(?:ы)? к повторению|Добавьте новые слова|Соберите первый учебный блок|Настройте урок под текущую задачу/ })).toBeVisible();

  for (let cycle = 0; cycle < 3; cycle += 1) {
    await expect(page.locator(".lx-home-paths article")).toHaveCount(3);
    await visibleNavigation(page).getByRole("link", { name: "Словарь", exact: true }).click();
    await expect(page).toHaveURL(/\/dictionary$/);
    await expect(page.getByRole("heading", { name: "Находите и изучайте материал в контексте" })).toBeVisible();
    await expect(page.getByRole("list", { name: "Результаты словаря" }).getByRole("listitem")).toHaveCount(3);
    await expect(page.locator(".lx-dictionary-toolbar")).toHaveCount(1);
    await visibleNavigation(page).getByRole("link", { name: "Главная", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator(".lx-home-paths article")).toHaveCount(3);
  }

  await page.locator(".lx-home-paths").getByRole("button", { name: "Настроить урок" }).click();
  await expect(page).toHaveURL(/\/learn$/);
  await expect(page.locator('[data-lexigo-collection]')).toHaveCount(5);
  await page.locator('[data-lexigo-collection="travel"]').click();
  await expect(page.locator('[data-lexigo-collection="travel"]')).toHaveAttribute("aria-checked", "true");
  expect(runtimeErrors).toEqual([]);
});

test("phrase sorting is React state, persists across reload and creates one toolbar", async ({ page }) => {
  const runtimeErrors = watchRuntimeErrors(page);
  await page.goto("/phrases");
  await expect(page.getByRole("heading", { name: "Находите готовые формулировки" })).toBeVisible();
  await expect(page.locator('.lx-catalog-sort[data-lexigo-sort-for="phrases"]')).toHaveCount(1);

  const sorting = page.getByRole("combobox", { name: "Сортировка каталога" });
  await sorting.selectOption("az");
  await expect.poll(() => phrasePrompts(page)).toEqual(["alpha pipeline", "Build release", "Zulu cache"]);

  await visibleNavigation(page).getByRole("link", { name: "Главная", exact: true }).click();
  await visibleNavigation(page).getByRole("link", { name: "Словарь", exact: true }).click();
  await expect(page.locator('.lx-catalog-sort[data-lexigo-sort-for="phrases"]')).toHaveCount(1);
  await expect.poll(() => phrasePrompts(page)).toEqual(["alpha pipeline", "Build release", "Zulu cache"]);

  await page.reload();
  await expect(sorting).toHaveValue("az");
  await expect.poll(() => phrasePrompts(page)).toEqual(["alpha pipeline", "Build release", "Zulu cache"]);

  await sorting.selectOption("za");
  await expect.poll(() => phrasePrompts(page)).toEqual(["Zulu cache", "Build release", "alpha pipeline"]);
  expect(runtimeErrors).toEqual([]);
});

test("lesson tabs and speech stay declarative through repeated state transitions", async ({ page }) => {
  const runtimeErrors = watchRuntimeErrors(page);
  await page.goto("/learn");
  await expect(page.getByRole("heading", { name: "Соберите один сфокусированный урок" })).toBeVisible();

  await page.getByRole("radio", { name: /Простое изучение слов/ }).click();
  await page.getByRole("button", { name: "Начать урок" }).click();
  await expect(page).toHaveURL(/\/lesson\/active(?:\?|$)/);

  const tabs = page.locator(".lx-study-tabs").getByRole("tab");
  await expect(tabs).toHaveCount(3);
  await expect(page.locator(".lx-study-column")).toHaveAttribute("data-study-view", "card");

  const exampleTab = page.getByRole("tab", { name: "Пример", exact: true });
  await exampleTab.click();
  await expect(exampleTab).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(".lx-study-column")).toHaveAttribute("data-study-view", "example");

  await exampleTab.press("ArrowRight");
  const contextTab = page.getByRole("tab", { name: "Контекст", exact: true });
  await expect(contextTab).toBeFocused();
  await expect(contextTab).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(".lx-study-column")).toHaveAttribute("data-study-view", "context");

  for (let cycle = 0; cycle < 3; cycle += 1) {
    await page.getByRole("tab", { name: "Карточка", exact: true }).click();
    await exampleTab.click();
    await contextTab.click();
  }
  await expect(tabs).toHaveCount(3);

  await page.getByRole("tab", { name: "Карточка", exact: true }).click();
  const speech = page.locator('[data-speech-text="absolute"] > button');
  await expect(speech).toHaveAttribute("aria-label", "Произнести: absolute");
  await speech.click();
  await expect(speech).toHaveClass(/speaking/);
  await expect(speech).toHaveAttribute("aria-label", "Остановить произношение: absolute");
  await expect(page.locator('[data-speech-text="absolute"] [role="status"]')).toContainText("Воспроизводим: absolute");
  await expect(speech).not.toHaveClass(/speaking/, { timeout: 3_000 });
  await expect(speech).toHaveAttribute("aria-label", "Произнести: absolute");
  await expect(tabs).toHaveCount(3);
  expect(runtimeErrors).toEqual([]);
});

test("dictionary counts come from authenticated resources without fallback DOM rewriting", async ({ page }) => {
  await page.goto("/dictionary");
  await expect(page.getByRole("heading", { name: "Находите и изучайте материал в контексте" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Результаты словаря" }).getByRole("listitem")).toHaveCount(3);
  await expect(page.getByText("0 слов освоено", { exact: true })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("799");
  await expect(page.locator("body")).not.toContainText("579");
});
