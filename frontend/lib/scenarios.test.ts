import { describe, expect, it, vi } from "vitest";

import {
  buildSubmitScenarioStepRequest,
  createScenarioDraft,
  isScenarioAttemptPayload,
  isScenarioDetailPayload,
  isStartScenarioAttemptResponse,
  isSubmitScenarioStepResponse,
  normalizeScenarioList,
  parseScenarioDraft,
  resolveScenarioSubmissionIdentity,
  scenarioDraftStorageKey,
  scenarioPath,
  scenarioSlugFromPath,
  scenarioSubmissionFingerprint,
  serializeScenarioDraft,
  type Scenario,
  type ScenarioAttempt,
} from "./scenarios";

const ATTEMPT_ID = "00000000-0000-4000-8000-000000000196";
const SUBMISSION_ID = "00000000-0000-4000-8000-000000000197";

const STEP = {
  position: 0,
  kind: "fact-hypothesis",
  title: "Разделите сигналы",
  prompt: "Write the confirmed facts and current hypotheses.",
  productionOutcome: "Факты и гипотезы перечислены раздельно.",
  vocabulary: ["incident", "impact", "hypothesis"],
  reviewTarget: { term: "impact" },
  requiresFactHypothesis: true,
  minResponseCharacters: 60,
} as const;

const SCENARIO: Scenario = {
  slug: "incident-update",
  type: "incident",
  title: "Обновление по инциденту",
  summary: "Сформулируйте проверяемое обновление.",
  userRole: "on-call data engineer",
  workplaceGoal: "Дать команде точный статус и следующий checkpoint.",
  completionCriterion: "Итог содержит факты, гипотезы, влияние и mitigation.",
  constraints: ["Не объявлять root cause без доказательств"],
  requiresFactHypothesis: true,
  estimatedMinutes: 18,
  version: 1,
  stepCount: 1,
  steps: [STEP],
};

const ATTEMPT: ScenarioAttempt = {
  id: ATTEMPT_ID,
  scenario: SCENARIO,
  currentPosition: 0,
  status: "active",
  version: 1,
  completedPositions: [],
  currentStep: STEP,
  startedAt: "2026-07-25T16:00:00Z",
  updatedAt: "2026-07-25T16:00:00Z",
};

const REVIEW = {
  wordId: 196,
  status: "learning",
  easiness: 2.3,
  intervalDays: 1,
  repetitions: 0,
  dueAt: "2026-07-26T16:00:00Z",
  lastReviewedAt: "2026-07-25T16:01:00Z",
  requestedRating: "known",
  effectiveRating: "known",
  correct: true,
  judgementSource: "server",
  judgementReason: "scenario_target_present",
  matchedAnswer: "impact",
  reviewEventId: 2196,
  suggestionAvailable: false,
} as const;

describe("Scenario API payload contracts", () => {
  it("accepts the exact server-owned detail, attempt and review envelopes", () => {
    expect(isScenarioDetailPayload(SCENARIO)).toBe(true);
    expect(isScenarioAttemptPayload(ATTEMPT)).toBe(true);
    expect(isStartScenarioAttemptResponse({ attempt: ATTEMPT, resumed: false })).toBe(true);
    expect(isSubmitScenarioStepResponse({ attempt: ATTEMPT, review: REVIEW, idempotentReplay: false })).toBe(true);
  });

  it("rejects incomplete detail and non-server judgement", () => {
    expect(isScenarioDetailPayload({ ...SCENARIO, steps: undefined })).toBe(false);
    expect(isSubmitScenarioStepResponse({
      attempt: ATTEMPT,
      review: { ...REVIEW, judgementSource: "legacy_client" },
      idempotentReplay: false,
    })).toBe(false);
  });

  it("builds only the bounded OpenAPI request fields", () => {
    const request = buildSubmitScenarioStepRequest({
      attemptVersion: 3,
      submissionId: SUBMISSION_ID,
      fields: {
        response: "  The impact is confirmed.\r\nWe will update at 17:00.  ",
        facts: "Impact is confirmed\nImpact is confirmed\nQueue depth is 120",
        hypotheses: "The consumer may be saturated",
      },
      requiresFactHypothesis: true,
      responseMs: 1050.7,
      timezoneOffsetMinutes: -120,
    });

    expect(request).toEqual({
      submissionId: SUBMISSION_ID,
      attemptVersion: 3,
      response: "The impact is confirmed.\nWe will update at 17:00.",
      facts: ["Impact is confirmed", "Queue depth is 120"],
      hypotheses: ["The consumer may be saturated"],
      review: { responseMs: 1051, timezoneOffsetMinutes: -120 },
    });
    expect(request).not.toHaveProperty("wordId");
    expect(request).not.toHaveProperty("rating");
    expect(request).not.toHaveProperty("correct");
    expect(request.review).not.toHaveProperty("answerRevealed");
  });
});

describe("Scenario retry identity", () => {
  it("reuses one submission id for the same normalized evidence", () => {
    const createID = vi.fn()
      .mockReturnValueOnce(SUBMISSION_ID)
      .mockReturnValueOnce("00000000-0000-4000-8000-000000000198");
    const firstFields = {
      response: "The impact is confirmed.",
      facts: "Queue is delayed\nImpact is confirmed",
      hypotheses: "Consumer saturation",
    };
    const first = resolveScenarioSubmissionIdentity(null, firstFields, createID);
    const retry = resolveScenarioSubmissionIdentity(first, {
      response: "  The impact is confirmed.  ",
      facts: "Queue is delayed\r\nImpact is confirmed",
      hypotheses: "Consumer saturation\n",
    }, createID);

    expect(retry).toEqual(first);
    expect(createID).toHaveBeenCalledTimes(1);
  });

  it("creates a new id after authored evidence changes", () => {
    const first = {
      fingerprint: scenarioSubmissionFingerprint({ response: "Before", facts: "", hypotheses: "" }),
      submissionId: SUBMISSION_ID,
    };
    const nextID = "00000000-0000-4000-8000-000000000198";
    expect(resolveScenarioSubmissionIdentity(first, {
      response: "After",
      facts: "",
      hypotheses: "",
    }, () => nextID)).toEqual({
      fingerprint: scenarioSubmissionFingerprint({ response: "After", facts: "", hypotheses: "" }),
      submissionId: nextID,
    });
  });
});

describe("Scenario local draft recovery", () => {
  it("round-trips only user-authored fields for the owned attempt position", () => {
    const draft = createScenarioDraft({
      userId: "user-196",
      attemptId: ATTEMPT_ID,
      position: 0,
    }, {
      response: "Draft response",
      facts: "Confirmed fact",
      hypotheses: "Current hypothesis",
    }, "2026-07-25T16:20:00Z");

    const raw = serializeScenarioDraft(draft);
    expect(parseScenarioDraft(raw, {
      userId: "user-196",
      attemptId: ATTEMPT_ID,
      position: 0,
    })).toEqual(draft);
    expect(raw).not.toContain("accessToken");
    expect(raw).not.toContain("refreshToken");
  });

  it("rejects corrupted and cross-attempt drafts", () => {
    const draft = createScenarioDraft({ userId: "user-196", attemptId: ATTEMPT_ID, position: 0 }, {
      response: "Draft response",
      facts: "",
      hypotheses: "",
    }, "2026-07-25T16:20:00Z");
    expect(parseScenarioDraft("not-json", {
      userId: "user-196",
      attemptId: ATTEMPT_ID,
      position: 0,
    })).toBeNull();
    expect(parseScenarioDraft(serializeScenarioDraft(draft), {
      userId: "user-196",
      attemptId: "00000000-0000-4000-8000-000000000199",
      position: 0,
    })).toBeNull();
  });

  it("uses an explicit versioned storage key", () => {
    expect(scenarioDraftStorageKey("user-196", ATTEMPT_ID, 2)).toBe(
      `lexigo:scenario-draft:v1:user-196:${ATTEMPT_ID}:2`,
    );
  });
});

describe("Scenario navigation helpers", () => {
  it("creates and parses canonical slug routes", () => {
    expect(scenarioPath("incident-update")).toBe("/scenarios/incident-update");
    expect(scenarioSlugFromPath("/scenarios/incident-update")).toBe("incident-update");
    expect(scenarioSlugFromPath("/scenarios/Incident_Update")).toBeNull();
    expect(scenarioSlugFromPath("/scenario/incident-update")).toBeNull();
  });

  it("normalizes line evidence without silently merging distinct values", () => {
    expect(normalizeScenarioList(" Impact \nimpact\nAction\n\nNext update ")).toEqual([
      "Impact",
      "Action",
      "Next update",
    ]);
  });
});
