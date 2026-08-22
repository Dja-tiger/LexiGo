import type { LessonSelectionReason } from "./learning";

export type LearningTerm = "recall" | "due" | "retained" | "cloze" | "chunk";
export type LessonSourceLabelKey =
  | "mixed"
  | "noun"
  | "verb"
  | "adjective"
  | "phrases"
  | "daily-life"
  | "travel"
  | "data-engineering"
  | "backend"
  | "academic-technical-english";
export type SystemStateKind = "loading" | "empty" | "error" | "success";
export type InterfaceAction = "retry" | "home" | "continueLesson";

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

const LESSON_SOURCE_LABELS: Record<LessonSourceLabelKey, string> = {
  mixed: "Смешанная практика",
  noun: "Существительные",
  verb: "Глаголы",
  adjective: "Прилагательные",
  phrases: "Технические фразы",
  "daily-life": "Бытовой английский",
  travel: "Для путешествий",
  "data-engineering": "Инженерия данных",
  backend: "Backend-разработка",
  "academic-technical-english": "Academic Technical English",
};

const LESSON_SELECTION_REASON_LABELS: Record<LessonSelectionReason, string> = {
  recent_failure: "Недавняя ошибка",
  due: "Готово к повторению",
  overdue: "Просрочено к повторению",
  relearning_due: "Пора закрепить повторно",
  repeated_again: "Повторная ошибка",
  repeated_almost: "Повторная оценка «Почти»",
  weak_topic: "Слабая тема",
  new: "Новый материал",
  scheduled: "По расписанию",
  manual: "Выбрано вручную",
};

const SYSTEM_STATE_EYEBROWS: Record<SystemStateKind, string> = {
  loading: "ЗАГРУЗКА",
  empty: "НИЧЕГО НЕ НАЙДЕНО",
  error: "НЕ УДАЛОСЬ ЗАГРУЗИТЬ",
  success: "ГОТОВО",
};

const INTERFACE_ACTION_LABELS: Record<InterfaceAction, string> = {
  retry: "Повторить",
  home: "На главную",
  continueLesson: "Продолжить урок",
};

const TOPIC_LABELS: Record<string, string> = {
  "academic-technical-english": "Технический английский",
  "daily life": "Повседневная жизнь",
  travel: "Путешествия",
  "data engineering": "Инженерия данных",
  "backend development": "Backend-разработка",
  "backend terminology": "Backend-терминология",
  incident: "Инциденты",
  incidents: "Инциденты",
  "incident updates": "Обновления по инцидентам",
  troubleshooting: "Диагностика проблем",
  architecture: "Архитектура",
  "architecture trade-offs": "Архитектурные компромиссы",
  performance: "Производительность",
  delivery: "Планирование работ",
  release: "Релизы",
  operations: "Эксплуатация",
  communication: "Рабочее общение",
  meetings: "Встречи",
  "code review": "Ревью кода",
  databases: "Базы данных",
  storage: "Хранение данных",
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

export function lessonSourceLabel(source: string): string {
  const trimmed = source.trim();
  if (!trimmed) return "Раздел не указан";
  return LESSON_SOURCE_LABELS[normalizedKey(trimmed) as LessonSourceLabelKey] ?? trimmed;
}

export function lessonSelectionReasonLabel(reason: LessonSelectionReason): string {
  return LESSON_SELECTION_REASON_LABELS[reason];
}

export function systemStateEyebrow(kind: SystemStateKind): string {
  return SYSTEM_STATE_EYEBROWS[kind];
}

export function interfaceActionLabel(action: InterfaceAction): string {
  return INTERFACE_ACTION_LABELS[action];
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
