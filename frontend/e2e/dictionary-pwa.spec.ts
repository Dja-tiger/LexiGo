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
  dueNow: 12,
  dueWords: 12,
  duePhrases: 0,
  totalWords: 60,
  totalPhrases: 0,
  newWords: 36,
  learningWords: 8,
  reviewWords: 12,
  masteredWords: 4,
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

const WORDS = Array.from({ length: 60 }, (_, index) => {
  const id = 101 + index;
  const number = String(index + 1).padStart(2, "0");
  const status = index < 36 ? "new" : index < 44 ? "learning" : index < 56 ? "review" : "mastered";
  return {
    id,
    kind: "word",
    lemma: index === 0 ? "cache" : `backend term ${number}`,
    translation: index === 0 ? "кэш" : `бэкенд-термин ${number}`,
    aliases: index === 0 ? ["temporary storage", "fast storage"] : [`alias ${number}`],
    phonetic: index === 0 ? "/kæʃ/" : "",
    partOfSpeech: index === 0 ? "noun" : "term",
    topic: "Backend Development",
    examples: index === 0 ? ["Clear the cache before deployment."] : [`Use backend term ${number} in the incident update.`],
    note: index === 0 ? "Temporary fast storage used by the service." : "Technical catalog entry.",
    status,
  };
});

const METADATA = {
  catalogVersion: "sha256:dictionary-catalog-e2e",
  updatedAt: "2026-07-19T00:00:00Z",
  totals: { items: 60, words: 60, phrases: 0 },
  sources: { mixed: 60, noun: 1, verb: 0, adjective: 0, phrases: 0, dailyLife: 0, travel: 0, dataEngineering: 0, backend: 60, academicTechnicalEnglish: 0 },
  topics: [{ topic: "Backend Development", count: 60, words: 60, phrases: 0 }],
};

async function emulateStandaloneMode(context: BrowserContext) {
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "standalone", { configurable: true, get: () => true });
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
  const catalogRequests: string[] = [];
  const lessonRequests: Array<Record<string, unknown>> = [];
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

    if (path === "/api/v1/catalog/metadata") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(METADATA) });
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
    if (path === "/api/v1/lessons/active") {
      await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: { code: "not_found", message: "active lesson was not found" } }) });
      return;
    }
    if (path === "/api/v1/words" && request.method() === "GET") {
      catalogRequests.push(url.search);
      const query = url.searchParams.get("query")?.toLowerCase() ?? "";
      const status = url.searchParams.get("status") ?? "";
      const page = Number(url.searchParams.get("page") ?? "1");
      const limit = Number(url.searchParams.get("limit") ?? "48");
      let filtered = WORDS.filter((item) => !status || item.status === status);
      if (query) {
        filtered = filtered.filter((item) => [item.lemma, item.translation, item.topic, ...item.aliases]
          .some((value) => value.toLowerCase().includes(query)));
      }
      const offset = (page - 1) * limit;
      const items = filtered.slice(offset, offset + limit);
      const totalPages = filtered.length === 0 ? 0 : Math.ceil(filtered.length / limit);
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        items,
        count: items.length,
        total: filtered.length,
        page,
        pageSize: limit,
        totalPages,
        hasPrevious: page > 1,
        hasNext: page < totalPages,
      }) });
      return;
    }
    if (/^\/api\/v1\/words\/\d+$/.test(path) && request.method() === "GET") {
      const id = Number(path.split("/").at(-1));
      const item = WORDS.find((candidate) => candidate.id === id);
      await route.fulfill({ status: item ? 200 : 404, contentType: "application/json", body: JSON.stringify(item ?? { error: { code: "not_found", message: "missing" } }) });
      return;
    }
    if (path === "/api/v1/lessons/preview") {
      const input = request.postDataJSON() as Record<string, unknown>;
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        source: input.source ?? "mixed",
        studyMode: input.studyMode ?? "study",
        lessonSize: input.lessonSize ?? "15",
        composition: { total: 15, words: 15, phrases: 0, due: 0, new: 15, scheduled: 0, availableWords: 48, availablePhrases: 0 },
      }) });
      return;
    }
    if (path === "/api/v1/lessons" && request.method() === "POST") {
      const input = request.postDataJSON() as { source: string; studyMode: string; lessonSize: string; wordIds?: number[] };
      lessonRequests.push(input);
      const selected = WORDS.filter((item) => input.wordIds?.includes(item.id)).slice(0, 15);
      await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({
        id: "00000000-0000-0000-0000-000000000055",
        source: input.source,
        studyMode: input.studyMode,
        lessonSize: input.lessonSize,
        currentIndex: 0,
        version: 1,
        status: "active",
        items: selected.map((item, position) => ({ ...item, position })),
        createdAt: "2026-07-19T00:00:00Z",
        updatedAt: "2026-07-19T00:00:00Z",
      }) });
      return;
    }

    await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: { code: "not_mocked", message: path } }) });
  });

  return { catalogRequests, lessonRequests };
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

async function expectDictionary(page: Page) {
  await expect(page).toHaveURL(/\/dictionary(?:\?|$)/);
  await expect(page.getByRole("heading", { name: "Находите и изучайте материал в контексте" })).toBeVisible();
  await expect(page.getByRole("list", { name: "Результаты словаря" })).toBeVisible();
  await expect(page.getByRole("listitem")).toHaveCount(48);
  await expect(page.locator(".lx-app")).toBeVisible();
  await expect(page.getByTestId("application-error-boundary")).toHaveCount(0);
}

test("dictionary filters, alias search, deep link and composer delegation are URL-driven", async ({ context, page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Dedicated desktop catalog contract");
  const api = await installAPI(context);
  const runtimeErrors = watchRuntimeErrors(page);

  await page.goto("/dictionary");
  await expectDictionary(page);
  await expect(page.getByText("Показано 1–48 из 60", { exact: true }).first()).toBeVisible();

  await page.getByRole("combobox", { name: "Раздел словаря" }).selectOption("backend");
  await page.getByRole("combobox", { name: "Тема словаря" }).selectOption("Backend Development");
  await page.getByRole("combobox", { name: "Статус изучения" }).selectOption("new");
  await expect(page).toHaveURL(/source=backend/);
  await expect(page).toHaveURL(/topic=Backend\+Development/);
  await expect(page).toHaveURL(/status=new/);

  const search = page.getByRole("searchbox", { name: "Поиск по словарю" });
  await search.fill("temporary storage");
  await search.press("Enter");
  await expect(page).toHaveURL(/query=temporary\+storage/);
  await expect(page.getByRole("listitem")).toHaveCount(1);
  await expect(page.getByText("cache", { exact: true })).toBeVisible();
  expect(api.catalogRequests.some((query) => query.includes("status=new") && query.includes("query=temporary+storage"))).toBe(true);

  await page.getByRole("button", { name: "Открыть карточку: cache" }).click();
  await expect(page).toHaveURL(/\/words\/101(?:\?|$)/);
  await expect(page.getByRole("heading", { name: "cache" })).toBeVisible();
  await expect(page.getByText("Temporary fast storage used by the service.")).toBeVisible();
  await expect(page.getByText("temporary storage, fast storage")).toBeVisible();

  await page.reload();
  await expect(page.getByRole("heading", { name: "cache" })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/dictionary\?/);
  await expect(page).toHaveURL(/query=temporary\+storage/);
  await expect(page.getByRole("listitem")).toHaveCount(1);

  await page.getByRole("button", { name: "Сбросить все фильтры" }).click();
  await expectDictionary(page);
  await page.getByRole("button", { name: "Настроить урок по текущей выборке" }).click();
  await expect(page).toHaveURL(/\/learn(?:\?|$)/);
  await expect(page.getByRole("heading", { name: "Соберите один сфокусированный урок" })).toBeVisible();
  await expect(page.getByRole("radio", { name: /Смешанная практика/ })).toHaveAttribute("aria-checked", "true");
  expect(api.lessonRequests).toHaveLength(0);
  expect(runtimeErrors).toEqual([]);
});

test("iOS standalone dictionary restores filters and result scroll across relaunch", async ({ context, page }, testInfo) => {
  test.skip(testInfo.project.name !== "ios-webkit", "Dedicated iOS PWA regression");
  await emulateStandaloneMode(context);
  await installAPI(context);
  let runtimeErrors = watchRuntimeErrors(page);

  await page.goto("/dictionary?source=backend&status=review");
  await expect(page.getByRole("heading", { name: "Находите и изучайте материал в контексте" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Раздел словаря" })).toHaveValue("backend");
  await expect(page.getByRole("combobox", { name: "Статус изучения" })).toHaveValue("review");
  await expect(page.getByRole("listitem")).toHaveCount(12);

  await page.getByRole("button", { name: /Открыть карточку:/ }).first().scrollIntoViewIfNeeded();
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await page.getByRole("button", { name: /Открыть карточку:/ }).first().click();
  await expect(page).toHaveURL(/\/words\/\d+(?:\?|$)/);
  await page.goBack();
  await expect(page).toHaveURL(/\/dictionary\?/);
  await expect(page).toHaveURL(/source=backend/);
  await expect(page).toHaveURL(/status=review/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThanOrEqual(scrollBefore);
  expect(runtimeErrors).toEqual([]);

  await page.close();
  const relaunched = await context.newPage();
  runtimeErrors = watchRuntimeErrors(relaunched);
  await relaunched.goto("/");
  await expect(relaunched).toHaveURL(/\/dictionary\?/);
  await expect(relaunched).toHaveURL(/source=backend/);
  await expect(relaunched).toHaveURL(/status=review/);
  await expect(relaunched.getByRole("listitem")).toHaveCount(12);
  expect(runtimeErrors).toEqual([]);
});
