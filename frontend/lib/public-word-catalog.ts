import { normalizePartOfSpeech, type LearningItem } from "./learning";

export type PublicWordAPIItem = {
  id: number;
  kind: "word";
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
};

export type PublicWordPage = {
  items: PublicWordAPIItem[];
  count: number;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || isString(value);
}

function isOptionalStringArray(value: unknown): boolean {
  return value === undefined || (Array.isArray(value) && value.every(isString));
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && typeof value === "number" && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && typeof value === "number" && value > 0;
}

export function isPublicWordPayload(value: unknown): value is PublicWordAPIItem {
  if (!isRecord(value)) return false;
  return isPositiveInteger(value.id)
    && value.kind === "word"
    && isOptionalString(value.slug)
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
    && isOptionalString(value.cloze)
    && isOptionalString(value.clozeAnswer)
    && !("status" in value)
    && !("easiness" in value)
    && !("intervalDays" in value)
    && !("repetitions" in value)
    && !("dueAt" in value)
    && !("lastReviewedAt" in value);
}

export function isPublicWordPagePayload(value: unknown): value is PublicWordPage {
  if (!isRecord(value)
    || !Array.isArray(value.items)
    || !value.items.every(isPublicWordPayload)
    || !isNonNegativeInteger(value.count)
    || !isNonNegativeInteger(value.total)
    || !isPositiveInteger(value.page)
    || !isPositiveInteger(value.pageSize)
    || !isNonNegativeInteger(value.totalPages)
    || typeof value.hasPrevious !== "boolean"
    || typeof value.hasNext !== "boolean") {
    return false;
  }
  return value.count === value.items.length
    && value.count <= value.pageSize
    && value.totalPages === (value.total === 0 ? 0 : Math.ceil(value.total / value.pageSize));
}

export function publicWordToLearningItem(item: PublicWordAPIItem): LearningItem {
  return {
    id: `word-${item.id}`,
    wordId: item.id,
    kind: "word",
    slug: item.slug,
    prompt: item.lemma,
    answer: item.translation,
    phonetic: item.phonetic,
    partOfSpeech: item.partOfSpeech,
    section: normalizePartOfSpeech(item.partOfSpeech),
    topic: item.topic,
    aliases: item.aliases,
    acceptedAnswers: item.acceptedAnswers,
    examples: item.examples,
    note: item.note,
    // LearningItem keeps a string status for shared content rendering. An empty
    // internal value is deliberately never rendered for a guest; public API
    // validation above rejects any server-owned personalized status field.
    status: "",
    cloze: item.cloze,
    clozeAnswer: item.clozeAnswer,
  };
}
