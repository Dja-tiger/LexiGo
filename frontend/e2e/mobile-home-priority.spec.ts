import { expect, test, type Page, type Route } from "@playwright/test";

import { learningTermCopy } from "../lib/interface-copy";

const SESSION = {
  user: {
    id: "00000000-0000-0000-0000-000000000063",
    email: "mobile-home@example.com",
    displayName: "Mobile Home User",
    createdAt: "2026-01-01T00:00:00Z",
  },
  tokens: {
    accessToken: "mobile-home-access-token",
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
  dueNow: 12,
  dueWords: 8,
  duePhrases: 4,
  totalWords: 80,
  totalPhrases: 20,
  newWords: 14,
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
  id: 6301,
  kind: "word",
  lemma: "priority",
  translation: "приоритет",
  phonetic: "/praɪˈɒrəti/",
  partOfSpeech: "noun",
  topic: "Mobile UX",
  examples: ["Keep the next learning action above the fold."],
  note: "The active lesson has priority over a new queue.",
  status: "review",
};

const METADATA = {
  catalogVersion: "sha256:mobile-home-e2e",
  updatedAt: "2026-07-22T00:00:00Z",
  totals: { items: 1, words: 1, phrases: 0 },
  sources: {
    mixed: 1,
    noun: 1,
    verb: 0,
    adjective: 0,
    phrases: 0,
    dailyLife: 0,
    travel: 0,
    dataEngineering: 0,
    backend: 0,
    academicTechnicalEnglish: 0,
  },
  topics: [{ topic: "Mobile UX", count: 1, words: 1, phrases: 0 }],
};

function createDeferred(): { promise: Promise<void>; resolve: () => void } {
  let resolve!: () => void;
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

async function fulfillJSON(route: Route, status: number, body: unknown) {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

async function installAPI(
  page: Page,
  options: { activeLesson?: boolean; progressGate?: Promise<void> } = {},
) {
  await page.context().addCookies([{
    name: "lexigo_csrf",
    value: "mobile-home-csrf",
    url: "http://127.0.0.1:3000",
    sameSite: "Lax",
  }]);

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path === "/api/v1/auth/refresh") return fulfillJSON(route, 200, SESSION);
    if (path === "/api/v1/catalog/metadata") return fulfillJSON(route, 200, METADATA);
    if (path === "/api/v1/progress") {
      if (options.progressGate) await options.progressGate;
      return fulfillJSON(route, 200, PROGRESS);
    }
    if (path === "/api/v1/lessons/active") {
      if (!options.activeLesson) {
        return fulfillJSON(route, 404, {
          error: { code: "active_lesson_not_found", message: "active lesson was not found" },
        });
      }
      return fulfillJSON(route, 200, {
        id: "00000000-0000-0000-0000-000000000630",
        source: "mixed",
        studyMode: "recall",
        lessonSize: "15",
        currentIndex: 0,
        version: 1,
        status: "active",
        items: [{ ...WORD, position: 0 }],
        createdAt: "2026-07-22T00:00:00Z",
        updatedAt: "2026-07-22T00:00:00Z",
      });
    }
    if (path === "/api/v1/lessons/preview" && request.method() === "POST") {
      if (options.progressGate) await options.progressGate;
      const input = request.postDataJSON() as Record<string, unknown>;
      const sessionKind = typeof input.sessionKind === "string" ? input.sessionKind : "";
      const backlog = sessionKind === "review" ? 12 : 0;
      return fulfillJSON(route, 200, {
        source: input.source ?? "mixed",
        studyMode: input.studyMode ?? "study",
        ...(sessionKind ? { sessionKind } : {}),
        lessonSize: input.lessonSize ?? "15",
        composition: {
          total: Math.min(15, backlog),
          words: Math.min(15, backlog),
          phrases: 0,
          due: sessionKind === "review" ? Math.min(15, backlog) : 0,
          new: sessionKind === "study" ? Math.min(15, backlog) : 0,
          scheduled: 0,
          availableWords: backlog,
          availablePhrases: 0,
        },
      });
    }
    if (path === "/api/v1/words" || path === "/api/v1/words/due") {
      return fulfillJSON(route, 200, { items: [WORD], count: 1 });
    }

    return fulfillJSON(route, 404, {
      error: { code: "not_mocked", message: path },
    });
  });
}

async function boundingBoxOrFail(locator: ReturnType<Page["locator"]>) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  return box!;
}

test.describe("compact mobile home priority", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
  });

  test("keeps the due CTA and daily status above the mobile fold without shifting the hero", async ({ page }) => {
    await page.addInitScript(() => {
      const state = window as typeof window & { __lexigoLayoutShifts?: number[] };
      state.__lexigoLayoutShifts = [];
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
          if (!shift.hadRecentInput) state.__lexigoLayoutShifts?.push(shift.value);
        }
      }).observe({ type: "layout-shift", buffered: true });
    });

    const progressGate = createDeferred();
    await installAPI(page, { progressGate: progressGate.promise });
    await page.goto("/");

    const hero = page.locator(".lx-home-next-action .lx-hero-card");
    const progressPanel = page.locator(".lx-home-next-action .lx-progress-panel");
    await expect(page.getByRole("heading", { name: "Проверяем учебные процессы" })).toBeVisible();
    const pendingHero = await boundingBoxOrFail(hero);
    const pendingProgressPanel = await boundingBoxOrFail(progressPanel);
    const pendingDueRow = progressPanel.locator(".lx-progress-list > div").first();
    await expect(pendingDueRow).toContainText(learningTermCopy("due").label);
    await expect(pendingDueRow.getByText("—", { exact: true })).toBeVisible();

    progressGate.resolve();

    const primaryCTA = page.getByRole("button", { name: "Повторить 12", exact: true });
    await expect(primaryCTA).toBeVisible();
    const readyHero = await boundingBoxOrFail(hero);
    const readyProgressPanel = await boundingBoxOrFail(progressPanel);
    const ctaBox = await boundingBoxOrFail(primaryCTA);

    expect(Math.abs(readyHero.y - pendingHero.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(readyHero.height - pendingHero.height)).toBeLessThanOrEqual(1);
    expect(Math.abs(readyProgressPanel.y - pendingProgressPanel.y)).toBeLessThanOrEqual(1);
    expect(Math.abs(readyProgressPanel.height - pendingProgressPanel.height)).toBeLessThanOrEqual(1);
    expect(readyHero.height).toBeLessThanOrEqual(320);
    expect(ctaBox.y + ctaBox.height).toBeLessThan(844 - 82);
    await expect(page.locator(".lx-home-next-action .lx-hero-art")).toBeHidden();

    await expect(progressPanel).toContainText("7 из 30");
    const dueRow = progressPanel.locator(".lx-progress-list > div").first();
    await expect(dueRow).toContainText(learningTermCopy("due").label);
    await expect(dueRow.getByText("12", { exact: true })).toBeVisible();

    for (const locator of [progressPanel.getByText("7 из 30", { exact: true }), dueRow]) {
      const box = await boundingBoxOrFail(locator);
      expect(box.y + box.height).toBeLessThan(844 - 82);
    }

    await page.waitForTimeout(100);
    const cumulativeLayoutShift = await page.evaluate(() => {
      const state = window as typeof window & { __lexigoLayoutShifts?: number[] };
      return (state.__lexigoLayoutShifts ?? []).reduce((sum, value) => sum + value, 0);
    });
    expect(cumulativeLayoutShift).toBeLessThanOrEqual(0.02);
  });

  test("keeps an unfinished lesson ahead of the due queue", async ({ page }) => {
    await installAPI(page, { activeLesson: true });
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Продолжите с сохранённой позиции" })).toBeVisible();
    const resumeCTA = page.getByRole("button", { name: "Продолжить урок" });
    await expect(resumeCTA).toBeVisible();
    await expect(page.locator('[data-home-process="review"]')).toHaveCount(0);

    const box = await boundingBoxOrFail(resumeCTA);
    expect(box.y + box.height).toBeLessThan(844 - 82);
  });
});
