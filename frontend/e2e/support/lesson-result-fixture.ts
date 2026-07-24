import { expect, type Page, type Route } from "@playwright/test";

export type LessonResultFixtureOptions = {
  previewTotal?: number;
  dueNow?: number;
  reviewsBefore?: number;
  reviewsAfter?: number;
  dailyGoal?: number;
  repeatCompletedBlock?: boolean;
};

export type LessonResultFixture = {
  reviewRequests: () => number;
  lessonCreateRequests: () => number;
  previewRequests: () => number;
};

const SESSION = {
  user: {
    id: "00000000-0000-0000-0000-000000000194",
    email: "lesson-result@example.com",
    displayName: "Lesson Result",
    createdAt: "2026-01-01T00:00:00Z",
  },
  tokens: {
    accessToken: "lesson-result-token",
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

const COMPLETED_ITEM = {
  id: 19401,
  kind: "phrase",
  slug: "pipeline-backlog-result",
  lemma: "The pipeline is delayed by a backlog.",
  translation: "Пайплайн задерживается из-за очереди.",
  phonetic: "",
  partOfSpeech: "phrase",
  topic: "Data Engineering",
  acceptedAnswers: ["backlog"],
  examples: ["We reduced the backlog before the release."],
  note: "",
  cloze: "The pipeline is delayed by a ____.",
  clozeAnswer: "backlog",
  status: "review",
  position: 0,
};

const NEXT_ITEM = {
  id: 19402,
  kind: "phrase",
  slug: "verify-checkpoint-result",
  lemma: "Verify the checkpoint.",
  translation: "Проверьте контрольную точку.",
  phonetic: "",
  partOfSpeech: "phrase",
  topic: "Data Engineering",
  acceptedAnswers: ["checkpoint"],
  examples: ["Verify the checkpoint before recovery."],
  note: "",
  cloze: "Verify the ____.",
  clozeAnswer: "checkpoint",
  status: "new",
  position: 0,
};

async function fulfillJSON(route: Route, status: number, body: unknown): Promise<void> {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

export async function installLessonResultFixture(
  page: Page,
  options: LessonResultFixtureOptions = {},
): Promise<LessonResultFixture> {
  const previewTotal = options.previewTotal ?? 1;
  const dueNow = options.dueNow ?? 0;
  const reviewsBefore = options.reviewsBefore ?? 2;
  const reviewsAfter = options.reviewsAfter ?? reviewsBefore + 1;
  const dailyGoal = options.dailyGoal ?? 15;
  let reviewCount = 0;
  let lessonCreateCount = 0;
  let previewCount = 0;

  await page.context().addCookies([{
    name: "lexigo_csrf",
    value: "lesson-result-csrf",
    url: "http://127.0.0.1:3000",
    sameSite: "Lax",
  }]);

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path === "/api/v1/auth/refresh") return fulfillJSON(route, 200, SESSION);
    if (path === "/api/v1/catalog/metadata") {
      return fulfillJSON(route, 200, {
        catalogVersion: "sha256:lesson-result",
        updatedAt: "2026-07-24T00:00:00Z",
        totals: { items: 2, words: 0, phrases: 2 },
        sources: {
          mixed: 2,
          noun: 0,
          verb: 0,
          adjective: 0,
          phrases: 2,
          dailyLife: 0,
          travel: 0,
          dataEngineering: 2,
          backend: 0,
          academicTechnicalEnglish: 0,
        },
        topics: [{ topic: "Data Engineering", count: 2, words: 0, phrases: 2 }],
      });
    }
    if (path === "/api/v1/progress") {
      const reviewsToday = reviewCount > 0 ? reviewsAfter : reviewsBefore;
      return fulfillJSON(route, 200, {
        dueNow,
        dueWords: 0,
        duePhrases: dueNow,
        totalWords: 0,
        totalPhrases: 2,
        newWords: 0,
        learningWords: 0,
        reviewWords: 0,
        masteredWords: 0,
        masteredPhrases: 0,
        reviewsToday,
        successfulToday: reviewsToday,
        objectiveReviewsToday: reviewsToday,
        objectiveSuccessfulToday: reviewsToday,
        reviewsTotal: 100 + reviewsToday,
        dailyGoal,
        currentStreak: 4,
        longestStreak: 8,
        retainedItemsWeek: 6,
        retainedWordsWeek: 0,
        retainedPhrasesWeek: 6,
        eventSchemaVersion: 2,
        modes: {
          study: EMPTY_MODE,
          recall: { ...EMPTY_MODE, attemptsToday: reviewsToday, successfulToday: reviewsToday },
          choice: EMPTY_MODE,
          legacy: EMPTY_MODE,
        },
      });
    }
    if (path === "/api/v1/lessons/active") {
      return fulfillJSON(route, 404, { error: { code: "active_lesson_not_found", message: "none" } });
    }
    if (path === "/api/v1/lessons/preview") {
      previewCount += 1;
      const total = reviewCount > 0 ? previewTotal : 1;
      return fulfillJSON(route, 200, {
        source: "phrases",
        studyMode: "recall",
        lessonSize: "15",
        composition: {
          total,
          words: 0,
          phrases: total,
          due: 0,
          new: total,
          scheduled: 0,
          availableWords: 0,
          availablePhrases: total,
          fallback: total > 0 ? "phrases_only" : "none",
        },
      });
    }
    if (path === "/api/v1/lessons" && request.method() === "POST") {
      const nextRequest = lessonCreateCount > 0;
      lessonCreateCount += 1;
      const repeat = nextRequest && options.repeatCompletedBlock;
      const item = nextRequest && !repeat ? NEXT_ITEM : COMPLETED_ITEM;
      const lessonID = nextRequest && !repeat
        ? "00000000-0000-0000-0000-000000000195"
        : "00000000-0000-0000-0000-000000000194";
      return fulfillJSON(route, 201, {
        id: lessonID,
        source: "phrases",
        studyMode: "recall",
        lessonSize: "15",
        currentIndex: 0,
        version: 1,
        status: "active",
        items: [item],
        createdAt: "2026-07-24T00:00:00Z",
        updatedAt: "2026-07-24T00:00:00Z",
      });
    }
    if (path.endsWith("/review") && request.method() === "POST") {
      reviewCount += 1;
      const payload = request.postDataJSON() as Record<string, unknown>;
      return fulfillJSON(route, 200, {
        wordId: COMPLETED_ITEM.id,
        requestedRating: payload.rating,
        effectiveRating: payload.rating,
        correct: true,
        judgementSource: "server",
        judgementReason: "accepted_exact",
        matchedAnswer: "backlog",
        reviewEventId: 194,
        suggestionAvailable: false,
        lessonId: "00000000-0000-0000-0000-000000000194",
        lessonCurrentIndex: 1,
        lessonVersion: 2,
        lastReviewedAt: "2026-07-24T00:01:00Z",
        lessonCompleted: true,
        lessonReviewedItems: 1,
        lessonSkippedItems: 0,
        lessonTotalItems: 1,
      });
    }
    if (path === "/api/v1/words" || path === "/api/v1/words/due") {
      return fulfillJSON(route, 200, {
        items: [COMPLETED_ITEM, NEXT_ITEM],
        count: 2,
        total: 2,
        page: 1,
        pageSize: 48,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      });
    }

    return fulfillJSON(route, 404, {
      error: { code: "not_mocked", message: `${request.method()} ${path}` },
    });
  });

  return {
    reviewRequests: () => reviewCount,
    lessonCreateRequests: () => lessonCreateCount,
    previewRequests: () => previewCount,
  };
}

export async function completeRecallLesson(page: Page): Promise<void> {
  await page.goto("/learn", { waitUntil: "domcontentloaded" });
  const configure = page.getByRole("button", { name: "Настроить урок", exact: true });
  if (await configure.isVisible()) await configure.click();

  const start = page.getByRole("button", { name: "Начать урок", exact: true });
  await expect(start).toBeEnabled({ timeout: 15_000 });
  await start.click();
  await page.getByRole("textbox", { name: "Введите ответ" }).fill("backlog");
  await page.getByRole("button", { name: "Сверить ответ", exact: true }).click();
  await page.getByRole("button", { name: "Знал", exact: true }).click();
  await page.getByRole("button", { name: "К результатам", exact: true }).click();
  await expect(page.locator(".lx-lesson-result")).toBeVisible();
}
