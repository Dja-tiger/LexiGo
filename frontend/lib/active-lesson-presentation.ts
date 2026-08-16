import { lessonSelectionReasonLabel } from "./interface-copy";
import { trackLearnHandoffItem } from "./lesson-composition-handoff";
import type { LessonSelectionReason } from "./learning";
import type { AnswerMode } from "./progress";

export type ActiveLessonFeedbackKind = "idle" | "pending" | "correct" | "incorrect" | "study";
export type ActiveLessonChoiceState = "idle" | "selected" | "correct" | "incorrect";

export function activeLessonModeLabel(mode: AnswerMode): string {
  if (mode === "study") return "Изучение";
  if (mode === "choice") return "Выбор ответа";
  return "Воспроизведение";
}

export function activeLessonEyebrow(mode: AnswerMode, kind: "word" | "phrase"): string {
  trackLearnHandoffItem(kind);
  if (mode === "study") return kind === "phrase" ? "НОВАЯ ФРАЗА" : "НОВОЕ СЛОВО";
  if (mode === "choice") return "ВЫБЕРИТЕ ПЕРЕВОД";
  return "ВВЕДИТЕ ОТВЕТ";
}

export function activeLessonSelectionReasonText(reason?: LessonSelectionReason): string {
  return reason ? `Почему предложено: ${lessonSelectionReasonLabel(reason)}` : "";
}

export function activeLessonConfidenceAvailable(mode: AnswerMode, revealed: boolean): boolean {
  return mode === "study" || revealed;
}

export function activeLessonFeedbackKind(
  mode: AnswerMode,
  revealed: boolean,
  correct: boolean | undefined,
): ActiveLessonFeedbackKind {
  if (correct === true) return "correct";
  if (correct === false) return "incorrect";
  if (mode === "study" && revealed) return "study";
  if (revealed) return "pending";
  return "idle";
}

export function activeLessonChoiceState(
  option: string,
  selectedAnswer: string,
  expectedAnswer: string,
  revealed: boolean,
  normalize: (value: string) => string,
): ActiveLessonChoiceState {
  if (!revealed) return normalize(option) === normalize(selectedAnswer) ? "selected" : "idle";
  if (normalize(option) === normalize(expectedAnswer)) return "correct";
  if (normalize(option) === normalize(selectedAnswer)) return "incorrect";
  return "idle";
}
