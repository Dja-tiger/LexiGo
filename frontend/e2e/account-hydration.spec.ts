import { expect, test, type Page } from "@playwright/test";

const SESSION = {
  user: {
    id: "00000000-0000-0000-0000-000000000042",
    email: "hydration@example.com",
    displayName: "Hydration User",
    createdAt: "2026-01-01T00:00:00Z",
  },
  tokens: {
    accessToken: "hydration-access-token",
    tokenType: "Bearer",
    expiresIn: 900,
  },
};

const PROGRESS = {
  dueNow: 7,
  dueWords: 4,
  duePhrases: 3,
  totalWords: 100,
  totalPhrases: 20,
  newWords: 40,
  learningWords: 20,
  reviewWords: 10,
  masteredWords: 30,
  masteredPhrases: 8,
  reviewsToday: 12,
  successfulToday: 10,
  reviewsTotal: 240,
  dailyGoal: 30,
  currentStreak: 6,
  longestStreak: 14,
  retainedItemsWeek: 9,
  retainedWordsWeek: 6,
  retainedPhrasesWeek: 3,
};

const PHRASES = [{
  id: 4201,
  kind: "phrase",
  slug: "independent-retry",
  lemma: "Independent retry",
  translation: "независимый повтор запроса",
  phonetic: "",
  partOfSpeech: "phrase",
  topic: "Reliability",
  examples: ["Retry only the failed resource."],
  note: "A successful resource must remain visible.",
  status: "new",
}];

const METADATA = {
  catalogVersion: "sha256:hydration-e2e",
  updatedAt: "2026-07-18T00:00:00Z",
  totals: { items: 120, words: 100, phrases: 20 },
  sources: {
    mixed: 120,
    noun: 30,
    verb: 30,
    adjective: 40,
    phrases: 20,
    dailyLife: 10,
    travel: 10,
    dataEngineering: 10,
    backend: 10, academicTechnicalEnglish: 0,
  },
  topics: [{ topic: "Reliability", count: 1 }],
};

function visibleNavigation(page: Page) {
  return page.locator(".lx-route-nav:visible");
}

async function installAccountMocks(page: Page, options: { failPhrasesOnce?: boolean } = {}) {
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
  let progressRequests = 0;
  let phraseRequests = 0;
  let activeLessonRequests = 0;

  await page.context().addCookies([{
    name: "lexigo_csrf",
    value: "hydration-csrf",
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
    if (path === "/api/v1/catalog/metadata") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(METADATA) });
      return;
    }
    if (path === "/api/v1/progress") {
      progressRequests += 1;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PROGRESS) });
      return;
    }
    if (path === "/api/v1/words" && url.searchParams.get("kind") === "phrase") {
      phraseRequests += 1;
      if (options.failPhrasesOnce && phraseRequests === 1) {
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ error: { code: "phrases_unavailable", message: "temporary phrase failure" } }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: PHRASES, count: PHRASES.length }),
      });
      return;
    }
    if (path === "/api/v1/lessons/preview") {
      const input = request.postDataJSON() as {
        source?: string;
        studyMode?: string;
        sessionKind?: "study" | "review" | "remediation";
        lessonSize?: string;
      };
      const available = input.sessionKind === "review"
        ? PROGRESS.dueNow
        : input.sessionKind === "remediation"
          ? 0
          : PROGRESS.newWords;
      const total = input.sessionKind ? Math.min(15, available) : Math.min(15, PROGRESS.newWords);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          source: input.source ?? "mixed",
          studyMode: input.studyMode ?? "study",
          ...(input.sessionKind ? { sessionKind: input.sessionKind } : {}),
          lessonSize: input.lessonSize ?? "30",
          composition: {
            total,
            words: total,
            phrases: 0,
            due: input.sessionKind === "review" ? total : 0,
            new: input.sessionKind === "review" || input.sessionKind === "remediation" ? 0 : total,
            scheduled: 0,
            availableWords: available,
            availablePhrases: 0,
          },
        }),
      });
      return;
    }
    if (path === "/api/v1/lessons/active") {
      activeLessonRequests += 1;
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ error: { code: "not_found", message: "active lesson was not found" } }),
      });
      return;
    }

    await route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({ error: { code: "not_mocked", message: path } }),
    });
  });

  return {
    progressRequests: () => progressRequests,
    phraseRequests: () => phraseRequests,
    activeLessonRequests: () => activeLessonRequests,
  };
}

test("an on-demand phrase catalog failure preserves progress and retries only its own resource", async ({ page }) => {
  test.setTimeout(60_000);
  const requests = await installAccountMocks(page, { failPhrasesOnce: true });

  await page.goto("/");

  const dueCard = page.locator(".lx-progress-list div").filter({ hasText: "К повторению" });
  await expect(dueCard.locator("strong")).toHaveText("7");

  await visibleNavigation(page).getByRole("link", { name: "Словарь", exact: true }).click();
  await page.getByRole("navigation", { name: "Быстрые фильтры словаря" }).getByRole("button", { name: "Фразы", exact: true }).click();
  await expect(page).toHaveURL(/\/phrases$/);
  await expect(page.getByRole("heading", { name: "Находите готовые формулировки" })).toBeVisible();

  const phraseNotice = page.getByRole("alert", { name: "Каталог фраз: ошибка загрузки" });
  await expect(phraseNotice).toContainText("Сервис временно недоступен");

  // Phrases owns its own progress evidence, so entering this route may add a
  // progress read. Capture the stable route baseline and prove that retrying
  // only the failed phrase catalog resource does not rehydrate unrelated
  // progress or Home active-session state.
  const progressBeforeRetry = requests.progressRequests();
  const activeLessonBeforeRetry = requests.activeLessonRequests();
  expect(progressBeforeRetry).toBeGreaterThanOrEqual(1);
  expect(activeLessonBeforeRetry).toBe(1);

  await phraseNotice.getByRole("button", { name: "Повторить" }).click();
  await expect(phraseNotice).toBeHidden();
  await expect(page.locator(".lx-phrase-grid").getByText("Independent retry", { exact: true })).toBeVisible();

  expect(requests.progressRequests()).toBe(progressBeforeRetry);
  expect(requests.phraseRequests()).toBe(2);
  expect(requests.activeLessonRequests()).toBe(activeLessonBeforeRetry);

  await visibleNavigation(page).getByRole("link", { name: "Главная", exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(dueCard.locator("strong")).toHaveText("7");

  // Returning to Home reuses the account-owned progress evidence while the
  // Home route remounts its active-session owner. The Phrases catalog itself
  // remains untouched.
  expect(requests.progressRequests()).toBe(progressBeforeRetry);
  expect(requests.phraseRequests()).toBe(2);
  expect(requests.activeLessonRequests()).toBe(activeLessonBeforeRetry + 1);
});

test("standalone startup migrates away from corrupted navigation without clearing unrelated state", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "standalone", { configurable: true, value: true });
    window.localStorage.setItem("lexigo.navigation.v2", JSON.stringify({
      version: 999,
      target: { view: "lesson", source: "unknown" },
    }));
    window.localStorage.setItem("lexigo.unrelated", "keep");
  });
  await installAccountMocks(page);

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Продолжите с сохранённой позиции|готов(?:ы)? к повторению|Добавьте новые слова|Соберите первый учебный блок|Настройте урок под текущую задачу/ })).toBeVisible();

  const persisted = await page.evaluate(() => ({
    navigation: JSON.parse(window.localStorage.getItem("lexigo.navigation.v2") ?? "null") as unknown,
    unrelated: window.localStorage.getItem("lexigo.unrelated"),
  }));
  expect(persisted.navigation).toEqual({ version: 2, target: { view: "home" } });
  expect(persisted.unrelated).toBe("keep");
});
