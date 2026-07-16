export type ProgressSummary = {
  dueNow: number;
  totalWords: number;
  newWords: number;
  learningWords: number;
  reviewWords: number;
  masteredWords: number;
  reviewsToday: number;
  successfulToday: number;
  reviewsTotal: number;
  dailyGoal: number;
  currentStreak: number;
  longestStreak: number;
  nextDueAt?: string;
};

export type ReviewRating = "again" | "almost" | "known";
export type AnswerMode = "recall" | "choice";

export type ReviewResult = {
  wordId: number;
  status: string;
  easiness: number;
  intervalDays: number;
  repetitions: number;
  dueAt: string;
  lastReviewedAt: string;
};

export function goalPercent(progress: ProgressSummary | null): number {
  if (!progress || progress.dailyGoal <= 0) return 0;
  return Math.min(100, Math.round((progress.reviewsToday / progress.dailyGoal) * 100));
}

export function ratingLabel(rating: ReviewRating): string {
  if (rating === "known") return "Знал";
  if (rating === "almost") return "Почти";
  return "Не знал";
}

export function correctFromAnswer(selectedAnswer: string, typedMatch: boolean): boolean | undefined {
  if (selectedAnswer) return selectedAnswer === "correct";
  if (typedMatch) return true;
  return undefined;
}
