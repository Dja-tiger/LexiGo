import type { Page, Route } from "@playwright/test";

export const CANONICAL_WORD_DETAIL = {
  id: 101,
  kind: "word" as const,
  lemma: "rollback",
  translation: "откат",
  aliases: ["roll back"],
  acceptedAnswers: ["откат", "возврат к предыдущей версии"],
  phonetic: "/ˈrəʊlbæk/",
  partOfSpeech: "noun",
  topic: "Release",
  examples: ["Prepare a rollback before the production deployment."],
  note: "A safe way to restore the previous release.",
  status: "review",
  easiness: 2.6,
  intervalDays: 8,
  repetitions: 3,
  dueAt: "2026-07-27T08:00:00Z",
  lastReviewedAt: "2026-07-19T08:00:00Z",
};

async function fulfillJSON(route: Route, status: number, body: unknown): Promise<void> {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

export async function installCanonicalWordDetailFixture(
  page: Page,
  word: typeof CANONICAL_WORD_DETAIL = CANONICAL_WORD_DETAIL,
): Promise<void> {
  await page.route("**/api/v1/words/101", (route) => fulfillJSON(route, 200, word));
}
