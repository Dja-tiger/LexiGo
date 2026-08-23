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
  let activeLesson: Record<string, unknown> | null = null;

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
        sources: { mixed: 6, noun: 1, verb: 1, adjective: 1, phrases: 3, dailyLife: 1, travel: 1, dataEngineering: 1, backend: 1, academicTechnicalEnglish: 0 },
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
      const input = request.postDataJSON() as { source?: string; studyMode?: string; sessionKind?: "study" | "review" | "remediation"; lessonSize?: string };
      const available = input.sessionKind === "review"
        ? PROGRESS.dueNow
        : input.sessionKind === "remediation"
          ? 0
          : PROGRESS.newWords;
      const total = input.sessionKind ? Math.min(15, available) : 2;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        source: input.source ?? "mixed",
        studyMode: input.studyMode ?? "study",
        ...(input.sessionKind ? { sessionKind: input.sessionKind } : {}),
        lessonSize: input.lessonSize ?? "30",
        composition: {
          total, words: total, phrases: 0,
          due: input.sessionKind === "review" ? total : 0,
          new: input.sessionKind === "review" || input.sessionKind === "remediation" ? 0 : total,
          scheduled: 0, availableWords: available, availablePhrases: 0,
        },
      }) });
    }
    if (path === "/api/v1/lessons/active") {
      if (activeLesson) {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(activeLesson) });
      } else {
        await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: { code: "not_found", message: "active lesson was not found" } }) });
      }
      return;
    }
    if (path === "/api/v1/lessons" && request.method() === "POST") {
      const input = request.postDataJSON() as { source: string; studyMode: string; sessionKind?: "study" | "review" | "remediation"; lessonSize: string; wordIds?: number[] };
      const selected = input.wordIds
        ? WORDS.filter((item) => input.wordIds?.includes(item.id))
        : [WORDS[0], PHRASES[0]];
      activeLesson = {
        id: "00000000-0000-0000-0000-000000000360",
        source: input.source,
        studyMode: input.studyMode,
        ...(input.sessionKind ? { sessionKind: input.sessionKind } : {}),
        lessonSize: input.lessonSize,
        currentIndex: 0,
        version: 1,
        status: "active",
        items: selected.map((item, position) => ({ ...item, position })),
        createdAt: "2026-07-17T00:00:00Z",
        updatedAt: "2026-07-17T00:00:00Z",
      };
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(activeLesson),
      });
      return;
    }

    if (path.endsWith("/review") && request.method() === "POST") {
      const input = request.postDataJSON() as { rating: "again" | "almost" | "known" };
      if (activeLesson) {
        activeLesson = {
          ...activeLesson,
          currentIndex: 1,
          version: 2,
          updatedAt: "2026-07-17T00:01:00Z",
        };
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          wordId: WORDS[0].id,
          requestedRating: input.rating,
          effectiveRating: input.rating,
          judgementSource: "study",
          judgementReason: "study_exposure",
          reviewEventId: 1,
          suggestionAvailable: false,
          lessonId: "00000000-0000-0000-0000-000000000360",
          lessonCurrentIndex: 1,
          lessonVersion: 2,
          lastReviewedAt: "2026-07-17T00:01:00Z",
          lessonCompleted: false,
          lessonReviewedItems: 1,
          lessonSkippedItems: 0,
          lessonTotalItems: 2,
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

async function revealLessonComposerControls(page: Page) {
  if ((page.viewportSize()?.width ?? 1000) >= 768) return;

  const configureLesson = page.getByRole("button", { name: "Настроить урок", exact: true });
  await expect(configureLesson).toBeVisible();
  await configureLesson.click();
  await expect(page.getByRole("button", { name: /Ручная настройка/ })).toBeVisible();
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

test("application shell, dictionary catalog and composer collections remain unique through React navigation", async ({ page }) => {
  const runtimeErrors = watchRuntimeErrors(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Продолжите с сохранённой позиции|готов(?:ы)? к повторению|доступ(?:ен|ны) для изучения|Добавьте новые слова|Соберите первый учебный блок|Настройте урок под текущую задачу/ })).toBeVisible();

  for (let cycle = 0; cycle < 3; cycle += 1) {
    await expect(page.locator(".lx-home-paths")).toBeHidden();
    await expect(visibleNavigation(page)).toHaveCount(1);
    await visibleNavigation(page).getByRole("link", { name: "Словарь", exact: true }).click();
    await expect(page).toHaveURL(/\/dictionary$/);
    await expect(page.getByRole("heading", { level: 1, name: "Словарь" })).toBeVisible();
    await expect(page.getByRole("list", { name: "Результаты словаря" }).getByRole("listitem")).toHaveCount(3);
    await expect(page.locator(".lx-dictionary-workspace")).toHaveCount(1);
    await expect(visibleNavigation(page)).toHaveCount(1);
    await visibleNavigation(page).getByRole("link", { name: "Главная", exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator(".lx-home-paths")).toBeHidden();
  }

  await visibleNavigation(page).getByRole("link", { name: /^(Обучение|Учить)$/ }).click();
  await expect(page).toHaveURL(/\/learn$/);
  await revealLessonComposerControls(page);
  await expect(page.locator("[data-lexigo-collection]")).toHaveCount(5);
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

test("focused lesson and speech stay declarative through repeated state transitions", async ({ page }) => {
  const runtimeErrors = watchRuntimeErrors(page);
  await page.goto("/learn");
  await expect(page.getByRole("heading", { name: "Соберите один сфокусированный урок" })).toBeVisible();
  await revealLessonComposerControls(page);

  await page.getByRole("radio", { name: /Простое изучение слов/ }).click();
  await page.getByRole("button", { name: "Начать урок" }).click();
  await expect(page).toHaveURL(/\/lesson\/active(?:\?|$)/);
  await expect(page.locator(".lx-active-lesson")).toHaveCount(1);

  const speech = page.locator('[data-speech-text="absolute"] > button');
  await expect(speech).toHaveAttribute("aria-label", "Произнести: absolute");
  for (let cycle = 0; cycle < 3; cycle += 1) {
    await speech.click();
    await expect(speech).toHaveClass(/speaking/);
    await expect(speech).toHaveAttribute("aria-label", "Остановить произношение: absolute");
    await speech.click();
    await expect(speech).not.toHaveClass(/speaking/);
  }

  const closeLesson = page.viewportSize()!.width < 768
    ? page.getByRole("button", { name: "Закрыть", exact: true })
    : page.getByRole("button", { name: "Закрыть урок" });
  for (let cycle = 0; cycle < 3; cycle += 1) {
    await closeLesson.click();
    const dialog = page.getByRole("dialog", { name: "Закрыть урок?" });
    await expect(dialog).toHaveCount(1);
    await dialog.getByRole("button", { name: "Продолжить урок", exact: true }).click();
    await expect(dialog).toHaveCount(0);
  }

  await page.getByRole("button", { name: "Знал", exact: true }).click();
  await page.getByRole("button", { name: "Дальше" }).click();
  await expect(page.locator(".lx-active-lesson")).toHaveCount(1);
  await expect(page.getByRole("progressbar", { name: "Прогресс урока" }))
    .toHaveAttribute("aria-valuetext", "2 из 2 элементов");
  await expect(page.getByRole("heading", { name: "Zulu cache" })).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});

test("dictionary counts come from catalog metadata without Progress or fallback DOM rewriting", async ({ page }) => {
  await page.goto("/dictionary");
  await expect(page.getByRole("heading", { level: 1, name: "Словарь" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Результаты словаря" }).getByRole("listitem")).toHaveCount(3);
  await expect(page.locator(".lx-dictionary-count")).toHaveText("3 слова");
  await expect(page.locator("body")).not.toContainText("799");
  await expect(page.locator("body")).not.toContainText("579");
});
