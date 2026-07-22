import { learningTermCopy } from "./interface-copy";

export type LessonCompositionFallback = "words_only" | "phrases_only" | "empty";

export type LessonComposition = {
  total: number;
  words: number;
  phrases: number;
  due: number;
  new: number;
  scheduled: number;
  availableWords: number;
  availablePhrases: number;
  fallback?: LessonCompositionFallback;
};

export function russianPlural(value: number, one: string, few: string, many: string): string {
  const mod100 = value % 100;
  const mod10 = value % 10;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

export function lessonCompositionDescription(composition: LessonComposition): string {
  const itemLabel = russianPlural(composition.total, "элемент", "элемента", "элементов");
  const wordLabel = russianPlural(composition.words, "слово", "слова", "слов");
  const phraseLabel = russianPlural(composition.phrases, "фраза", "фразы", "фраз");
  return `${composition.total} ${itemLabel} · ${composition.words} ${wordLabel} · ${composition.phrases} ${phraseLabel}`;
}

export function lessonPriorityDescription(composition: LessonComposition): string {
  const parts = [
    `${learningTermCopy("due").label}: ${composition.due}`,
    `Новых: ${composition.new}`,
  ];
  if (composition.scheduled > 0) parts.push(`Запланировано: ${composition.scheduled}`);
  return parts.join(" · ");
}

export function lessonCompositionFallbackMessage(composition: LessonComposition): string {
  if (composition.fallback === "words_only") {
    return "Фраз для выбранного режима сейчас нет. Урок продолжится доступными словами.";
  }
  if (composition.fallback === "phrases_only") {
    return "Слов для выбранного режима сейчас нет. Урок продолжится доступными фразами.";
  }
  if (composition.fallback === "empty") {
    return "Для выбранного режима пока нет доступных элементов.";
  }
  return "";
}
