import type { Page, Route } from "@playwright/test";

export type ActiveLessonMode = "study" | "recall" | "choice";

export const ACTIVE_LESSON_SESSION = {
  user: {
    id: "00000000-0000-0000-0000-000000000193",
    email: "active-lesson@example.com",
    displayName: "Active Lesson",
    createdAt: "2026-01-01T00:00:00Z",
  },
  tokens: {
    accessToken: "active-lesson-access-token",
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

export const ACTIVE_LESSON_PROGRESS = {
  dueNow: 3,
  dueWords: 0,
  duePhrases: 3,
  totalWords: 64,
  totalPhrases: 24,
  newWords: 18,
  learningWords: 21,
  reviewWords: 17,
  masteredWords: 8,
  masteredPhrases: 5,
  reviewsToday: 12,
  successfulToday: 10,
  objectiveReviewsToday: 8,
  objectiveSuccessfulToday: 7,
  reviewsTotal: 184,
  dailyGoal: 30,
  currentStreak: 7,
  longestStreak: 12,
  retainedItemsWeek: 16,
  retainedWordsWeek: 12,
  retainedPhrasesWeek: 4,
  eventSchemaVersion: 2,
  modes: {
    study: { ...EMPTY_MODE, attemptsTotal: 72, successfulTotal: 68 },
    recall: { ...EMPTY_MODE, attemptsTotal: 58, successfulTotal: 43 },
    choice: { ...EMPTY_MODE, attemptsTotal: 54, successfulTotal: 45 },
    legacy: EMPTY_MODE,
  },
};

export const ACTIVE_LESSON_ITEMS = [
  {
    id: 19301,
    kind: "phrase",
    slug: "pipeline-backlog",
    lemma: "The pipeline is delayed by a backlog in the ingestion stage.",
    translation: "Пайплайн задерживается из-за очереди на этапе загрузки.",
    phonetic: "/ðə ˈpaɪplaɪn ɪz dɪˈleɪd baɪ ə ˈbæklɒɡ/",
    partOfSpeech: "phrase",
    topic: "Data Engineering",
    acceptedAnswers: ["backlog"],
    examples: ["We added capacity to reduce the backlog in the ingestion stage."],
    note: "Use backlog for accumulated work waiting to be processed.",
    cloze: "The pipeline is delayed by a ____ in the ingestion stage.",
    clozeAnswer: "backlog",
    status: "review",
    position: 0,
  },
  {
    id: 19302,
    kind: "phrase",
    slug: "skip-checkpoint",
    lemma: "Skip the checkpoint.",
    translation: "Пропустить контрольную точку.",
    phonetic: "",
    partOfSpeech: "phrase",
    topic: "Data Engineering",
    examples: ["Do not skip the checkpoint during recovery."],
    note: "",
    cloze: "Skip the ____.",
    clozeAnswer: "checkpoint",
    status: "review",
    position: 1,
  },
  {
    id: 19303,
    kind: "phrase",
    slug: "reduce-timeout",
    lemma: "Reduce the timeout.",
    translation: "Уменьшить таймаут.",
    phonetic: "",
    partOfSpeech: "phrase",
    topic: "Backend",
    examples: ["Reduce the timeout only after measuring retries."],
    note: "",
    cloze: "Reduce the ____.",
    clozeAnswer: "timeout",
    status: "review",
    position: 2,
  },
] as const;

export type ActiveLessonFixture = {
  reviewRequests: () => Array<Record<string, unknown>>;
  activeRequests: () => number;
};

async function fulfillJSON(route: Route, status: number, body: unknown): Promise<void> {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

export async function installActiveLessonFixture(
  page: Page,
  mode: ActiveLessonMode,
): Promise<ActiveLessonFixture> {
  const reviews: Array<Record<string, unknown>> = [];
  let activeRequestCount = 0;
  let version = 1;

  await page.context().addCookies([{
    name: "lexigo_csrf",
    value: "active-lesson-csrf",
    url: "http://127.0.0.1:3000",
    sameSite: "Lax",
  }]);

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path === "/api/v1/auth/refresh") {
      return fulfillJSON(route, 200, ACTIVE_LESSON_SESSION);
    }
    if (path === "/api/v1/catalog/metadata") {
      return fulfillJSON(route, 200, {
        catalogVersion: "sha256:active-lesson",
        updatedAt: "2026-07-24T00:00:00Z",
        totals: { items: 3, words: 0, phrases: 3 },
        sources: {
          mixed: 3,
          noun: 0,
          verb: 0,
          adjective: 0,
          phrases: 3,
          dailyLife: 0,
          travel: 0,
          dataEngineering: 2,
          backend: 1,
          academicTechnicalEnglish: 0,
        },
        topics: [{ topic: "Data Engineering", count: 2, words: 0, phrases: 2 }],
      });
    }
    if (path === "/api/v1/progress") {
      return fulfillJSON(route, 200, ACTIVE_LESSON_PROGRESS);
    }
    if (path === "/api/v1/lessons/active") {
      activeRequestCount += 1;
      return fulfillJSON(route, 200, {
        id: "00000000-0000-0000-0000-000000000193",
        source: "phrases",
        studyMode: mode,
        lessonSize: "15",
        currentIndex: 0,
        version,
        status: "active",
        items: ACTIVE_LESSON_ITEMS,
        createdAt: "2026-07-24T00:00:00Z",
        updatedAt: "2026-07-24T00:00:00Z",
      });
    }
    if (path.endsWith("/review") && request.method() === "POST") {
      const payload = request.postDataJSON() as Record<string, unknown>;
      reviews.push(payload);
      const submitted = typeof payload.submittedAnswer === "string"
        ? payload.submittedAnswer.trim().toLocaleLowerCase("en-US")
        : "";
      const correct = mode === "study" ? undefined : submitted === "backlog";
      version += 1;
      return fulfillJSON(route, 200, {
        wordId: ACTIVE_LESSON_ITEMS[0].id,
        requestedRating: payload.rating,
        effectiveRating: correct === false ? "again" : payload.rating,
        ...(correct === undefined ? {} : { correct }),
        judgementSource: mode === "study" ? "study" : "server",
        judgementReason: mode === "study"
          ? "study_exposure"
          : correct
            ? "accepted_exact"
            : submitted
              ? "rejected_no_match"
              : "rejected_no_answer",
        ...(correct ? { matchedAnswer: "backlog" } : {}),
        reviewEventId: reviews.length,
        suggestionAvailable: correct === false,
        lessonId: "00000000-0000-0000-0000-000000000193",
        lessonCurrentIndex: 1,
        lessonVersion: version,
        lastReviewedAt: "2026-07-24T00:01:00Z",
        lessonCompleted: false,
        lessonReviewedItems: 1,
        lessonSkippedItems: 0,
        lessonTotalItems: ACTIVE_LESSON_ITEMS.length,
      });
    }
    if (path.endsWith("/answer-suggestions") && request.method() === "POST") {
      return fulfillJSON(route, 201, { id: 1, status: "pending" });
    }
    if (path === "/api/v1/words" || path === "/api/v1/words/due") {
      return fulfillJSON(route, 200, {
        items: ACTIVE_LESSON_ITEMS,
        count: ACTIVE_LESSON_ITEMS.length,
        total: ACTIVE_LESSON_ITEMS.length,
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
    reviewRequests: () => [...reviews],
    activeRequests: () => activeRequestCount,
  };
}

export async function openActiveLesson(page: Page): Promise<void> {
  await page.goto("/lesson/active", { waitUntil: "domcontentloaded" });
  const continueLesson = page.getByRole("button", { name: "Продолжить урок", exact: true });
  await continueLesson.waitFor({ state: "visible" });
  await continueLesson.click();
}
