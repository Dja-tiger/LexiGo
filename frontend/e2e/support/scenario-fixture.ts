import type { Page, Route } from "@playwright/test";

import type {
  Scenario,
  ScenarioAttempt,
  ScenarioStep,
  SubmitScenarioStepRequest,
  SubmitScenarioStepResponse,
} from "../../lib/scenarios";

export const SCENARIO_SESSION = {
  user: {
    id: "00000000-0000-4000-8000-000000000196",
    email: "scenario@example.com",
    displayName: "Scenario Learner",
    createdAt: "2026-01-01T00:00:00Z",
  },
  tokens: {
    accessToken: "scenario-access-token",
    tokenType: "Bearer",
    expiresIn: 900,
  },
};

const ATTEMPT_ID = "00000000-0000-4000-8000-000000000296";
const STARTED_AT = "2026-07-25T16:00:00Z";

export const SCENARIO_STEPS: ScenarioStep[] = [
  {
    position: 0,
    kind: "fact-hypothesis",
    title: "Разделите подтверждённое и предполагаемое",
    prompt: "Write a concise incident update with confirmed impact, facts, and current hypotheses.",
    productionOutcome: "Факты, гипотезы и влияние сформулированы раздельно.",
    vocabulary: ["impact", "confirmed", "hypothesis"],
    reviewTarget: { term: "impact" },
    requiresFactHypothesis: true,
    minResponseCharacters: 60,
  },
  {
    position: 1,
    kind: "production",
    title: "Опишите действие по снижению влияния",
    prompt: "Explain the mitigation that is running now and what it is expected to change.",
    productionOutcome: "Mitigation описан как проверяемое действие с ожидаемым эффектом.",
    vocabulary: ["mitigate", "rollback", "traffic"],
    reviewTarget: { term: "mitigate" },
    requiresFactHypothesis: false,
    minResponseCharacters: 50,
  },
  {
    position: 2,
    kind: "final-message",
    title: "Зафиксируйте следующий checkpoint",
    prompt: "Send the final update with the next checkpoint, owner, and decision boundary.",
    productionOutcome: "Итоговое сообщение содержит следующий checkpoint и владельца действия.",
    vocabulary: ["checkpoint", "owner", "decision"],
    reviewTarget: { term: "checkpoint" },
    requiresFactHypothesis: false,
    minResponseCharacters: 60,
  },
];

export const SCENARIO_DETAIL: Scenario = {
  slug: "incident-update",
  type: "incident",
  title: "Обновление по инциденту",
  summary: "Подготовьте точный статус для команды без преждевременного объявления root cause.",
  userRole: "on-call data engineer",
  workplaceGoal: "Сообщить влияние, подтверждённые факты, текущие гипотезы и следующий checkpoint.",
  completionCriterion: "Команда понимает текущее влияние, mitigation и время следующего обновления.",
  constraints: [
    "Не объявлять root cause без доказательств",
    "Отделять факты от гипотез",
  ],
  requiresFactHypothesis: true,
  estimatedMinutes: 18,
  version: 1,
  stepCount: SCENARIO_STEPS.length,
  steps: SCENARIO_STEPS,
};

type ScenarioFixtureOptions = {
  initialPosition?: number;
  initialStatus?: "active" | "paused";
};

type RecordedSubmission = {
  position: number;
  payload: SubmitScenarioStepRequest;
};

export type ScenarioFixture = {
  submissions: () => RecordedSubmission[];
  pauseRequests: () => Array<Record<string, unknown>>;
  resumeRequests: () => Array<Record<string, unknown>>;
  attemptSnapshot: () => ScenarioAttempt | null;
  failNextSubmission: () => void;
};

async function fulfillJSON(route: Route, status: number, body: unknown): Promise<void> {
  await route.fulfill({
    status,
    contentType: "application/json",
    body: JSON.stringify(body),
  });
}

function cloneAttempt(attempt: ScenarioAttempt): ScenarioAttempt {
  return structuredClone(attempt);
}

function createAttempt(position: number, status: "active" | "paused"): ScenarioAttempt {
  const safePosition = Math.min(Math.max(position, 0), SCENARIO_STEPS.length - 1);
  return {
    id: ATTEMPT_ID,
    scenario: SCENARIO_DETAIL,
    currentPosition: safePosition,
    status,
    version: 1,
    completedPositions: Array.from({ length: safePosition }, (_, index) => index),
    currentStep: SCENARIO_STEPS[safePosition],
    startedAt: STARTED_AT,
    updatedAt: STARTED_AT,
  };
}

function versionConflict(route: Route, attempt: ScenarioAttempt): Promise<void> {
  return fulfillJSON(route, 409, {
    error: {
      code: "scenario_attempt_version_conflict",
      message: `expected attempt version ${attempt.version}`,
    },
  });
}

function reviewResult(position: number, targetPresent: boolean, reviewEventId: number) {
  return {
    wordId: 19600 + position,
    status: targetPresent ? "review" : "learning",
    easiness: targetPresent ? 2.6 : 2.3,
    intervalDays: targetPresent ? 3 : 1,
    repetitions: targetPresent ? 1 : 0,
    dueAt: targetPresent ? "2026-07-28T16:01:00Z" : "2026-07-26T16:01:00Z",
    lastReviewedAt: "2026-07-25T16:01:00Z",
    requestedRating: targetPresent ? "known" : "again",
    effectiveRating: targetPresent ? "known" : "again",
    correct: targetPresent,
    judgementSource: "server" as const,
    judgementReason: targetPresent ? "scenario_target_present" as const : "scenario_target_missing" as const,
    ...(targetPresent ? { matchedAnswer: SCENARIO_STEPS[position].reviewTarget.term } : {}),
    reviewEventId,
    suggestionAvailable: !targetPresent,
  };
}

export async function installScenarioFixture(
  page: Page,
  options: ScenarioFixtureOptions = {},
): Promise<ScenarioFixture> {
  const submissions: RecordedSubmission[] = [];
  const pauses: Array<Record<string, unknown>> = [];
  const resumes: Array<Record<string, unknown>> = [];
  const accepted = new Map<string, { fingerprint: string; response: SubmitScenarioStepResponse }>();
  let attempt: ScenarioAttempt | null = null;
  let failSubmission = false;
  let reviewEventID = 1960;

  await page.context().addCookies([{
    name: "lexigo_csrf",
    value: "scenario-csrf",
    url: "http://127.0.0.1:3000",
    sameSite: "Lax",
  }]);

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path === "/api/v1/auth/refresh") {
      return fulfillJSON(route, 200, SCENARIO_SESSION);
    }

    if (path === `/api/v1/scenarios/${SCENARIO_DETAIL.slug}` && request.method() === "GET") {
      return fulfillJSON(route, 200, SCENARIO_DETAIL);
    }

    if (path === `/api/v1/scenarios/${SCENARIO_DETAIL.slug}/attempts` && request.method() === "POST") {
      const resumed = attempt !== null;
      if (!attempt) {
        attempt = createAttempt(options.initialPosition ?? 0, options.initialStatus ?? "active");
      }
      return fulfillJSON(route, 200, { attempt: cloneAttempt(attempt), resumed });
    }

    if (path === `/api/v1/scenario-attempts/${ATTEMPT_ID}` && request.method() === "GET") {
      if (!attempt) return fulfillJSON(route, 404, { error: { code: "not_found", message: "attempt not found" } });
      return fulfillJSON(route, 200, cloneAttempt(attempt));
    }

    if (path === `/api/v1/scenario-attempts/${ATTEMPT_ID}/pause` && request.method() === "POST") {
      if (!attempt) return fulfillJSON(route, 404, { error: { code: "not_found", message: "attempt not found" } });
      const payload = request.postDataJSON() as Record<string, unknown>;
      pauses.push(payload);
      if (payload.attemptVersion !== attempt.version) return versionConflict(route, attempt);
      attempt = {
        ...attempt,
        status: "paused",
        version: attempt.version + 1,
        updatedAt: "2026-07-25T16:02:00Z",
      };
      return fulfillJSON(route, 200, cloneAttempt(attempt));
    }

    if (path === `/api/v1/scenario-attempts/${ATTEMPT_ID}/resume` && request.method() === "POST") {
      if (!attempt) return fulfillJSON(route, 404, { error: { code: "not_found", message: "attempt not found" } });
      const payload = request.postDataJSON() as Record<string, unknown>;
      resumes.push(payload);
      if (payload.attemptVersion !== attempt.version) return versionConflict(route, attempt);
      attempt = {
        ...attempt,
        status: "active",
        version: attempt.version + 1,
        updatedAt: "2026-07-25T16:03:00Z",
      };
      return fulfillJSON(route, 200, cloneAttempt(attempt));
    }

    const submissionMatch = path.match(new RegExp(`^/api/v1/scenario-attempts/${ATTEMPT_ID}/steps/(\\d+)$`));
    if (submissionMatch && request.method() === "PUT") {
      if (!attempt) return fulfillJSON(route, 404, { error: { code: "not_found", message: "attempt not found" } });
      const position = Number(submissionMatch[1]);
      const payload = request.postDataJSON() as SubmitScenarioStepRequest;
      submissions.push({ position, payload: structuredClone(payload) });
      const fingerprint = JSON.stringify(payload);
      const replay = accepted.get(payload.submissionId);
      if (replay) {
        if (replay.fingerprint !== fingerprint) {
          return fulfillJSON(route, 409, {
            error: { code: "submission_id_conflict", message: "submission id already owns another payload" },
          });
        }
        return fulfillJSON(route, 200, { ...structuredClone(replay.response), idempotentReplay: true });
      }
      if (failSubmission) {
        failSubmission = false;
        return fulfillJSON(route, 503, {
          error: { code: "scenario_transport_unavailable", message: "temporary scenario submission failure" },
        });
      }
      if (payload.attemptVersion !== attempt.version || position !== attempt.currentPosition) {
        return versionConflict(route, attempt);
      }

      const step = SCENARIO_STEPS[position];
      const targetPresent = payload.response.toLocaleLowerCase("en-US")
        .includes(step.reviewTarget.term.toLocaleLowerCase("en-US"));
      reviewEventID += 1;
      const completedPositions = [...attempt.completedPositions, position];
      const nextPosition = position + 1;
      const completed = nextPosition >= SCENARIO_STEPS.length;
      const acceptedAt = `2026-07-25T16:0${Math.min(position + 4, 9)}:00Z`;
      attempt = {
        ...attempt,
        currentPosition: completed ? position : nextPosition,
        status: completed ? "completed" : "active",
        version: attempt.version + 1,
        completedPositions,
        ...(completed ? { currentStep: undefined, completedAt: acceptedAt } : { currentStep: SCENARIO_STEPS[nextPosition] }),
        updatedAt: acceptedAt,
        lastSubmission: {
          position,
          submissionId: payload.submissionId,
          response: payload.response,
          facts: payload.facts ?? [],
          hypotheses: payload.hypotheses ?? [],
          reviewEventId: reviewEventID,
          acceptedAt,
        },
      };
      const response: SubmitScenarioStepResponse = {
        attempt: cloneAttempt(attempt),
        review: reviewResult(position, targetPresent, reviewEventID),
        idempotentReplay: false,
      };
      accepted.set(payload.submissionId, { fingerprint, response: structuredClone(response) });
      return fulfillJSON(route, 200, response);
    }

    return fulfillJSON(route, 404, {
      error: { code: "not_mocked", message: `${request.method()} ${path}` },
    });
  });

  return {
    submissions: () => structuredClone(submissions),
    pauseRequests: () => structuredClone(pauses),
    resumeRequests: () => structuredClone(resumes),
    attemptSnapshot: () => attempt ? cloneAttempt(attempt) : null,
    failNextSubmission: () => {
      failSubmission = true;
    },
  };
}

export async function openScenarioEntry(page: Page): Promise<void> {
  await page.goto(`/scenarios/${SCENARIO_DETAIL.slug}`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: SCENARIO_DETAIL.title }).waitFor({ state: "visible" });
}

export async function startScenario(page: Page): Promise<void> {
  await openScenarioEntry(page);
  await page.getByRole("button", { name: "Начать или продолжить", exact: true }).click();
  await page.getByRole("textbox", { name: "Рабочая формулировка на английском" }).waitFor({ state: "visible" });
}
