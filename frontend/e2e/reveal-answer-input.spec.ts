import { expect, test, type Page } from "@playwright/test";

import { learningTermCopy } from "../lib/interface-copy";

const SESSION = {
  user: {
    id: "00000000-0000-0000-0000-000000000650",
    email: "reveal-input@example.com",
    displayName: "Reveal Input Tester",
    createdAt: "2026-01-01T00:00:00Z",
  },
  tokens: {
    accessToken: "e2e-access-token",
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
  dueNow: 0,
  dueWords: 0,
  duePhrases: 0,
  totalWords: 1,
  totalPhrases: 0,
  newWords: 1,
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
  currentStreak: 0,
  longestStreak: 0,
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

const WORD = {
  id: 650,
  kind: "word",
  lemma: "durable",
  translation: "надёжный",
  acceptedAnswers: ["надёжный", "прочный"],
  phonetic: "/ˈdjʊərəbl/",
  partOfSpeech: "adjective",
  topic: "Data",
  examples: ["Use durable storage."],
  note: "",
  status: "new",
  position: 0,
};

async function installLessonAPI(page: Page) {
  let activeLesson: Record<string, unknown> | null = null;
  const reviewRequests: Record<string, unknown>[] = [];

  await page.context().addCookies([{
    name: "lexigo_csrf",
    value: "e2e-csrf-token",
    url: "http://127.0.0.1:3000",
    sameSite: "Lax",
  }]);

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path === "/api/v1/auth/refresh") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(SESSION),
      });
    }

    if (path === "/api/v1/catalog/metadata") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          catalogVersion: "sha256:issue-650",
          updatedAt: "2026-08-24T00:00:00Z",
          totals: { items: 1, words: 1, phrases: 0 },
          sources: {
            mixed: 1,
            noun: 0,
            verb: 0,
            adjective: 1,
            phrases: 0,
            dailyLife: 0,
            travel: 0,
            dataEngineering: 1,
            backend: 0,
            academicTechnicalEnglish: 0,
          },
          topics: [{ topic: "Data", count: 1 }],
        }),
      });
    }

    if (path === "/api/v1/progress") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(PROGRESS),
      });
    }

    if (path === "/api/v1/words" || path === "/api/v1/words/due") {
      if (url.searchParams.get("kind") === "phrase") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ items: [], count: 0 }),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [WORD], count: 1 }),
      });
    }

    if (path === "/api/v1/lessons/preview") {
      const input = request.postDataJSON() as {
        source?: string;
        studyMode?: string;
        lessonSize?: string;
      };
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          source: input.source ?? "mixed",
          studyMode: input.studyMode ?? "recall",
          lessonSize: input.lessonSize ?? "15",
          composition: {
            total: 1,
            words: 1,
            phrases: 0,
            due: 0,
            new: 1,
            scheduled: 0,
            availableWords: 1,
            availablePhrases: 0,
            fallback: "words_only",
          },
        }),
      });
    }

    if (path === "/api/v1/lessons/active") {
      return activeLesson
        ? route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify(activeLesson),
          })
        : route.fulfill({
            status: 404,
            contentType: "application/json",
            body: JSON.stringify({
              error: {
                code: "active_lesson_not_found",
                message: "active lesson was not found",
              },
            }),
          });
    }

    if (path === "/api/v1/lessons" && request.method() === "POST") {
      const input = request.postDataJSON() as Record<string, unknown>;
      activeLesson = {
        id: "00000000-0000-0000-0000-000000000650",
        source: "mixed",
        studyMode: input.studyMode,
        lessonSize: "1",
        currentIndex: 0,
        version: 1,
        status: "active",
        items: [WORD],
        createdAt: "2026-08-24T00:00:00Z",
        updatedAt: "2026-08-24T00:00:00Z",
      };
      return route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(activeLesson),
      });
    }

    if (path.endsWith("/review") && request.method() === "POST") {
      const input = request.postDataJSON() as Record<string, unknown>;
      reviewRequests.push(input);
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          wordId: WORD.id,
          status: "learning",
          easiness: 2.5,
          intervalDays: 1,
          repetitions: 1,
          dueAt: "2026-08-25T00:00:00Z",
          lastReviewedAt: "2026-08-24T00:00:00Z",
          requestedRating: input.rating,
          effectiveRating: input.rating,
          correct: true,
          judgementSource: "server",
          judgementReason: "accepted_exact",
          matchedAnswer: "надёжный",
          reviewEventId: 650,
          suggestionAvailable: false,
          lessonId: "00000000-0000-0000-0000-000000000650",
          lessonCurrentIndex: 1,
          lessonVersion: 2,
          lessonCompleted: true,
          lessonReviewedItems: 1,
          lessonSkippedItems: 0,
          lessonTotalItems: 1,
        }),
      });
    }

    return route.fulfill({
      status: 404,
      contentType: "application/json",
      body: JSON.stringify({
        error: { code: "not_mocked", message: path },
      }),
    });
  });

  return {
    reviewRequests: () => reviewRequests,
  };
}

async function openRecallLesson(page: Page) {
  await page.goto("/learn");

  if ((page.viewportSize()?.width ?? 1000) < 768) {
    await page.getByRole("button", { name: "Настроить урок" }).click();
  }

  await page
    .getByRole("radio", { name: new RegExp(learningTermCopy("recall").label) })
    .click();

  const startLesson = page.getByRole("button", {
    name: "Начать урок",
    exact: true,
  });
  await expect(startLesson).toBeEnabled({ timeout: 15_000 });
  await startLesson.click();
  await expect(page).toHaveURL(/\/lesson\/active(?:\?|$)/);
}

test("Reveal answer keeps Recall input focusable and editable before rating", async ({ page }) => {
  const api = await installLessonAPI(page);
  await openRecallLesson(page);

  const answer = page.getByRole("textbox", { name: "Введите ответ" });
  await expect(answer).toBeEditable();
  await expect(answer).toHaveValue("");

  await page
    .getByRole("button", { name: "Не помню — показать ответ", exact: true })
    .click();

  await expect(page.getByText(/Правильный ответ:/)).toContainText("надёжный");
  await expect(answer).toBeEditable();

  // The second tap/click is the user gesture that must be allowed to focus the
  // native input on mobile WebKit so the operating system can present its keyboard.
  await answer.click();
  await expect(answer).toBeFocused();
  await page.keyboard.type("надёжный");
  await expect(answer).toHaveValue("надёжный");

  // Re-entering reveal semantics through Enter is idempotent and must not lock input.
  await answer.press("Enter");
  await expect(answer).toBeEditable();
  await expect(answer).toHaveValue("надёжный");

  await answer.fill("прочный");
  await expect(answer).toHaveValue("прочный");
  await answer.fill("надёжный");

  await page.getByRole("button", { name: "Знал", exact: true }).click();
  await expect.poll(() => api.reviewRequests().length).toBe(1);
  expect(api.reviewRequests()[0]).toMatchObject({
    answerMode: "recall",
    answerRevealed: true,
    submittedAnswer: "надёжный",
    rating: "known",
  });

  // Once the review is persisted, editing would misrepresent immutable server evidence.
  await expect(answer).not.toBeEditable();
});
