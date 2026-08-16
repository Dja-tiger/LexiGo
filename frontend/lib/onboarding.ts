export type OnboardingState = "not_started" | "in_progress" | "completed" | "skipped";
export type DiagnosticSelfMark = "known" | "unsure" | "new";

export type DiagnosticPrompt = {
  position: number;
  id: number;
  kind: string;
  lemma: string;
  phonetic: string;
  partOfSpeech: string;
  topic: string;
};

export type DiagnosticReveal = {
  id: number;
  translation: string;
};

export type OnboardingSnapshot = {
  state: OnboardingState;
  total: number;
  marked: number;
  current?: DiagnosticPrompt;
};

export type DiagnosticMarkResult = {
  marked: number;
  total: number;
  completeReady: boolean;
  reveal: DiagnosticReveal;
};

const ONBOARDING_STATES = new Set<OnboardingState>([
  "not_started",
  "in_progress",
  "completed",
  "skipped",
]);
const DIAGNOSTIC_MARKS = new Set<DiagnosticSelfMark>(["known", "unsure", "new"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) > 0;
}

function isDiagnosticPrompt(value: unknown): value is DiagnosticPrompt {
  if (!isRecord(value)) return false;
  return isNonNegativeInteger(value.position)
    && isPositiveInteger(value.id)
    && typeof value.kind === "string"
    && typeof value.lemma === "string"
    && typeof value.phonetic === "string"
    && typeof value.partOfSpeech === "string"
    && typeof value.topic === "string";
}

function isDiagnosticReveal(value: unknown): value is DiagnosticReveal {
  return isRecord(value)
    && isPositiveInteger(value.id)
    && typeof value.translation === "string";
}

export function isOnboardingSnapshotPayload(value: unknown): value is OnboardingSnapshot {
  if (!isRecord(value)
    || typeof value.state !== "string"
    || !ONBOARDING_STATES.has(value.state as OnboardingState)
    || !isNonNegativeInteger(value.total)
    || !isNonNegativeInteger(value.marked)
    || (value.marked as number) > (value.total as number)) {
    return false;
  }
  if (value.current !== undefined && !isDiagnosticPrompt(value.current)) return false;
  if (value.state !== "in_progress" && value.current !== undefined) return false;
  return true;
}

export function isDiagnosticMarkResultPayload(value: unknown): value is DiagnosticMarkResult {
  return isRecord(value)
    && isNonNegativeInteger(value.marked)
    && isNonNegativeInteger(value.total)
    && (value.marked as number) <= (value.total as number)
    && typeof value.completeReady === "boolean"
    && isDiagnosticReveal(value.reveal);
}

export function isDiagnosticSelfMark(value: string): value is DiagnosticSelfMark {
  return DIAGNOSTIC_MARKS.has(value as DiagnosticSelfMark);
}

export function diagnosticMarkLabel(mark: DiagnosticSelfMark): string {
  if (mark === "known") return "Знаю";
  if (mark === "unsure") return "Не уверен";
  return "Новое";
}
