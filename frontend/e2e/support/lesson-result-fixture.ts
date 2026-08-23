import { expect, type Page, type Route } from "@playwright/test";

export type LessonResultFixtureOptions = {
  previewTotal?: number;
  dueNow?: number;
  nextDueAt?: string | null;
  reviewsBefore?: number;
  reviewsAfter?: number;
  dailyGoal?: number;
  repeatCompletedBlock?: boolean;
  resumeWithReviewedItem?: boolean;
};

export type LessonResultActionRequest = {
  recommendedAction: string;
  selectedAction: string;
};

export type LessonResultFixture = {
  reviewRequests: () => number;
  lessonCreateRequests: () => number;
  previewRequests: () => number;
  resultActionRequests: () => LessonResultActionRequest[];
};

type LessonSessionKind = "study" | "review" | "remediation";

type LessonRequest = {
  source?: string;
  studyMode?: string;
  sessionKind?: LessonSessionKind;
  lessonSize?: string;
};

const ACTIVE_LESSON_HYDRATION = new WeakMap<Page, Promise<void>>();

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
  const nextDueAt = options.nextDueAt === undefined ? "2026-07-25T08:30:00Z" : options.nextDueAt;
  const reviewsBefore = options.reviewsBefore ?? 2;
  const reviewsAfter = options.reviewsAfter ?? reviewsBefore + 1;
  const dailyGoal = options.dailyGoal ?? 15;
  let reviewCount = 0;
  let lessonCreateCount = 0;
  let previewCount = 0;
  const resultActions: LessonResultActionRequest[] = [];
  let activeLesson: Record<string, unknown> | null = options.resumeWithReviewedItem ? {
    id: "00000000-0000-0000-0000-000000000194",
    source: "mixed",
    studyMode: "recall",
    lessonSize: "30",
    currentIndex: 1,
    version: 2,
    status: "active",
    items: [
      {
        ...COMPLETED_ITEM,
        rating: "known",
        reviewedAt: "2026-07-24T00:00:30Z",
      },
      {
        ...NEXT_ITEM,
        position: 1,
      },
    ],
    createdAt: "2026-07-24T00:00:00Z",
    updatedAt: "2026-07-24T00:00:30Z",
  } : null;
  let activeLessonHydrationResolved = false;
  let resolveActiveLessonHydration!: () => void;
  const activeLessonHydration = new Promise<void>((resolve) => {
    resolveActiveLessonHydration = resolve;
  });
  ACTIVE_LESSON_HYDRATION.set(page, activeLessonHydration);

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
        nextDueAt,
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
      if (activeLesson) {
        await fulfillJSON(route, 200, activeLesson);
      } else {
        await fulfillJSON(route, 404, { error: { code: "active_lesson_not_found", message: "none" } });
      }
      if (!activeLessonHydrationResolved) {
        activeLessonHydrationResolved = true;
        resolveActiveLessonHydration();
      }
      return;
    }
    if (path === "/api/v1/lessons/preview") {
      previewCount += 1;
      const input = request.postDataJSON() as LessonRequest;
      const legacyTotal = reviewCount > 0 ? previewTotal : 1;
      const available = input.sessionKind === "review"
        ? dueNow
        : input.sessionKind === "remediation"
          ? 0
          : legacyTotal;
      const total = input.sessionKind ? Math.min(15, available) : legacyTotal;
      return fulfillJSON(route, 200, {
        source: input.source ?? "mixed",
        studyMode: input.studyMode ?? "recall",
        ...(input.sessionKind ? { sessionKind: input.sessionKind } : {}),
        lessonSize: input.lessonSize ?? "30",
        composition: {
          total,
          words: 0,
          phrases: total,
          due: input.sessionKind === "review" ? total : 0,
          new: input.sessionKind === "review" || input.sessionKind === "remediation" ? 0 : total,
          scheduled: 0,
          availableWords: 0,
          availablePhrases: available,
          fallback: total > 0 ? "phrases_only" : "none",
        },
      });
    }
    if (path === "/api/v1/lessons" && request.method() === "POST") {
      const input = request.postDataJSON() as LessonRequest;
      const nextRequest = lessonCreateCount > 0;
      lessonCreateCount += 1;
      const repeat = nextRequest && options.repeatCompletedBlock;
      const item = nextRequest && !repeat ? NEXT_ITEM : COMPLETED_ITEM;
      const lessonID = nextRequest && !repeat
        ? "00000000-0000-0000-0000-000000000195"
        : "00000000-0000-0000-0000-000000000194";
      activeLesson = {
        id: lessonID,
        source: input.source ?? "mixed",
        studyMode: input.studyMode ?? "recall",
        ...(input.sessionKind ? { sessionKind: input.sessionKind } : {}),
        lessonSize: input.lessonSize ?? "30",
        currentIndex: 0,
        version: 1,
        status: "active",
        items: [item],
        createdAt: "2026-07-24T00:00:00Z",
        updatedAt: "2026-07-24T00:00:00Z",
      };
      return fulfillJSON(route, 201, activeLesson);
    }
    if (path.endsWith("/result-action") && request.method() === "POST") {
      resultActions.push(request.postDataJSON() as LessonResultActionRequest);
      await route.fulfill({ status: 204 });
      return;
    }
    if (path.endsWith("/review") && request.method() === "POST") {
      reviewCount += 1;
      const completedLesson = activeLesson;
      const payload = request.postDataJSON() as Record<string, unknown>;
      const reviewedWordId = path.includes(`/${NEXT_ITEM.id}/`) ? NEXT_ITEM.id : COMPLETED_ITEM.id;
      const lessonID = typeof completedLesson?.id === "string"
        ? completedLesson.id
        : "00000000-0000-0000-0000-000000000194";
      const lessonTotalItems = Array.isArray(completedLesson?.items) ? completedLesson.items.length : 1;
      activeLesson = null;
      return fulfillJSON(route, 200, {
        wordId: reviewedWordId,
        requestedRating: payload.rating,
        effectiveRating: payload.rating,
        correct: true,
        judgementSource: "server",
        judgementReason: "accepted_exact",
        matchedAnswer: reviewedWordId === NEXT_ITEM.id ? "checkpoint" : "backlog",
        reviewEventId: 194 + reviewCount,
        suggestionAvailable: false,
        lessonId: lessonID,
        lessonCurrentIndex: lessonTotalItems,
        lessonVersion: 3,
        lastReviewedAt: "2026-07-24T00:01:00Z",
        lessonCompleted: true,
        lessonReviewedItems: lessonTotalItems,
        lessonSkippedItems: 0,
        lessonTotalItems,
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
    resultActionRequests: () => [...resultActions],
  };
}

export async function completeRecallLesson(page: Page): Promise<void> {
  await page.goto("/learn", { waitUntil: "domcontentloaded" });
  const activeLessonHydration = ACTIVE_LESSON_HYDRATION.get(page);
  if (activeLessonHydration) await activeLessonHydration;

  const isCompact = (page.viewportSize()?.width ?? 1000) < 768;
  let start;

  if (isCompact) {
    // Compact Progressive UI owns a dedicated recommendation CTA. Interact with
    // the visible recommendation instead of searching for the desktop-only CTA.
    const recommendation = page.getByRole("article", { name: "Рекомендуемый урок" });
    await expect(recommendation).toBeVisible();
    await expect(page.getByLabel(/Текущие параметры:/)).toContainText("Воспроизведение");
    start = recommendation.getByRole("button", {
      name: "Начать рекомендуемый урок",
      exact: true,
    });
  } else {
    // Desktop exposes the full composer. Verify the deterministic Recall mode
    // before starting so this helper cannot silently exercise another mode.
    const modeGroup = page.getByRole("radiogroup", { name: "Режим обучения" });
    const recall = modeGroup.getByRole("radio", { name: /Вспомнить самостоятельно/ });
    await expect(recall).toHaveAttribute("aria-checked", "true");
    start = page.getByRole("button", { name: "Начать урок", exact: true });
  }

  await expect(start).toBeEnabled({ timeout: 15_000 });
  await start.click();
  await completeVisibleRecallCard(page, "backlog");
}

async function completeVisibleRecallCard(page: Page, answerValue: string): Promise<void> {
  const answer = page.getByRole("textbox", { name: "Введите ответ" });
  await answer.focus();
  await answer.fill(answerValue);
  await expect(answer).toHaveValue(answerValue);
  const submit = page.getByRole("button", { name: "Сверить ответ", exact: true });
  await expect(submit).toBeEnabled();
  await submit.click();
  await page.getByRole("button", { name: "Знал", exact: true }).click();
  await page.getByRole("button", { name: "К результатам", exact: true }).click();
  await expect(page.locator(".lx-lesson-result")).toBeVisible();
}
