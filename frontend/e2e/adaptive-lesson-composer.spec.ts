import { expect, test, type Page, type Route } from "@playwright/test";

const SESSION = {
  user: {
    id: "00000000-0000-0000-0000-000000000162",
    email: "composer@example.com",
    displayName: "Composer User",
    createdAt: "2026-01-01T00:00:00Z",
  },
  tokens: {
    accessToken: "composer-access-token",
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
  dueNow: 18,
  dueWords: 12,
  duePhrases: 6,
  totalWords: 80,
  totalPhrases: 20,
  newWords: 12,
  learningWords: 22,
  reviewWords: 44,
  masteredWords: 18,
  masteredPhrases: 6,
  reviewsToday: 7,
  successfulToday: 6,
  objectiveReviewsToday: 7,
  objectiveSuccessfulToday: 6,
  reviewsTotal: 340,
  dailyGoal: 30,
  currentStreak: 5,
  longestStreak: 9,
  retainedItemsWeek: 21,
  retainedWordsWeek: 15,
  retainedPhrasesWeek: 6,
  eventSchemaVersion: 2,
  modes: {
    study: EMPTY_MODE,
    recall: EMPTY_MODE,
    choice: EMPTY_MODE,
    legacy: EMPTY_MODE,
  },
};

const WORD = {
  id: 16201,
  kind: "word",
  lemma: "retention",
  translation: "удержание",
  phonetic: "/rɪˈtenʃən/",
  partOfSpeech: "noun",
  topic: "Learning",
  examples: ["Spaced repetition improves retention."],
  note: "A retained item remains available for recall.",
  status: "review",
};

const METADATA = {
  catalogVersion: "sha256:composer-e2e",
  updatedAt: "2026-07-24T00:00:00Z",
  totals: { items: 100, words: 80, phrases: 20 },
  sources: {
    mixed: 100,
    noun: 20,
    verb: 20,
    adjective: 20,
    phrases: 20,
    dailyLife: 10,
    travel: 10,
    dataEngineering: 20,
    backend: 20,
    academicTechnicalEnglish: 20,
  },
  topics: [{ topic: "Learning", count: 1, words: 1, phrases: 0 }],
};

type LessonRequest = {
  source?: string;
  studyMode?: string;
  lessonSize?: string;
};

async function fulfillJSON(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function installAPI(page: Page) {
  const lessonRequests: LessonRequest[] = [];
  const previewRequests: LessonRequest[] = [];

  await page.context().addCookies([{
    name: "lexigo_csrf",
    value: "composer-csrf",
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
    if (path === "/api/v1/words" || path === "/api/v1/words/due") {
      return fulfillJSON(route, 200, { items: [WORD], count: 1 });
    }
    if (path === "/api/v1/lessons/preview") {
      const input = request.postDataJSON() as LessonRequest;
      previewRequests.push(input);
      const requestedSize = input.lessonSize ?? "15";
      const total = requestedSize === "all" ? 100 : Number(requestedSize);
      return fulfillJSON(route, 200, {
        source: input.source ?? "mixed",
        studyMode: input.studyMode ?? "recall",
        lessonSize: requestedSize,
        composition: {
          total,
          words: Math.min(total, 80),
          phrases: Math.max(0, total - 80),
          due: Math.min(total, 18),
          new: Math.max(0, Math.min(total - 18, 12)),
          scheduled: Math.max(0, total - 30),
          availableWords: 80,
          availablePhrases: 20,
        },
      });
    }
    if (path === "/api/v1/lessons" && request.method() === "POST") {
      const input = request.postDataJSON() as LessonRequest;
      lessonRequests.push(input);
      return fulfillJSON(route, 201, {
        id: "00000000-0000-0000-0000-000000000162",
        source: input.source ?? "mixed",
        studyMode: input.studyMode ?? "recall",
        lessonSize: input.lessonSize ?? "15",
        currentIndex: 0,
        version: 1,
        status: "active",
        items: [{ ...WORD, position: 0 }],
        createdAt: "2026-07-24T00:00:00Z",
        updatedAt: "2026-07-24T00:00:00Z",
      });
    }

    return fulfillJSON(route, 404, {
      error: { code: "not_mocked", message: path },
    });
  });

  return { lessonRequests, previewRequests };
}

test.describe("progressive Lesson Composer", () => {
  test("mobile starts collapsed, exposes current recommendation and preserves selected payload", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "android-chromium", "The mobile disclosure contract is asserted in the Android profile.");
    await page.setViewportSize({ width: 390, height: 844 });
    const { lessonRequests } = await installAPI(page);
    await page.goto("/learn");

    const recommendation = page.getByRole("article", { name: "Рекомендуемый урок" });
    const configure = page.getByRole("button", { name: "Настроить урок" });
    const modeGroup = page.getByRole("radiogroup", { name: "Режим обучения" });

    await expect(recommendation).toBeVisible();
    await expect(configure).toHaveAttribute("aria-expanded", "false");
    await expect(modeGroup).toBeHidden();
    await expect(page.getByLabel(/Текущие параметры:/)).toContainText("Смешанная практика");
    await expect(page.getByLabel(/Текущие параметры:/)).toContainText("Воспроизведение");
    await expect(page.getByLabel(/Текущие параметры:/)).toContainText("15 элементов");
    await expect(recommendation.getByText("15", { exact: true })).toBeVisible();
    await expect(recommendation.getByText("0", { exact: true })).toBeVisible();

    await configure.focus();
    await page.keyboard.press("Enter");
    const manualSummary = page.getByRole("button", { name: /Ручная настройка/ });
    await expect(manualSummary).toBeVisible();
    await expect(manualSummary).toHaveAttribute("aria-expanded", "true");
    await expect(modeGroup).toBeVisible();

    await modeGroup.getByRole("radio", { name: /Выбрать вариант/ }).click();
    await page.getByRole("radiogroup", { name: "Раздел обучения" })
      .getByRole("radio", { name: /Academic Technical English/ })
      .click();
    await page.getByRole("radiogroup", { name: "Размер урока" })
      .getByRole("radio", { name: "15", exact: true })
      .click();

    await expect(manualSummary).toContainText("Academic Technical English · Варианты · 15 элементов");
    await manualSummary.focus();
    await page.keyboard.press("Space");

    await expect(recommendation).toBeVisible();
    await expect(page.getByLabel(/Текущие параметры:/)).toContainText("Academic Technical English");
    await expect(page.getByLabel(/Текущие параметры:/)).toContainText("Варианты");
    await expect(page.getByLabel(/Текущие параметры:/)).toContainText("15 элементов");

    const start = page.getByRole("button", { name: "Начать рекомендуемый урок" });
    await expect(start).toBeEnabled();
    await start.click();
    await expect(page).toHaveURL(/\/lesson\/active(?:\?|$)/);
    expect(lessonRequests).toHaveLength(1);
    expect(lessonRequests[0]).toMatchObject({
      source: "academic-technical-english",
      studyMode: "choice",
      lessonSize: "15",
    });
  });

  test("manual workload sends exact 15, 30, 50 and all tokens to preview and create", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "Manual request vocabulary is asserted once in deterministic desktop Chromium.");
    await page.setViewportSize({ width: 1440, height: 1024 });
    const { lessonRequests, previewRequests } = await installAPI(page);
    const cases = [
      { label: "15", token: "15" },
      { label: "30", token: "30" },
      { label: "50", token: "50" },
      { label: "Все", token: "all" },
    ] as const;

    for (const scenario of cases) {
      await page.goto("/learn");
      const sizeGroup = page.getByRole("radiogroup", { name: "Размер урока" });
      const size = sizeGroup.getByRole("radio", { name: scenario.label, exact: true });
      await expect(sizeGroup.getByRole("radio")).toHaveCount(4);
      if (scenario.token !== "15") await size.click();

      await expect.poll(() => previewRequests.at(-1)?.lessonSize).toBe(scenario.token);
      await expect(size).toHaveAttribute("aria-checked", "true");

      const start = page.getByRole("button", { name: "Начать урок", exact: true });
      await expect(start).toBeEnabled();
      await start.click();
      await expect(page).toHaveURL(/\/lesson\/active(?:\?|$)/);
      expect(lessonRequests.at(-1)?.lessonSize).toBe(scenario.token);
    }

    expect(lessonRequests.map((request) => request.lessonSize)).toEqual(["15", "30", "50", "all"]);
  });

  test("desktop keeps the complete composer visible without duplicate recommendation actions", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "Desktop geometry is deterministic in Chromium.");
    await page.setViewportSize({ width: 1440, height: 1024 });
    await installAPI(page);
    await page.goto("/learn");

    await expect(page.getByRole("article", { name: "Рекомендуемый урок" })).toBeHidden();
    await expect(page.getByRole("radiogroup", { name: "Режим обучения" })).toBeVisible();
    await expect(page.getByRole("radio", { name: /Вспомнить самостоятельно/ })).toHaveAttribute("aria-checked", "true");
    await expect(page.getByRole("button", { name: "Начать урок", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Начать рекомендуемый урок" })).toBeHidden();

    const columns = await page.locator(".lx-setup-card").evaluate((node) => getComputedStyle(node).gridTemplateColumns);
    expect(columns.trim().split(/\s+/)).toHaveLength(2);
  });

  test("reduced motion removes composer transitions", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "android-chromium", "Reduced-motion styles are asserted once on mobile.");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await installAPI(page);
    await page.goto("/learn");

    const configure = page.getByRole("button", { name: "Настроить урок" });
    const motion = await configure.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        transitionProperty: style.transitionProperty,
        transitionDuration: style.transitionDuration,
        animationName: style.animationName,
        animationDuration: style.animationDuration,
      };
    });

    expect(["", "none"]).toContain(motion.transitionProperty);
    expect(["", "0s"]).toContain(motion.transitionDuration);
    expect(["", "none"]).toContain(motion.animationName);
    expect(["", "0s"]).toContain(motion.animationDuration);
  });
});
