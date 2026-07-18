import { expect, test, type Page, type Route } from "@playwright/test";

const SESSION = {
  user: {
    id: "00000000-0000-0000-0000-000000000046",
    email: "route-focus@example.com",
    displayName: "Route Focus User",
    createdAt: "2026-01-01T00:00:00Z",
  },
  tokens: {
    accessToken: "route-focus-access-token",
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
  totalPhrases: 36,
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
  currentStreak: 3,
  longestStreak: 5,
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
    id: 4601,
    kind: "word",
    lemma: "restore",
    translation: "восстанавливать",
    phonetic: "/rɪˈstɔː/",
    partOfSpeech: "verb",
    topic: "Accessibility",
    examples: ["Restore focus after navigation."],
    note: "History entries preserve their scroll position.",
    status: "new",
  },
  {
    id: 4602,
    kind: "word",
    lemma: "announce",
    translation: "объявлять",
    phonetic: "/əˈnaʊns/",
    partOfSpeech: "verb",
    topic: "Accessibility",
    examples: ["Announce the new screen."],
    note: "Use a polite live region for SPA transitions.",
    status: "new",
  },
];

const PHRASES = Array.from({ length: 36 }, (_, index) => ({
  id: 4700 + index,
  kind: "phrase" as const,
  slug: `route-focus-${index + 1}`,
  lemma: `Keep route focus ${index + 1}`,
  translation: `сохранять фокус маршрута ${index + 1}`,
  phonetic: "",
  partOfSpeech: "phrase",
  topic: index % 2 === 0 ? "Accessibility" : "Navigation",
  examples: [`Restore the logical position for route ${index + 1}.`],
  note: "Browser history must remain predictable.",
  status: "new",
}));

const METADATA = {
  catalogVersion: "sha256:route-focus-e2e",
  updatedAt: "2026-07-18T00:00:00Z",
  totals: { items: 38, words: 2, phrases: 36 },
  sources: {
    mixed: 38,
    noun: 0,
    verb: 2,
    adjective: 0,
    phrases: 36,
    dailyLife: 4,
    travel: 4,
    dataEngineering: 4,
    backend: 4,
  },
  topics: [
    { topic: "Accessibility", count: 19 },
    { topic: "Navigation", count: 19 },
  ],
};

async function fulfillJSON(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function installAPI(page: Page) {
  let reviewCount = 0;
  let lessonVersion = 1;

  await page.context().addCookies([{
    name: "lexigo_csrf",
    value: "route-focus-csrf",
    url: "http://127.0.0.1:3000",
    sameSite: "Lax",
  }]);

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path === "/api/v1/auth/refresh") {
      await fulfillJSON(route, 200, SESSION);
      return;
    }
    if (path === "/api/v1/catalog/metadata") {
      await fulfillJSON(route, 200, METADATA);
      return;
    }
    if (path === "/api/v1/progress") {
      await fulfillJSON(route, 200, PROGRESS);
      return;
    }
    if (path === "/api/v1/lessons/active") {
      await fulfillJSON(route, 404, {
        error: { code: "active_lesson_not_found", message: "active lesson was not found" },
      });
      return;
    }
    if ((path === "/api/v1/words" || path === "/api/v1/words/due")
      && url.searchParams.get("kind") === "phrase") {
      await fulfillJSON(route, 200, { items: PHRASES, count: PHRASES.length });
      return;
    }
    if (path === "/api/v1/words" || path === "/api/v1/words/due") {
      await fulfillJSON(route, 200, { items: WORDS, count: WORDS.length });
      return;
    }
    if (path === "/api/v1/lessons/preview") {
      const input = request.postDataJSON() as {
        source?: string;
        studyMode?: string;
        lessonSize?: string;
      };
      await fulfillJSON(route, 200, {
        source: input.source ?? "mixed",
        studyMode: input.studyMode ?? "study",
        lessonSize: input.lessonSize ?? "30",
        composition: {
          total: 2,
          words: 2,
          phrases: 0,
          due: 2,
          new: 0,
          scheduled: 0,
          availableWords: 2,
          availablePhrases: 0,
          fallback: "words_only",
        },
      });
      return;
    }
    if (path === "/api/v1/lessons" && request.method() === "POST") {
      const input = request.postDataJSON() as {
        source?: string;
        studyMode?: string;
        lessonSize?: string;
      };
      await fulfillJSON(route, 201, {
        id: "00000000-0000-0000-0000-000000000460",
        source: input.source ?? "mixed",
        studyMode: input.studyMode ?? "study",
        lessonSize: input.lessonSize ?? "30",
        currentIndex: 0,
        version: lessonVersion,
        status: "active",
        items: WORDS.map((item, position) => ({ ...item, position })),
        createdAt: "2026-07-18T00:00:00Z",
        updatedAt: "2026-07-18T00:00:00Z",
      });
      return;
    }
    if (path.endsWith("/review") && request.method() === "POST") {
      reviewCount += 1;
      lessonVersion += 1;
      await fulfillJSON(route, 200, {
        wordId: WORDS[Math.min(reviewCount - 1, WORDS.length - 1)].id,
        status: "learning",
        easiness: 2.5,
        intervalDays: 1,
        repetitions: reviewCount,
        dueAt: "2026-07-19T00:00:00Z",
        lastReviewedAt: "2026-07-18T00:00:00Z",
        lessonId: "00000000-0000-0000-0000-000000000460",
        lessonCurrentIndex: reviewCount,
        lessonVersion,
        lessonCompleted: reviewCount >= WORDS.length,
        lessonReviewedItems: reviewCount,
        lessonSkippedItems: 0,
        lessonTotalItems: WORDS.length,
      });
      return;
    }

    await fulfillJSON(route, 404, {
      error: { code: "not_mocked", message: path },
    });
  });
}

async function clickPrimaryNavigation(page: Page, view: "learn" | "phrases" | "progress") {
  const desktopLabels = {
    learn: "Обучение",
    phrases: "Фразы",
    progress: "Прогресс",
  } as const;
  const mobileLabels = {
    learn: "Учить",
    phrases: "Фразы",
    progress: "Прогресс",
  } as const;

  const desktop = page.locator(".lx-nav").getByRole("button", {
    name: desktopLabels[view],
    exact: true,
  });
  if (await desktop.isVisible()) {
    await desktop.click();
    return;
  }

  await page.locator(".lx-mobile-nav").getByRole("button", {
    name: mobileLabels[view],
    exact: true,
  }).click();
}

async function expectMainFocus(page: Page, label: string) {
  const main = page.locator("#lexigo-main-content");
  await expect(main).toBeFocused();
  await expect(main).toHaveAttribute("aria-label", label);
}

test.describe.configure({ timeout: 60_000 });

test.beforeEach(async ({ page }) => {
  await installAPI(page);
});

test("skip link reaches the main landmark and route navigation announces the new screen", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Продолжайте учиться/ })).toBeVisible();

  const skipLink = page.getByRole("link", { name: "Перейти к основному содержимому" });
  await skipLink.focus();
  await expect(skipLink).toBeFocused();
  await skipLink.press("Enter");
  await expectMainFocus(page, "Главная");

  await clickPrimaryNavigation(page, "learn");
  await expect(page).toHaveURL(/view=learn/);
  await expect(page.getByRole("heading", { name: "Настройте урок под текущую задачу" })).toBeVisible();
  await expectMainFocus(page, "Обучение");

  await expect(page.locator(".lx-nav").getByRole("button", {
    name: "Обучение",
    exact: true,
    includeHidden: true,
  })).toHaveAttribute("aria-current", "page");
  await expect(page.locator(".lx-mobile-nav").getByRole("button", {
    name: "Учить",
    exact: true,
    includeHidden: true,
  })).toHaveAttribute("aria-current", "page");
  await expect(page.locator(".lx-route-announcement"))
    .toHaveText("Обучение. Экран загружен.");
});

test("the skip link is the first desktop Tab stop", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Deterministic desktop Tab order is asserted once.");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Продолжайте учиться/ })).toBeVisible();

  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Перейти к основному содержимому" });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeVisible();
});

test("back and forward restore the matching scroll position and main focus", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Scroll restoration uses one deterministic desktop viewport.");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Продолжайте учиться/ })).toBeVisible();

  await clickPrimaryNavigation(page, "phrases");
  await expect(page.getByRole("heading", { name: "Готовые формулировки для работы" })).toBeVisible();
  await expectMainFocus(page, "Технические фразы");

  await page.evaluate(() => window.scrollTo({ top: 1_100, behavior: "auto" }));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(500);
  const savedScroll = await page.evaluate(() => window.scrollY);
  await page.waitForTimeout(100);

  await page.locator(".lx-nav").getByRole("button", { name: "Прогресс", exact: true })
    .evaluate((element) => (element as HTMLButtonElement).click());
  await expect(page).toHaveURL(/view=progress/);
  await expectMainFocus(page, "Прогресс");

  await page.goBack();
  await expect(page).toHaveURL(/view=phrases/);
  await expectMainFocus(page, "Технические фразы");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(savedScroll - 80);
  await expect(page.locator(".lx-route-announcement"))
    .toHaveText("Технические фразы. Экран загружен.");

  await page.goForward();
  await expect(page).toHaveURL(/view=progress/);
  await expectMainFocus(page, "Прогресс");
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(80);
  await expect(page.locator(".lx-route-announcement"))
    .toHaveText("Прогресс. Экран загружен.");
});

test("reduced motion changes route scrolling to instant behavior", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "The motion contract is asserted once in Chromium.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    const original = window.scrollTo.bind(window);
    const calls: ScrollToOptions[] = [];
    Object.defineProperty(window, "__lexigoScrollCalls", { value: calls, configurable: true });
    window.scrollTo = ((...args: Parameters<typeof window.scrollTo>) => {
      if (typeof args[0] === "object") calls.push(args[0]);
      original(...args);
    }) as typeof window.scrollTo;
  });

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Продолжайте учиться/ })).toBeVisible();
  await clickPrimaryNavigation(page, "learn");
  await expectMainFocus(page, "Обучение");

  const behavior = await page.evaluate(() => {
    const host = window as typeof window & { __lexigoScrollCalls?: ScrollToOptions[] };
    return host.__lexigoScrollCalls?.at(-1)?.behavior;
  });
  expect(behavior).toBe("auto");

  const transitionDuration = await page.getByRole("link", {
    name: "Перейти к основному содержимому",
  }).evaluate((element) => window.getComputedStyle(element).transitionDuration);
  const maximumTransitionSeconds = Math.max(
    ...transitionDuration.split(",").map((duration) => Number.parseFloat(duration)),
  );
  expect(maximumTransitionSeconds).toBeLessThanOrEqual(0.00001);
});

test("saving a review transfers focus locally without generating a route announcement", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium", "Keyboard review focus is deterministic in the desktop release profile.");
  await page.goto("/?view=learn");
  await expect(page.getByRole("heading", { name: "Настройте урок под текущую задачу" })).toBeVisible();

  await page.getByRole("button", { name: /Простое изучение слов/ }).click();
  const start = page.getByRole("button", { name: "Начать урок", exact: true });
  await expect(start).toBeEnabled();
  await start.click();
  await expect(page).toHaveURL(/view=lesson/);
  await expectMainFocus(page, "Урок");

  const announcement = page.locator(".lx-route-announcement");
  const announcementID = await announcement.getAttribute("data-announcement-id");
  const known = page.getByRole("button", { name: "Знал", exact: true });
  await known.focus();
  await known.press("Space");

  const advance = page.getByRole("button", { name: "Дальше", exact: true });
  await expect(advance).toBeEnabled();
  await expect(advance).toBeFocused();
  await expect(announcement).toHaveAttribute("data-announcement-id", announcementID ?? "");
  await expect(announcement).toHaveText("Урок. Экран загружен.");
});
