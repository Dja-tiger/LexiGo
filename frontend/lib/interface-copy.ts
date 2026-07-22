export type LearningTerm = "recall" | "due" | "retained" | "cloze" | "chunk";

export type LearningTermCopy = {
  label: string;
  explanation: string;
};

const LEARNING_TERMS: Record<LearningTerm, LearningTermCopy> = {
  recall: {
    label: "Вспомнить самостоятельно",
    explanation: "Ответ нужно восстановить по памяти, не открывая подсказку заранее.",
  },
  due: {
    label: "Готово к повторению",
    explanation: "Материал, для которого наступило запланированное время следующего повторения.",
  },
  retained: {
    label: "Закреплено",
    explanation: "Материал, который был успешно воспроизведён после интервала и сохранился в памяти.",
  },
  cloze: {
    label: "Восстановить пропуск",
    explanation: "Нужно вписать пропущенное английское слово или фрагмент фразы.",
  },
  chunk: {
    label: "Готовая фраза",
    explanation: "Устойчивый фрагмент речи, который полезно запоминать целиком.",
  },
};

const TOPIC_LABELS: Record<string, string> = {
  "academic-technical-english": "Технический английский",
  "daily life": "Повседневная жизнь",
  travel: "Путешествия",
  "data engineering": "Инженерия данных",
  "backend development": "Backend-разработка",
  incidents: "Инциденты",
  troubleshooting: "Диагностика проблем",
  architecture: "Архитектура",
  performance: "Производительность",
  delivery: "Планирование работ",
  release: "Релизы",
  operations: "Эксплуатация",
  communication: "Рабочее общение",
  meetings: "Встречи",
  "code review": "Ревью кода",
  databases: "Базы данных",
  api: "API",
  apis: "API",
  security: "Безопасность",
};

const PART_OF_SPEECH_LABELS: Record<string, string> = {
  noun: "существительное",
  n: "существительное",
  verb: "глагол",
  v: "глагол",
  adjective: "прилагательное",
  adj: "прилагательное",
  adverb: "наречие",
  preposition: "предлог",
  phrase: "фраза",
  word: "слово",
};

const STATUS_LABELS: Record<string, string> = {
  new: "Новое",
  learning: "Изучается",
  review: "На повторении",
  mastered: "Освоено",
  phrase: "Фраза",
};

function normalizedKey(value: string): string {
  return value.trim().toLocaleLowerCase("en-US");
}

export function learningTermCopy(term: LearningTerm): LearningTermCopy {
  return LEARNING_TERMS[term];
}

export function topicLabel(topic: string): string {
  const trimmed = topic.trim();
  if (!trimmed) return "Тема не указана";
  return TOPIC_LABELS[normalizedKey(trimmed)] ?? trimmed;
}

export function partOfSpeechLabel(partOfSpeech: string): string {
  const trimmed = partOfSpeech.trim();
  if (!trimmed) return "часть речи не указана";
  return PART_OF_SPEECH_LABELS[normalizedKey(trimmed)] ?? trimmed;
}

export function catalogStatusLabel(status: string): string {
  const trimmed = status.trim();
  if (!trimmed) return "Статус не указан";
  return STATUS_LABELS[normalizedKey(trimmed)] ?? trimmed;
}
