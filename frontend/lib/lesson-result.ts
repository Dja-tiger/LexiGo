import type { AnswerMode, ReviewRating } from "./progress";

export const LESSON_RESULT_VERSION = 1 as const;
export const LESSON_RESULT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export type LessonResultJudgement = {
  mode: AnswerMode;
  correct: boolean | null;
};

export type LessonResultEvidence = {
  recall: {
    attempted: number;
    correct: number;
  };
  recognition: {
    attempted: number;
    correct: number;
  };
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

export type LessonResultSnapshot = {
  version: typeof LESSON_RESULT_VERSION;
  userId: string;
  lessonId: string;
  source: string;
  studyMode: AnswerMode;
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

export type LessonResultPrimaryAction = "review_due" | "continue_goal" | "next_lesson" | "home";

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

function isAnswerMode(value: unknown): value is AnswerMode {
  return value === "study" || value === "recall" || value === "choice";
}

function normalizeOptionalTimestamp(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") return null;
  return Number.isFinite(Date.parse(value)) ? value : null;
}

function lessonResultStorageKey(userId: string): string {
  return `lexigo.lesson-result.v${LESSON_RESULT_VERSION}.${userId}`;
}

function dailyGoalCelebrationKey(snapshot: LessonResultSnapshot): string {
  const day = snapshot.completedAt.slice(0, 10);
  return `lexigo.lesson-result.daily-goal.v${LESSON_RESULT_VERSION}.${snapshot.userId}.${day}`;
}

export function buildLessonResultEvidence(
  judgements: Record<string, LessonResultJudgement>,
  itemCount: number,
): LessonResultEvidence {
  const values = Object.values(judgements);
  const recall = values.filter((entry) => entry.mode === "recall");
  const recognition = values.filter((entry) => entry.mode === "choice");

  return {
    recall: {
      attempted: recall.length,
      correct: recall.filter((entry) => entry.correct === true).length,
    },
    recognition: {
      attempted: recognition.length,
      correct: recognition.filter((entry) => entry.correct === true).length,
    },
    activity: {
      reviewed: values.length,
      total: Math.max(0, itemCount),
    },
  };
}

export function buildLessonResultSnapshot(
  input: BuildLessonResultSnapshotInput,
): LessonResultSnapshot {
  const ratingValues = Object.values(input.ratings);
  const completedAt = input.completedAt ?? new Date().toISOString();
  const reviewsBefore = input.reviewsBefore !== null && Number.isFinite(input.reviewsBefore)
    ? Math.max(0, input.reviewsBefore)
    : null;
  const reviewsAfter = input.reviewsAfter !== null && Number.isFinite(input.reviewsAfter)
    ? Math.max(0, input.reviewsAfter)
    : null;
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
    nextDueAt: normalizeOptionalTimestamp(input.nextDueAt),
    dailyGoal,
    reviewsBefore,
    reviewsAfter,
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
  if (input.previewTotal === null) return { kind: "checking" };

  const weakSavedRatings = input.snapshot.confidence.almost + input.snapshot.confidence.again;
  if (input.snapshot.dueNow > 0 && weakSavedRatings > 0) {
    return { kind: "due", dueCount: input.snapshot.dueNow };
  }
  if (input.previewTotal > 0) {
    return {
      kind: "next",
      title: input.nextTitle?.trim() || "Следующий учебный блок",
      itemCount: input.previewTotal,
      estimatedMinutes: Math.max(1, Math.round(input.estimatedMinutes ?? input.previewTotal / 2)),
    };
  }
  if (input.snapshot.dueNow > 0) return { kind: "due", dueCount: input.snapshot.dueNow };
  return { kind: "home" };
}

export function lessonResultPrimaryAction(
  snapshot: LessonResultSnapshot,
  continuation: LessonResultContinuation,
): LessonResultPrimaryAction | null {
  switch (continuation.kind) {
    case "due":
      return "review_due";
    case "next":
      return snapshot.dailyGoalReached ? "next_lesson" : "continue_goal";
    case "daily-goal":
    case "home":
      return "home";
    case "checking":
    case "sync-pending":
      return null;
  }
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
    const nextDueAt = normalizeOptionalTimestamp(parsed.nextDueAt);
    if (
      parsed.version !== LESSON_RESULT_VERSION
      || parsed.userId !== userId
      || typeof parsed.lessonId !== "string"
      || typeof parsed.source !== "string"
      || !isAnswerMode(parsed.studyMode)
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
      || !isFiniteNonNegative(evidence.recognition.attempted)
      || !isFiniteNonNegative(evidence.recognition.correct)
      || !isFiniteNonNegative(evidence.activity.reviewed)
      || !isFiniteNonNegative(evidence.activity.total)
      || !isRecord(confidence)
      || !isFiniteNonNegative(confidence.known)
      || !isFiniteNonNegative(confidence.almost)
      || !isFiniteNonNegative(confidence.again)
      || !isFiniteNonNegative(parsed.skipped)
      || !isFiniteNonNegative(parsed.dueNow)
      || !(parsed.nextDueAt === undefined || parsed.nextDueAt === null || nextDueAt !== null)
      || !isFiniteNonNegative(parsed.dailyGoal)
      || !(parsed.reviewsBefore === null || isFiniteNonNegative(parsed.reviewsBefore))
      || !(parsed.reviewsAfter === null || isFiniteNonNegative(parsed.reviewsAfter))
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

    return {
      ...(parsed as Omit<LessonResultSnapshot, "nextDueAt">),
      nextDueAt,
    };
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
