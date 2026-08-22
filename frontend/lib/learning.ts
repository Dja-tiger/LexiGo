export type PartOfSpeechSection = "noun" | "verb" | "adjective" | "other";
export type WordCollection = "daily-life" | "travel" | "data-engineering" | "backend" | "academic-technical-english";
export type WordSection = "mixed" | Exclude<PartOfSpeechSection, "other"> | WordCollection;
export type LessonSize = 15 | 30 | 60 | "all";
export type LessonSessionKind = "study" | "review" | "remediation";
export type LessonSelectionReason =
  | "recent_failure"
  | "due"
  | "overdue"
  | "relearning_due"
  | "repeated_again"
  | "repeated_almost"
  | "weak_topic"
  | "new"
  | "scheduled"
  | "manual";

export const WORD_COLLECTION_TOPICS: Record<WordCollection, string> = {
  "daily-life": "Daily Life",
  travel: "Travel",
  "data-engineering": "Data Engineering",
  backend: "Backend Development",
  "academic-technical-english": "academic-technical-english",
};

export type LearningItem = {
  id: string;
  wordId?: number;
  kind: "word" | "phrase";
  slug?: string;
  prompt: string;
  answer: string;
  phonetic: string;
  partOfSpeech: string;
  section: PartOfSpeechSection | "phrase";
  topic: string;
  aliases?: string[];
  acceptedAnswers?: string[];
  examples: string[];
  note: string;
  status: string;
  selectionReason?: LessonSelectionReason;
  cloze?: string;
  clozeAnswer?: string;
};

export type AnswerJudgementReason = "accepted_exact" | "accepted_normalized" | "rejected_no_answer" | "rejected_no_match";

export type AnswerJudgement = {
  correct: boolean;
  reason: AnswerJudgementReason;
  matchedAnswer: string;
};

export function normalizePartOfSpeech(value: string): PartOfSpeechSection {
  const normalized = value.trim().toLowerCase();
  const tokens = normalized.split(/[\s,;/()\-]+/).filter(Boolean);
  if (tokens.some((token) => token === "noun" || token === "n") || normalized.includes("существ")) return "noun";
  if (tokens.some((token) => token === "verb" || token === "v") || normalized.includes("глагол")) return "verb";
  if (tokens.some((token) => token === "adjective" || token === "adj") || normalized.includes("прилаг")) return "adjective";
  return "other";
}

function roundRobin<T>(groups: T[][]): T[] {
  const result: T[] = [];
  const indexes = groups.map(() => 0);
  let added = true;
  while (added) {
    added = false;
    groups.forEach((group, groupIndex) => {
      const item = group[indexes[groupIndex]];
      if (item !== undefined) {
        result.push(item);
        indexes[groupIndex] += 1;
        added = true;
      }
    });
  }
  return result;
}

export function prepareWordItems(items: LearningItem[], section: WordSection): LearningItem[] {
  if (section in WORD_COLLECTION_TOPICS) {
    const topic = WORD_COLLECTION_TOPICS[section as WordCollection];
    return items.filter((item) => item.kind === "word" && item.topic === topic);
  }
  if (section !== "mixed") return items.filter((item) => item.kind === "word" && item.section === section);
  const order: PartOfSpeechSection[] = ["noun", "verb", "adjective", "other"];
  return roundRobin(order.map((part) => items.filter((item) => item.kind === "word" && item.section === part)));
}

export function takeLessonBlock(items: LearningItem[], size: LessonSize): LearningItem[] {
  return size === "all" ? items : items.slice(0, size);
}

export function inferClozeAnswer(prompt: string, cloze?: string): string {
  if (!cloze || !cloze.includes("_")) return "";
  const firstBlank = cloze.indexOf("_");
  const lastBlank = cloze.lastIndexOf("_");
  const prefix = cloze.slice(0, firstBlank);
  const suffix = cloze.slice(lastBlank + 1);
  if (!prompt.startsWith(prefix) || !prompt.endsWith(suffix)) return "";
  return prompt.slice(prefix.length, prompt.length - suffix.length).trim();
}

export function exerciseAnswer(item: LearningItem): string {
  if (item.kind === "phrase" && item.cloze) {
    return item.clozeAnswer?.trim() || inferClozeAnswer(item.prompt, item.cloze) || item.answer.trim();
  }
  return item.answer.trim();
}

export function exercisePromptLabel(item: LearningItem): string {
  return item.kind === "phrase" && item.cloze
    ? "Введите пропущенное английское слово или фрагмент"
    : "Введите перевод или смысл своими словами";
}

function hash(value: string): number {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

export function buildAnswerOptions(current: LearningItem, pool: LearningItem[], count = 4): string[] {
  const correctAnswer = exerciseAnswer(current);
  const alternatives = Array.from(
    new Set(pool.map((item) => exerciseAnswer(item)).filter((answer) => answer && answer !== correctAnswer)),
  );
  alternatives.sort((left, right) => hash(`${current.id}:${left}`) - hash(`${current.id}:${right}`));
  const options = [correctAnswer, ...alternatives.slice(0, Math.max(0, count - 1))];
  return options.sort((left, right) => hash(`${current.id}:option:${left}`) - hash(`${current.id}:option:${right}`));
}

export function normalizeAnswer(value: string): string {
  let normalized = "";
  let spacePending = false;
  for (const inputCharacter of value.trim()) {
    const character = inputCharacter.toLocaleLowerCase("ru-RU") === "ё"
      ? "е"
      : inputCharacter.toLocaleLowerCase("ru-RU");
    if (/^[\p{L}\p{N}]$/u.test(character)) {
      if (spacePending && normalized) normalized += " ";
      normalized += character;
      spacePending = false;
    } else if (character === "'" || character === "’" || character === "ʼ") {
      // Apostrophes do not create a token boundary: don't and dont are equal.
    } else {
      spacePending = Boolean(normalized);
    }
  }
  return normalized.trim();
}

function canonicalTranslationCandidates(value: string): string[] {
  const trimmed = value.trim();
  if (!trimmed) return [];
  const alternatives = trimmed.split(/[,;/]/).map((candidate) => candidate.trim()).filter(Boolean);
  return alternatives.length > 1 ? [trimmed, ...alternatives] : [trimmed];
}

export function acceptedAnswersForItem(item: LearningItem): string[] {
  const primaryCandidates = item.kind === "word"
    ? canonicalTranslationCandidates(exerciseAnswer(item))
    : [exerciseAnswer(item)];
  const candidates = [...primaryCandidates, ...(item.acceptedAnswers ?? [])];
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const normalized = normalizeAnswer(candidate);
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

export function judgeLearningAnswer(item: LearningItem, submittedAnswer: string): AnswerJudgement {
  const trimmed = submittedAnswer.trim();
  const normalized = normalizeAnswer(trimmed);
  if (!normalized) return { correct: false, reason: "rejected_no_answer", matchedAnswer: "" };

  for (const candidate of acceptedAnswersForItem(item)) {
    if (trimmed.toLocaleLowerCase("ru-RU") === candidate.trim().toLocaleLowerCase("ru-RU")) {
      return { correct: true, reason: "accepted_exact", matchedAnswer: candidate };
    }
    if (normalized === normalizeAnswer(candidate)) {
      return { correct: true, reason: "accepted_normalized", matchedAnswer: candidate };
    }
  }
  return { correct: false, reason: "rejected_no_match", matchedAnswer: "" };
}
