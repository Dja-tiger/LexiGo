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

export const CANONICAL_RELATED_PHRASES = [
  {
    id: 301,
    kind: "phrase" as const,
    slug: "prepare-a-rollback-plan",
    lemma: "Prepare a rollback plan",
    translation: "Подготовить план отката",
    phonetic: "",
    partOfSpeech: "phrase",
    topic: "Release",
    examples: ["Prepare a rollback plan before production deployment."],
    note: "Release readiness phrase.",
    status: "learning",
  },
  {
    id: 302,
    kind: "phrase" as const,
    slug: "trigger-a-safe-rollback",
    lemma: "Trigger a safe rollback",
    translation: "Запустить безопасный откат",
    phonetic: "",
    partOfSpeech: "phrase",
    topic: "Release",
    examples: ["Trigger a safe rollback if the smoke checks fail."],
    note: "Incident response phrase.",
    status: "review",
  },
  {
    id: 303,
    kind: "phrase" as const,
    slug: "rollback-window",
    lemma: "Rollback window",
    translation: "Окно для отката",
    phonetic: "",
    partOfSpeech: "phrase",
    topic: "Release",
    examples: ["Confirm the rollback window with the release manager."],
    note: "Release coordination phrase.",
    status: "new",
  },
];

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
  await page.route("**/api/v1/words?*", async (route) => {
    const url = new URL(route.request().url());
    if (
      route.request().method() !== "GET"
      || url.searchParams.get("kind") !== "phrase"
      || url.searchParams.get("query") !== word.lemma
    ) {
      await route.fallback();
      return;
    }
    await fulfillJSON(route, 200, {
      items: CANONICAL_RELATED_PHRASES,
      count: CANONICAL_RELATED_PHRASES.length,
      total: CANONICAL_RELATED_PHRASES.length,
      page: 1,
      pageSize: 3,
      totalPages: 1,
      hasPrevious: false,
      hasNext: false,
    });
  });
}
