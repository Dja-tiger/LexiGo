"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  failedResourceStatus,
  loadingResourceStatus,
  readyResourceStatus,
  type ResourceStatus,
} from "../lib/account-resources";
import { authorizedJSON } from "../lib/authorized-json";
import type { Session } from "../lib/auth-session";
import { navigationURL } from "../lib/navigation";
import { describeRequestFailure, RequestFailure } from "../lib/request-failure";
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
  scenarioSlugFromPath,
  scenarioStepKindLabel,
  scenarioTypeLabel,
  serializeScenarioDraft,
  type Scenario,
  type ScenarioAttempt,
  type ScenarioDraftFields,
  type ScenarioStep,
  type ScenarioSubmissionIdentity,
  type SubmitScenarioStepResponse,
} from "../lib/scenarios";
import { AsyncStatePanel } from "./async-state";

const EMPTY_DRAFT: ScenarioDraftFields = {
  response: "",
  facts: "",
  hypotheses: "",
};

const HISTORY_GUARD_KEY = "lexigoScenarioGuard";

type LexigoScenarioAppProps = {
  pathname: string;
  initialSession: Session;
  onSessionUpdated: (session: Session) => void;
};

type AcceptedFeedback = {
  step: ScenarioStep;
  fields: ScenarioDraftFields;
  result: SubmitScenarioStepResponse;
};

type ExitIntent = "close" | "history";

function createSubmissionID(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, "0"));
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
}

function draftIdentity(session: Session, attempt: ScenarioAttempt) {
  return {
    userId: session.user.id,
    attemptId: attempt.id,
    position: attempt.currentPosition,
  };
}

function attemptDraftOwner(attempt: ScenarioAttempt): string {
  return attempt.currentStep ? `${attempt.id}:${attempt.currentPosition}` : "";
}

function safeReadDraft(session: Session, attempt: ScenarioAttempt): ScenarioDraftFields {
  if (typeof window === "undefined") return EMPTY_DRAFT;
  const identity = draftIdentity(session, attempt);
  try {
    const stored = parseScenarioDraft(
      window.sessionStorage.getItem(scenarioDraftStorageKey(identity.userId, identity.attemptId, identity.position)),
      identity,
    );
    return stored
      ? { response: stored.response, facts: stored.facts, hypotheses: stored.hypotheses }
      : EMPTY_DRAFT;
  } catch {
    return EMPTY_DRAFT;
  }
}

function safeWriteDraft(session: Session, attempt: ScenarioAttempt, fields: ScenarioDraftFields): void {
  if (typeof window === "undefined") return;
  const identity = draftIdentity(session, attempt);
  try {
    window.sessionStorage.setItem(
      scenarioDraftStorageKey(identity.userId, identity.attemptId, identity.position),
      serializeScenarioDraft(createScenarioDraft(identity, fields)),
    );
  } catch {
    // The attempt remains durable on the server when private mode blocks storage.
  }
}

function safeDeleteDraft(session: Session, attemptId: string, position: number): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(scenarioDraftStorageKey(session.user.id, attemptId, position));
  } catch {
    // Storage policy must not block a server-accepted submission.
  }
}

function hasFactHypothesisOverlap(fields: ScenarioDraftFields): boolean {
  const facts = new Set(normalizeScenarioList(fields.facts).map((value) => value.toLocaleLowerCase("en-US")));
  return normalizeScenarioList(fields.hypotheses)
    .some((value) => facts.has(value.toLocaleLowerCase("en-US")));
}

function progressValue(attempt: ScenarioAttempt | null, scenario: Scenario): number {
  if (!attempt) return 0;
  if (attempt.status === "completed") return scenario.stepCount;
  return Math.min(scenario.stepCount, attempt.completedPositions.length);
}

function actionProblem(error: unknown, resource: string): string {
  const problem = describeRequestFailure(error, resource);
  return problem.correlationId
    ? `${problem.message} Код обращения: ${problem.correlationId}.`
    : problem.message;
}

export function LexigoScenarioApp({
  pathname,
  initialSession,
  onSessionUpdated,
}: LexigoScenarioAppProps) {
  const router = useRouter();
  const slug = scenarioSlugFromPath(pathname);
  const session = initialSession;
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [scenarioStatus, setScenarioStatus] = useState<ResourceStatus>(loadingResourceStatus);
  const [attempt, setAttempt] = useState<ScenarioAttempt | null>(null);
  const [draft, setDraft] = useState<ScenarioDraftFields>(EMPTY_DRAFT);
  const [draftOwner, setDraftOwner] = useState("");
  const [submissionIdentity, setSubmissionIdentity] = useState<ScenarioSubmissionIdentity | null>(null);
  const [feedback, setFeedback] = useState<AcceptedFeedback | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [exitIntent, setExitIntent] = useState<ExitIntent | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const editorStartedAtRef = useRef(0);
  const allowNavigationRef = useRef(false);

  const adoptSession = useCallback((next: Session) => {
    if (session.tokens.accessToken !== next.tokens.accessToken) onSessionUpdated(next);
  }, [onSessionUpdated, session.tokens.accessToken]);

  const adoptAttempt = useCallback((nextAttempt: ScenarioAttempt, preserveOwnedDraft = false) => {
    const nextOwner = attemptDraftOwner(nextAttempt);
    setAttempt(nextAttempt);

    if (!nextAttempt.currentStep) {
      setDraft(EMPTY_DRAFT);
      setDraftOwner("");
      setSubmissionIdentity(null);
      editorStartedAtRef.current = 0;
      return;
    }

    if (preserveOwnedDraft && nextOwner === draftOwner) return;
    setDraft(safeReadDraft(session, nextAttempt));
    setDraftOwner(nextOwner);
    setSubmissionIdentity(null);
    editorStartedAtRef.current = performance.now();
  }, [draftOwner, session]);

  const loadScenario = useCallback(async (signal?: AbortSignal) => {
    if (!slug) {
      setScenario(null);
      setScenarioStatus(failedResourceStatus(new Error("Некорректный адрес сценария"), "сценарий"));
      return;
    }
    setScenarioStatus(loadingResourceStatus());
    try {
      const result = await authorizedJSON<Scenario>(
        session,
        `/api/v1/scenarios/${encodeURIComponent(slug)}`,
        { signal },
        isScenarioDetailPayload,
      );
      if (signal?.aborted) return;
      adoptSession(result.activeSession);
      setScenario(result.data);
      setScenarioStatus(readyResourceStatus());
    } catch (error) {
      if (signal?.aborted) return;
      setScenario(null);
      setScenarioStatus(failedResourceStatus(error, "сценарий"));
    }
  }, [adoptSession, session, slug]);

  const resyncAttempt = useCallback(async (attemptId: string): Promise<ScenarioAttempt | null> => {
    try {
      const result = await authorizedJSON<ScenarioAttempt>(
        session,
        `/api/v1/scenario-attempts/${encodeURIComponent(attemptId)}`,
        {},
        isScenarioAttemptPayload,
      );
      adoptSession(result.activeSession);
      adoptAttempt(result.data, true);
      setStatusMessage("Состояние сценария синхронизировано с сервером.");
      return result.data;
    } catch (error) {
      setActionError(actionProblem(error, "состояние сценария"));
      return null;
    }
  }, [adoptAttempt, adoptSession, session]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void loadScenario(controller.signal), 0);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [loadScenario]);

  const currentStep = attempt?.currentStep;
  const owner = attempt && currentStep ? attemptDraftOwner(attempt) : "";

  useEffect(() => {
    if (!attempt || !currentStep || feedback || owner !== draftOwner) return;
    safeWriteDraft(session, attempt, draft);
  }, [attempt, currentStep, draft, draftOwner, feedback, owner, session]);

  useEffect(() => {
    if (!attempt || attempt.status !== "active" || feedback) return;
    const guardIdentity = attempt.id;
    const currentState = window.history.state as Record<string, unknown> | null;
    if (currentState?.[HISTORY_GUARD_KEY] !== guardIdentity) {
      window.history.replaceState(
        { ...(currentState ?? {}), lexigoScenarioBase: guardIdentity },
        "",
        window.location.href,
      );
      window.history.pushState(
        { ...(currentState ?? {}), [HISTORY_GUARD_KEY]: guardIdentity },
        "",
        window.location.href,
      );
    }

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (allowNavigationRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const onPopState = () => {
      if (allowNavigationRef.current) return;
      window.history.forward();
      setExitIntent("history");
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("popstate", onPopState);
    };
  }, [attempt, feedback]);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => feedbackRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const startAttempt = useCallback(async () => {
    if (!slug) return;
    setBusy(true);
    setActionError("");
    setStatusMessage("");
    try {
      const result = await authorizedJSON<{ attempt: ScenarioAttempt; resumed: boolean }>(
        session,
        `/api/v1/scenarios/${encodeURIComponent(slug)}/attempts`,
        { method: "POST", body: "{}" },
        isStartScenarioAttemptResponse,
      );
      adoptSession(result.activeSession);
      adoptAttempt(result.data.attempt);
      setFeedback(null);
      setStatusMessage(result.data.resumed ? "Сохранённая попытка восстановлена." : "Сценарий начат.");
      window.setTimeout(() => mainRef.current?.focus(), 0);
    } catch (error) {
      setActionError(actionProblem(error, "запуск сценария"));
    } finally {
      setBusy(false);
    }
  }, [adoptAttempt, adoptSession, session, slug]);

  const resumeAttempt = useCallback(async () => {
    if (!attempt) return;
    setBusy(true);
    setActionError("");
    try {
      const result = await authorizedJSON<ScenarioAttempt>(
        session,
        `/api/v1/scenario-attempts/${encodeURIComponent(attempt.id)}/resume`,
        {
          method: "POST",
          body: JSON.stringify({ attemptVersion: attempt.version }),
        },
        isScenarioAttemptPayload,
      );
      adoptSession(result.activeSession);
      adoptAttempt(result.data, true);
      setStatusMessage("Сценарий продолжен с сохранённого шага.");
      window.setTimeout(() => mainRef.current?.focus(), 0);
    } catch (error) {
      if (error instanceof RequestFailure && error.status === 409) {
        await resyncAttempt(attempt.id);
        setActionError("Сценарий изменился на другом устройстве. Проверьте синхронизированный шаг и повторите действие.");
      } else {
        setActionError(actionProblem(error, "возобновление сценария"));
      }
    } finally {
      setBusy(false);
    }
  }, [adoptAttempt, adoptSession, attempt, resyncAttempt, session]);

  const pauseAttempt = useCallback(async (navigateAfterPause: boolean) => {
    if (!attempt) return;
    if (currentStep) safeWriteDraft(session, attempt, draft);
    if (attempt.status !== "active") {
      if (navigateAfterPause) {
        allowNavigationRef.current = true;
        router.replace(navigationURL({ view: "learn" }));
      }
      return;
    }
    setBusy(true);
    setActionError("");
    try {
      const result = await authorizedJSON<ScenarioAttempt>(
        session,
        `/api/v1/scenario-attempts/${encodeURIComponent(attempt.id)}/pause`,
        {
          method: "POST",
          body: JSON.stringify({ attemptVersion: attempt.version }),
        },
        isScenarioAttemptPayload,
      );
      adoptSession(result.activeSession);
      adoptAttempt(result.data, true);
      setStatusMessage("Черновик сохранён, попытка поставлена на паузу.");
      setExitIntent(null);
      if (navigateAfterPause) {
        allowNavigationRef.current = true;
        router.replace(navigationURL({ view: "learn" }));
      }
    } catch (error) {
      if (error instanceof RequestFailure && error.status === 409) {
        await resyncAttempt(attempt.id);
        setActionError("Версия попытки изменилась. Черновик сохранён локально; проверьте синхронизированный шаг.");
      } else {
        setActionError(actionProblem(error, "сохранение сценария"));
      }
    } finally {
      setBusy(false);
    }
  }, [adoptAttempt, adoptSession, attempt, currentStep, draft, resyncAttempt, router, session]);

  const validationMessage = useMemo(() => {
    if (!currentStep || feedback || attempt?.status !== "active") return "";
    const response = draft.response.trim();
    if (response.length < currentStep.minResponseCharacters) {
      return `Добавьте ещё ${currentStep.minResponseCharacters - response.length} симв.`;
    }
    if (currentStep.requiresFactHypothesis) {
      if (normalizeScenarioList(draft.facts).length === 0) return "Добавьте хотя бы один подтверждённый факт.";
      if (normalizeScenarioList(draft.hypotheses).length === 0) return "Добавьте хотя бы одну гипотезу.";
      if (hasFactHypothesisOverlap(draft)) return "Одинаковый пункт не может быть одновременно фактом и гипотезой.";
    }
    return "";
  }, [attempt?.status, currentStep, draft, feedback]);

  const submitStep = useCallback(async () => {
    if (!attempt || !currentStep || validationMessage) return;
    const identity = resolveScenarioSubmissionIdentity(submissionIdentity, draft, createSubmissionID);
    setSubmissionIdentity(identity);
    safeWriteDraft(session, attempt, draft);
    setBusy(true);
    setActionError("");
    setStatusMessage("Отправляем ответ и получаем объективный языковой сигнал…");
    try {
      const responseMs = editorStartedAtRef.current > 0
        ? performance.now() - editorStartedAtRef.current
        : undefined;
      const payload = buildSubmitScenarioStepRequest({
        attemptVersion: attempt.version,
        submissionId: identity.submissionId,
        fields: draft,
        requiresFactHypothesis: currentStep.requiresFactHypothesis,
        responseMs,
        timezoneOffsetMinutes: new Date().getTimezoneOffset(),
      });
      const result = await authorizedJSON<SubmitScenarioStepResponse>(
        session,
        `/api/v1/scenario-attempts/${encodeURIComponent(attempt.id)}/steps/${currentStep.position}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        },
        isSubmitScenarioStepResponse,
      );
      adoptSession(result.activeSession);
      safeDeleteDraft(session, attempt.id, currentStep.position);
      setAttempt(result.data.attempt);
      setFeedback({ step: currentStep, fields: draft, result: result.data });
      setStatusMessage(result.data.idempotentReplay
        ? "Сервер подтвердил ранее принятую отправку без повторного review event."
        : "Ответ принят; объективный языковой сигнал сохранён.");
    } catch (error) {
      if (error instanceof RequestFailure && error.status === 409) {
        await resyncAttempt(attempt.id);
        setActionError("Шаг уже изменился на другом устройстве. Ваш текст и submission id сохранены; проверьте состояние перед повтором.");
      } else {
        setActionError(`${actionProblem(error, "отправку ответа")} Текст и submission id сохранены для безопасного повтора.`);
      }
      setStatusMessage("");
    } finally {
      setBusy(false);
    }
  }, [adoptSession, attempt, currentStep, draft, resyncAttempt, session, submissionIdentity, validationMessage]);

  const continueAfterFeedback = useCallback(() => {
    if (attempt) adoptAttempt(attempt);
    setFeedback(null);
    setActionError("");
    setStatusMessage(attempt?.status === "completed" ? "Сценарий завершён." : "Открыт следующий шаг.");
    window.setTimeout(() => mainRef.current?.focus(), 0);
  }, [adoptAttempt, attempt]);

  const leaveCompleted = useCallback(() => {
    allowNavigationRef.current = true;
    router.push(navigationURL({ view: "learn" }));
  }, [router]);

  if (scenarioStatus.phase === "loading" || scenarioStatus.phase === "idle") {
    return (
      <main className="lx-scenario lx-scenario-state" aria-busy="true" aria-live="polite">
        <div className="lx-scenario-state-mark">L</div>
        <strong>Загружаем рабочий сценарий…</strong>
      </main>
    );
  }

  if (!scenario) {
    const problem = scenarioStatus.problem;
    return (
      <main className="lx-scenario lx-scenario-state" tabIndex={-1} ref={mainRef}>
        <AsyncStatePanel
          label="Сценарий недоступен"
          kind="error"
          title={problem?.title ?? "Сценарий не найден"}
          message={problem?.message ?? "Проверьте ссылку или вернитесь к настройке обучения."}
          reference={problem?.correlationId}
          actionLabel={problem?.retryable ? "Повторить" : "К обучению"}
          onAction={problem?.retryable ? () => void loadScenario() : leaveCompleted}
          focusResult
        />
      </main>
    );
  }

  const completed = attempt?.status === "completed" && !feedback;
  const paused = attempt?.status === "paused";
  const active = attempt?.status === "active";
  const shownStep = feedback?.step ?? currentStep ?? scenario.steps?.[0];
  const shownFields = feedback?.fields ?? draft;
  const completedSteps = progressValue(attempt, scenario);
  const percentage = Math.round((completedSteps / scenario.stepCount) * 100);
  const targetPresent = feedback?.result.review.judgementReason === "scenario_target_present";
  const headerStatus = busy
    ? "Сохраняем…"
    : paused
      ? "На паузе"
      : feedback
        ? "Ответ сохранён"
        : active
          ? "Черновик сохраняется"
          : "Готово к работе";

  return (
    <div className="lx-scenario" data-scenario-state={completed ? "completed" : feedback ? "feedback" : paused ? "paused" : active ? "active" : "entry"}>
      <header className="lx-scenario-header">
        <span className="lx-scenario-brand" aria-label="LexiGo">LexiGo</span>
        <button
          type="button"
          className="lx-scenario-back"
          aria-label="Вернуться к обучению"
          onClick={() => active ? setExitIntent("close") : leaveCompleted()}
        >
          <span aria-hidden="true">←</span>
        </button>
        <strong>{scenarioTypeLabel(scenario.type)}</strong>
        <span className="lx-scenario-save-status" role="status" aria-live="polite">{headerStatus}</span>
        <button
          type="button"
          className="lx-scenario-close-mobile"
          onClick={() => active ? setExitIntent("close") : leaveCompleted()}
        >
          Закрыть
        </button>
      </header>

      <div className="lx-scenario-progress-row">
        <div
          className="lx-scenario-progress"
          role="progressbar"
          aria-label="Прогресс сценария"
          aria-valuemin={0}
          aria-valuemax={scenario.stepCount}
          aria-valuenow={completedSteps}
          aria-valuetext={`${completedSteps} из ${scenario.stepCount} шагов`}
        >
          <span style={{ width: `${percentage}%` }} />
        </div>
        {attempt ? (
          <button
            type="button"
            className="lx-scenario-close-desktop"
            onClick={() => active ? setExitIntent("close") : leaveCompleted()}
          >
            Закрыть сценарий
          </button>
        ) : null}
      </div>

      <main className="lx-scenario-main" ref={mainRef} tabIndex={-1}>
        {!attempt ? (
          <section className="lx-scenario-entry" aria-labelledby="scenario-entry-title">
            <div className="lx-scenario-context-card">
              <span>СЦЕНАРИЙ</span>
              <h1 id="scenario-entry-title">{scenario.title}</h1>
              <p>{scenario.summary}</p>
              <dl>
                <div><dt>Роль</dt><dd>{scenario.userRole}</dd></div>
                <div><dt>Рабочая цель</dt><dd>{scenario.workplaceGoal}</dd></div>
                <div><dt>Критерий завершения</dt><dd>{scenario.completionCriterion}</dd></div>
              </dl>
              <ul aria-label="Ограничения сценария">
                {scenario.constraints.map((constraint) => <li key={constraint}>{constraint}</li>)}
              </ul>
            </div>
            <div className="lx-scenario-entry-action">
              <span>{scenario.estimatedMinutes} мин. · {scenario.stepCount} шага</span>
              <h2>Сформулируйте рабочий ответ без self-rating</h2>
              <p>Сервер проверит только заданную языковую цель, сохранит review event и вернёт слабую формулировку в обычную очередь повторения.</p>
              <button type="button" className="lx-scenario-primary" disabled={busy} onClick={() => void startAttempt()}>
                {busy ? "Открываем…" : "Начать или продолжить"}
              </button>
            </div>
          </section>
        ) : completed ? (
          <section className="lx-scenario-completed" aria-labelledby="scenario-completed-title">
            <span>СЦЕНАРИЙ ЗАВЕРШЁН</span>
            <h1 id="scenario-completed-title">{scenario.title}</h1>
            <p>{scenario.completionCriterion}</p>
            <div className="lx-scenario-completed-evidence">
              <strong>{attempt.completedPositions.length} из {scenario.stepCount} шагов приняты сервером</strong>
              <span>Языковые сигналы записаны как обычные Recall review events; расписание повторения остаётся серверным.</span>
            </div>
            <button type="button" className="lx-scenario-primary" onClick={leaveCompleted}>Вернуться к обучению</button>
          </section>
        ) : shownStep ? (
          <div className="lx-scenario-workspace">
            <section className="lx-scenario-context-card" aria-labelledby="scenario-title">
              <span>СЦЕНАРИЙ</span>
              <h1 id="scenario-title">{scenario.title}</h1>
              <dl>
                <div><dt>Роль</dt><dd>{scenario.userRole}</dd></div>
                <div><dt>Текущий шаг</dt><dd>{scenarioStepKindLabel(shownStep.kind)} · {shownStep.position + 1} из {scenario.stepCount}</dd></div>
                <div><dt>Цель</dt><dd>{scenario.workplaceGoal}</dd></div>
                <div><dt>Критерий завершения</dt><dd>{scenario.completionCriterion}</dd></div>
                <div><dt>Ограничения</dt><dd>{scenario.constraints.join(" · ")}</dd></div>
              </dl>
              <div className="lx-scenario-prompt">
                <strong>{shownStep.title}</strong>
                <p lang="en">{shownStep.prompt}</p>
              </div>
              <div className="lx-scenario-criteria" aria-label="Языковые ориентиры шага">
                {shownStep.vocabulary.slice(0, 3).map((term) => {
                  const isTarget = term.toLocaleLowerCase("en-US") === shownStep.reviewTarget.term.toLocaleLowerCase("en-US");
                  const state = feedback && isTarget ? (targetPresent ? "retained" : "weak") : "neutral";
                  return <span key={term} data-criterion-state={state} lang="en">{term}</span>;
                })}
                {!shownStep.vocabulary.some((term) => term.toLocaleLowerCase("en-US") === shownStep.reviewTarget.term.toLocaleLowerCase("en-US")) ? (
                  <span data-criterion-state={feedback ? (targetPresent ? "retained" : "weak") : "neutral"} lang="en">
                    {shownStep.reviewTarget.term}
                  </span>
                ) : null}
              </div>
            </section>

            <section className="lx-scenario-response-card" aria-labelledby="scenario-response-title">
              <span>ВАШ ОТВЕТ</span>
              <h2 id="scenario-response-title" className="lx-visually-hidden">Ответ на текущий шаг</h2>
              <label className="lx-scenario-field">
                <span>Рабочая формулировка на английском</span>
                <textarea
                  lang="en"
                  rows={8}
                  value={shownFields.response}
                  readOnly={Boolean(feedback) || paused}
                  disabled={busy}
                  onChange={(event) => setDraft((current) => ({ ...current, response: event.target.value }))}
                  aria-describedby="scenario-response-help scenario-response-count"
                />
              </label>
              <div className="lx-scenario-response-meta">
                <small id="scenario-response-help">Минимум {shownStep.minResponseCharacters} символов. Языковая цель не раскрывается как правильный ответ.</small>
                <small id="scenario-response-count">{shownFields.response.trim().length} симв.</small>
              </div>

              {shownStep.requiresFactHypothesis ? (
                <div className="lx-scenario-evidence-grid">
                  <label className="lx-scenario-field">
                    <span>Подтверждённые факты — по одному на строку</span>
                    <textarea
                      rows={4}
                      value={shownFields.facts}
                      readOnly={Boolean(feedback) || paused}
                      disabled={busy}
                      onChange={(event) => setDraft((current) => ({ ...current, facts: event.target.value }))}
                    />
                  </label>
                  <label className="lx-scenario-field">
                    <span>Текущие гипотезы — по одной на строку</span>
                    <textarea
                      rows={4}
                      value={shownFields.hypotheses}
                      readOnly={Boolean(feedback) || paused}
                      disabled={busy}
                      onChange={(event) => setDraft((current) => ({ ...current, hypotheses: event.target.value }))}
                    />
                  </label>
                </div>
              ) : null}

              {feedback ? (
                <div className="lx-scenario-feedback" ref={feedbackRef} tabIndex={-1} role="status" aria-live="polite">
                  <strong>Шаг принят сервером</strong>
                  <p>{feedback.step.productionOutcome}</p>
                  <div data-language-signal={targetPresent ? "present" : "missing"}>
                    <b>{targetPresent ? "Языковая цель использована" : "Языковую цель нужно закрепить"}</b>
                    <span lang="en">{feedback.step.reviewTarget.term}</span>
                    <small>{targetPresent
                      ? "Объективный Recall-сигнал сохранён; расписание определил сервер."
                      : "Формулировка вернётся в обычную очередь повторения; self-rating не применялся."}</small>
                  </div>
                </div>
              ) : paused ? (
                <div className="lx-scenario-paused-note" role="status">
                  <strong>Попытка на паузе</strong>
                  <span>Черновик сохранён на этом устройстве, позиция и версия — на сервере.</span>
                </div>
              ) : (
                <div className="lx-scenario-guidance">
                  <strong>После отправки</strong>
                  <span>Сервер примет шаг, проверит только review target и сохранит обычный Recall review event.</span>
                </div>
              )}

              {actionError ? <div className="lx-scenario-action-error" role="alert">{actionError}</div> : null}
              {validationMessage && !paused && !feedback ? <div className="lx-scenario-validation" role="status">{validationMessage}</div> : null}

              <div className="lx-scenario-actions">
                {feedback ? (
                  <button type="button" className="lx-scenario-primary" onClick={continueAfterFeedback}>
                    {attempt.status === "completed" ? "Показать результат" : "Следующий шаг"}
                  </button>
                ) : paused ? (
                  <button type="button" className="lx-scenario-primary" disabled={busy} onClick={() => void resumeAttempt()}>
                    {busy ? "Продолжаем…" : "Продолжить сценарий"}
                  </button>
                ) : (
                  <button type="button" className="lx-scenario-primary" disabled={busy || Boolean(validationMessage)} onClick={() => void submitStep()}>
                    {busy ? "Отправляем…" : "Отправить ответ"}
                  </button>
                )}
                {!feedback && !paused ? (
                  <button type="button" className="lx-scenario-secondary" disabled={busy} onClick={() => void pauseAttempt(false)}>
                    Сохранить черновик
                  </button>
                ) : null}
              </div>
            </section>

            <aside className="lx-scenario-after" aria-label="Что произойдёт после отправки">
              <strong>После отправки</strong>
              <p>Слабая формулировка попадёт в будущую очередь повторения. Objective feedback хранится отдельно от self-rating.</p>
            </aside>
          </div>
        ) : (
          <AsyncStatePanel
            label="Шаг сценария недоступен"
            kind="error"
            title="Сервер не вернул текущий шаг"
            message="Синхронизируйте попытку или вернитесь к обучению. Черновик не удалён."
            actionLabel="Синхронизировать"
            onAction={() => attempt ? void resyncAttempt(attempt.id) : undefined}
            focusResult
          />
        )}
      </main>

      <div className="lx-scenario-live lx-visually-hidden" role="status" aria-live="polite">{statusMessage}</div>

      {exitIntent ? (
        <div className="lx-scenario-dialog-backdrop">
          <div className="lx-scenario-dialog" role="dialog" aria-modal="true" aria-labelledby="scenario-exit-title">
            <span>СОХРАНЕНИЕ</span>
            <h2 id="scenario-exit-title">Сохранить черновик и закрыть сценарий?</h2>
            <p>Текст останется на этом устройстве, а сервер поставит попытку на паузу. Review event создаётся только после принятой отправки.</p>
            {actionError ? <div className="lx-scenario-action-error" role="alert">{actionError}</div> : null}
            <div>
              <button type="button" className="lx-scenario-secondary" disabled={busy} onClick={() => setExitIntent(null)}>Продолжить работу</button>
              <button type="button" className="lx-scenario-primary" disabled={busy} onClick={() => void pauseAttempt(true)}>
                {busy ? "Сохраняем…" : exitIntent === "history" ? "Сохранить и выйти" : "Сохранить и закрыть"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
