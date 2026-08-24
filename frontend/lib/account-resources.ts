import type { ModeProgress, ProgressSummary } from "./progress";
import { describeRequestFailure, type RequestProblem } from "./request-failure";

export type ResourcePhase = "idle" | "loading" | "ready" | "error";

export type ResourceStatus = {
  phase: ResourcePhase;
  problem: RequestProblem | null;
};

export const idleResourceStatus = (): ResourceStatus => ({ phase: "idle", problem: null });
export const loadingResourceStatus = (): ResourceStatus => ({ phase: "loading", problem: null });
export const readyResourceStatus = (): ResourceStatus => ({ phase: "ready", problem: null });
export const failedResourceStatus = (error: unknown, resource: string): ResourceStatus => ({
  phase: "error",
  problem: describeRequestFailure(error, resource),
});

const LESSON_SOURCES = new Set([
  "mixed",
  "noun",
  "verb",
  "adjective",
  "phrases",
  "daily-life",
  "travel",
  "data-engineering",
  "backend",
  "academic-technical-english",
]);
const STUDY_MODES = new Set(["study", "recall", "choice"]);
const LESSON_SESSION_KINDS = new Set(["study", "review", "remediation"]);
const LESSON_SELECTION_REASONS = new Set([
  "recent_failure",
  "due",
  "overdue",
  "relearning_due",
  "repeated_again",
  "repeated_almost",
  "weak_topic",
  "new",
  "scheduled",
  "manual",
]);
const SCENARIO_TYPES = new Set([
  "incident",
  "troubleshooting",
  "architecture-review",
  "data-pipeline",
  "release",
  "status-update",
]);
const SCENARIO_RECOMMENDATION_REASONS = new Set([
  "resume_in_progress",
  "first_uncompleted",
  "least_recently_completed",
]);
const SCENARIO_RECOMMENDATION_ACTIONS = new Set(["start", "resume"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonNegativeNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && isNonNegativeNumber(value);
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && isFiniteNumber(value) && value > 0;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim().length > 0;
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || isString(value);
}

function isOptionalStringArray(value: unknown): boolean {
  return value === undefined || (Array.isArray(value) && value.every(isString));
}

function isTimestamp(value: unknown): boolean {
  return isString(value) && Number.isFinite(Date.parse(value));
}

export function isLearningItemPayload(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return Number.isInteger(value.id)
    && (value.kind === "word" || value.kind === "phrase")
    && isString(value.lemma)
    && isString(value.translation)
    && isString(value.phonetic)
    && isString(value.partOfSpeech)
    && isString(value.topic)
    && isOptionalStringArray(value.aliases)
    && isOptionalStringArray(value.acceptedAnswers)
    && Array.isArray(value.examples)
    && value.examples.every(isString)
    && isString(value.note)
    && isString(value.status)
    && isOptionalString(value.slug)
    && isOptionalString(value.cloze)
    && isOptionalString(value.clozeAnswer)
    && isOptionalString(value.reviewedAt);
}

export function isItemsResponsePayload(value: unknown): boolean {
  if (!isRecord(value) || !Array.isArray(value.items) || !value.items.every(isLearningItemPayload) || !isNonNegativeNumber(value.count)) return false;
  const optionalNonNegative = [value.total, value.totalPages].every((entry) => entry === undefined || isNonNegativeNumber(entry));
  const optionalPositive = [value.page, value.pageSize].every((entry) => entry === undefined || (isFiniteNumber(entry) && entry > 0));
  const optionalFlags = [value.hasPrevious, value.hasNext].every((entry) => entry === undefined || typeof entry === "boolean");
  return optionalNonNegative && optionalPositive && optionalFlags;
}

export function isActiveLessonPayload(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isString(value.id)
    && LESSON_SOURCES.has(value.source as string)
    && STUDY_MODES.has(value.studyMode as string)
    && (value.sessionKind === undefined || (isString(value.sessionKind) && LESSON_SESSION_KINDS.has(value.sessionKind)))
    && isString(value.lessonSize)
    && isNonNegativeNumber(value.currentIndex)
    && isNonNegativeNumber(value.version)
    && value.status === "active"
    && Array.isArray(value.items)
    && value.items.every((item) => isLearningItemPayload(item)
      && isRecord(item)
      && isNonNegativeNumber(item.position)
      && (item.reason === undefined || LESSON_SELECTION_REASONS.has(item.reason as string)))
    && isTimestamp(value.createdAt)
    && isTimestamp(value.updatedAt);
}

const REQUIRED_PROGRESS_FIELDS: Array<keyof ProgressSummary> = [
  "dueNow",
  "dueWords",
  "duePhrases",
  "totalWords",
  "totalPhrases",
  "newWords",
  "learningWords",
  "reviewWords",
  "masteredWords",
  "masteredPhrases",
  "reviewsToday",
  "successfulToday",
  "reviewsTotal",
  "dailyGoal",
  "currentStreak",
  "longestStreak",
  "retainedItemsWeek",
  "retainedWordsWeek",
  "retainedPhrasesWeek",
];

const MODE_PROGRESS_FIELDS: Array<keyof ModeProgress> = [
  "attemptsToday",
  "successfulToday",
  "attemptsTotal",
  "successfulTotal",
];

function isModeProgress(value: unknown): value is ModeProgress {
  return isRecord(value) && MODE_PROGRESS_FIELDS.every((field) => isNonNegativeNumber(value[field]));
}

function isProgressModes(value: unknown): boolean {
  return isRecord(value)
    && isModeProgress(value.study)
    && isModeProgress(value.recall)
    && isModeProgress(value.choice)
    && isModeProgress(value.legacy);
}

function isPercentage(value: unknown): boolean {
  return Number.isInteger(value) && isNonNegativeNumber(value) && value <= 100;
}

function isDateOnly(value: unknown): boolean {
  return isString(value) && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`));
}

function isDailyRecallEvidence(value: unknown): boolean {
  return isRecord(value)
    && isDateOnly(value.date)
    && isNonNegativeNumber(value.attempts)
    && isNonNegativeNumber(value.successful)
    && isPercentage(value.rate);
}

function isTopicEvidence(value: unknown): boolean {
  return isRecord(value)
    && isString(value.topic)
    && isNonNegativeNumber(value.attempts)
    && isNonNegativeNumber(value.successful)
    && isNonNegativeNumber(value.errors)
    && isPercentage(value.rate);
}

function isPartOfSpeechEvidence(value: unknown): boolean {
  return isRecord(value)
    && isString(value.partOfSpeech)
    && value.partOfSpeech.trim().length > 0
    && isNonNegativeNumber(value.attempts)
    && isNonNegativeNumber(value.successful)
    && isNonNegativeNumber(value.errors)
    && isPercentage(value.rate);
}

function isWeeklyProgressEvidence(value: unknown): boolean {
  if (!isRecord(value)) return false;
  const weakPartsOfSpeechValid = value.weakPartsOfSpeech === undefined
    || (Array.isArray(value.weakPartsOfSpeech)
      && value.weakPartsOfSpeech.length <= 3
      && value.weakPartsOfSpeech.every(isPartOfSpeechEvidence));
  return isDateOnly(value.weekStart)
    && isDateOnly(value.weekEnd)
    && isNonNegativeNumber(value.recallAttempts)
    && isNonNegativeNumber(value.recallSuccessful)
    && isPercentage(value.recallRate)
    && isNonNegativeNumber(value.previousRecallAttempts)
    && isNonNegativeNumber(value.previousRecallSuccessful)
    && isPercentage(value.previousRecallRate)
    && isNonNegativeNumber(value.choiceAttempts)
    && isNonNegativeNumber(value.choiceSuccessful)
    && isPercentage(value.choiceRate)
    && isNonNegativeNumber(value.reviews)
    && isNonNegativeNumber(value.lessons)
    && isNonNegativeNumber(value.activeMinutes)
    && Array.isArray(value.trend)
    && value.trend.length === 7
    && value.trend.every(isDailyRecallEvidence)
    && Array.isArray(value.weakTopics)
    && value.weakTopics.length <= 3
    && value.weakTopics.every(isTopicEvidence)
    && weakPartsOfSpeechValid
    && (value.strongTopic === undefined || isTopicEvidence(value.strongTopic));
}

function isProcessRetentionEvidence(value: unknown): boolean {
  return isRecord(value)
    && isNonNegativeNumber(value.attempts)
    && isNonNegativeNumber(value.successful)
    && value.successful <= value.attempts
    && isPercentage(value.rate);
}

function isLearningProcessEvidence(value: unknown): boolean {
  return isRecord(value)
    && isDateOnly(value.weekStart)
    && isDateOnly(value.weekEnd)
    && isNonNegativeNumber(value.newLearned)
    && isNonNegativeNumber(value.dueReviewed)
    && isNonNegativeNumber(value.remediationReviewed)
    && isNonNegativeNumber(value.reviewBacklog)
    && isNonNegativeNumber(value.lapses)
    && isProcessRetentionEvidence(value.retention);
}

function isScenarioRecommendation(value: unknown): boolean {
  if (!isRecord(value)
    || !isNonEmptyString(value.slug)
    || !SCENARIO_TYPES.has(value.type as string)
    || !isNonEmptyString(value.title)
    || !isPositiveInteger(value.estimatedMinutes)
    || !SCENARIO_RECOMMENDATION_REASONS.has(value.reason as string)
    || !SCENARIO_RECOMMENDATION_ACTIONS.has(value.action as string)
    || !isNonNegativeInteger(value.completedCount)
    || (value.lastCompletedAt !== undefined && !isTimestamp(value.lastCompletedAt))) {
    return false;
  }

  if (value.reason === "resume_in_progress") return value.action === "resume";
  if (value.action !== "start") return false;
  if (value.reason === "first_uncompleted") {
    return value.completedCount === 0 && value.lastCompletedAt === undefined;
  }
  return value.reason === "least_recently_completed"
    && value.completedCount > 0
    && isTimestamp(value.lastCompletedAt);
}

function isScenarioProgressEvidence(value: unknown): boolean {
  return isRecord(value)
    && isNonNegativeInteger(value.completedThisWeek)
    && isNonNegativeInteger(value.completedTotal)
    && value.completedThisWeek <= value.completedTotal
    && (value.recommendation === undefined || isScenarioRecommendation(value.recommendation));
}

export function isProgressSummaryPayload(value: unknown): value is ProgressSummary {
  if (!isRecord(value)) return false;
  if (!REQUIRED_PROGRESS_FIELDS.every((field) => isNonNegativeNumber(value[field]))) return false;
  if ((value.dailyGoal as number) <= 0) return false;
  if (value.objectiveReviewsToday !== undefined && !isNonNegativeNumber(value.objectiveReviewsToday)) return false;
  if (value.objectiveSuccessfulToday !== undefined && !isNonNegativeNumber(value.objectiveSuccessfulToday)) return false;
  if (value.nextDueAt !== undefined && !isTimestamp(value.nextDueAt)) return false;
  if (value.eventSchemaVersion !== undefined && !isNonNegativeNumber(value.eventSchemaVersion)) return false;
  if (value.modes !== undefined && !isProgressModes(value.modes)) return false;
  if (value.weekly !== undefined && !isWeeklyProgressEvidence(value.weekly)) return false;
  if (value.processes !== undefined && !isLearningProcessEvidence(value.processes)) return false;
  if (value.scenarios !== undefined && !isScenarioProgressEvidence(value.scenarios)) return false;
  return true;
}
