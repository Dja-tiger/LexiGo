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
  listening?: ModeProgress;
  legacy: ModeProgress;
};

export type NormalizedProgressModes = {
  study: ModeProgress;
  recall: ModeProgress;
  choice: ModeProgress;
  listening: ModeProgress;
  legacy: ModeProgress;
};

export type DailyRecallEvidence = {
  date: string;
  attempts: number;
  successful: number;
  rate: number;
};

export type TopicEvidence = {
  topic: string;
  attempts: number;
  successful: number;
  errors: number;
  rate: number;
};

export type PartOfSpeechEvidence = {
  partOfSpeech: string;
  attempts: number;
  successful: number;
  errors: number;
  rate: number;
};

export type WeeklyProgressEvidence = {
  weekStart: string;
  weekEnd: string;
  recallAttempts: number;
  recallSuccessful: number;
  recallRate: number;
  previousRecallAttempts: number;
  previousRecallSuccessful: number;
  previousRecallRate: number;
  choiceAttempts: number;
  choiceSuccessful: number;
  choiceRate: number;
  reviews: number;
  lessons: number;
  activeMinutes: number;
  trend: DailyRecallEvidence[];
  weakTopics: TopicEvidence[];
  weakPartsOfSpeech: PartOfSpeechEvidence[];
  strongTopic?: TopicEvidence;
};

export type ProcessRetentionEvidence = {
  attempts: number;
  successful: number;
  rate: number;
};

export type LearningProcessEvidence = {
  weekStart: string;
  weekEnd: string;
  newLearned: number;
  dueReviewed: number;
  remediationReviewed: number;
  reviewBacklog: number;
  lapses: number;
  retention: ProcessRetentionEvidence;
};

export type ScenarioRecommendationReason =
  | "resume_in_progress"
  | "first_uncompleted"
  | "least_recently_completed";

export type ScenarioRecommendationAction = "start" | "resume";

export type ScenarioRecommendation = {
  slug: string;
  type: "incident" | "troubleshooting" | "architecture-review" | "data-pipeline" | "release" | "status-update";
  title: string;
  estimatedMinutes: number;
  reason: ScenarioRecommendationReason;
  action: ScenarioRecommendationAction;
  completedCount: number;
  lastCompletedAt?: string;
};

export type ScenarioProgressEvidence = {
  completedThisWeek: number;
  completedTotal: number;
  recommendation?: ScenarioRecommendation;
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
  weekly?: WeeklyProgressEvidence;
  processes?: LearningProcessEvidence;
  scenarios?: ScenarioProgressEvidence;
  nextDueAt?: string;
};

export type ReviewRating = "again" | "almost" | "known";
export type AnswerMode = "study" | "recall" | "choice" | "listening";

export type ReviewResult = {
  wordId: number;
  status: string;
  easiness: number;
  intervalDays: number;
  repetitions: number;
  dueAt: string;
  lastReviewedAt: string;
};

export const MAX_DUE_REVIEW_LESSON_ITEMS = 60;

const EMPTY_MODE: ModeProgress = {
  attemptsToday: 0,
  successfulToday: 0,
  attemptsTotal: 0,
  successfulTotal: 0,
};

const EMPTY_TREND: DailyRecallEvidence[] = Array.from({ length: 7 }, () => ({
  date: "",
  attempts: 0,
  successful: 0,
  rate: 0,
}));

export function normalizedProgressModes(progress: ProgressSummary | null): NormalizedProgressModes {
  const modes = progress?.modes;
  return {
    study: modes?.study ?? { ...EMPTY_MODE },
    recall: modes?.recall ?? { ...EMPTY_MODE },
    choice: modes?.choice ?? { ...EMPTY_MODE },
    listening: modes?.listening ?? { ...EMPTY_MODE },
    legacy: modes?.legacy ?? { ...EMPTY_MODE },
  };
}

export function normalizedWeeklyEvidence(progress: ProgressSummary): WeeklyProgressEvidence {
  if (progress.weekly) {
    return {
      ...progress.weekly,
      trend: progress.weekly.trend.length === 7
        ? progress.weekly.trend
        : [...progress.weekly.trend, ...EMPTY_TREND].slice(0, 7),
      weakTopics: progress.weekly.weakTopics ?? [],
      weakPartsOfSpeech: progress.weekly.weakPartsOfSpeech ?? [],
    };
  }

  const modes = normalizedProgressModes(progress);
  const recallAttempts = modes.recall.attemptsToday;
  const recallSuccessful = modes.recall.successfulToday;
  const choiceAttempts = modes.choice.attemptsToday;
  const choiceSuccessful = modes.choice.successfulToday;

  return {
    weekStart: "",
    weekEnd: "",
    recallAttempts,
    recallSuccessful,
    recallRate: percentage(recallSuccessful, recallAttempts),
    previousRecallAttempts: 0,
    previousRecallSuccessful: 0,
    previousRecallRate: 0,
    choiceAttempts,
    choiceSuccessful,
    choiceRate: percentage(choiceSuccessful, choiceAttempts),
    reviews: progress.reviewsToday,
    lessons: 0,
    activeMinutes: 0,
    trend: EMPTY_TREND.map((entry) => ({ ...entry })),
    weakTopics: [],
    weakPartsOfSpeech: [],
  };
}

export function normalizedLearningProcessEvidence(progress: ProgressSummary): LearningProcessEvidence {
  if (progress.processes) return progress.processes;
  const weekly = normalizedWeeklyEvidence(progress);
  return {
    weekStart: weekly.weekStart,
    weekEnd: weekly.weekEnd,
    newLearned: 0,
    dueReviewed: 0,
    remediationReviewed: 0,
    reviewBacklog: 0,
    lapses: 0,
    retention: { attempts: 0, successful: 0, rate: 0 },
  };
}

export function dueReviewLessonCount(dueNow: number): number {
  if (!Number.isFinite(dueNow) || dueNow <= 0) return 0;
  return Math.min(MAX_DUE_REVIEW_LESSON_ITEMS, Math.floor(dueNow));
}

export function objectiveSuccessRate(progress: ProgressSummary | null): number {
  if (!progress) return 0;
  const attempts = progress.objectiveReviewsToday ?? progress.reviewsToday;
  const successful = progress.objectiveSuccessfulToday ?? progress.successfulToday;
  return percentage(successful, attempts);
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

function percentage(successful: number, attempts: number): number {
  return attempts > 0 ? Math.round((successful / attempts) * 100) : 0;
}
