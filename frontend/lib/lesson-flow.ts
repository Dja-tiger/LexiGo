import type { ReviewRating } from "./progress";

export type LessonAdvanceDecision =
  | {
      kind: "blocked";
      canAdvance: false;
      label: string;
      reason: "saving" | "review_required" | "completion_not_confirmed";
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

/**
 * Determines the only legal forward transition for a persisted lesson card.
 * The browser never infers completion from the local index alone: the final
 * transition is available only after the backend confirms lesson completion.
 */
export function decideLessonAdvance(input: LessonAdvanceInput): LessonAdvanceDecision {
  if (input.reviewSaving) {
    return {
      kind: "blocked",
      canAdvance: false,
      label: "Сохраняем оценку…",
      reason: "saving",
    };
  }

  if (!input.reviewPersisted) {
    return {
      kind: "blocked",
      canAdvance: false,
      label: "Сначала сохраните оценку",
      reason: "review_required",
    };
  }

  const lastIndex = Math.max(0, input.itemCount - 1);
  if (input.currentIndex >= lastIndex) {
    if (!input.serverCompleted) {
      return {
        kind: "blocked",
        canAdvance: false,
        label: "Проверяем завершение…",
        reason: "completion_not_confirmed",
      };
    }
    return { kind: "results", canAdvance: true, label: "К результатам" };
  }

  const fallbackIndex = input.currentIndex + 1;
  const requestedIndex = input.serverNextIndex ?? fallbackIndex;
  const nextIndex = Math.min(Math.max(requestedIndex, fallbackIndex), lastIndex);
  return { kind: "next", canAdvance: true, label: "Дальше", nextIndex };
}

/**
 * Builds the completion copy from reviews that were confirmed by the backend.
 * `skipped` remains visible even though the current M0 flow does not permit an
 * implicit skip; this protects the result screen from claiming full completion
 * if local and server state ever diverge.
 */
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
