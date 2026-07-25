"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { isProgressSummaryPayload } from "../lib/account-resources";
import { authorizedJSON } from "../lib/authorized-json";
import type { Session } from "../lib/auth-session";
import type { ProgressSummary, ScenarioRecommendation } from "../lib/progress";
import {
  isScenarioPayload,
  scenarioPath,
  scenarioTypeLabel,
  type Scenario,
} from "../lib/scenarios";
import { describeRequestFailure, type RequestProblem } from "../lib/request-failure";

type ScenarioCatalogResponse = {
  items: Scenario[];
  count: number;
};

type LoadState =
  | { phase: "loading" }
  | { phase: "ready" }
  | { phase: "error"; problem: RequestProblem };

type LexigoScenarioCatalogAppProps = {
  initialSession: Session;
  onSessionUpdated: (session: Session) => void;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function isScenarioCatalogPayload(value: unknown): value is ScenarioCatalogResponse {
  if (!isRecord(value) || !Array.isArray(value.items)) return false;
  if (!Number.isInteger(value.count) || (value.count as number) < 0) return false;
  if (value.count !== value.items.length || !value.items.every(isScenarioPayload)) return false;

  const slugs = value.items.map((item) => item.slug);
  return new Set(slugs).size === slugs.length;
}

function recommendationLabel(recommendation: ScenarioRecommendation): string {
  return recommendation.action === "resume" ? "Продолжить" : "Начать";
}

function recommendationDescription(recommendation: ScenarioRecommendation): string {
  if (recommendation.reason === "resume_in_progress") {
    return "Незавершённая попытка · продолжите с сохранённого шага";
  }
  if (recommendation.reason === "first_uncompleted") {
    return "Этот сценарий ещё не завершался";
  }
  return recommendation.lastCompletedAt
    ? "Пора вернуться к сценарию, который практиковался раньше остальных"
    : "Следующий сценарий выбран сервером";
}

function CatalogLoading() {
  return (
    <section className="lx-scenario-catalog-state" aria-live="polite" aria-busy="true">
      <span>РАБОЧИЕ СЦЕНАРИИ</span>
      <h2>Загружаем доступные ситуации…</h2>
      <p>Получаем актуальный каталог из аккаунта.</p>
      <div className="lx-scenario-catalog-skeleton" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
    </section>
  );
}

export function LexigoScenarioCatalogApp({
  initialSession,
  onSessionUpdated,
}: LexigoScenarioCatalogAppProps) {
  const router = useRouter();
  const session = initialSession;
  const [catalog, setCatalog] = useState<Scenario[]>([]);
  const [catalogState, setCatalogState] = useState<LoadState>({ phase: "loading" });
  const [recommendation, setRecommendation] = useState<ScenarioRecommendation | null>(null);
  const [progressProblem, setProgressProblem] = useState<RequestProblem | null>(null);

  const adoptSession = useCallback((next: Session) => {
    if (session.tokens.accessToken !== next.tokens.accessToken) onSessionUpdated(next);
  }, [onSessionUpdated, session.tokens.accessToken]);

  const loadCatalog = useCallback(async (activeSession: Session, signal?: AbortSignal) => {
    setCatalogState({ phase: "loading" });
    try {
      const result = await authorizedJSON<ScenarioCatalogResponse>(
        activeSession,
        "/api/v1/scenarios",
        { signal },
        isScenarioCatalogPayload,
      );
      if (signal?.aborted) return;
      adoptSession(result.activeSession);
      setCatalog(result.data.items);
      setCatalogState({ phase: "ready" });
    } catch (error) {
      if (signal?.aborted) return;
      setCatalog([]);
      setCatalogState({
        phase: "error",
        problem: describeRequestFailure(error, "каталог сценариев"),
      });
    }
  }, [adoptSession]);

  const loadRecommendation = useCallback(async (activeSession: Session, signal?: AbortSignal) => {
    setProgressProblem(null);
    try {
      const result = await authorizedJSON<ProgressSummary>(
        activeSession,
        `/api/v1/progress?timezoneOffsetMinutes=${new Date().getTimezoneOffset()}`,
        { signal },
        isProgressSummaryPayload,
      );
      if (signal?.aborted) return;
      adoptSession(result.activeSession);
      setRecommendation(result.data.scenarios?.recommendation ?? null);
    } catch (error) {
      if (signal?.aborted) return;
      setRecommendation(null);
      setProgressProblem(describeRequestFailure(error, "рекомендацию сценария"));
    }
  }, [adoptSession]);

  useEffect(() => {
    const catalogController = new AbortController();
    const progressController = new AbortController();
    const timer = window.setTimeout(() => {
      void loadCatalog(session, catalogController.signal);
      void loadRecommendation(session, progressController.signal);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      catalogController.abort();
      progressController.abort();
    };
  }, [loadCatalog, loadRecommendation, session]);

  const initial = useMemo(() => (
    session.user.displayName.trim().charAt(0).toUpperCase()
    || session.user.email.charAt(0).toUpperCase()
    || "L"
  ), [session.user.displayName, session.user.email]);

  return (
    <div className="lx-app lx-scenario-catalog-route" data-route-client-island="scenario-catalog">
      <header className="lx-header">
        <div className="lx-header-tools">
          <button
            className="lx-avatar"
            type="button"
            aria-label="Открыть профиль"
            onClick={() => router.push("/profile", { scroll: false })}
          >
            {initial}
          </button>
        </div>
      </header>

      <div className="lx-app-shell">
        <main
          id="lexigo-main-content"
          className="lx-main-content lx-scenario-catalog-main"
          tabIndex={-1}
          aria-label="Рабочие сценарии"
        >
          <section className="lx-scenario-catalog-heading">
            <div>
              <span>ОБУЧЕНИЕ</span>
              <h1>Рабочие сценарии</h1>
              <p>Переносите техническую лексику в сообщения, решения и обсуждение рисков.</p>
            </div>
            <nav className="lx-learning-section-switch" aria-label="Разделы обучения">
              <Link href="/learn" prefetch={false}>Уроки</Link>
              <Link href="/scenarios" prefetch={false} aria-current="page" className="active">Сценарии</Link>
            </nav>
          </section>

          {recommendation ? (
            <section className="lx-scenario-catalog-recommendation" aria-label="Следующее действие">
              <div>
                <span>СЛЕДУЮЩЕЕ ДЕЙСТВИЕ</span>
                <h2>{recommendation.title}</h2>
                <p>{recommendationDescription(recommendation)}</p>
              </div>
              <Link
                className="lx-button primary"
                href={scenarioPath(recommendation.slug)}
                prefetch={false}
                data-scenario-recommendation-reason={recommendation.reason}
                data-scenario-recommendation-action={recommendation.action}
              >
                {recommendationLabel(recommendation)}
              </Link>
            </section>
          ) : progressProblem ? (
            <p className="lx-scenario-catalog-recommendation-note" role="status">
              Персональная рекомендация временно недоступна. Каталог можно использовать без неё.
            </p>
          ) : null}

          {catalogState.phase === "loading" ? <CatalogLoading /> : null}

          {catalogState.phase === "error" ? (
            <section className="lx-scenario-catalog-state" role="alert">
              <span>КАТАЛОГ НЕДОСТУПЕН</span>
              <h2>{catalogState.problem.title}</h2>
              <p>{catalogState.problem.message}</p>
              {catalogState.problem.correlationId ? <small>Код: {catalogState.problem.correlationId}</small> : null}
              {catalogState.problem.retryable ? (
                <button className="lx-button primary" type="button" onClick={() => void loadCatalog(session)}>
                  Повторить загрузку
                </button>
              ) : null}
            </section>
          ) : null}

          {catalogState.phase === "ready" && catalog.length === 0 ? (
            <section className="lx-scenario-catalog-state">
              <span>ВСЕ СЦЕНАРИИ</span>
              <h2>Доступных сценариев пока нет</h2>
              <p>Каталог пуст на сервере. Новые ситуации появятся здесь после публикации.</p>
              <Link className="lx-button ghost" href="/learn" prefetch={false}>Вернуться к урокам</Link>
            </section>
          ) : null}

          {catalogState.phase === "ready" && catalog.length > 0 ? (
            <section className="lx-scenario-catalog-listing" aria-labelledby="scenario-catalog-title">
              <div className="lx-scenario-catalog-listing-heading">
                <h2 id="scenario-catalog-title">Все сценарии</h2>
                <span>{catalog.length}</span>
              </div>
              <ul data-scenario-catalog-order={catalog.map((scenario) => scenario.slug).join(",")}>
                {catalog.map((scenario) => (
                  <li key={scenario.slug}>
                    <article className="lx-scenario-catalog-card">
                      <div className="lx-scenario-catalog-card-meta">
                        <span>{scenarioTypeLabel(scenario.type)}</span>
                        <small>{scenario.estimatedMinutes} мин · {scenario.stepCount} шага</small>
                      </div>
                      <h3>{scenario.title}</h3>
                      <p>{scenario.summary}</p>
                      <dl>
                        <div>
                          <dt>Роль</dt>
                          <dd>{scenario.userRole}</dd>
                        </div>
                        <div>
                          <dt>Результат</dt>
                          <dd>{scenario.workplaceGoal}</dd>
                        </div>
                      </dl>
                      <Link
                        href={scenarioPath(scenario.slug)}
                        prefetch={false}
                        aria-label={`Открыть сценарий «${scenario.title}»`}
                      >
                        <span>Открыть сценарий</span>
                        <span aria-hidden="true">→</span>
                      </Link>
                    </article>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}
