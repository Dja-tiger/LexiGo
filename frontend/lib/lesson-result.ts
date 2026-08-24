import type { AnswerMode, ReviewRating } from "./progress";

export const LESSON_RESULT_VERSION = 2 as const;
export const LESSON_RESULT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type LessonResultJudgement = {
  mode: AnswerMode;
  correct: boolean | null;
};

export type LessonResultObjectiveEvidence = {
  attempted: number;
  correct: number;
  unavailable: number;
};

export type LessonResultEvidence = {
  recall: LessonResultObjectiveEvidence;
  recognition: LessonResultObjectiveEvidence;
  activity: {
    reviewed: number;
    total: number;
  };
};

export type LessonResultConfidence = {
  known: number;
  almost: number;
  again: number;
};

export type LessonResultSessionKind = "study" | "review" | "remediation";
export type LessonResultOutcomeState = "empty" | "study" | "partial" | "skipped" | "complete";

export type LessonResultSnapshot = {
  version: typeof LESSON_RESULT_VERSION;
  userId: string;
  lessonId: string;
  source: string;
  studyMode: AnswerMode;
  sessionKind?: LessonResultSessionKind;
  lessonSize: string;
  topic: string;
  completedAt: string;
  itemIds: number[];
  itemCount: number;
  evidence: LessonResultEvidence;
  confidence: LessonResultConfidence;
  skipped: number;
  dueNow: number;
  nextDueAt: string | null;
  dailyGoal: number;
  reviewsBefore: number | null;
  reviewsAfter: number | null;
  objectiveReviewsToday: number | null;
  objectiveSuccessfulToday: number | null;
  currentStreak: number | null;
  dailyGoalReached: boolean;
  dailyGoalJustReached: boolean;
  syncPending: boolean;
};

export type LessonResultContinuation =
  | { kind: "checking" }
  | { kind: "daily-goal" }
  | { kind: "next"; title: string; itemCount: number; estimatedMinutes: number }
  | { kind: "due"; dueCount: number }
  | { kind: "home" }
  | { kind: "sync-pending" };

export type LessonResultRecommendedAction = "next_lesson" | "due_review" | "home" | "none";
export type LessonResultSelectedAction = "next_lesson" | "due_review" | "home" | "progress" | "stay";

export type LessonResultCandidate = {
  id: string;
  itemIds: number[];
};

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

type BuildLessonResultSnapshotInput = {
  userId: string;
  lessonId: string;
  source: string;
  studyMode: AnswerMode;
  sessionKind?: LessonResultSessionKind;
  lessonSize: string;
  topic?: string;
  completedAt?: string;
  itemIds: number[];
  judgements: Record<string, LessonResultJudgement>;
  ratings: Record<string, ReviewRating>;
  skipped: number;
  dueNow: number;
  nextDueAt?: string | null;
  dailyGoal: number;
  reviewsBefore: number | null;
  reviewsAfter: number | null;
  objectiveReviewsToday?: number | null;
  objectiveSuccessfulToday?: number | null;
  currentStreak?: number | null;
  syncPending?: boolean;
};

type ResolveLessonResultContinuationInput = {
  snapshot: LessonResultSnapshot;
  previewTotal: number | null;
  nextTitle?: string;
  estimatedMinutes?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isNullableFiniteNonNegative(value: unknown): value is number | null {
  return value === null || isFiniteNonNegative(value);
}

function isAnswerMode(value: unknown): value is AnswerMode {
  return value === "study" || value === "recall" || value === "choice";
}

function isLessonResultSessionKind(value: unknown): value is LessonResultSessionKind {
  return value === "study" || value === "review" || value === "remediation";
}

function normalizeNullableCounter(value: number | null | undefined): number | null {
  return value !== null && value !== undefined && Number.isFinite(value)
    ? Math.max(0, value)
    : null;
}

function normalizeNextDueAt(value: string | null | undefined): string | null {
  const normalized = value?.trim();
  if (!normalized || !Number.isFinite(Date.parse(normalized))) return null;
  return normalized;
}

function isNullableTimestamp(value: unknown): value is string | null {
  return value === null || (
    typeof value === "string"
    && value.trim().length > 0
    && Number.isFinite(Date.parse(value))
  );
}

function lessonResultStorageKey(userId: string): string {
  return `lexigo.lesson-result.v${LESSON_RESULT_VERSION}.${userId}`;
}

function dailyGoalCelebrationKey(snapshot: LessonResultSnapshot): string {
  const day = snapshot.completedAt.slice(0, 10);
  return `lexigo.lesson-result.daily-goal.v${LESSON_RESULT_VERSION}.${snapshot.userId}.${day}`;
}

function objectiveEvidence(values: LessonResultJudgement[], mode: AnswerMode): LessonResultObjectiveEvidence {
  const relevant = values.filter((entry) => entry.mode === mode);
  const objective = relevant.filter((entry) => typeof entry.correct === "boolean");
  return {
    attempted: objective.length,
    correct: objective.filter((entry) => entry.correct === true).length,
    unavailable: relevant.length - objective.length,
  };
}

export function buildLessonResultEvidence(
  judgements: Record<string, LessonResultJudgement>,
  itemCount: number,
): LessonResultEvidence {
  const values = Object.values(judgements);

  return {
    recall: objectiveEvidence(values, "recall"),
    recognition: objectiveEvidence(values, "choice"),
    activity: {
      reviewed: values.length,
      total: Math.max(0, itemCount),
    },
  };
}

export function lessonResultOutcomeState(snapshot: LessonResultSnapshot): LessonResultOutcomeState {
  if (snapshot.evidence.activity.reviewed === 0) return "empty";
  if (snapshot.skipped > 0) return "skipped";
  if (snapshot.evidence.recall.unavailable + snapshot.evidence.recognition.unavailable > 0) return "partial";
  if (
    snapshot.studyMode === "study"
    || snapshot.evidence.recall.attempted + snapshot.evidence.recognition.attempted === 0
  ) {
    return "study";
  }
  return "complete";
}

export function buildLessonResultSnapshot(
  input: BuildLessonResultSnapshotInput,
): LessonResultSnapshot {
  const ratingValues = Object.values(input.ratings);
  const completedAt = input.completedAt ?? new Date().toISOString();
  const reviewsBefore = normalizeNullableCounter(input.reviewsBefore);
  const reviewsAfter = normalizeNullableCounter(input.reviewsAfter);
  const objectiveReviewsToday = normalizeNullableCounter(input.objectiveReviewsToday);
  const objectiveSuccessfulToday = normalizeNullableCounter(input.objectiveSuccessfulToday);
  const currentStreak = normalizeNullableCounter(input.currentStreak);
  const dailyGoal = Math.max(0, input.dailyGoal);
  const dailyGoalReached = reviewsAfter !== null && dailyGoal > 0 && reviewsAfter >= dailyGoal;
  const dailyGoalJustReached = dailyGoalReached
    && reviewsBefore !== null
    && reviewsBefore < dailyGoal;

  return {
    version: LESSON_RESULT_VERSION,
    userId: input.userId,
    lessonId: input.lessonId,
    source: input.source,
    studyMode: input.studyMode,
    ...(input.sessionKind ? { sessionKind: input.sessionKind } : {}),
    lessonSize: input.lessonSize,
    topic: input.topic?.trim() ?? "",
    completedAt,
    itemIds: [...new Set(input.itemIds.filter((value) => Number.isInteger(value) && value > 0))],
    itemCount: Math.max(0, input.itemIds.length),
    evidence: buildLessonResultEvidence(input.judgements, input.itemIds.length),
    confidence: {
      known: ratingValues.filter((rating) => rating === "known").length,
      almost: ratingValues.filter((rating) => rating === "almost").length,
      again: ratingValues.filter((rating) => rating === "again").length,
    },
    skipped: Math.max(0, input.skipped),
    dueNow: Math.max(0, input.dueNow),
    nextDueAt: normalizeNextDueAt(input.nextDueAt),
    dailyGoal,
    reviewsBefore,
    reviewsAfter,
    objectiveReviewsToday,
    objectiveSuccessfulToday,
    currentStreak,
    dailyGoalReached,
    dailyGoalJustReached,
    syncPending: Boolean(input.syncPending),
  };
}

export function resolveLessonResultContinuation(
  input: ResolveLessonResultContinuationInput,
): LessonResultContinuation {
  if (input.snapshot.syncPending) return { kind: "sync-pending" };
  if (input.snapshot.dailyGoalJustReached) return { kind: "daily-goal" };
  if (input.snapshot.dueNow > 0) return { kind: "due", dueCount: input.snapshot.dueNow };
  if (input.previewTotal === null) return { kind: "checking" };
  if (input.previewTotal > 0) {
    return {
      kind: "next",
      title: input.nextTitle?.trim() || "Следующий учебный блок",
      itemCount: input.previewTotal,
      estimatedMinutes: Math.max(1, Math.round(input.estimatedMinutes ?? input.previewTotal / 2)),
    };
  }
  return { kind: "home" };
}

export function lessonResultRecommendedAction(
  continuation: LessonResultContinuation,
): LessonResultRecommendedAction {
  if (continuation.kind === "next") return "next_lesson";
  if (continuation.kind === "due") return "due_review";
  if (continuation.kind === "checking") return "none";
  return "home";
}

export function isDistinctLessonResultCandidate(
  snapshot: Pick<LessonResultSnapshot, "lessonId" | "itemIds">,
  candidate: LessonResultCandidate,
): boolean {
  if (!candidate.id || candidate.id === snapshot.lessonId) return false;
  const previous = [...snapshot.itemIds].sort((left, right) => left - right);
  const next = [...candidate.itemIds].sort((left, right) => left - right);
  if (previous.length !== next.length) return true;
  return previous.some((value, index) => value !== next[index]);
}

export function writeLessonResultSnapshot(
  storage: StorageLike,
  snapshot: LessonResultSnapshot,
): void {
  storage.setItem(lessonResultStorageKey(snapshot.userId), JSON.stringify(snapshot));
}

export function readLessonResultSnapshot(
  storage: StorageLike,
  userId: string,
  now = Date.now(),
): LessonResultSnapshot | null {
  const raw = storage.getItem(lessonResultStorageKey(userId));
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) throw new Error("invalid snapshot");
    const evidence = parsed.evidence;
    const confidence = parsed.confidence;
    if (
      parsed.version !== LESSON_RESULT_VERSION
      || parsed.userId !== userId
      || typeof parsed.lessonId !== "string"
      || typeof parsed.source !== "string"
      || !isAnswerMode(parsed.studyMode)
      || (parsed.sessionKind !== undefined && !isLessonResultSessionKind(parsed.sessionKind))
      || typeof parsed.lessonSize !== "string"
      || typeof parsed.topic !== "string"
      || typeof parsed.completedAt !== "string"
      || !Array.isArray(parsed.itemIds)
      || !parsed.itemIds.every((value) => Number.isInteger(value) && Number(value) > 0)
      || !isFiniteNonNegative(parsed.itemCount)
      || !isRecord(evidence)
      || !isRecord(evidence.recall)
      || !isRecord(evidence.recognition)
      || !isRecord(evidence.activity)
      || !isFiniteNonNegative(evidence.recall.attempted)
      || !isFiniteNonNegative(evidence.recall.correct)
      || !isFiniteNonNegative(evidence.recall.unavailable)
      || evidence.recall.correct > evidence.recall.attempted
      || !isFiniteNonNegative(evidence.recognition.attempted)
      || !isFiniteNonNegative(evidence.recognition.correct)
      || !isFiniteNonNegative(evidence.recognition.unavailable)
      || evidence.recognition.correct > evidence.recognition.attempted
      || !isFiniteNonNegative(evidence.activity.reviewed)
      || !isFiniteNonNegative(evidence.activity.total)
      || evidence.activity.reviewed > evidence.activity.total
      || !isRecord(confidence)
      || !isFiniteNonNegative(confidence.known)
      || !isFiniteNonNegative(confidence.almost)
      || !isFiniteNonNegative(confidence.again)
      || !isFiniteNonNegative(parsed.skipped)
      || !isFiniteNonNegative(parsed.dueNow)
      || !isNullableTimestamp(parsed.nextDueAt)
      || !isFiniteNonNegative(parsed.dailyGoal)
      || !isNullableFiniteNonNegative(parsed.reviewsBefore)
      || !isNullableFiniteNonNegative(parsed.reviewsAfter)
      || !isNullableFiniteNonNegative(parsed.objectiveReviewsToday)
      || !isNullableFiniteNonNegative(parsed.objectiveSuccessfulToday)
      || !isNullableFiniteNonNegative(parsed.currentStreak)
      || (
        parsed.objectiveReviewsToday !== null
        && parsed.objectiveSuccessfulToday !== null
        && parsed.objectiveSuccessfulToday > parsed.objectiveReviewsToday
      )
      || typeof parsed.dailyGoalReached !== "boolean"
      || typeof parsed.dailyGoalJustReached !== "boolean"
      || typeof parsed.syncPending !== "boolean"
    ) {
      throw new Error("invalid snapshot");
    }

    const completedAt = Date.parse(parsed.completedAt);
    if (!Number.isFinite(completedAt) || now - completedAt > LESSON_RESULT_MAX_AGE_MS || completedAt - now > 60_000) {
      throw new Error("stale snapshot");
    }

    return parsed as LessonResultSnapshot;
  } catch {
    storage.removeItem(lessonResultStorageKey(userId));
    return null;
  }
}

export function clearLessonResultSnapshot(storage: StorageLike, userId: string): void {
  storage.removeItem(lessonResultStorageKey(userId));
}

export function claimDailyGoalCelebration(
  storage: StorageLike,
  snapshot: LessonResultSnapshot,
): boolean {
  if (!snapshot.dailyGoalJustReached) return false;
  const key = dailyGoalCelebrationKey(snapshot);
  if (storage.getItem(key)) return false;
  storage.setItem(key, snapshot.lessonId);
  return true;
}
