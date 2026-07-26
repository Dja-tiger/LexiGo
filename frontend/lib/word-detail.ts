import { isLearningItemPayload } from "./account-resources";
import type { LearningItem } from "./learning";

export type WordDetailItem = LearningItem & {
  easiness: number;
  intervalDays: number;
  repetitions: number;
  dueAt: string;
  lastReviewedAt?: string;
};

type WordDetailPayload = {
  id: number;
  kind: "word" | "phrase";
  slug?: string;
  lemma: string;
  translation: string;
  phonetic: string;
  partOfSpeech: string;
  topic: string;
  aliases?: string[];
  acceptedAnswers?: string[];
  examples: string[];
  note: string;
  cloze?: string;
  clozeAnswer?: string;
  status: string;
  easiness: number;
  intervalDays: number;
  repetitions: number;
  dueAt: string;
  lastReviewedAt?: string;
};

const WORD_DETAIL_STATUSES = new Set(["new", "learning", "review", "mastered"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && isFiniteNumber(value) && value >= 0;
}

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function hasSchedulerFields(value: Record<string, unknown>): boolean {
  return typeof value.status === "string"
    && WORD_DETAIL_STATUSES.has(value.status)
    && isFiniteNumber(value.easiness)
    && value.easiness > 0
    && isNonNegativeInteger(value.intervalDays)
    && isNonNegativeInteger(value.repetitions)
    && isTimestamp(value.dueAt)
    && (value.lastReviewedAt === undefined || isTimestamp(value.lastReviewedAt));
}

export function isWordDetailPayload(value: unknown): value is WordDetailPayload {
  return isLearningItemPayload(value) && isRecord(value) && hasSchedulerFields(value);
}

export function isWordDetailItem(value: LearningItem): value is WordDetailItem {
  return hasSchedulerFields(value as unknown as Record<string, unknown>);
}

export function wordDetailStatus(status: string): {
  label: string;
  description: string;
  tone: "new" | "learning" | "review" | "mastered";
  action: string;
  studyMode: "study" | "recall";
} {
  switch (status) {
    case "mastered":
      return {
        label: "Готово",
        description: "Слово закреплено и остаётся в интервальном повторении.",
        tone: "mastered",
        action: "Повторить сейчас",
        studyMode: "recall",
      };
    case "review":
      return {
        label: "К повторению",
        description: "Срок интервального повторения наступил.",
        tone: "review",
        action: "Повторить сейчас",
        studyMode: "recall",
      };
    case "learning":
      return {
        label: "В работе",
        description: "Слово уже участвует в учебном цикле.",
        tone: "learning",
        action: "Практиковать слово",
        studyMode: "recall",
      };
    default:
      return {
        label: "Новое",
        description: "Слово ещё не проходило объективное повторение.",
        tone: "new",
        action: "Добавить в практику",
        studyMode: "study",
      };
  }
}

function formattedDate(value: string, locale = "ru-RU"): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function wordDetailSchedule(item: Pick<WordDetailItem, "intervalDays" | "repetitions" | "dueAt" | "lastReviewedAt">): {
  due: string;
  interval: string;
  repetitions: string;
  lastReviewed: string;
} {
  return {
    due: formattedDate(item.dueAt),
    interval: item.intervalDays > 0 ? `${item.intervalDays} дн.` : "первое повторение",
    repetitions: item.repetitions.toLocaleString("ru-RU"),
    lastReviewed: item.lastReviewedAt ? formattedDate(item.lastReviewedAt) : "ещё не было",
  };
}
