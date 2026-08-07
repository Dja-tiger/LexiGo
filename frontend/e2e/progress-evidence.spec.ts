import { expect, test, type Locator, type Page, type Route } from "@playwright/test";

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
    weakPartsOfSpeech: [
      { partOfSpeech: "noun", attempts: 6, successful: 3, errors: 3, rate: 50 },
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

type DueRequest = {
  topic: string | null;
  source: string | null;
};

type ControlBox = {
  x: number;
  y: number;
  width: number;
  height: number;
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
  dueRequests: DueRequest[] = [],
) {
  let activeLesson: Record<string, unknown> | null = null;
  let selectedDueItems = DUE_ITEMS;

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
      const dueRequest = {
        topic: url.searchParams.get("topic"),
        source: url.searchParams.get("source"),
      };
      dueRequests.push(dueRequest);
      selectedDueItems = dueRequest.source === "noun"
        ? DUE_ITEMS.filter((item) => item.partOfSpeech === "noun")
        : DUE_ITEMS;
      return fulfillJSON(route, 200, {
        items: selectedDueItems,
        count: selectedDueItems.length,
        total: selectedDueItems.length,
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
        items: selectedDueItems.map((item, position) => ({ ...item, position })),
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

async function expectMinimumTarget(control: Locator, minimum: number): Promise<ControlBox> {
  await expect(control).toBeVisible();
  const box = await control.boundingBox();
  expect(box).not.toBeNull();
  if (!box) throw new Error("Expected a visible control bounding box");
  expect(box.width).toBeGreaterThanOrEqual(minimum);
  expect(box.height).toBeGreaterThanOrEqual(minimum);
  return box;
}

function expectNoIntersection(left: ControlBox, right: ControlBox, label: string): void {
  const intersects = left.x < right.x + right.width
    && left.x + left.width > right.x
    && left.y < right.y + right.height
    && left.y + left.height > right.y;
  expect(intersects, label).toBe(false);
}

async function expectKeyboardFocus(page: Page, control: Locator): Promise<void> {
  await control.focus();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(control).toBeFocused();
  const focus = await control.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      focusVisible: element.matches(":focus-visible"),
      outlineStyle: style.outlineStyle,
      outlineWidth: Number.parseFloat(style.outlineWidth) || 0,
    };
  });
  expect(focus.focusVisible).toBe(true);
  expect(focus.outlineStyle).not.toBe("none");
  expect(focus.outlineWidth).toBeGreaterThanOrEqual(3);
}

async function applyTextZoom(page: Page, percent = 200) {
  const stylesheetPath = `/__e2e__/text-zoom-${percent}.css`;
  await page.route(`**${stylesheetPath}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/css",
      body: `html { font-size: ${percent}% !important; }`,
    });
  });

  await page.addStyleTag({ url: new URL(stylesheetPath, page.url()).toString() });
  await expect.poll(async () => page.evaluate(() => (
    Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize)
  ))).toBeGreaterThanOrEqual(32);
}

test.describe("Progress retained-learning evidence", () => {
  test("renders server-owned weekly evidence and starts the exact global due Recall queue", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "Desktop contract is asserted once; mobile and WebKit have dedicated coverage.");
    await page.setViewportSize({ width: 1440, height: 1024 });
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    const lessonBodies: unknown[] = [];
    const dueRequests: DueRequest[] = [];
    await installAPI(page, lessonBodies, dueRequests);

    await page.goto("/progress");

    const dashboard = page.locator(".lx-progress-evidence");
    await expect(dashboard.getByRole("heading", { name: "Прогресс", exact: true })).toBeVisible();
    await expect(dashboard.getByRole("heading", { name: "21 элемент сохранился в памяти" })).toBeVisible();
    await expect(dashboard.getByText("Самостоятельное воспроизведение: 68% → 76%.")).toBeVisible();
    await expect(dashboard.getByRole("heading", { name: "Активность отдельно от знания" })).toBeVisible();
    await expect(dashboard.getByRole("listitem")).toHaveCount(10);
    await expect(dashboard.locator(".lx-progress-evidence__chart li")).toHaveCount(7);

    await dashboard.getByText("Разделение по режимам").click();
    await expect(dashboard.getByText("Поддержанное узнавание")).toBeVisible();

    await dashboard.getByRole("button", { name: "Повторить 3 элемента" }).click();

    await expect(page).toHaveURL(/\/lesson\/active$/);
    const resumeLesson = page.getByRole("button", { name: "Продолжить урок", exact: true });
    await expect(resumeLesson).toBeVisible();
    await resumeLesson.click();
    await expect(page.locator(".lx-active-lesson")).toHaveAttribute("data-active-lesson-mode", "recall");
    expect(dueRequests).toEqual([{ topic: null, source: null }]);
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
    const dueRequests: DueRequest[] = [];
    await installAPI(page, lessonBodies, dueRequests);

    await page.goto("/progress");
    await page.getByRole("button", { name: "Повторить тему Обновления по инцидентам" }).click();

    await expect(page).toHaveURL(/\/lesson\/active$/);
    expect(dueRequests).toEqual([{ topic: "Incident updates", source: null }]);
    expect(lessonBodies).toHaveLength(1);
  });

  test("starts a source-filtered due Recall queue from a weak part-of-speech recommendation", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "The part-of-speech recommendation contract is asserted once in Chromium.");
    const lessonBodies: unknown[] = [];
    const dueRequests: DueRequest[] = [];
    await installAPI(page, lessonBodies, dueRequests);

    await page.goto("/progress");
    await page.getByRole("button", { name: "Повторить часть речи существительное" }).click();

    await expect(page).toHaveURL(/\/lesson\/active$/);
    expect(dueRequests).toEqual([{ topic: null, source: "noun" }]);
    expect(lessonBodies).toEqual([{
      source: "noun",
      studyMode: "recall",
      lessonSize: "15",
      wordIds: DUE_ITEMS.filter((item) => item.partOfSpeech === "noun").map((item) => item.id),
    }]);
  });

  test("keeps populated Progress controls at the 44/48px target contract without overlap", async ({ page }, testInfo) => {
    test.skip(
      !["desktop-chromium", "ios-webkit", "android-chromium"].includes(testInfo.project.name),
      "The Progress target contract runs in desktop Chromium, iOS WebKit and Android Chromium.",
    );

    const compact = testInfo.project.name !== "desktop-chromium";
    const expectedMinimum = compact ? 48 : 44;
    await page.setViewportSize(compact ? { width: 390, height: 844 } : { width: 1440, height: 1024 });
    await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
    await installAPI(page, []);

    await page.goto("/progress");

    const dashboard = page.locator(".lx-progress-evidence");
    await expect(dashboard.getByRole("heading", { name: "Прогресс", exact: true })).toBeVisible();
    const isCoarsePointer = await page.evaluate(() => window.matchMedia("(pointer: coarse)").matches);
    expect(isCoarsePointer).toBe(compact);

    const nextAction = dashboard.locator(".lx-progress-evidence__next-action button");
    const weakButtons = dashboard.locator(".lx-progress-evidence__weak button");
    const statusBadges = dashboard.locator(".lx-progress-evidence__topic-status");
    const activityDisclosure = dashboard.locator(".lx-progress-evidence__activity summary");
    await expect(weakButtons).toHaveCount(3);
    await expect(statusBadges).toHaveCount(3);

    await expectMinimumTarget(nextAction, expectedMinimum);
    await expectMinimumTarget(activityDisclosure, expectedMinimum);
    await expectKeyboardFocus(page, nextAction);

    for (let index = 0; index < 3; index += 1) {
      const button = weakButtons.nth(index);
      const status = statusBadges.nth(index);
      const buttonBox = await expectMinimumTarget(button, expectedMinimum);
      const statusBox = await status.boundingBox();
      expect(statusBox).not.toBeNull();
      if (!statusBox) throw new Error("Expected a visible weak-area status bounding box");
      expectNoIntersection(buttonBox, statusBox, `weak-area row ${index + 1} action must not overlap its status badge`);
      await expectKeyboardFocus(page, button);
    }

    await expectKeyboardFocus(page, activityDisclosure);
    await activityDisclosure.click();
    await expect(dashboard.getByText("Поддержанное узнавание")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("reflows the dark compact dashboard at 200% text size without hiding evidence", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "ios-webkit", "Compact WebKit geometry is the highest-risk mobile contract.");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await installAPI(page, []);

    await page.goto("/progress");
    await applyTextZoom(page);

    const dashboard = page.locator(".lx-progress-evidence");
    await expect(dashboard.getByRole("heading", { name: "Прогресс", exact: true })).toBeVisible();
    await expect(dashboard.getByText("Что считается закреплённым:", { exact: false })).toBeVisible();
    await expect(dashboard.getByRole("heading", { name: "Слабые области" })).toBeVisible();
    await expect(page.locator('[data-route-navigation="mobile"]')).toBeVisible();
    await expect(page.locator('[data-route-navigation="rail"]')).toBeHidden();
    await expectNoHorizontalOverflow(page);
  });
});