import { expect, test, type BrowserContext, type Page, type Route } from "@playwright/test";

const SESSION = {
  user: {
    id: "00000000-0000-0000-0000-000000000056",
    email: "routes@example.com",
    displayName: "Route Contract User",
    createdAt: "2026-01-01T00:00:00Z",
  },
  tokens: {
    accessToken: "route-contract-access-token",
    tokenType: "Bearer",
    expiresIn: 900,
  },
};

const WORD = {
  id: 101,
  kind: "word",
  lemma: "route",
  translation: "маршрут",
  aliases: ["path"],
  phonetic: "/ruːt/",
  partOfSpeech: "noun",
  topic: "Frontend Architecture",
  examples: ["Open the route in a new tab."],
  note: "A canonical application location.",
  status: "new",
};

const PHRASE = {
  id: 201,
  kind: "phrase",
  slug: "route-contract",
  lemma: "Keep the route stable",
  translation: "сохранять маршрут стабильным",
  phonetic: "",
  partOfSpeech: "phrase",
  topic: "Frontend Architecture",
  examples: ["Keep the route stable across reloads."],
  note: "Back and Forward must restore the screen.",
  status: "new",
};

const PROGRESS = {
  dueNow: 1,
  dueWords: 1,
  duePhrases: 0,
  totalWords: 1,
  totalPhrases: 1,
  newWords: 1,
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

const METADATA = {
  catalogVersion: "sha256:app-router-e2e",
  updatedAt: "2026-07-19T00:00:00Z",
  totals: { items: 2, words: 1, phrases: 1 },
  sources: {
    mixed: 2,
    noun: 1,
    verb: 0,
    adjective: 0,
    phrases: 1,
    dailyLife: 0,
    travel: 0,
    dataEngineering: 0,
    backend: 1,
  },
  topics: [{ topic: "Frontend Architecture", count: 2, words: 1, phrases: 1 }],
};

async function json(route: Route, status: number, body: unknown) {
  await route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
}

async function installAuthenticatedAPI(context: BrowserContext) {
  await context.addCookies([{
    name: "lexigo_csrf",
    value: "route-contract-csrf",
    url: "http://127.0.0.1:3000",
    sameSite: "Lax",
  }]);

  await context.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path === "/api/v1/auth/refresh") return json(route, 200, SESSION);
    if (path === "/api/v1/catalog/metadata") return json(route, 200, METADATA);
    if (path === "/api/v1/progress") return json(route, 200, PROGRESS);
    if (path === "/api/v1/lessons/active") {
      return json(route, 404, { error: { code: "active_lesson_not_found", message: "not found" } });
    }
    if (path === "/api/v1/lessons/preview") {
      const input = request.postDataJSON() as { source?: string; studyMode?: string; lessonSize?: string };
      return json(route, 200, {
        source: input.source ?? "mixed",
        studyMode: input.studyMode ?? "study",
        lessonSize: input.lessonSize ?? "30",
        composition: {
          total: 1,
          words: 1,
          phrases: 0,
          due: 1,
          new: 0,
          scheduled: 0,
          availableWords: 1,
          availablePhrases: 1,
        },
      });
    }
    if (path === "/api/v1/words/101") return json(route, 200, WORD);
    if (path === "/api/v1/words" || path === "/api/v1/words/due") {
      const phraseRequest = url.searchParams.get("kind") === "phrase";
      const items = phraseRequest ? [PHRASE] : [WORD];
      return json(route, 200, {
        items,
        count: items.length,
        total: items.length,
        page: 1,
        pageSize: 48,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      });
    }

    return json(route, 404, { error: { code: "not_mocked", message: path } });
  });
}

function runtimeErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (text.includes("Failed to load resource") && text.includes("404")) return;
    errors.push(`console: ${text}`);
  });
  return errors;
}

function visibleRouteLink(page: Page, view: "home" | "learn" | "phrases" | "library" | "progress") {
  return page.locator(`.lx-route-nav:visible [data-navigation-view="${view}"]`);
}

test.describe.configure({ timeout: 60_000 });

test.beforeEach(async ({ context }) => {
  await installAuthenticatedAPI(context);
});

test("direct primary routes render, remain canonical and expose the active semantic link", async ({ page }) => {
  const errors = runtimeErrors(page);
  const routes = [
    { path: "/", view: "home", heading: /Продолжайте учиться/ },
    { path: "/learn", view: "learn", heading: "Настройте урок под текущую задачу" },
    { path: "/phrases", view: "phrases", heading: "Готовые формулировки для работы" },
    { path: "/dictionary", view: "library", heading: "Каталог слов и терминов" },
    { path: "/progress", view: "progress", heading: "Смотрите, что действительно сохранилось" },
  ] as const;

  for (const entry of routes) {
    await page.goto(entry.path);
    await expect(page).toHaveURL((url) => url.pathname === entry.path && url.search === "");
    await expect(page.getByRole("heading", { name: entry.heading })).toBeVisible();
    const link = visibleRouteLink(page, entry.view);
    await expect(link).toHaveAttribute("aria-current", "page");
    await expect(link).toHaveAttribute("href", entry.path);
  }

  await page.goto("/profile");
  await expect(page).toHaveURL(/\/profile$/);
  await expect(page.getByRole("heading", { name: "Route Contract User" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("legacy query URLs redirect once to canonical paths without losing filters", async ({ page }) => {
  await page.goto("/?view=library&source=backend&topic=Frontend%20Architecture&status=new");
  await expect(page).toHaveURL(/\/dictionary\?source=backend&topic=Frontend\+Architecture&status=new$/);
  await expect(page.getByRole("heading", { name: "Каталог слов и терминов" })).toBeVisible();
});

test("semantic route links support a real new tab and browser Back/Forward", async ({ context, page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Native middle-click tab creation is deterministic in Chromium.");
  await page.goto("/");

  const learn = visibleRouteLink(page, "learn");
  await expect(learn).toHaveAttribute("href", "/learn");
  const tabPromise = context.waitForEvent("page");
  await learn.click({ button: "middle" });
  const tab = await tabPromise;
  await tab.waitForLoadState("domcontentloaded");
  await expect(tab).toHaveURL(/\/learn$/);
  await expect(tab.getByRole("heading", { name: "Настройте урок под текущую задачу" })).toBeVisible();
  await tab.close();

  await learn.click();
  await expect(page).toHaveURL(/\/learn$/);
  await visibleRouteLink(page, "phrases").click();
  await expect(page).toHaveURL(/\/phrases$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/learn$/);
  await expect(page.getByRole("heading", { name: "Настройте урок под текущую задачу" })).toBeVisible();
  await page.goForward();
  await expect(page).toHaveURL(/\/phrases$/);
  await expect(page.getByRole("heading", { name: "Готовые формулировки для работы" })).toBeVisible();
});

test("word and phrase deep links survive reload and remain shareable", async ({ page }) => {
  await page.goto("/words/101?source=backend");
  await expect(page).toHaveURL(/\/words\/101\?source=backend$/);
  await expect(page.getByRole("heading", { name: "route" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "route" })).toBeVisible();

  await page.goto("/phrases/phrase-root-cause");
  await expect(page).toHaveURL(/\/phrases\/phrase-root-cause$/);
  await expect(page.getByRole("heading", { name: "We need to identify the root cause." })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "We need to identify the root cause." })).toBeVisible();
});

test("a guest lesson deep link is protected and preserves its return target", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.route("**/api/v1/catalog/metadata", (route) => json(route, 200, METADATA));

  await page.goto("/lesson/active?source=mixed");
  await expect(page).toHaveURL(/\/profile\?session=required&return_to=%2Flesson%2Factive%3Fsource%3Dmixed$/);
  await expect(page.getByRole("heading", { name: "Сохраняйте прогресс на всех устройствах" })).toBeVisible();
  await context.close();
});

test("arbitrary lesson identifiers and unknown routes use the not-found boundary", async ({ page }) => {
  await page.goto("/lesson/another-users-session");
  await expect(page.getByRole("heading", { name: "Такого раздела нет" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Открыть главную" })).toHaveAttribute("href", "/");

  await page.goto("/route-that-does-not-exist");
  await expect(page.getByRole("heading", { name: "Такого раздела нет" })).toBeVisible();
});
