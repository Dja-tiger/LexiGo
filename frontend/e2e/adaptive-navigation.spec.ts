import { expect, test, type Page, type Route } from "@playwright/test";

const SESSION = {
  user: {
    id: "00000000-0000-0000-0000-000000000050",
    email: "adaptive-navigation@example.com",
    displayName: "Adaptive Navigation User",
    createdAt: "2026-01-01T00:00:00Z",
  },
  tokens: {
    accessToken: "adaptive-navigation-access-token",
    tokenType: "Bearer",
    expiresIn: 900,
  },
};

const EMPTY_MODE = {
  attemptsToday: 0,
  successfulToday: 0,
  attemptsTotal: 0,
  successfulTotal: 0,
};

const PROGRESS = {
  dueNow: 2,
  dueWords: 1,
  duePhrases: 1,
  totalWords: 2,
  totalPhrases: 42,
  newWords: 2,
  learningWords: 0,
  reviewWords: 0,
  masteredWords: 0,
  masteredPhrases: 0,
  reviewsToday: 0,
  successfulToday: 0,
  objectiveReviewsToday: 0,
  objectiveSuccessfulToday: 0,
  reviewsTotal: 0,
  dailyGoal: 30,
  currentStreak: 4,
  longestStreak: 7,
  retainedItemsWeek: 0,
  retainedWordsWeek: 0,
  retainedPhrasesWeek: 0,
  eventSchemaVersion: 2,
  modes: {
    study: EMPTY_MODE,
    recall: EMPTY_MODE,
    choice: EMPTY_MODE,
    legacy: EMPTY_MODE,
  },
};

const WORDS = [
  {
    id: 5001,
    kind: "word",
    lemma: "viewport",
    translation: "область просмотра",
    phonetic: "/ˈvjuːpɔːt/",
    partOfSpeech: "noun",
    topic: "Responsive UI",
    examples: ["The viewport changes when the device rotates."],
    note: "Keep the current lesson focused during layout changes.",
    status: "new",
  },
  {
    id: 5002,
    kind: "word",
    lemma: "sidebar",
    translation: "боковая панель",
    phonetic: "/ˈsaɪdbɑː/",
    partOfSpeech: "noun",
    topic: "Responsive UI",
    examples: ["A sidebar uses the available tablet width."],
    note: "Navigation labels remain visible at medium widths.",
    status: "new",
  },
];

const PHRASES = Array.from({ length: 42 }, (_, index) => ({
  id: 5100 + index,
  kind: "phrase" as const,
  slug: `adaptive-navigation-${index + 1}`,
  lemma: `Keep navigation state ${index + 1}`,
  translation: `сохранять состояние навигации ${index + 1}`,
  phonetic: "",
  partOfSpeech: "phrase",
  topic: index % 2 === 0 ? "Responsive UI" : "Accessibility",
  examples: [`Restore the previous tab position for scenario ${index + 1}.`],
  note: "Top-level navigation must remain predictable.",
  status: "new",
}));

const METADATA = {
  catalogVersion: "sha256:adaptive-navigation-e2e",
  updatedAt: "2026-07-18T00:00:00Z",
  totals: { items: WORDS.length + PHRASES.length, words: WORDS.length, phrases: PHRASES.length },
  sources: {
    mixed: WORDS.length + PHRASES.length,
    noun: WORDS.length,
    verb: 0,
    adjective: 0,
    phrases: PHRASES.length,
    dailyLife: 4,
    travel: 4,
    dataEngineering: 4,
    backend: 4,
  },
  topics: [
    { topic: "Responsive UI", count: 22 },
    { topic: "Accessibility", count: 22 },
  ],
};

const NAVIGATION_SELECTORS = [
  ".lx-route-nav--header",
  ".lx-route-nav--rail",
  ".lx-route-nav--mobile",
] as const;

async function fulfillJSON(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function installAPI(page: Page) {
  await page.context().addCookies([{
    name: "lexigo_csrf",
    value: "adaptive-navigation-csrf",
    url: "http://127.0.0.1:3000",
    sameSite: "Lax",
  }]);

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path === "/api/v1/auth/refresh") return fulfillJSON(route, 200, SESSION);
    if (path === "/api/v1/catalog/metadata") return fulfillJSON(route, 200, METADATA);
    if (path === "/api/v1/progress") return fulfillJSON(route, 200, PROGRESS);
    if (path === "/api/v1/lessons/active") {
      return fulfillJSON(route, 404, {
        error: { code: "active_lesson_not_found", message: "active lesson was not found" },
      });
    }
    if ((path === "/api/v1/words" || path === "/api/v1/words/due")
      && url.searchParams.get("kind") === "phrase") {
      return fulfillJSON(route, 200, { items: PHRASES, count: PHRASES.length });
    }
    if (path === "/api/v1/words" || path === "/api/v1/words/due") {
      return fulfillJSON(route, 200, { items: WORDS, count: WORDS.length });
    }
    if (path === "/api/v1/lessons/preview") {
      const input = request.postDataJSON() as {
        source?: string;
        studyMode?: string;
        lessonSize?: string;
      };
      return fulfillJSON(route, 200, {
        source: input.source ?? "mixed",
        studyMode: input.studyMode ?? "study",
        lessonSize: input.lessonSize ?? "30",
        composition: {
          total: WORDS.length,
          words: WORDS.length,
          phrases: 0,
          due: WORDS.length,
          new: 0,
          scheduled: 0,
          availableWords: WORDS.length,
          availablePhrases: 0,
          fallback: "words_only",
        },
      });
    }
    if (path === "/api/v1/lessons" && request.method() === "POST") {
      const input = request.postDataJSON() as {
        source?: string;
        studyMode?: string;
        lessonSize?: string;
      };
      return fulfillJSON(route, 201, {
        id: "00000000-0000-0000-0000-000000000500",
        source: input.source ?? "mixed",
        studyMode: input.studyMode ?? "study",
        lessonSize: input.lessonSize ?? "30",
        currentIndex: 0,
        version: 1,
        status: "active",
        items: WORDS.map((item, position) => ({ ...item, position })),
        createdAt: "2026-07-18T00:00:00Z",
        updatedAt: "2026-07-18T00:00:00Z",
      });
    }

    return fulfillJSON(route, 404, {
      error: { code: "not_mocked", message: path },
    });
  });
}

function navigation(page: Page, selector: string) {
  return page.locator(selector);
}

async function clickNavigationView(page: Page, view: string) {
  for (const selector of NAVIGATION_SELECTORS) {
    const host = navigation(page, selector);
    if (await host.isVisible()) {
      await host.locator(`[data-navigation-view="${view}"]`).click();
      return;
    }
  }
  throw new Error(`No visible primary navigation for ${view}`);
}

async function expectMinimumNavigationTargets(page: Page, selector: string, minimum = 48) {
  const sizes = await page.locator(`${selector} > a`).evaluateAll((links) => links.map((link) => {
    const box = link.getBoundingClientRect();
    return { width: box.width, height: box.height };
  }));
  expect(sizes).toHaveLength(5);
  for (const size of sizes) {
    expect(size.width).toBeGreaterThanOrEqual(minimum);
    expect(size.height).toBeGreaterThanOrEqual(minimum);
  }
}

async function expectNoHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

test.describe.configure({ timeout: 60_000 });

test.beforeEach(async ({ page }) => {
  await installAPI(page);
});

test("expanded width keeps all semantic header navigation labels visible", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Expanded layout is asserted once in Chromium.");
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Продолжайте учиться/ })).toBeVisible();

  const headerNavigation = navigation(page, ".lx-route-nav--header");
  await expect(headerNavigation).toBeVisible();
  await expect(navigation(page, ".lx-route-nav--rail")).toBeHidden();
  await expect(navigation(page, ".lx-route-nav--mobile")).toBeHidden();
  await expect(headerNavigation.getByText("Главная", { exact: true })).toBeVisible();
  await expect(headerNavigation.getByText("Обучение", { exact: true })).toBeVisible();
  await expect(headerNavigation.getByText("Фразы", { exact: true })).toBeVisible();
  await expect(headerNavigation.getByText("Словарь", { exact: true })).toBeVisible();
  await expect(headerNavigation.getByText("Прогресс", { exact: true })).toBeVisible();
  await expect(headerNavigation.getByRole("link", { name: "Обучение" })).toHaveAttribute("href", "/learn");
  await expectMinimumNavigationTargets(page, ".lx-route-nav--header");
  await expectNoHorizontalOverflow(page);
});

test("breakpoint boundaries expose exactly one labelled primary navigation", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Breakpoint boundaries are asserted once.");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Продолжайте учиться/ })).toBeVisible();

  const cases = [
    { width: 719, expected: ".lx-route-nav--mobile" },
    { width: 720, expected: ".lx-route-nav--rail" },
    { width: 1099, expected: ".lx-route-nav--rail" },
    { width: 1100, expected: ".lx-route-nav--header" },
  ];

  for (const current of cases) {
    await page.setViewportSize({ width: current.width, height: 800 });
    const visibility = await page.locator(NAVIGATION_SELECTORS.join(", "))
      .evaluateAll((elements) => elements.map((element) => ({
        className: element.className,
        visible: window.getComputedStyle(element).display !== "none",
      })));
    expect(visibility.filter((entry) => entry.visible)).toHaveLength(1);
    await expect(page.locator(current.expected)).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
});

test("medium width uses a labelled rail and restores the previous tab target and scroll", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-webkit", "Tablet rail and WebKit behavior are asserted once.");
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/phrases");
  await expect(page.getByRole("heading", { name: "Готовые формулировки для работы" })).toBeVisible();

  const rail = navigation(page, ".lx-route-nav--rail");
  await expect(rail).toBeVisible();
  await expect(navigation(page, ".lx-route-nav--header")).toBeHidden();
  await expect(navigation(page, ".lx-route-nav--mobile")).toBeHidden();
  await expect(rail.getByText("Обучение", { exact: true })).toBeVisible();
  await expect(rail.getByText("Словарь", { exact: true })).toBeVisible();
  await expectMinimumNavigationTargets(page, ".lx-route-nav--rail");

  const railBox = await rail.boundingBox();
  const mainBox = await page.locator("#lexigo-main-content").boundingBox();
  expect(railBox).not.toBeNull();
  expect(mainBox).not.toBeNull();
  expect(mainBox!.x).toBeGreaterThanOrEqual(railBox!.x + railBox!.width + 10);

  await page.evaluate(() => window.scrollTo({ top: 1_050, behavior: "auto" }));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
  const savedScroll = await page.evaluate(() => window.scrollY);
  await page.waitForTimeout(100);

  await clickNavigationView(page, "progress");
  await expect(page).toHaveURL(/\/progress$/);
  await clickNavigationView(page, "phrases");
  await expect(page).toHaveURL(/\/phrases$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(savedScroll - 100);

  const firstPhrase = page.locator(".lx-phrase-grid button").first();
  await firstPhrase.click();
  await expect(page).toHaveURL(/\/phrases\/adaptive-navigation-1$/);
  await expect(page.getByRole("heading", { name: "Keep navigation state 1" })).toBeVisible();

  await clickNavigationView(page, "progress");
  await clickNavigationView(page, "phrases");
  await expect(page).toHaveURL(/\/phrases\/adaptive-navigation-1$/);
  await expect(page.getByRole("heading", { name: "Keep navigation state 1" })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test("compact portrait uses a safe-area bottom tab bar with readable labels", async ({ page }, testInfo) => {
  test.skip(!["ios-webkit", "android-chromium"].includes(testInfo.project.name), "Compact mobile contract.");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Продолжайте учиться/ })).toBeVisible();

  const bottomNavigation = navigation(page, ".lx-route-nav--mobile");
  await expect(bottomNavigation).toBeVisible();
  await expect(navigation(page, ".lx-route-nav--header")).toBeHidden();
  await expect(navigation(page, ".lx-route-nav--rail")).toBeHidden();
  await expectMinimumNavigationTargets(page, ".lx-route-nav--mobile");

  const labelSizes = await bottomNavigation.locator("a > span > span").evaluateAll((labels) => labels.map((label) => (
    Number.parseFloat(window.getComputedStyle(label).fontSize)
  )));
  expect(labelSizes.every((size) => size >= 11)).toBe(true);

  const navigationBox = await bottomNavigation.boundingBox();
  expect(navigationBox).not.toBeNull();
  expect(navigationBox!.y + navigationBox!.height).toBeLessThanOrEqual(844 - 9);
  const appPaddingBottom = await page.locator(".lx-app").evaluate((element) => (
    Number.parseFloat(window.getComputedStyle(element).paddingBottom)
  ));
  expect(appPaddingBottom).toBeGreaterThan(navigationBox!.height + 20);
  await expectNoHorizontalOverflow(page);
});

test("mobile landscape switches to the medium rail without clipping content", async ({ page }, testInfo) => {
  test.skip(!["ios-webkit", "android-chromium"].includes(testInfo.project.name), "Landscape mobile contract.");
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto("/learn");
  await expect(page.getByRole("heading", { name: "Настройте урок под текущую задачу" })).toBeVisible();

  const rail = navigation(page, ".lx-route-nav--rail");
  await expect(rail).toBeVisible();
  await expect(navigation(page, ".lx-route-nav--header")).toBeHidden();
  await expect(navigation(page, ".lx-route-nav--mobile")).toBeHidden();
  await expectMinimumNavigationTargets(page, ".lx-route-nav--rail");
  await expect(rail.getByText("Прогресс", { exact: true })).toBeVisible();
  const railBox = await rail.boundingBox();
  expect(railBox).not.toBeNull();
  expect(railBox!.y + railBox!.height).toBeLessThanOrEqual(390);
  expect(await rail.evaluate((element) => element.scrollHeight <= element.clientHeight + 1)).toBe(true);
  await expectNoHorizontalOverflow(page);
});

test("an active lesson removes top-level navigation and blocks browser history exit", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Focused lesson behavior is asserted once.");
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto("/learn");
  await expect(page.getByRole("heading", { name: "Настройте урок под текущую задачу" })).toBeVisible();

  const start = page.getByRole("button", { name: "Начать урок", exact: true });
  await expect(start).toBeEnabled();
  await start.click();
  await expect(page).toHaveURL(/\/lesson\/active/);
  await expect(page.getByRole("heading", { name: "viewport" })).toBeVisible();
  await expect(page.getByText("Урок в процессе", { exact: true })).toBeVisible();
  await expect(page.locator(NAVIGATION_SELECTORS.join(", "))).toHaveCount(0);

  await page.evaluate(() => window.history.back());
  await expect.poll(() => new URL(page.url()).pathname).toBe("/lesson/active");
  await expect(page.locator(".lx-queue-notice")).toContainText("Сохранить и выйти");
  await expect(page.getByRole("heading", { name: "viewport" })).toBeVisible();

  await page.getByRole("button", { name: "Сохранить и выйти", exact: true }).click();
  await expect(page).toHaveURL("http://127.0.0.1:3000/");
  await expect(navigation(page, ".lx-route-nav--rail")).toBeVisible();

  await page.goBack();
  await expect(page).toHaveURL(/\/learn$/);
  await expect(page.getByRole("heading", { name: "Настройте урок под текущую задачу" })).toBeVisible();
  await expect(page).not.toHaveURL(/\/lesson\//);
});

test("the PWA manifest no longer restricts the app to portrait", async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Manifest contract is asserted once.");
  const response = await request.get("/manifest.webmanifest");
  expect(response.ok()).toBe(true);
  const manifest = await response.json() as { orientation?: string; display?: string };
  expect(manifest.display).toBe("standalone");
  expect(manifest.orientation).toBeUndefined();
});
