import type { ReviewRating } from "./progress";

export type LessonAdvanceDecision =
  | {
      kind: "blocked";
      canAdvance: false;
      label: string;
      reason:
        | "saving"
        | "review_required"
        | "completion_not_confirmed"
        | "server_position_missing"
        | "server_position_invalid";
    }
  | {
      kind: "next";
      canAdvance: true;
      label: "Дальше";
      nextIndex: number;
    }
  | {
      kind: "results";
      canAdvance: true;
      label: "К результатам";
    };

export type LessonAdvanceInput = {
  currentIndex: number;
  itemCount: number;
  reviewPersisted: boolean;
  reviewSaving: boolean;
  serverCompleted: boolean;
  serverNextIndex?: number | null;
};

export type LessonResultSummary = {
  known: number;
  almost: number;
  again: number;
  reviewed: number;
  skipped: number;
};

export function resolveActiveLessonIndex(
  currentIndex: number,
  itemCount: number,
  currentItemReviewed: boolean,
): number | null {
  if (!Number.isInteger(currentIndex) || currentIndex < 0 || currentIndex >= itemCount) return null;
  if (currentItemReviewed) return null;
  return currentIndex;
}

/**
 * Determines the only legal transition for an active persisted lesson. The
 * browser never invents the next index: the backend must return exactly the
 * next sequential position after a committed review.
 */
export function decideLessonAdvance(input: LessonAdvanceInput): LessonAdvanceDecision {
  if (input.reviewSaving) {
    return { kind: "blocked", canAdvance: false, label: "Сохраняем оценку…", reason: "saving" };
  }
  if (!input.reviewPersisted) {
    return { kind: "blocked", canAdvance: false, label: "Сначала сохраните оценку", reason: "review_required" };
  }

  const lastIndex = Math.max(0, input.itemCount - 1);
  if (input.currentIndex >= lastIndex) {
    if (!input.serverCompleted) {
      return { kind: "blocked", canAdvance: false, label: "Проверяем завершение…", reason: "completion_not_confirmed" };
    }
    return { kind: "results", canAdvance: true, label: "К результатам" };
  }

  if (input.serverNextIndex === null || input.serverNextIndex === undefined) {
    return { kind: "blocked", canAdvance: false, label: "Синхронизируем позицию…", reason: "server_position_missing" };
  }
  if (
    !Number.isInteger(input.serverNextIndex)
    || input.serverNextIndex !== input.currentIndex + 1
    || input.serverNextIndex < 0
    || input.serverNextIndex >= input.itemCount
  ) {
    return { kind: "blocked", canAdvance: false, label: "Обновите урок", reason: "server_position_invalid" };
  }
  return { kind: "next", canAdvance: true, label: "Дальше", nextIndex: input.serverNextIndex };
}

export function summarizePersistedLesson(
  ratings: Record<string, ReviewRating>,
  itemCount: number,
): LessonResultSummary {
  const values = Object.values(ratings);
  const known = values.filter((rating) => rating === "known").length;
  const almost = values.filter((rating) => rating === "almost").length;
  const again = values.filter((rating) => rating === "again").length;
  const reviewed = known + almost + again;

  return {
    known,
    almost,
    again,
    reviewed,
    skipped: Math.max(0, itemCount - reviewed),
  };
}
