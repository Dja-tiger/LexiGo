import { expect, test } from "@playwright/test";

const SESSION = {
  user: { id: "00000000-0000-0000-0000-000000000178", email: "academic@example.com", displayName: "Academic Learner", createdAt: "2026-01-01T00:00:00Z" },
  tokens: { accessToken: "academic-token", tokenType: "Bearer", expiresIn: 900 },
};
const MODE = { attemptsToday: 0, successfulToday: 0, attemptsTotal: 0, successfulTotal: 0 };
const PROGRESS = {
  dueNow: 0, dueWords: 0, duePhrases: 0, totalWords: 579, totalPhrases: 0, newWords: 579, learningWords: 0,
  reviewWords: 0, masteredWords: 0, masteredPhrases: 0, reviewsToday: 0, successfulToday: 0,
  objectiveReviewsToday: 0, objectiveSuccessfulToday: 0, reviewsTotal: 0, dailyGoal: 15, currentStreak: 0,
  longestStreak: 0, retainedItemsWeek: 0, retainedWordsWeek: 0, retainedPhrasesWeek: 0, eventSchemaVersion: 2,
  modes: { study: MODE, recall: MODE, choice: MODE, legacy: MODE },
};
const ITEMS = [
  { id: 701, kind: "word", position: 0, lemma: "abstract", translation: "абстрактный", phonetic: "", partOfSpeech: "adjective", topic: "academic-technical-english", examples: ["The model uses an abstract representation."], note: "", status: "new" },
  { id: 702, kind: "word", position: 0, lemma: "accurate", translation: "точный", phonetic: "", partOfSpeech: "adjective", topic: "academic-technical-english", examples: ["The estimate must be accurate."], note: "", status: "new" },
];

test("Academic Technical English is selectable and preserved for the next block", async ({ page }) => {
  test.setTimeout(45_000);
  const createSources: string[] = [];
  const previewSources: string[] = [];
  await page.context().addCookies([{ name: "lexigo_csrf", value: "academic-csrf", url: "http://127.0.0.1:3000", sameSite: "Lax" }]);
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    if (path === "/api/v1/auth/refresh") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SESSION) });
    if (path === "/api/v1/progress") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PROGRESS) });
    if (path === "/api/v1/catalog/metadata") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      catalogVersion: "sha256:academic", updatedAt: "2026-07-23T00:00:00Z",
      totals: { items: 579, words: 579, phrases: 0 },
      sources: { mixed: 579, noun: 200, verb: 120, adjective: 180, phrases: 0, dailyLife: 0, travel: 0, dataEngineering: 0, backend: 0, academicTechnicalEnglish: 579 },
      topics: [{ topic: "academic-technical-english", count: 579, words: 579, phrases: 0 }],
    }) });
    if (path === "/api/v1/words" || path === "/api/v1/words/due") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: ITEMS, count: ITEMS.length }) });
    if (path === "/api/v1/lessons/active") return route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: { code: "active_lesson_not_found", message: "none" } }) });
    if (path === "/api/v1/lessons/preview") {
      const body = request.postDataJSON() as { source: string; studyMode: string; lessonSize: string };
      previewSources.push(body.source);
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ source: body.source, studyMode: body.studyMode, lessonSize: body.lessonSize, composition: { total: 1, words: 1, phrases: 0, due: 0, new: 1, scheduled: 0, availableWords: 579, availablePhrases: 0 } }) });
    }
    if (path === "/api/v1/lessons" && request.method() === "POST") {
      const body = request.postDataJSON() as { source: string };
      createSources.push(body.source);
      const index = Math.min(createSources.length - 1, ITEMS.length - 1);
      return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ id: `00000000-0000-0000-0000-00000000018${index}`, source: body.source, studyMode: "study", lessonSize: "15", currentIndex: 0, version: 1, status: "active", items: [ITEMS[index]], createdAt: "2026-07-23T00:00:00Z", updatedAt: "2026-07-23T00:00:00Z" }) });
    }
    if (path.endsWith("/review")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ wordId: 701, status: "learning", easiness: 2.5, intervalDays: 0, repetitions: 0, dueAt: "2026-07-24T00:00:00Z", lastReviewedAt: "2026-07-23T00:00:00Z", requestedRating: "known", effectiveRating: "known", judgementSource: "study", judgementReason: "passive_exposure", reviewEventId: 1, suggestionAvailable: false, lessonId: "00000000-0000-0000-0000-000000000180", lessonCurrentIndex: 1, lessonVersion: 2, lessonCompleted: true, lessonReviewedItems: 1, lessonSkippedItems: 0, lessonTotalItems: 1 }) });
    return route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: { code: "not_mocked", message: path } }) });
  });

  await page.goto("/learn");
  const academic = page.locator('[data-lexigo-source="academic-technical-english"]');

  // On mobile (<768px) the source controls are inside the progressive settings panel;
  // open it before interacting with source selectors.
  if ((page.viewportSize()?.width || 1000) < 768) {
    await page.getByRole("button", { name: "Настроить урок" }).click();
  }

  await expect(academic).toContainText("Academic Technical English");
  await expect(academic).toContainText("579");
  await academic.click();
  await expect(academic).toHaveAttribute("aria-checked", "true");
  const start = page.getByRole("button", { name: "Начать урок", exact: true });
  await expect(start).toBeEnabled({ timeout: 15_000 });
  await start.click();
  await expect(page.getByText("abstract", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Знал", exact: true }).click();
  await page.getByRole("button", { name: "К результатам", exact: true }).click();
  await page.getByRole("button", { name: "Следующий урок", exact: true }).click();
  await expect(page.getByText("accurate", { exact: true })).toBeVisible();
  expect(createSources).toEqual(["academic-technical-english", "academic-technical-english"]);
  expect(previewSources).toContain("academic-technical-english");
});

