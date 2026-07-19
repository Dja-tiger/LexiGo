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
]);
const STUDY_MODES = new Set(["study", "recall", "choice"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonNegativeNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || isString(value);
}

function isTimestamp(value: unknown): boolean {
  return isString(value) && Number.isFinite(Date.parse(value));
}

function isLearningItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return Number.isInteger(value.id)
    && (value.kind === "word" || value.kind === "phrase")
    && isString(value.lemma)
    && isString(value.translation)
    && isString(value.phonetic)
    && isString(value.partOfSpeech)
    && isString(value.topic)
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
  if (!isRecord(value) || !Array.isArray(value.items) || !value.items.every(isLearningItem) || !isNonNegativeNumber(value.count)) return false;
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
    && isString(value.lessonSize)
    && isNonNegativeNumber(value.currentIndex)
    && isNonNegativeNumber(value.version)
    && value.status === "active"
    && Array.isArray(value.items)
    && value.items.every((item) => isLearningItem(item) && isRecord(item) && isNonNegativeNumber(item.position))
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

export function isProgressSummaryPayload(value: unknown): value is ProgressSummary {
  if (!isRecord(value)) return false;
  if (!REQUIRED_PROGRESS_FIELDS.every((field) => isNonNegativeNumber(value[field]))) return false;
  if ((value.dailyGoal as number) <= 0) return false;
  if (value.objectiveReviewsToday !== undefined && !isNonNegativeNumber(value.objectiveReviewsToday)) return false;
  if (value.objectiveSuccessfulToday !== undefined && !isNonNegativeNumber(value.objectiveSuccessfulToday)) return false;
  if (value.nextDueAt !== undefined && !isTimestamp(value.nextDueAt)) return false;
  if (value.eventSchemaVersion !== undefined && !isNonNegativeNumber(value.eventSchemaVersion)) return false;
  if (value.modes !== undefined && !isProgressModes(value.modes)) return false;
  return true;
}
