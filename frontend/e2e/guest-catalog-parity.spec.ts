import { expect, test, type BrowserContext, type Page, type Route } from "@playwright/test";

const SESSION = {
  user: {
    id: "00000000-0000-0000-0000-000000000072",
    email: "guest-catalog@example.com",
    displayName: "Guest Catalog User",
    createdAt: "2026-08-11T00:00:00Z",
  },
  tokens: {
    accessToken: "guest-catalog-access-token",
    tokenType: "Bearer",
    expiresIn: 900,
  },
};

const PUBLIC_WORD = {
  id: 102,
  kind: "word",
  lemma: "throughput",
  translation: "пропускная способность",
  phonetic: "/ˈθruːpʊt/",
  partOfSpeech: "noun",
  topic: "Backend",
  aliases: ["processing rate"],
  acceptedAnswers: ["пропускная способность"],
  examples: ["Measure throughput before increasing concurrency."],
  note: "The amount of work processed per unit of time.",
};

const PERSONALIZED_WORD = {
  ...PUBLIC_WORD,
  status: "learning",
  easiness: 2.5,
  intervalDays: 2,
  repetitions: 1,
  dueAt: "2026-08-13T09:00:00Z",
  lastReviewedAt: "2026-08-11T09:00:00Z",
};

const AUTHENTICATED_PHRASE = {
  id: 201,
  kind: "phrase",
  slug: "root-cause",
  lemma: "We need to identify the root cause.",
  translation: "Нам нужно определить первопричину.",
  phonetic: "",
  partOfSpeech: "phrase",
  topic: "Incidents",
  examples: ["Before applying another workaround, we need to identify the root cause."],
  note: "Use for incident investigation.",
  cloze: "We need to identify the _____ cause.",
  clozeAnswer: "root",
  status: "review",
};

const METADATA = {
  catalogVersion: "sha256:issue-72-guest-parity",
  updatedAt: "2026-08-11T00:00:00Z",
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
    academicTechnicalEnglish: 0,
  },
  topics: [
    { topic: "Backend", count: 1, words: 1, phrases: 0 },
    { topic: "Incidents", count: 1, words: 0, phrases: 1 },
  ],
};

const PROGRESS = {
  dueNow: 1,
  dueWords: 1,
  duePhrases: 0,
  totalWords: 1,
  totalPhrases: 1,
  newWords: 0,
  learningWords: 1,
  reviewWords: 0,
  masteredWords: 0,
  masteredPhrases: 0,
  reviewsToday: 1,
  successfulToday: 1,
  reviewsTotal: 1,
  dailyGoal: 30,
  currentStreak: 1,
  longestStreak: 1,
  retainedItemsWeek: 1,
  retainedWordsWeek: 1,
  retainedPhrasesWeek: 0,
};

async function fulfillJSON(route: Route, status: number, body: unknown): Promise<void> {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function installCatalogAPI(context: BrowserContext): Promise<{
  authenticatedRequests: string[];
  publicRequests: string[];
}> {
  let authenticated = false;
  const authenticatedRequests: string[] = [];
  const publicRequests: string[] = [];

  await context.route("**/api/v1/auth/refresh", async (route) => {
    if (authenticated) return fulfillJSON(route, 200, SESSION);
    return fulfillJSON(route, 401, { error: { code: "unauthorized", message: "guest" } });
  });
  await context.route("**/api/v1/auth/login", async (route) => {
    authenticated = true;
    return fulfillJSON(route, 200, SESSION);
  });
  await context.route("**/api/v1/auth/register", async (route) => {
    authenticated = true;
    return fulfillJSON(route, 201, SESSION);
  });
  await context.route("**/api/v1/catalog/metadata", (route) => fulfillJSON(route, 200, METADATA));
  await context.route("**/api/v1/product/journey", (route) => fulfillJSON(route, 202, { accepted: true }));
  await context.route("**/api/v1/progress?*", (route) => fulfillJSON(route, 200, PROGRESS));

  await context.route("**/api/v1/catalog/words?*", async (route) => {
    publicRequests.push(route.request().url());
    return fulfillJSON(route, 200, {
      items: [PUBLIC_WORD],
      count: 1,
      total: 1,
      page: 1,
      pageSize: 48,
      totalPages: 1,
      hasPrevious: false,
      hasNext: false,
    });
  });
  await context.route("**/api/v1/catalog/words/102", async (route) => {
    publicRequests.push(route.request().url());
    return fulfillJSON(route, 200, PUBLIC_WORD);
  });

  await context.route("**/api/v1/words?*", async (route) => {
    authenticatedRequests.push(route.request().url());
    const url = new URL(route.request().url());
    const phraseRequest = url.searchParams.get("kind") === "phrase";
    const items = phraseRequest ? [AUTHENTICATED_PHRASE] : [PERSONALIZED_WORD];
    return fulfillJSON(route, 200, {
      items,
      count: items.length,
      total: items.length,
      page: 1,
      pageSize: 48,
      totalPages: 1,
      hasPrevious: false,
      hasNext: false,
    });
  });
  await context.route("**/api/v1/words/102", async (route) => {
    authenticatedRequests.push(route.request().url());
    return fulfillJSON(route, 200, PERSONALIZED_WORD);
  });
  await context.route("**/api/v1/phrases/root-cause", async (route) => {
    authenticatedRequests.push(route.request().url());
    return fulfillJSON(route, 200, AUTHENTICATED_PHRASE);
  });

  return { authenticatedRequests, publicRequests };
}

async function installDeterministicRuntime(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const install = () => {
      if (document.getElementById("lexigo-issue-72-runtime")) return;
      const style = document.createElement("style");
      style.id = "lexigo-issue-72-runtime";
      style.nonce = document.querySelector<HTMLElement>("[nonce]")?.nonce ?? "";
      style.textContent = "*, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }";
      (document.head ?? document.documentElement).append(style);
    };
    if (document.documentElement) install();
    else document.addEventListener("DOMContentLoaded", install, { once: true });
  });
}

function returnTarget(page: Page): string | null {
  return new URL(page.url()).searchParams.get("return_to");
}

test.describe("Issue #72 guest catalog parity", () => {
  test.describe.configure({ timeout: 90_000 });

  test.beforeEach(async ({ context, page }, testInfo) => {
    test.skip(
      !["desktop-chromium", "ios-webkit"].includes(testInfo.project.name),
      "Guest catalog acceptance runs in desktop Chromium and iOS WebKit.",
    );
    await context.clearCookies();
    await installDeterministicRuntime(page);
  });

  test("guest Word Detail is content-only and login returns to the exact canonical context", async ({ context, page }) => {
    const requests = await installCatalogAPI(context);
    const target = "/words/102?source=backend&query=throughput&sort=az&page=2";

    await page.goto(target, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL((url) => `${url.pathname}${url.search}` === target);
    await expect(page.getByRole("heading", { level: 1, name: "throughput" })).toBeVisible();
    await expect(page.getByRole("note")).toContainText("прогресс и история повторений не сохраняются");
    await expect(page.getByRole("heading", { level: 2, name: "Демо без сохранения" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Статус знания" })).toHaveCount(0);
    expect(requests.publicRequests.some((url) => new URL(url).pathname === "/api/v1/catalog/words/102")).toBe(true);
    expect(requests.authenticatedRequests).toEqual([]);

    await page.getByRole("button", { name: "Войти и сохранить прогресс", exact: true }).click();
    await expect(page).toHaveURL((url) => url.pathname === "/profile");
    expect(returnTarget(page)).toBe(target);

    await page.locator("#auth-email").fill("guest-catalog@example.com");
    await page.locator("#auth-password").fill("correct horse battery staple");
    await page.getByRole("button", { name: "Войти", exact: true }).click();

    await expect(page).toHaveURL((url) => `${url.pathname}${url.search}` === target);
    await expect(page.getByRole("heading", { level: 1, name: "throughput" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Статус знания" })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Демо без сохранения" })).toHaveCount(0);
    expect(requests.authenticatedRequests.some((url) => new URL(url).pathname === "/api/v1/words/102")).toBe(true);
  });

  test("guest Phrases explains non-persistence and registration returns to the exact phrase detail", async ({ context, page }) => {
    const requests = await installCatalogAPI(context);

    await page.goto("/phrases?query=root+cause", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1, name: "Находите готовые формулировки" })).toBeVisible();
    await expect(page.getByRole("note")).toContainText("Статусы, повторения и прогресс не сохраняются без аккаунта.");
    await expect(page.getByRole("link", { name: /We need to identify the root cause\./ })).toBeVisible();
    expect(requests.authenticatedRequests).toEqual([]);

    await page.getByRole("link", { name: /We need to identify the root cause\./ }).click();
    await expect(page.getByRole("heading", { level: 1, name: "We need to identify the root cause." })).toBeVisible();
    const detailTarget = `${new URL(page.url()).pathname}${new URL(page.url()).search}`;
    await expect(page.getByRole("note")).toContainText("прогресс и история повторений не сохраняются");

    await page.getByRole("button", { name: "Войти и сохранить прогресс", exact: true }).click();
    await expect(page).toHaveURL((url) => url.pathname === "/profile");
    expect(returnTarget(page)).toBe(detailTarget);

    await page.getByRole("tab", { name: "Регистрация", exact: true }).click();
    await page.locator("#auth-displayName").fill("Guest Catalog User");
    await page.locator("#auth-email").fill("guest-catalog@example.com");
    await page.locator("#auth-password").fill("correct horse battery staple");
    await page.locator("#auth-passwordConfirmation").fill("correct horse battery staple");
    await page.getByRole("button", { name: "Создать аккаунт", exact: true }).click();

    await expect(page).toHaveURL((url) => `${url.pathname}${url.search}` === detailTarget);
    await expect(page.getByRole("heading", { level: 1, name: "We need to identify the root cause." })).toBeVisible();
    await expect(page.getByRole("button", { name: "Настроить урок", exact: true })).toBeVisible();
    expect(requests.authenticatedRequests.some((url) => new URL(url).pathname === "/api/v1/phrases/root-cause")).toBe(true);
  });
});
