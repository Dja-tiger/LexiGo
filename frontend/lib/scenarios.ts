const SCENARIO_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SCENARIO_TYPES = new Set([
  "incident",
  "troubleshooting",
  "architecture-review",
  "data-pipeline",
  "release",
  "status-update",
] as const);
const SCENARIO_STEP_KINDS = new Set([
  "production",
  "fact-hypothesis",
  "revision",
  "final-message",
] as const);
const ATTEMPT_STATUSES = new Set(["active", "paused", "completed", "discarded"] as const);
const RATINGS = new Set(["again", "almost", "known"] as const);

export type ScenarioType =
  | "incident"
  | "troubleshooting"
  | "architecture-review"
  | "data-pipeline"
  | "release"
  | "status-update";

export type ScenarioStepKind = "production" | "fact-hypothesis" | "revision" | "final-message";
export type ScenarioAttemptStatus = "active" | "paused" | "completed" | "discarded";
export type ScenarioReviewRating = "again" | "almost" | "known";

export type ScenarioReviewTarget = {
  term: string;
};

export type ScenarioStep = {
  position: number;
  kind: ScenarioStepKind;
  title: string;
  prompt: string;
  productionOutcome: string;
  vocabulary: string[];
  reviewTarget: ScenarioReviewTarget;
  requiresFactHypothesis: boolean;
  minResponseCharacters: number;
};

export type Scenario = {
  slug: string;
  type: ScenarioType;
  title: string;
  summary: string;
  userRole: string;
  workplaceGoal: string;
  completionCriterion: string;
  constraints: string[];
  requiresFactHypothesis: boolean;
  estimatedMinutes: number;
  version: number;
  stepCount: number;
  steps?: ScenarioStep[];
};

export type ScenarioStepSubmission = {
  position: number;
  submissionId: string;
  response: string;
  facts: string[];
  hypotheses: string[];
  reviewEventId: number;
  acceptedAt: string;
};

export type ScenarioAttempt = {
  id: string;
  scenario: Scenario;
  currentPosition: number;
  status: ScenarioAttemptStatus;
  version: number;
  completedPositions: number[];
  currentStep?: ScenarioStep;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  lastSubmission?: ScenarioStepSubmission;
};

export type StartScenarioAttemptResponse = {
  attempt: ScenarioAttempt;
  resumed: boolean;
};

export type ScenarioReviewResult = {
  wordId: number;
  status: string;
  easiness: number;
  intervalDays: number;
  repetitions: number;
  dueAt: string;
  lastReviewedAt: string;
  requestedRating: ScenarioReviewRating;
  effectiveRating: ScenarioReviewRating;
  correct?: boolean;
  judgementSource: "server";
  judgementReason: "scenario_target_present" | "scenario_target_missing";
  matchedAnswer?: string;
  reviewEventId: number;
  suggestionAvailable: boolean;
};

export type SubmitScenarioStepResponse = {
  attempt: ScenarioAttempt;
  review: ScenarioReviewResult;
  idempotentReplay: boolean;
};

export type ScenarioDraftFields = {
  response: string;
  facts: string;
  hypotheses: string;
};

export type ScenarioDraft = ScenarioDraftFields & {
  version: 1;
  userId: string;
  attemptId: string;
  position: number;
  updatedAt: string;
};

export type ScenarioSubmissionIdentity = {
  fingerprint: string;
  submissionId: string;
};

export type SubmitScenarioStepRequest = {
  submissionId: string;
  attemptVersion: number;
  response: string;
  facts?: string[];
  hypotheses?: string[];
  review: {
    responseMs?: number;
    timezoneOffsetMinutes: number;
  };
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isInteger(value: unknown): value is number {
  return Number.isInteger(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return isInteger(value) && (value as number) >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return isInteger(value) && (value as number) > 0;
}

function isTimestamp(value: unknown): value is string {
  return isString(value) && Number.isFinite(Date.parse(value));
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isUniqueNonNegativeIntegerArray(value: unknown): value is number[] {
  return Array.isArray(value)
    && value.every(isNonNegativeInteger)
    && new Set(value).size === value.length;
}

export function isScenarioSlug(value: string): boolean {
  return SCENARIO_SLUG_PATTERN.test(value);
}

export function scenarioPath(slug: string): string {
  if (!isScenarioSlug(slug)) throw new Error("Invalid scenario slug");
  return `/scenarios/${slug}`;
}

export function scenarioSlugFromPath(pathname: string): string | null {
  const match = /^\/scenarios\/([^/?#]+)\/?$/.exec(pathname);
  if (!match) return null;
  const slug = decodeURIComponent(match[1]);
  return isScenarioSlug(slug) ? slug : null;
}

export function scenarioTypeLabel(type: ScenarioType): string {
  if (type === "incident") return "Incident update";
  if (type === "troubleshooting") return "Troubleshooting";
  if (type === "architecture-review") return "Architecture review";
  if (type === "data-pipeline") return "Data pipeline";
  if (type === "release") return "Release decision";
  return "Status update";
}

export function scenarioStepKindLabel(kind: ScenarioStepKind): string {
  if (kind === "fact-hypothesis") return "Факты и гипотезы";
  if (kind === "revision") return "Уточнение";
  if (kind === "final-message") return "Итоговое сообщение";
  return "Рабочий ответ";
}

export function isScenarioStepPayload(value: unknown): value is ScenarioStep {
  if (!isRecord(value)) return false;
  return isNonNegativeInteger(value.position)
    && SCENARIO_STEP_KINDS.has(value.kind as ScenarioStepKind)
    && isNonEmptyString(value.title)
    && isNonEmptyString(value.prompt)
    && isNonEmptyString(value.productionOutcome)
    && isStringArray(value.vocabulary)
    && isRecord(value.reviewTarget)
    && isNonEmptyString(value.reviewTarget.term)
    && typeof value.requiresFactHypothesis === "boolean"
    && isPositiveInteger(value.minResponseCharacters);
}

export function isScenarioPayload(value: unknown): value is Scenario {
  if (!isRecord(value)) return false;
  const steps = value.steps;
  return isScenarioSlug(isString(value.slug) ? value.slug : "")
    && SCENARIO_TYPES.has(value.type as ScenarioType)
    && isNonEmptyString(value.title)
    && isNonEmptyString(value.summary)
    && isNonEmptyString(value.userRole)
    && isNonEmptyString(value.workplaceGoal)
    && isNonEmptyString(value.completionCriterion)
    && isStringArray(value.constraints)
    && typeof value.requiresFactHypothesis === "boolean"
    && isPositiveInteger(value.estimatedMinutes)
    && isPositiveInteger(value.version)
    && isPositiveInteger(value.stepCount)
    && (steps === undefined || (Array.isArray(steps)
      && steps.length === value.stepCount
      && steps.every(isScenarioStepPayload)));
}

export function isScenarioDetailPayload(value: unknown): value is Scenario {
  return isScenarioPayload(value)
    && Array.isArray(value.steps)
    && value.steps.length === value.stepCount;
}

export function isScenarioStepSubmissionPayload(value: unknown): value is ScenarioStepSubmission {
  if (!isRecord(value)) return false;
  return isNonNegativeInteger(value.position)
    && isString(value.submissionId)
    && UUID_PATTERN.test(value.submissionId)
    && isNonEmptyString(value.response)
    && isStringArray(value.facts)
    && isStringArray(value.hypotheses)
    && isPositiveInteger(value.reviewEventId)
    && isTimestamp(value.acceptedAt);
}

export function isScenarioAttemptPayload(value: unknown): value is ScenarioAttempt {
  if (!isRecord(value)) return false;
  const currentStepValid = value.currentStep === undefined || isScenarioStepPayload(value.currentStep);
  const completedAtValid = value.completedAt === undefined || isTimestamp(value.completedAt);
  const lastSubmissionValid = value.lastSubmission === undefined
    || isScenarioStepSubmissionPayload(value.lastSubmission);
  return isString(value.id)
    && UUID_PATTERN.test(value.id)
    && isScenarioPayload(value.scenario)
    && isNonNegativeInteger(value.currentPosition)
    && ATTEMPT_STATUSES.has(value.status as ScenarioAttemptStatus)
    && isPositiveInteger(value.version)
    && isUniqueNonNegativeIntegerArray(value.completedPositions)
    && currentStepValid
    && isTimestamp(value.startedAt)
    && isTimestamp(value.updatedAt)
    && completedAtValid
    && lastSubmissionValid
    && (value.status === "completed" ? isTimestamp(value.completedAt) : true)
    && (value.status === "active" || value.status === "paused" ? isScenarioStepPayload(value.currentStep) : true);
}

export function isStartScenarioAttemptResponse(value: unknown): value is StartScenarioAttemptResponse {
  return isRecord(value)
    && isScenarioAttemptPayload(value.attempt)
    && typeof value.resumed === "boolean";
}

export function isScenarioReviewResultPayload(value: unknown): value is ScenarioReviewResult {
  if (!isRecord(value)) return false;
  return isPositiveInteger(value.wordId)
    && isNonEmptyString(value.status)
    && isFiniteNumber(value.easiness)
    && isNonNegativeInteger(value.intervalDays)
    && isNonNegativeInteger(value.repetitions)
    && isTimestamp(value.dueAt)
    && isTimestamp(value.lastReviewedAt)
    && RATINGS.has(value.requestedRating as ScenarioReviewRating)
    && RATINGS.has(value.effectiveRating as ScenarioReviewRating)
    && (value.correct === undefined || typeof value.correct === "boolean")
    && value.judgementSource === "server"
    && (value.judgementReason === "scenario_target_present" || value.judgementReason === "scenario_target_missing")
    && (value.matchedAnswer === undefined || isString(value.matchedAnswer))
    && isPositiveInteger(value.reviewEventId)
    && typeof value.suggestionAvailable === "boolean";
}

export function isSubmitScenarioStepResponse(value: unknown): value is SubmitScenarioStepResponse {
  return isRecord(value)
    && isScenarioAttemptPayload(value.attempt)
    && isScenarioReviewResultPayload(value.review)
    && typeof value.idempotentReplay === "boolean";
}

export function normalizeScenarioList(value: string): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const line of value.replace(/\r\n?/g, "\n").split("\n")) {
    const item = line.trim();
    if (!item) continue;
    const identity = item.toLocaleLowerCase("en-US");
    if (seen.has(identity)) continue;
    seen.add(identity);
    normalized.push(item);
  }
  return normalized;
}

export function normalizeScenarioResponse(value: string): string {
  return value.replace(/\r\n?/g, "\n").trim();
}

export function scenarioSubmissionFingerprint(fields: ScenarioDraftFields): string {
  return JSON.stringify({
    response: normalizeScenarioResponse(fields.response),
    facts: normalizeScenarioList(fields.facts),
    hypotheses: normalizeScenarioList(fields.hypotheses),
  });
}

export function resolveScenarioSubmissionIdentity(
  current: ScenarioSubmissionIdentity | null,
  fields: ScenarioDraftFields,
  createSubmissionId: () => string,
): ScenarioSubmissionIdentity {
  const fingerprint = scenarioSubmissionFingerprint(fields);
  if (current?.fingerprint === fingerprint) return current;
  const submissionId = createSubmissionId();
  if (!UUID_PATTERN.test(submissionId)) throw new Error("Submission id must be a UUID");
  return { fingerprint, submissionId };
}

export function buildSubmitScenarioStepRequest(input: {
  attemptVersion: number;
  submissionId: string;
  fields: ScenarioDraftFields;
  requiresFactHypothesis: boolean;
  responseMs?: number;
  timezoneOffsetMinutes: number;
}): SubmitScenarioStepRequest {
  if (!isPositiveInteger(input.attemptVersion)) throw new Error("Attempt version must be positive");
  if (!UUID_PATTERN.test(input.submissionId)) throw new Error("Submission id must be a UUID");
  const response = normalizeScenarioResponse(input.fields.response);
  if (!response) throw new Error("Scenario response is empty");
  const facts = normalizeScenarioList(input.fields.facts);
  const hypotheses = normalizeScenarioList(input.fields.hypotheses);
  const responseMs = input.responseMs === undefined
    ? undefined
    : Math.max(0, Math.round(input.responseMs));
  return {
    submissionId: input.submissionId,
    attemptVersion: input.attemptVersion,
    response,
    ...(input.requiresFactHypothesis ? { facts, hypotheses } : {}),
    review: {
      ...(responseMs === undefined ? {} : { responseMs }),
      timezoneOffsetMinutes: Math.round(input.timezoneOffsetMinutes),
    },
  };
}

export function scenarioDraftStorageKey(userId: string, attemptId: string, position: number): string {
  if (!userId || !UUID_PATTERN.test(attemptId) || !isNonNegativeInteger(position)) {
    throw new Error("Invalid Scenario draft identity");
  }
  return `lexigo:scenario-draft:v1:${userId}:${attemptId}:${position}`;
}

export function serializeScenarioDraft(draft: ScenarioDraft): string {
  return JSON.stringify(draft);
}

export function parseScenarioDraft(
  raw: string | null,
  expected: { userId: string; attemptId: string; position: number },
): ScenarioDraft | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value)) return null;
    if (value.version !== 1
      || value.userId !== expected.userId
      || value.attemptId !== expected.attemptId
      || value.position !== expected.position
      || !isString(value.response)
      || !isString(value.facts)
      || !isString(value.hypotheses)
      || !isTimestamp(value.updatedAt)) return null;
    return value as ScenarioDraft;
  } catch {
    return null;
  }
}

export function createScenarioDraft(
  identity: { userId: string; attemptId: string; position: number },
  fields: ScenarioDraftFields,
  updatedAt = new Date().toISOString(),
): ScenarioDraft {
  return {
    version: 1,
    ...identity,
    response: fields.response,
    facts: fields.facts,
    hypotheses: fields.hypotheses,
    updatedAt,
  };
}
