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
    backend: 4, academicTechnicalEnglish: 0,
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
  let activeLesson: Record<string, unknown> | null = null;

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
      return activeLesson
        ? fulfillJSON(route, 200, activeLesson)
        : fulfillJSON(route, 404, {
            error: { code: "active_lesson_not_found", message: "active lesson was not found" },
          });
    }
    if (path.startsWith("/api/v1/phrases/")) {
      const slug = decodeURIComponent(path.slice("/api/v1/phrases/".length));
      const phrase = PHRASES.find((item) => item.slug === slug);
      return phrase
        ? fulfillJSON(route, 200, phrase)
        : fulfillJSON(route, 404, {
            error: { code: "phrase_not_found", message: "phrase was not found" },
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
      activeLesson = {
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
      };
      return fulfillJSON(route, 201, activeLesson);
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

async function expectSingleVisibleNavigation(page: Page, expectedSelector: string) {
  for (const selector of NAVIGATION_SELECTORS) {
    if (selector === expectedSelector) await expect(navigation(page, selector)).toBeVisible();
    else await expect(navigation(page, selector)).toBeHidden();
  }
}

async function openFirstPhraseDetail(page: Page) {
  await clickNavigationView(page, "library");
  await page.getByRole("link", { name: "Фразы", exact: true }).click();
  await expect(page).toHaveURL(/\/phrases$/);
  await expect(page.getByRole("heading", { name: "Находите готовые формулировки" })).toBeVisible();
  await page.getByRole("list", { name: "Результаты каталога фраз" }).getByRole("link").first().click();
  await expect(page.locator(".lx-detail-card")).toBeVisible();
}

async function returnFromDetail(page: Page) {
  await page.getByRole("button", { name: "Назад в каталог" }).click();
  await expect(page).toHaveURL(/\/phrases$/);
}

async function startActiveLesson(page: Page) {
  await clickNavigationView(page, "learn");
  await expect(page).toHaveURL(/\/learn$/);
  const configureLesson = page.getByRole("button", { name: "Настроить урок", exact: true });
  if (await configureLesson.isVisible()) await configureLesson.click();
  await page.getByRole("radio", { name: /Простое изучение слов/ }).click();
  await page.getByRole("button", { name: "Начать урок", exact: true }).click();
  await expect(page).toHaveURL(/\/lesson\/active/);
  await expect(page.locator(".lx-active-lesson")).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await installAPI(page);
});

test("primary navigation switches at 799/800 and 1023/1024 without duplicate visible controls", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/phrases");
  await expectSingleVisibleNavigation(page, ".lx-route-nav--mobile");

  await page.setViewportSize({ width: 799, height: 900 });
  await expectSingleVisibleNavigation(page, ".lx-route-nav--mobile");
  await page.setViewportSize({ width: 800, height: 900 });
  await expectSingleVisibleNavigation(page, ".lx-route-nav--rail");
  await page.setViewportSize({ width: 1023, height: 900 });
  await expectSingleVisibleNavigation(page, ".lx-route-nav--rail");
  await page.setViewportSize({ width: 1024, height: 900 });
  await expectSingleVisibleNavigation(page, ".lx-route-nav--header");

  const visibleNavigationCount = await page.locator(".lx-route-nav:visible").count();
  expect(visibleNavigationCount).toBe(1);
});

test("primary navigation remains operational after compact/medium/desktop rotations", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await clickNavigationView(page, "library");
  await expect(page).toHaveURL(/\/dictionary$/);

  await page.setViewportSize({ width: 900, height: 1180 });
  await clickNavigationView(page, "progress");
  await expect(page).toHaveURL(/\/progress$/);

  await page.setViewportSize({ width: 1440, height: 1000 });
  await clickNavigationView(page, "learn");
  await expect(page).toHaveURL(/\/learn$/);

  await page.setViewportSize({ width: 390, height: 844 });
  await clickNavigationView(page, "library");
  await expect(page).toHaveURL(/\/dictionary$/);
  expect(errors).toEqual([]);
});

test("phrase detail navigation preserves catalog location across viewport switches", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await openFirstPhraseDetail(page);

  await page.setViewportSize({ width: 900, height: 1180 });
  await returnFromDetail(page);
  await expect(page.getByRole("heading", { name: "Находите готовые формулировки" })).toBeVisible();

  await page.setViewportSize({ width: 1440, height: 1000 });
  await openFirstPhraseDetail(page);
  await page.goBack();
  await expect(page).toHaveURL(/\/phrases$/);
  await expect(page.getByRole("heading", { name: "Находите готовые формулировки" })).toBeVisible();
});

test("active lesson remains focused while viewport crosses compact and medium boundaries", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await startActiveLesson(page);
  await page.setViewportSize({ width: 900, height: 1180 });
  await expect(page.locator(".lx-active-lesson")).toBeVisible();
  await expect(page.getByRole("heading", { name: "viewport" })).toBeVisible();

  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(page.locator(".lx-active-lesson")).toBeVisible();
  await expect(page.locator(".lx-route-nav:visible")).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator(".lx-active-lesson")).toBeVisible();
  await expect(page.getByRole("button", { name: "Закрыть", exact: true })).toBeVisible();
});

test("wide layouts keep content bounded and medium sidebar does not cover the workspace", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto("/phrases");
  const desktopWorkspace = page.locator(".lx-phrase-catalog-workspace");
  await expect(desktopWorkspace).toBeVisible();
  const desktopBox = await desktopWorkspace.boundingBox();
  expect(desktopBox).not.toBeNull();
  expect(desktopBox!.width).toBeLessThan(1450);
  expect(desktopBox!.x).toBeGreaterThan(60);

  await page.setViewportSize({ width: 900, height: 1180 });
  const mediumWorkspace = page.locator(".lx-phrase-catalog-workspace");
  const rail = navigation(page, ".lx-route-nav--rail");
  const [workspaceBox, railBox] = await Promise.all([mediumWorkspace.boundingBox(), rail.boundingBox()]);
  expect(workspaceBox).not.toBeNull();
  expect(railBox).not.toBeNull();
  expect(workspaceBox!.x).toBeGreaterThanOrEqual(railBox!.x + railBox!.width - 1);
});
