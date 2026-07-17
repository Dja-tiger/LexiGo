export type ModeProgress = {
  attemptsToday: number;
  successfulToday: number;
  attemptsTotal: number;
  successfulTotal: number;
};

export type ProgressModes = {
  study: ModeProgress;
  recall: ModeProgress;
  choice: ModeProgress;
  legacy: ModeProgress;
};

export type ProgressSummary = {
  dueNow: number;
  dueWords: number;
  duePhrases: number;
  totalWords: number;
  totalPhrases: number;
  newWords: number;
  learningWords: number;
  reviewWords: number;
  masteredWords: number;
  masteredPhrases: number;
  reviewsToday: number;
  successfulToday: number;
  objectiveReviewsToday?: number;
  objectiveSuccessfulToday?: number;
  reviewsTotal: number;
  dailyGoal: number;
  currentStreak: number;
  longestStreak: number;
  retainedItemsWeek: number;
  retainedWordsWeek: number;
  retainedPhrasesWeek: number;
  eventSchemaVersion?: number;
  modes?: ProgressModes;
  nextDueAt?: string;
};

export type ReviewRating = "again" | "almost" | "known";
export type AnswerMode = "study" | "recall" | "choice";

export type ReviewResult = {
  wordId: number;
  status: string;
  easiness: number;
  intervalDays: number;
  repetitions: number;
  dueAt: string;
  lastReviewedAt: string;
};

const EMPTY_MODE: ModeProgress = {
  attemptsToday: 0,
  successfulToday: 0,
  attemptsTotal: 0,
  successfulTotal: 0,
};

export function normalizedProgressModes(progress: ProgressSummary | null): ProgressModes {
  return progress?.modes ?? {
    study: { ...EMPTY_MODE },
    recall: { ...EMPTY_MODE },
    choice: { ...EMPTY_MODE },
    legacy: { ...EMPTY_MODE },
  };
}

export function objectiveSuccessRate(progress: ProgressSummary | null): number {
  if (!progress) return 0;
  const attempts = progress.objectiveReviewsToday ?? progress.reviewsToday;
  const successful = progress.objectiveSuccessfulToday ?? progress.successfulToday;
  return attempts > 0 ? Math.round((successful / attempts) * 100) : 0;
}

export function goalPercent(progress: ProgressSummary | null): number {
  if (!progress || progress.dailyGoal <= 0) return 0;
  return Math.min(100, Math.round((progress.reviewsToday / progress.dailyGoal) * 100));
}

export function ratingLabel(rating: ReviewRating): string {
  if (rating === "known") return "Знал";
  if (rating === "almost") return "Почти";
  return "Не знал";
}
