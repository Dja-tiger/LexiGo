import type { ProgressSummary } from "./progress";
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

function isLearningItem(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isFiniteNumber(value.id)
    && (value.kind === "word" || value.kind === "phrase")
    && isString(value.lemma)
    && isString(value.translation)
    && isString(value.partOfSpeech)
    && isString(value.topic)
    && Array.isArray(value.examples)
    && value.examples.every(isString)
    && isString(value.status);
}

export function isItemsResponsePayload(value: unknown): boolean {
  return isRecord(value)
    && Array.isArray(value.items)
    && value.items.every(isLearningItem)
    && isNonNegativeNumber(value.count);
}

export function isActiveLessonPayload(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return isString(value.id)
    && isString(value.source)
    && isString(value.studyMode)
    && isString(value.lessonSize)
    && isNonNegativeNumber(value.currentIndex)
    && isNonNegativeNumber(value.version)
    && value.status === "active"
    && Array.isArray(value.items)
    && value.items.every((item) => isLearningItem(item) && isRecord(item) && isNonNegativeNumber(item.position))
    && isString(value.createdAt)
    && isString(value.updatedAt);
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

export function isProgressSummaryPayload(value: unknown): value is ProgressSummary {
  if (!isRecord(value)) return false;
  if (!REQUIRED_PROGRESS_FIELDS.every((field) => isNonNegativeNumber(value[field]))) return false;
  if ((value.dailyGoal as number) <= 0) return false;
  if (value.nextDueAt !== undefined && !isString(value.nextDueAt)) return false;
  if (value.eventSchemaVersion !== undefined && !isNonNegativeNumber(value.eventSchemaVersion)) return false;
  return true;
}
