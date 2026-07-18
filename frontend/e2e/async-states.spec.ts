import { expect, test, type Page, type Route } from "@playwright/test";

const SESSION = {
  user: {
    id: "00000000-0000-0000-0000-000000000044",
    email: "async@example.com",
    displayName: "Async User",
    createdAt: "2026-01-01T00:00:00Z",
  },
  tokens: {
    accessToken: "async-access-token",
    tokenType: "Bearer",
    expiresIn: 900,
  },
};

const PROGRESS = {
  dueNow: 4,
  dueWords: 3,
  duePhrases: 1,
  totalWords: 100,
  totalPhrases: 20,
  newWords: 80,
  learningWords: 10,
  reviewWords: 10,
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

const METADATA = {
  catalogVersion: "sha256:async-state-e2e",
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
    backend: 10,
  },
  topics: [],
};

const PHRASES = [{
  id: 4401,
  kind: "phrase",
  slug: "async-state",
  lemma: "Recover locally",
  translation: "восстановиться локально",
  phonetic: "",
  partOfSpeech: "phrase",
  topic: "Reliability",
  examples: ["The failed panel can recover locally."],
  note: "Keep successful panels interactive.",
  status: "new",
}];

type PhraseMode = "success" | "empty" | "server" | "offline" | "slow" | "timeout";

async function fulfillJSON(route: Route, status: number, body: unknown, headers: Record<string, string> = {}) {
  await route.fulfill({
    status,
    contentType: "application/json",
    headers,
    body: JSON.stringify(body),
  });
}

async function installMocks(page: Page, phraseMode: PhraseMode, options: { refreshExpires?: boolean } = {}) {
  let refreshCount = 0;
  let phraseCount = 0;

  await page.context().addCookies([{
    name: "lexigo_csrf",
    value: "async-state-csrf",
    url: "http://127.0.0.1:3000",
    sameSite: "Lax",
  }]);

  if (phraseMode === "offline") {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
    });
  }

  await page.route("**/api/v1/**", async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;

    if (path === "/api/v1/auth/refresh") {
      refreshCount += 1;
      if (options.refreshExpires && refreshCount > 1) {
        await fulfillJSON(route, 401, { error: { code: "session_expired", message: "expired" } });
      } else {
        await fulfillJSON(route, 200, SESSION);
      }
      return;
    }
    if (path === "/api/v1/catalog/metadata") {
      await fulfillJSON(route, 200, METADATA);
      return;
    }
    if (path === "/api/v1/progress") {
      if (options.refreshExpires) {
        await fulfillJSON(route, 401, { error: { code: "access_expired", message: "expired" } });
      } else {
        await fulfillJSON(route, 200, PROGRESS);
      }
      return;
    }
    if (path === "/api/v1/lessons/active") {
      await fulfillJSON(route, 404, { error: { code: "not_found", message: "not found" } });
      return;
    }
    if (path === "/api/v1/words" && url.searchParams.get("kind") === "phrase") {
      phraseCount += 1;
      if (phraseMode === "server" && phraseCount === 1) {
        await fulfillJSON(route, 500, { error: { code: "phrase_failure", message: "database stack trace" } }, { "x-request-id": "req-phrase-500" });
        return;
      }
      if (phraseMode === "offline" && phraseCount === 1) {
        await route.abort("internetdisconnected");
        return;
      }
      if (phraseMode === "slow" && phraseCount === 1) {
        await new Promise((resolve) => setTimeout(resolve, 900));
      }
      if (phraseMode === "timeout" && phraseCount === 1) {
        await new Promise((resolve) => setTimeout(resolve, 13_000));
      }
      const items = phraseMode === "empty" ? [] : PHRASES;
      await fulfillJSON(route, 200, { items, count: items.length });
      return;
    }

    await fulfillJSON(route, 404, { error: { code: "not_mocked", message: path } });
  });

  return { phraseCount: () => phraseCount };
}

test("slow catalog shows a local skeleton before content", async ({ page }) => {
  await installMocks(page, "slow");
  await page.goto("/?view=phrases", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("status", { name: "Загружаем каталог фраз" })).toBeVisible();
  await expect(page.getByText("Recover locally", { exact: true })).toBeVisible();
});

test("server failure keeps progress visible, exposes correlation id and retries locally", async ({ page }) => {
  const requests = await installMocks(page, "server");
  await page.goto("/");

  const dueCard = page.locator(".lx-progress-stats button").filter({ hasText: "К повторению" });
  await expect(dueCard.locator("strong")).toHaveText("4");

  const notice = page.getByRole("alert", { name: "Каталог фраз: ошибка загрузки" });
  await expect(notice).toContainText("Сервис временно недоступен");
  await expect(notice).toContainText("req-phrase-500");
  await expect(notice).not.toContainText("database stack trace");
  await expect(notice).toBeFocused();

  await notice.getByRole("button", { name: "Повторить" }).click();
  await expect(notice).toBeHidden();
  expect(requests.phraseCount()).toBe(2);
  await expect(dueCard.locator("strong")).toHaveText("4");
});

test("offline and expired-session states are distinct", async ({ page }) => {
  await installMocks(page, "offline");
  await page.goto("/");
  await expect(page.getByRole("alert", { name: "Каталог фраз: ошибка загрузки" })).toContainText("Нет подключения к сети");

  const second = await page.context().newPage();
  await installMocks(second, "success", { refreshExpires: true });
  await second.goto("/");
  await expect(second).toHaveURL(/view=profile&session=expired/);
  await expect(second.getByRole("alert").filter({ hasText: "Сессия истекла" })).toContainText("Войдите снова, чтобы загрузить сессию аккаунта");
});

test("empty phrase response provides a next action", async ({ page }) => {
  await installMocks(page, "empty");
  await page.goto("/?view=phrases");
  const empty = page.getByRole("status", { name: "Каталог фраз пуст" });
  await expect(empty).toContainText("В этой теме пока нет фраз");
  await expect(empty.getByRole("button", { name: "Показать все темы" })).toBeVisible();
});

test("404 active lesson is an empty state rather than an error", async ({ page }) => {
  await installMocks(page, "success");
  await page.goto("/?view=lesson");
  await expect(page.getByRole("status", { name: "Активный урок отсутствует" })).toContainText("Активного урока нет");
  await expect(page.getByRole("alert", { name: "Незавершённый урок: ошибка загрузки" })).toHaveCount(0);
});

test("request timeout has a dedicated recoverable state", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "One real timeout contract is sufficient; other browser profiles cover the same component.");
  test.setTimeout(30_000);
  await installMocks(page, "timeout");
  await page.goto("/");
  const notice = page.getByRole("alert", { name: "Каталог фраз: ошибка загрузки" });
  await expect(notice).toContainText("Сервер отвечает слишком долго", { timeout: 20_000 });
  await expect(notice.getByRole("button", { name: "Повторить" })).toBeVisible();
});
