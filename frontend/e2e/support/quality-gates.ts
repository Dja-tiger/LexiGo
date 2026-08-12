import type { BrowserContext, Page, Route } from "@playwright/test";

export const QUALITY_SESSION = {
  user: {
    id: "00000000-0000-0000-0000-000000000058",
    email: "quality-gates@example.com",
    displayName: "Quality Gates",
    createdAt: "2026-01-01T00:00:00Z",
  },
  tokens: {
    accessToken: "quality-gates-access-token",
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

export const QUALITY_SCENARIOS = [
  {
    slug: "incident-update",
    type: "incident",
    title: "Incident update",
    summary: "Communicate impact, confirmed facts and the next checkpoint.",
    userRole: "on-call engineer",
    workplaceGoal: "Provide a precise incident update without overstating the root cause.",
    completionCriterion: "The update contains impact, evidence, action and the next checkpoint.",
    constraints: ["Separate confirmed facts from hypotheses", "Name the next checkpoint"],
    requiresFactHypothesis: true,
    estimatedMinutes: 12,
    version: 1,
    stepCount: 4,
  },
  {
    slug: "troubleshooting-plan",
    type: "troubleshooting",
    title: "Troubleshooting plan",
    summary: "Separate evidence from hypotheses and propose the next checks.",
    userRole: "backend engineer",
    workplaceGoal: "Propose a testable diagnostic plan.",
    completionCriterion: "The plan has evidence, hypotheses and executable next checks.",
    constraints: ["Keep hypotheses qualified", "Do not skip the evidence"],
    requiresFactHypothesis: true,
    estimatedMinutes: 15,
    version: 1,
    stepCount: 5,
  },
  {
    slug: "architecture-review",
    type: "architecture-review",
    title: "Architecture review",
    summary: "Explain trade-offs, constraints and risks of a proposed design.",
    userRole: "tech lead",
    workplaceGoal: "Defend a design decision with explicit trade-offs.",
    completionCriterion: "The decision, alternatives and risks are explicit.",
    constraints: ["Name at least one rejected alternative"],
    requiresFactHypothesis: false,
    estimatedMinutes: 14,
    version: 1,
    stepCount: 4,
  },
] as const;

export const QUALITY_PROGRESS = {
  dueNow: 4,
  dueWords: 3,
  duePhrases: 1,
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
  weekly: {
    weekStart: "2026-07-20",
    weekEnd: "2026-07-26",
    recallAttempts: 25,
    recallSuccessful: 19,
    recallRate: 76,
    previousRecallAttempts: 22,
    previousRecallSuccessful: 15,
    previousRecallRate: 68,
    choiceAttempts: 12,
    choiceSuccessful: 10,
    choiceRate: 83,
    reviews: 120,
    lessons: 9,
    activeMinutes: 64,
    trend: [
      { date: "2026-07-20", attempts: 4, successful: 3, rate: 75 },
      { date: "2026-07-21", attempts: 3, successful: 2, rate: 67 },
      { date: "2026-07-22", attempts: 4, successful: 3, rate: 75 },
      { date: "2026-07-23", attempts: 5, successful: 4, rate: 80 },
      { date: "2026-07-24", attempts: 3, successful: 2, rate: 67 },
      { date: "2026-07-25", attempts: 3, successful: 3, rate: 100 },
      { date: "2026-07-26", attempts: 3, successful: 2, rate: 67 },
    ],
    weakTopics: [
      { topic: "Incident", attempts: 5, successful: 2, errors: 3, rate: 40 },
      { topic: "Release", attempts: 4, successful: 2, errors: 2, rate: 50 },
    ],
    strongTopic: { topic: "Data Engineering", attempts: 6, successful: 6, errors: 0, rate: 100 },
  },
  eventSchemaVersion: 2,
  modes: {
    study: { ...EMPTY_MODE, attemptsToday: 4, successfulToday: 4, attemptsTotal: 72, successfulTotal: 68 },
    recall: { ...EMPTY_MODE, attemptsToday: 5, successfulToday: 4, attemptsTotal: 58, successfulTotal: 43 },
    choice: { ...EMPTY_MODE, attemptsToday: 3, successfulToday: 2, attemptsTotal: 54, successfulTotal: 45 },
    legacy: EMPTY_MODE,
  },
  scenarios: {
    completedThisWeek: 1,
    completedTotal: 2,
    recommendation: {
      slug: QUALITY_SCENARIOS[0].slug,
      type: QUALITY_SCENARIOS[0].type,
      title: QUALITY_SCENARIOS[0].title,
      estimatedMinutes: QUALITY_SCENARIOS[0].estimatedMinutes,
      reason: "resume_in_progress",
      action: "resume",
      completedCount: 1,
      lastCompletedAt: "2026-07-19T12:00:00Z",
    },
  },
};

export const QUALITY_WORDS = [
  {
    id: 101,
    kind: "word",
    lemma: "rollback",
    translation: "откат",
    aliases: ["roll back"],
    phonetic: "/ˈrəʊlbæk/",
    partOfSpeech: "noun",
    topic: "Release",
    examples: ["Prepare a rollback before the production deployment."],
    note: "A safe way to restore the previous release.",
    status: "review",
  },
  {
    id: 102,
    kind: "word",
    lemma: "throughput",
    translation: "пропускная способность",
    aliases: ["processing rate"],
    phonetic: "/ˈθruːpʊt/",
    partOfSpeech: "noun",
    topic: "Data Engineering",
    examples: ["Measure throughput before increasing concurrency."],
    note: "The amount of work processed per unit of time.",
    status: "learning",
  },
  {
    id: 103,
    kind: "word",
    lemma: "durable",
    translation: "надёжный, сохраняемый",
    aliases: ["persistent"],
    phonetic: "/ˈdjʊərəbl/",
    partOfSpeech: "adjective",
    topic: "Storage",
    examples: ["The event must be written to durable storage."],
    note: "Able to survive restarts or failures.",
    status: "new",
  },
] as const;

const QUALITY_PUBLIC_WORDS = QUALITY_WORDS.map((item) => ({
  id: item.id,
  kind: item.kind,
  lemma: item.lemma,
  translation: item.translation,
  aliases: item.aliases,
  phonetic: item.phonetic,
  partOfSpeech: item.partOfSpeech,
  topic: item.topic,
  examples: item.examples,
  note: item.note,
}));

export const QUALITY_PHRASES = [
  {
    id: 201,
    kind: "phrase",
    slug: "identify-root-cause",
    lemma: "We need to identify the root cause.",
    translation: "Нам нужно определить первопричину.",
    phonetic: "",
    partOfSpeech: "phrase",
    topic: "Incident",
    examples: ["We need to identify the root cause before applying another fix."],
    note: "Use during incident investigation.",
    cloze: "We need to identify the ____ cause.",
    clozeAnswer: "root",
    status: "review",
  },
  {
    id: 202,
    kind: "phrase",
    slug: "deployment-is-complete",
    lemma: "The deployment is complete.",
    translation: "Развёртывание завершено.",
    phonetic: "",
    partOfSpeech: "phrase",
    topic: "Release",
    examples: ["The deployment is complete and the smoke checks are green."],
    note: "Use for a concise release update.",
    cloze: "The deployment is ____.",
    clozeAnswer: "complete",
    status: "learning",
  },
] as const;

export const QUALITY_METADATA = {
  catalogVersion: "sha256:quality-gates",
  updatedAt: "2026-07-20T00:00:00Z",
  totals: {
    items: QUALITY_WORDS.length + QUALITY_PHRASES.length,
    words: QUALITY_WORDS.length,
    phrases: QUALITY_PHRASES.length,
  },
  sources: {
    mixed: QUALITY_WORDS.length + QUALITY_PHRASES.length,
    noun: 2,
    verb: 0,
    adjective: 1,
    phrases: QUALITY_PHRASES.length,
    dailyLife: 0,
    travel: 0,
    dataEngineering: 2,
    backend: 3,
    academicTechnicalEnglish: 0,
  },
  topics: [
    { topic: "Release", count: 2, words: 1, phrases: 1 },
    { topic: "Data Engineering", count: 1, words: 1, phrases: 0 },
    { topic: "Storage", count: 1, words: 1, phrases: 0 },
    { topic: "Incident", count: 1, words: 0, phrases: 1 },
  ],
};

async function fulfillJSON(route: Route, status: number, body: unknown): Promise<void> {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

function paginated(items: readonly unknown[]) {
  return {
    items,
    count: items.length,
    total: items.length,
    page: 1,
    pageSize: 48,
    totalPages: 1,
    hasPrevious: false,
    hasNext: false,
  };
}

export async function installDeterministicRuntime(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const install = () => {
      if (document.getElementById("lexigo-quality-gates-runtime")) return;
      const style = document.createElement("style");
      style.id = "lexigo-quality-gates-runtime";
      style.nonce = document.querySelector<HTMLElement>("[nonce]")?.nonce ?? "";
      style.textContent = [
        "*, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; caret-color: transparent !important; }",
        "html { color-scheme: light !important; }",
      ].join("\n");
      (document.head ?? document.documentElement).append(style);
    };

    if (document.documentElement) install();
    else document.addEventListener("DOMContentLoaded", install, { once: true });
  });
}

export async function installQualityGateAPI(
  context: BrowserContext,
  options: { authenticated?: boolean; progress?: unknown } = {},
): Promise<void> {
  const authenticated = options.authenticated ?? true;
  const progress = options.progress ?? QUALITY_PROGRESS;

  if (authenticated) {
    await context.addCookies([{
      name: "lexigo_csrf",
      value: "quality-gates-csrf",
      url: "http://127.0.0.1:3000",
      sameSite: "Lax",
    }]);
  }

  await context.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path === "/api/v1/auth/refresh") {
      if (authenticated) return fulfillJSON(route, 200, QUALITY_SESSION);
      return fulfillJSON(route, 401, { error: { code: "unauthorized", message: "guest" } });
    }
    if (path === "/api/v1/catalog/metadata") return fulfillJSON(route, 200, QUALITY_METADATA);
    if (path === "/api/v1/catalog/words" && request.method() === "GET") {
      return fulfillJSON(route, 200, paginated(QUALITY_PUBLIC_WORDS));
    }
    if (path.startsWith("/api/v1/catalog/words/") && request.method() === "GET") {
      const wordID = Number(path.slice("/api/v1/catalog/words/".length));
      const word = QUALITY_PUBLIC_WORDS.find((item) => item.id === wordID);
      if (word) return fulfillJSON(route, 200, word);
      return fulfillJSON(route, 404, { error: { code: "word_not_found", message: String(wordID) } });
    }
    if (path === "/api/v1/progress") return fulfillJSON(route, 200, progress);
    if (path === "/api/v1/scenarios" && request.method() === "GET") {
      return fulfillJSON(route, 200, { items: QUALITY_SCENARIOS, count: QUALITY_SCENARIOS.length });
    }
    if (path === "/api/v1/lessons/active") {
      return fulfillJSON(route, 404, { error: { code: "active_lesson_not_found", message: "not found" } });
    }
    if (path === "/api/v1/lessons/preview") {
      const input = request.postDataJSON() as { source?: string; studyMode?: string; lessonSize?: string };
      return fulfillJSON(route, 200, {
        source: input.source ?? "mixed",
        studyMode: input.studyMode ?? "study",
        lessonSize: input.lessonSize ?? "30",
        composition: {
          total: QUALITY_WORDS.length + QUALITY_PHRASES.length,
          words: QUALITY_WORDS.length,
          phrases: QUALITY_PHRASES.length,
          due: 4,
          new: 1,
          scheduled: 0,
          availableWords: QUALITY_WORDS.length,
          availablePhrases: QUALITY_PHRASES.length,
        },
      });
    }
    if (path === "/api/v1/words/101") return fulfillJSON(route, 200, QUALITY_WORDS[0]);
    if (path.startsWith("/api/v1/phrases/") && request.method() === "GET") {
      const slug = decodeURIComponent(path.slice("/api/v1/phrases/".length));
      const phrase = QUALITY_PHRASES.find((item) => item.slug === slug);
      if (phrase) return fulfillJSON(route, 200, phrase);
      return fulfillJSON(route, 404, { error: { code: "phrase_not_found", message: slug } });
    }
    if (path === "/api/v1/words" || path === "/api/v1/words/due") {
      const items = url.searchParams.get("kind") === "phrase" ? QUALITY_PHRASES : QUALITY_WORDS;
      return fulfillJSON(route, 200, paginated(items));
    }
    if (path === "/api/v1/auth/sessions" && request.method() === "GET") {
      return fulfillJSON(route, 200, {
        sessions: [{
          id: "quality-current-session",
          current: true,
          userAgent: "Mozilla/5.0 Chrome",
          ipAddress: "127.0.0.1",
          createdAt: "2026-07-20T08:00:00Z",
          lastSeenAt: "2026-07-20T12:00:00Z",
          expiresAt: "2026-08-20T08:00:00Z",
        }],
      });
    }
    if (path === "/api/v1/auth/audit-events" && request.method() === "GET") {
      return fulfillJSON(route, 200, { events: [] });
    }

    return fulfillJSON(route, 404, { error: { code: "not_mocked", message: path } });
  });
}

export function captureRuntimeErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("crash", () => errors.push("pagecrash: browser renderer terminated"));
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (text.includes("Failed to load resource") && text.includes("404")) return;
    errors.push(`console: ${text}`);
  });
  return errors;
}
