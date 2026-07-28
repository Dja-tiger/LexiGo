import type { CatalogPageInfo } from "./catalog-page";
import { catalogStatusLabel, topicLabel } from "./interface-copy";
import type { LearningItem } from "./learning";

export type PhraseAPIItem = {
  id: number;
  kind: "phrase";
  slug: string;
  lemma: string;
  translation: string;
  phonetic: string;
  partOfSpeech: string;
  topic: string;
  aliases?: string[];
  acceptedAnswers?: string[];
  examples: string[];
  note: string;
  status: string;
  cloze?: string;
  clozeAnswer?: string;
};

export type PhraseItemsResponse = {
  items: PhraseAPIItem[];
  count: number;
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  hasPrevious?: boolean;
  hasNext?: boolean;
};

export type PhraseCatalogResult = {
  items: PhraseItem[];
  info: CatalogPageInfo;
};

export type PhraseItem = LearningItem & {
  kind: "phrase";
  slug: string;
  wordId: number;
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

function isNonNegativeInteger(value: unknown): boolean {
  return Number.isInteger(value) && Number(value) >= 0;
}

function isPositiveInteger(value: unknown): boolean {
  return Number.isInteger(value) && Number(value) > 0;
}

export function isPhraseItemPayload(value: unknown): value is PhraseAPIItem {
  if (!isRecord(value)) return false;
  return isPositiveInteger(value.id)
    && value.kind === "phrase"
    && isString(value.slug)
    && value.slug.trim().length > 0
    && value.slug.length <= 120
    && !value.slug.includes("/")
    && isString(value.lemma)
    && value.lemma.trim().length > 0
    && isString(value.translation)
    && value.translation.trim().length > 0
    && isString(value.phonetic)
    && isString(value.partOfSpeech)
    && isString(value.topic)
    && value.topic.trim().length > 0
    && isOptionalStringArray(value.aliases)
    && isOptionalStringArray(value.acceptedAnswers)
    && Array.isArray(value.examples)
    && value.examples.every(isString)
    && isString(value.note)
    && isString(value.status)
    && isOptionalString(value.cloze)
    && isOptionalString(value.clozeAnswer);
}

export function isPhraseItemsResponsePayload(value: unknown): value is PhraseItemsResponse {
  if (!isRecord(value)
    || !Array.isArray(value.items)
    || !value.items.every(isPhraseItemPayload)
    || !isNonNegativeInteger(value.count)) {
    return false;
  }
  const optionalNonNegative = [value.total, value.totalPages]
    .every((entry) => entry === undefined || isNonNegativeInteger(entry));
  const optionalPositive = [value.page, value.pageSize]
    .every((entry) => entry === undefined || isPositiveInteger(entry));
  const optionalFlags = [value.hasPrevious, value.hasNext]
    .every((entry) => entry === undefined || typeof entry === "boolean");
  return optionalNonNegative && optionalPositive && optionalFlags;
}

export function phraseFromAPI(value: unknown): PhraseItem {
  if (!isPhraseItemPayload(value)) throw new TypeError("Некорректный payload фразы");
  const item = value;
  return {
    id: `phrase-${item.id}`,
    wordId: item.id,
    kind: "phrase",
    slug: item.slug,
    prompt: item.lemma,
    answer: item.translation,
    phonetic: item.phonetic,
    partOfSpeech: item.partOfSpeech,
    section: "phrase",
    topic: item.topic,
    aliases: item.aliases,
    acceptedAnswers: item.acceptedAnswers,
    examples: item.examples,
    note: item.note,
    status: item.status,
    cloze: item.cloze,
    clozeAnswer: item.clozeAnswer,
  };
}

export function phraseSlug(item: LearningItem): string {
  const explicit = item.slug?.trim();
  if (explicit) return explicit;
  return item.id.replace(/^phrase-/, "");
}

export function phraseTopicLabel(topic: string): string {
  return topicLabel(topic);
}

export function phraseStatusLabel(status: string): string {
  return catalogStatusLabel(status || "new");
}
