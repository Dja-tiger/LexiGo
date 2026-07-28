import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const SESSION = {
  user: { id: "00000000-0000-0000-0000-000000000054", email: "catalog-performance@example.com", displayName: "Catalog Performance", createdAt: "2026-01-01T00:00:00Z" },
  tokens: { accessToken: "catalog-performance-token", tokenType: "Bearer", expiresIn: 900 },
};

const PROGRESS = {
  dueNow: 0, dueWords: 0, duePhrases: 0, totalWords: 0, totalPhrases: 1000,
  newWords: 0, learningWords: 0, reviewWords: 0, masteredWords: 0, masteredPhrases: 0,
  reviewsToday: 0, successfulToday: 0, reviewsTotal: 0, dailyGoal: 30,
  currentStreak: 0, longestStreak: 0, retainedItemsWeek: 0, retainedWordsWeek: 0, retainedPhrasesWeek: 0,
};

const PHRASES = Array.from({ length: 1000 }, (_, index) => {
  const number = String(index + 1).padStart(4, "0");
  return {
    id: index + 1,
    kind: "phrase",
    slug: `performance-phrase-${number}`,
    lemma: `performance phrase ${number}`,
    translation: `тестовая фраза ${number}`,
    phonetic: "",
    partOfSpeech: "phrase",
    topic: index % 2 === 0 ? "Performance" : "Reliability",
    examples: [`Use performance phrase ${number}.`],
    note: "",
    status: "new",
  };
});

function sortItems(items: typeof PHRASES, sort: string) {
  if (sort === "az") return [...items].sort((left, right) => left.lemma.localeCompare(right.lemma));
  if (sort === "za") return [...items].sort((left, right) => right.lemma.localeCompare(left.lemma));
  return items;
}

async function installAPI(context: BrowserContext, requestedLimits: number[]) {
  await context.addCookies([{ name: "lexigo_csrf", value: "catalog-csrf", url: "http://127.0.0.1:3000", sameSite: "Lax" }]);
  await context.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    if (path === "/api/v1/auth/refresh") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SESSION) });
    if (path === "/api/v1/catalog/metadata") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      catalogVersion: "sha256:catalog-performance", updatedAt: "2026-07-19T00:00:00Z",
      totals: { items: 1000, words: 0, phrases: 1000 },
      sources: { mixed: 1000, noun: 0, verb: 0, adjective: 0, phrases: 1000, dailyLife: 0, travel: 0, dataEngineering: 0, backend: 0, academicTechnicalEnglish: 0 },
      topics: [{ topic: "Performance", count: 500, words: 0, phrases: 500 }, { topic: "Reliability", count: 500, words: 0, phrases: 500 }],
    }) });
    if (path === "/api/v1/progress") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PROGRESS) });
    if (path === "/api/v1/lessons/active") return route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: { code: "active_lesson_not_found", message: "not found" } }) });
    if (path.startsWith("/api/v1/phrases/") && request.method() === "GET") {
      const slug = decodeURIComponent(path.slice("/api/v1/phrases/".length));
      const phrase = PHRASES.find((item) => item.slug === slug);
      return route.fulfill({
        status: phrase ? 200 : 404,
        contentType: "application/json",
        body: JSON.stringify(phrase ?? { error: { code: "phrase_not_found", message: "not found" } }),
      });
    }
    if (path === "/api/v1/words") {
      const limit = Number(url.searchParams.get("limit") ?? "30");
      requestedLimits.push(limit);
      const requestedPage = Number(url.searchParams.get("page") ?? "1");
      const topic = url.searchParams.get("topic") ?? "";
      const query = (url.searchParams.get("query") ?? "").toLowerCase();
      let items = topic ? PHRASES.filter((item) => item.topic === topic) : PHRASES;
      if (query) items = items.filter((item) => [item.lemma, item.translation, item.topic].some((value) => value.toLowerCase().includes(query)));
      items = sortItems(items, url.searchParams.get("sort") ?? "default");
      const total = items.length;
      const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
      const page = totalPages === 0 ? 1 : Math.min(requestedPage, totalPages);
      const pageItems = items.slice((page - 1) * limit, page * limit);
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        items: pageItems, count: pageItems.length, total, page, pageSize: limit, totalPages,
        hasPrevious: page > 1, hasNext: totalPages > 0 && page < totalPages,
      }) });
    }
    return route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: { code: "not_mocked", message: path } }) });
  });
}

function captureErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("404")) errors.push(message.text());
  });
  return errors;
}

test("low-end Android keeps catalog requests and DOM bounded while preserving page navigation", async ({ context, page }, testInfo) => {
  test.skip(testInfo.project.name !== "android-chromium", "Dedicated low-end Android profile");
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  const requestedLimits: number[] = [];
  await context.addInitScript(() => {
    const updateMaximum = () => {
      const current = document.querySelectorAll(".lx-phrase-grid [role=listitem]").length;
      const previous = Number(document.documentElement.dataset.lexigoMaxCatalogItems ?? "0");
      document.documentElement.dataset.lexigoMaxCatalogItems = String(Math.max(previous, current));
    };
    new MutationObserver(updateMaximum).observe(document, { childList: true, subtree: true });
  });
  await installAPI(context, requestedLimits);
  const errors = captureErrors(page);

  const startedAt = Date.now();
  await page.goto("/phrases");
  await expect(page.getByRole("heading", { name: "Находите готовые формулировки" })).toBeVisible();
  await expect(page.locator(".lx-phrase-grid [role=listitem]")).toHaveCount(48);
  expect(Date.now() - startedAt).toBeLessThan(8000);
  await expect(page.getByText("Показано 1–48 из 1 000").first()).toBeVisible();
  expect(requestedLimits.length).toBeGreaterThan(0);
  expect(requestedLimits.every((limit) => limit <= 48)).toBe(true);
  expect(await page.evaluate(() => Number(document.documentElement.dataset.lexigoMaxCatalogItems ?? "0"))).toBeLessThanOrEqual(48);

  await page.getByRole("button", { name: "Следующая →" }).first().click();
  await expect(page.getByText("Страница 2 из 21").first()).toBeVisible();
  await expect(page.locator(".lx-phrase-grid [role=listitem]")).toHaveCount(48);
  await expect(page.locator(".lx-phrase-grid [role=listitem]").first()).toHaveAttribute("aria-posinset", "49");
  await expect(page.locator(".lx-phrase-grid [role=listitem]").first()).toHaveAttribute("aria-setsize", "1000");

  const target = page
    .getByRole("list", { name: "Результаты каталога фраз" })
    .getByRole("link")
    .nth(40);
  await target.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const scrollBeforeDetail = await page.evaluate(() => window.scrollY);
  await target.click();
  await expect(page.locator(".lx-detail-card")).toBeVisible();
  await expect(page).toHaveURL(/\/phrases\/performance-phrase-/);
  await page.goBack();
  await expect(page.getByText("Страница 2 из 21").first()).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(Math.max(0, scrollBeforeDetail - 200));

  await page.getByRole("button", { name: "Урок по теме" }).click();
  await expect(page).toHaveURL(/\/learn\?source=phrases/);
  const configureLesson = page.getByRole("button", { name: "Настроить урок", exact: true });
  await expect(configureLesson).toBeVisible();
  await configureLesson.click();
  await expect(page.getByRole("radio", { name: /Технические фразы/ })).toHaveAttribute("aria-checked", "true");
  await expect(page.locator(".lx-phrase-grid [role=listitem]")).toHaveCount(0);
  expect(requestedLimits.every((limit) => limit <= 48)).toBe(true);
  expect(errors).toEqual([]);
});
