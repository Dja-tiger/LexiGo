export type WordSection = "mixed" | "noun" | "verb" | "adjective";
export type LessonSize = 15 | 30 | 60 | "all";

export type LearningItem = {
  id: string;
  wordId?: number;
  kind: "word" | "phrase";
  slug?: string;
  prompt: string;
  answer: string;
  phonetic: string;
  partOfSpeech: string;
  section: WordSection | "other" | "phrase";
  topic: string;
  examples: string[];
  note: string;
  status: string;
  cloze?: string;
  clozeAnswer?: string;
};

export function normalizePartOfSpeech(value: string): Exclude<LearningItem["section"], "mixed" | "phrase"> {
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
  if (section !== "mixed") return items.filter((item) => item.section === section);
  const order: LearningItem["section"][] = ["noun", "verb", "adjective", "other"];
  return roundRobin(order.map((part) => items.filter((item) => item.section === part)));
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
  return value
    .trim()
    .toLowerCase()
    .replace(/[ё]/g, "е")
    .replace(/[.,;:!?()[\]{}"'«»]/g, "")
    .replace(/\s+/g, " ");
}
