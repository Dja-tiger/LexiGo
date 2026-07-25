import { expect, test, type Page, type Route } from "@playwright/test";

const SESSION = {
  user: {
    id: "00000000-0000-0000-0000-000000000195",
    email: "progress-evidence@example.com",
    displayName: "Progress Evidence",
    createdAt: "2026-01-01T00:00:00Z",
  },
  tokens: {
    accessToken: "progress-evidence-access-token",
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

const DUE_ITEMS = [
  {
    id: 19501,
    kind: "word",
    lemma: "incident",
    translation: "инцидент",
    phonetic: "/ˈɪnsɪdənt/",
    partOfSpeech: "noun",
    topic: "Incident updates",
    acceptedAnswers: ["инцидент"],
    examples: ["The incident update must be concise."],
    note: "Use in operational communication.",
    status: "review",
  },
  {
    id: 19502,
    kind: "word",
    lemma: "mitigation",
    translation: "смягчение последствий",
    phonetic: "/ˌmɪtɪˈɡeɪʃən/",
    partOfSpeech: "noun",
    topic: "Incident updates",
    acceptedAnswers: ["смягчение последствий"],
    examples: ["The mitigation reduced customer impact."],
    note: "A temporary or permanent risk reduction.",
    status: "review",
  },
  {
    id: 19503,
    kind: "phrase",
    slug: "share-an-incident-update",
    lemma: "Share an incident update.",
    translation: "Сообщите обновление по инциденту.",
    phonetic: "",
    partOfSpeech: "phrase",
    topic: "Incident updates",
    acceptedAnswers: ["обновление"],
    examples: ["Share an incident update every thirty minutes."],
    note: "A concise operational request.",
    cloze: "Share an incident ____.",
    clozeAnswer: "update",
    status: "review",
  },
];

const PROGRESS = {
  dueNow: DUE_ITEMS.length,
  dueWords: 2,
  duePhrases: 1,
  totalWords: 80,
  totalPhrases: 20,
  newWords: 10,
  learningWords: 18,
  reviewWords: 52,
  masteredWords: 24,
  masteredPhrases: 8,
  reviewsToday: 9,
  successfulToday: 7,
  objectiveReviewsToday: 7,
  objectiveSuccessfulToday: 5,
  reviewsTotal: 420,
  dailyGoal: 30,
  currentStreak: 5,
  longestStreak: 11,
  retainedItemsWeek: 21,
  retainedWordsWeek: 15,
  retainedPhrasesWeek: 6,
  eventSchemaVersion: 2,
  modes: {
    study: { ...EMPTY_MODE, attemptsToday: 2, attemptsTotal: 90 },
    recall: { ...EMPTY_MODE, attemptsToday: 5, successfulToday: 4, attemptsTotal: 180, successfulTotal: 132 },
    choice: { ...EMPTY_MODE, attemptsToday: 2, successfulToday: 1, attemptsTotal: 110, successfulTotal: 84 },
    legacy: EMPTY_MODE,
  },
  weekly: {
    weekStart: "2026-07-20",
    weekEnd: "2026-07-26",
    recallAttempts: 25,
    recallSuccessful: 19,
    recallRate: 76,
    previousRecallAttempts: 22,
    previousRecallSuccessful: 15,
    previousRecallRate: 68,
    choiceAttempts: 12,
    choiceSuccessful: 10,
    choiceRate: 83,
    reviews: 120,
    lessons: 9,
    activeMinutes: 64,
    trend: [
      { date: "2026-07-20", attempts: 4, successful: 3, rate: 75 },
      { date: "2026-07-21", attempts: 3, successful: 2, rate: 67 },
      { date: "2026-07-22", attempts: 4, successful: 3, rate: 75 },
      { date: "2026-07-23", attempts: 5, successful: 4, rate: 80 },
      { date: "2026-07-24", attempts: 3, successful: 2, rate: 67 },
      { date: "2026-07-25", attempts: 3, successful: 3, rate: 100 },
      { date: "2026-07-26", attempts: 3, successful: 2, rate: 67 },
    ],
    weakTopics: [
      { topic: "Incident updates", attempts: 5, successful: 2, errors: 3, rate: 40 },
      { topic: "Architecture trade-offs", attempts: 4, successful: 2, errors: 2, rate: 50 },
    ],
    strongTopic: { topic: "Backend terminology", attempts: 6, successful: 6, errors: 0, rate: 100 },
  },
};

const METADATA = {
  catalogVersion: "sha256:progress-evidence",
  updatedAt: "2026-07-25T00:00:00Z",
  totals: { items: DUE_ITEMS.length, words: 2, phrases: 1 },
  sources: {
    mixed: DUE_ITEMS.length,
    noun: 2,
    verb: 0,
    adjective: 0,
    phrases: 1,
    dailyLife: 0,
    travel: 0,
    dataEngineering: 0,
    backend: 0,
    academicTechnicalEnglish: 0,
  },
  topics: [{ topic: "Incident updates", count: DUE_ITEMS.length, words: 2, phrases: 1 }],
};

async function fulfillJSON(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function installAPI(
  page: Page,
  lessonBodies: unknown[],
  dueTopics: Array<string | null> = [],
) {
  let activeLesson: Record<string, unknown> | null = null;

  await page.context().addCookies([{
    name: "lexigo_csrf",
    value: "progress-evidence-csrf",
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
      if (activeLesson) return fulfillJSON(route, 200, activeLesson);
      return fulfillJSON(route, 404, {
        error: { code: "active_lesson_not_found", message: "active lesson was not found" },
      });
    }
    if (path === "/api/v1/words/due") {
      expect(url.searchParams.get("kind")).toBe("all");
      dueTopics.push(url.searchParams.get("topic"));
      return fulfillJSON(route, 200, {
        items: DUE_ITEMS,
        count: DUE_ITEMS.length,
        total: DUE_ITEMS.length,
        page: 1,
        pageSize: 15,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      });
    }
    if (path === "/api/v1/lessons" && request.method() === "POST") {
      const body = request.postDataJSON() as Record<string, unknown>;
      lessonBodies.push(body);
      activeLesson = {
        id: "00000000-0000-0000-0000-000000001950",
        source: body.source,
        studyMode: body.studyMode,
        lessonSize: body.lessonSize,
        currentIndex: 0,
        version: 1,
        status: "active",
        items: DUE_ITEMS.map((item, position) => ({ ...item, position })),
        createdAt: "2026-07-25T00:00:00Z",
        updatedAt: "2026-07-25T00:00:00Z",
      };
      return fulfillJSON(route, 201, activeLesson);
    }
    if (path === "/api/v1/product/journey") return fulfillJSON(route, 202, { accepted: true });

    return fulfillJSON(route, 404, {
      error: { code: "not_mocked", message: path },
    });
  });
}

async function expectNoHorizontalOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(dimensions.document).toBeLessThanOrEqual(dimensions.viewport + 1);
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport + 1);
}

test.describe("Progress retained-learning evidence", () => {
  test("renders server-owned weekly evidence and starts the exact global due Recall queue", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "Desktop contract is asserted once; mobile and WebKit have dedicated coverage.");
    await page.setViewportSize({ width: 1440, height: 1024 });
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    const lessonBodies: unknown[] = [];
    const dueTopics: Array<string | null> = [];
    await installAPI(page, lessonBodies, dueTopics);

    await page.goto("/progress");

    const dashboard = page.locator(".lx-progress-evidence");
    await expect(dashboard.getByRole("heading", { name: "Прогресс", exact: true })).toBeVisible();
    await expect(dashboard.getByRole("heading", { name: "21 элемент сохранился в памяти" })).toBeVisible();
    await expect(dashboard.getByText("Самостоятельное воспроизведение: 68% → 76%.")).toBeVisible();
    await expect(dashboard.getByRole("heading", { name: "Активность отдельно от знания" })).toBeVisible();
    await expect(dashboard.getByRole("listitem")).toHaveCount(9);
    await expect(dashboard.locator(".lx-progress-evidence__chart li")).toHaveCount(7);

    await dashboard.getByText("Разделение по режимам").click();
    await expect(dashboard.getByText("Поддержанное узнавание")).toBeVisible();

    await dashboard.getByRole("button", { name: "Повторить 3 элемента" }).click();

    await expect(page).toHaveURL(/\/lesson\/active$/);
    await expect(page.locator(".lx-active-lesson")).toHaveAttribute("data-active-lesson-mode", "recall");
    expect(dueTopics).toEqual([null]);
    expect(lessonBodies).toEqual([{
      source: "mixed",
      studyMode: "recall",
      lessonSize: "15",
      wordIds: DUE_ITEMS.map((item) => item.id),
    }]);
    await expectNoHorizontalOverflow(page);
  });

  test("starts a topic-filtered due Recall queue from a weak-topic recommendation", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "The recommendation contract is asserted once in Chromium.");
    const lessonBodies: unknown[] = [];
    const dueTopics: Array<string | null> = [];
    await installAPI(page, lessonBodies, dueTopics);

    await page.goto("/progress");
    await page.getByRole("button", { name: "Повторить тему Incident updates" }).click();

    await expect(page).toHaveURL(/\/lesson\/active$/);
    expect(dueTopics).toEqual(["Incident updates"]);
    expect(lessonBodies).toHaveLength(1);
  });

  test("reflows the dark compact dashboard at 200% text size without hiding evidence", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "ios-webkit", "Compact WebKit geometry is the highest-risk mobile contract.");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await installAPI(page, []);

    await page.goto("/progress");
    await page.addStyleTag({ content: "html { font-size: 200% !important; }" });

    const dashboard = page.locator(".lx-progress-evidence");
    await expect(dashboard.getByRole("heading", { name: "Прогресс", exact: true })).toBeVisible();
    await expect(dashboard.getByText("Что считается сохранённым:", { exact: false })).toBeVisible();
    await expect(dashboard.getByRole("heading", { name: "Слабые темы" })).toBeVisible();
    await expect(page.locator('[data-route-navigation="mobile"]')).toBeVisible();
    await expect(page.locator('[data-route-navigation="rail"]')).toBeHidden();
    await expectNoHorizontalOverflow(page);
  });
});
