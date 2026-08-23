"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  failedResourceStatus,
  isActiveLessonPayload,
  isProgressSummaryPayload,
  loadingResourceStatus,
  readyResourceStatus,
  type ResourceStatus,
} from "../lib/account-resources";
import { normalizeProgressValue } from "../lib/accessibility-semantics";
import { authorizedJSON } from "../lib/authorized-json";
import type { Session } from "../lib/auth-session";
import { interfaceActionLabel, learningTermCopy, lessonSourceLabel } from "../lib/interface-copy";
import { russianPlural } from "../lib/lesson-composition";
import { lessonResumeURL } from "../lib/lesson-resume-intent";
import type { LessonSessionKind } from "../lib/learning";
import { navigationURL, viewTitle, type NavigationTarget } from "../lib/navigation";
import { queueProductJourneyIntent, type ProductJourneyIntent } from "../lib/product-journey";
import { goalPercent, type ProgressSummary } from "../lib/progress";
import { RequestFailure } from "../lib/request-failure";
import { AsyncResourceNotice, AsyncStatePanel } from "./async-state";

type LessonSource =
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

type StudyMode = "study" | "recall" | "choice";

type LessonItemResponse = {
  id: number;
  position: number;
  rating?: string;
};

type LessonSessionResponse = {
  id: string;
  source: LessonSource;
  studyMode: StudyMode;
  sessionKind?: LessonSessionKind;
  lessonSize: string;
  currentIndex: number;
  version: number;
  status: "active";
  items: LessonItemResponse[];
  createdAt: string;
  updatedAt: string;
};

type HomeLessonComposition = {
  total: number;
  words: number;
  phrases: number;
  due: number;
  new: number;
  scheduled: number;
  availableWords: number;
  availablePhrases: number;
};

type HomeLessonPreview = {
  source: "mixed";
  studyMode: StudyMode;
  sessionKind: LessonSessionKind;
  lessonSize: "15";
  composition: HomeLessonComposition;
};

type HomeProcessPreviews = Record<LessonSessionKind, HomeLessonPreview | null>;

type LexigoHomeAppProps = {
  initialSession: Session | null;
  onSessionUpdated: (session: Session) => void;
};

type HomeIconName = "play" | "repeat" | "learn" | "chart" | "flame";

type HomeNextAction = {
  eyebrow: string;
  title: string;
  description: string;
  label: string;
  icon: HomeIconName;
  disabled?: boolean;
  processKind?: LessonSessionKind;
  action: () => void;
};

type HomeProcessDefinition = {
  kind: LessonSessionKind;
  mode: StudyMode;
  icon: HomeIconName;
};

const PRODUCT_ROUTE_GRAPH_EVENT = "lexigo:product-route-graph";
const DUE_COPY = learningTermCopy("due");
const RETAINED_COPY = learningTermCopy("retained");
const RETRY_ACTION_LABEL = interfaceActionLabel("retry");
const CONTINUE_LESSON_ACTION_LABEL = interfaceActionLabel("continueLesson");
const HOME_AUTOMATIC_LESSON_SIZE = 15;
const HOME_PROCESS_DEFINITIONS: readonly HomeProcessDefinition[] = [
  { kind: "review", mode: "recall", icon: "repeat" },
  { kind: "remediation", mode: "recall", icon: "repeat" },
  { kind: "study", mode: "study", icon: "learn" },
];
const EMPTY_PROCESS_PREVIEWS: HomeProcessPreviews = {
  study: null,
  review: null,
  remediation: null,
};
const WORD_PREVIEW = {
  prompt: "incident",
  phonetic: "/ˈɪnsɪdənt/",
  answer: "инцидент, происшествие",
  example: "We need to identify the cause of the incident.",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

function isHomeLessonPreviewPayload(
  value: unknown,
  expectedKind: LessonSessionKind,
  expectedMode: StudyMode,
): value is HomeLessonPreview {
  if (!isRecord(value)
    || value.source !== "mixed"
    || value.studyMode !== expectedMode
    || value.sessionKind !== expectedKind
    || value.lessonSize !== String(HOME_AUTOMATIC_LESSON_SIZE)
    || !isRecord(value.composition)) {
    return false;
  }

  const composition = value.composition;
  return [
    composition.total,
    composition.words,
    composition.phrases,
    composition.due,
    composition.new,
    composition.scheduled,
    composition.availableWords,
    composition.availablePhrases,
  ].every(isNonNegativeInteger);
}

function processBacklog(preview: HomeLessonPreview | null): number {
  if (!preview) return 0;
  return preview.composition.availableWords + preview.composition.availablePhrases;
}

function boundedAutomaticCount(backlog: number): number {
  return Math.min(HOME_AUTOMATIC_LESSON_SIZE, backlog);
}

function processActionLabel(kind: LessonSessionKind, backlog: number): string {
  const count = boundedAutomaticCount(backlog);
  switch (kind) {
    case "review":
      return backlog > count ? `Повторить ${count} из ${backlog}` : `Повторить ${count}`;
    case "remediation":
      return backlog > count ? `Разобрать ${count} из ${backlog} слабых мест` : `Разобрать ${count} слабых мест`;
    case "study":
      return backlog > count ? `Изучить ${count} новых из ${backlog}` : `Изучить ${count} новых`;
  }
}

function HomeIcon({ name, size = 19 }: { name: HomeIconName; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (name === "play") return <svg {...common}><path d="m8 5 11 7-11 7V5Z" /></svg>;
  if (name === "repeat") return <svg {...common}><path d="M20 7h-9a6 6 0 0 0-6 6v1" /><path d="m17 4 3 3-3 3" /><path d="M4 17h9a6 6 0 0 0 6-6v-1" /><path d="m7 20-3-3 3-3" /></svg>;
  if (name === "chart") return <svg {...common}><path d="M5 20V10M12 20V4M19 20v-7" /><path d="M3 20h18" /></svg>;
  if (name === "flame") return <svg {...common}><path d="M12 22c4 0 7-2.9 7-7 0-3.2-1.8-5.8-4.5-8.4.1 2.4-.8 3.8-2 4.7.1-3.7-1.7-6.7-4.4-9.3.1 4.4-3.1 6.5-3.1 10.8C5 18 8 22 12 22Z" /></svg>;
  return <svg {...common}><path d="m3 7 9-4 9 4-9 4-9-4Z" /><path d="M7 9.5V15c0 1.7 2.2 3 5 3s5-1.3 5-3V9.5" /><path d="M21 7v6" /></svg>;
}

function requestProductGraph(targetURL: string): void {
  window.dispatchEvent(new CustomEvent(PRODUCT_ROUTE_GRAPH_EVENT, {
    detail: {
      routeGraph: "product",
      pathname: new URL(targetURL, window.location.origin).pathname,
    },
  }));
}

export function LexigoHomeApp({ initialSession, onSessionUpdated }: LexigoHomeAppProps) {
  const router = useRouter();
  const session = initialSession;
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [activeLesson, setActiveLesson] = useState<LessonSessionResponse | null>(null);
  const [processPreviews, setProcessPreviews] = useState<HomeProcessPreviews>(EMPTY_PROCESS_PREVIEWS);
  const [progressStatus, setProgressStatus] = useState<ResourceStatus>(() => (
    session ? loadingResourceStatus() : readyResourceStatus()
  ));
  const [activeLessonStatus, setActiveLessonStatus] = useState<ResourceStatus>(() => (
    session ? loadingResourceStatus() : readyResourceStatus()
  ));
  const [processStatus, setProcessStatus] = useState<ResourceStatus>(() => (
    session ? loadingResourceStatus() : readyResourceStatus()
  ));
  const [busyProcess, setBusyProcess] = useState<LessonSessionKind | null>(null);
  const [actionError, setActionError] = useState("");

  const adoptSession = useCallback((next: Session) => {
    if (session?.tokens.accessToken !== next.tokens.accessToken) onSessionUpdated(next);
  }, [onSessionUpdated, session?.tokens.accessToken]);

  const loadProgress = useCallback(async (activeSession: Session, signal?: AbortSignal) => {
    setProgressStatus(loadingResourceStatus());
    try {
      const result = await authorizedJSON<ProgressSummary>(
        activeSession,
        `/api/v1/progress?timezoneOffsetMinutes=${new Date().getTimezoneOffset()}`,
        { signal },
        isProgressSummaryPayload,
      );
      if (signal?.aborted) return;
      adoptSession(result.activeSession);
      setProgress(result.data);
      setProgressStatus(readyResourceStatus());
    } catch (error) {
      if (signal?.aborted) return;
      setProgress(null);
      setProgressStatus(failedResourceStatus(error, "прогресс"));
    }
  }, [adoptSession]);

  const loadActiveLesson = useCallback(async (
    activeSession: Session,
    signal?: AbortSignal,
  ): Promise<LessonSessionResponse | null | undefined> => {
    setActiveLessonStatus(loadingResourceStatus());
    try {
      const result = await authorizedJSON<LessonSessionResponse>(
        activeSession,
        "/api/v1/lessons/active",
        { signal },
        isActiveLessonPayload,
      );
      if (signal?.aborted) return undefined;
      adoptSession(result.activeSession);
      setActiveLesson(result.data);
      setActiveLessonStatus(readyResourceStatus());
      return result.data;
    } catch (error) {
      if (signal?.aborted) return undefined;
      if (error instanceof RequestFailure && error.status === 404) {
        setActiveLesson(null);
        setActiveLessonStatus(readyResourceStatus());
        return null;
      }
      setActiveLesson(null);
      setActiveLessonStatus(failedResourceStatus(error, "незавершённый урок"));
      return undefined;
    }
  }, [adoptSession]);

  const loadProcessPreviews = useCallback(async (activeSession: Session, signal?: AbortSignal) => {
    setProcessStatus(loadingResourceStatus());
    try {
      const results = await Promise.all(HOME_PROCESS_DEFINITIONS.map(async ({ kind, mode }) => {
        const result = await authorizedJSON<HomeLessonPreview>(
          activeSession,
          "/api/v1/lessons/preview",
          {
            method: "POST",
            signal,
            body: JSON.stringify({
              source: "mixed",
              studyMode: mode,
              sessionKind: kind,
              lessonSize: String(HOME_AUTOMATIC_LESSON_SIZE),
            }),
          },
          (value) => isHomeLessonPreviewPayload(value, kind, mode),
        );
        return { kind, result };
      }));
      if (signal?.aborted) return;

      const next: HomeProcessPreviews = { ...EMPTY_PROCESS_PREVIEWS };
      for (const { kind, result } of results) next[kind] = result.data;
      const latestSession = results.at(-1)?.result.activeSession;
      if (latestSession) adoptSession(latestSession);
      setProcessPreviews(next);
      setProcessStatus(readyResourceStatus());
    } catch (error) {
      if (signal?.aborted) return;
      setProcessPreviews({ ...EMPTY_PROCESS_PREVIEWS });
      setProcessStatus(failedResourceStatus(error, "учебные процессы"));
    }
  }, [adoptSession]);

  const loadLessonPlan = useCallback(async (activeSession: Session, signal?: AbortSignal) => {
    const lesson = await loadActiveLesson(activeSession, signal);
    if (signal?.aborted) return;
    if (lesson === null) {
      await loadProcessPreviews(activeSession, signal);
      return;
    }

    // Process queues cannot change the dominant action while a server-owned
    // lesson is active. Avoid three unnecessary preview requests and defer
    // queue reads until there is no resumable lesson.
    setProcessPreviews({ ...EMPTY_PROCESS_PREVIEWS });
    setProcessStatus(readyResourceStatus());
  }, [loadActiveLesson, loadProcessPreviews]);

  useEffect(() => {
    if (!session) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setActionError("");
      void Promise.all([
        loadProgress(session, controller.signal),
        loadLessonPlan(session, controller.signal),
      ]);
    }, 0);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [loadLessonPlan, loadProgress, session]);

  const initial = useMemo(() => session?.user.displayName.trim().charAt(0).toUpperCase()
    || session?.user.email.charAt(0).toUpperCase()
    || "L", [session]);

  const navigate = useCallback((target: NavigationTarget, intent: ProductJourneyIntent = "in_app_navigation") => {
    const targetURL = navigationURL(target);
    queueProductJourneyIntent(intent);
    requestProductGraph(targetURL);
    router.push(targetURL, { scroll: false });
  }, [router]);

  const openLesson = useCallback(() => {
    const targetURL = lessonResumeURL();
    queueProductJourneyIntent("home_next_action");
    requestProductGraph(targetURL);
    router.push(targetURL, { scroll: false });
  }, [router]);

  const startLesson = useCallback(async (sessionKind: LessonSessionKind) => {
    if (!session || busyProcess) return;
    const definition = HOME_PROCESS_DEFINITIONS.find(({ kind }) => kind === sessionKind);
    if (!definition) return;

    setBusyProcess(sessionKind);
    setActionError("");
    try {
      const result = await authorizedJSON<LessonSessionResponse>(
        session,
        "/api/v1/lessons",
        {
          method: "POST",
          body: JSON.stringify({
            source: "mixed",
            studyMode: definition.mode,
            sessionKind,
            lessonSize: String(HOME_AUTOMATIC_LESSON_SIZE),
          }),
        },
        isActiveLessonPayload,
      );
      adoptSession(result.activeSession);
      setActiveLesson(result.data);
      openLesson();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Не удалось сформировать учебный блок");
    } finally {
      setBusyProcess(null);
    }
  }, [adoptSession, busyProcess, openLesson, session]);

  const progressPending = Boolean(session && (
    progressStatus.phase === "idle" || progressStatus.phase === "loading"
  ));
  const activeLessonPending = Boolean(session && (
    activeLessonStatus.phase === "idle" || activeLessonStatus.phase === "loading"
  ));
  const processPending = Boolean(session && (
    processStatus.phase === "idle" || processStatus.phase === "loading"
  ));
  const processBacklogs = useMemo<Record<LessonSessionKind, number>>(() => ({
    study: processBacklog(processPreviews.study),
    review: processBacklog(processPreviews.review),
    remediation: processBacklog(processPreviews.remediation),
  }), [processPreviews]);
  const recommendedProcessKind: LessonSessionKind | null = processBacklogs.review > 0
    ? "review"
    : processBacklogs.remediation > 0
      ? "remediation"
      : processBacklogs.study > 0
        ? "study"
        : null;

  const nextAction: HomeNextAction = activeLesson
    ? {
        eyebrow: "НЕЗАВЕРШЁННЫЙ УРОК",
        title: "Продолжите с сохранённой позиции",
        description: `${lessonSourceLabel(activeLesson.source)} · карточка ${activeLesson.currentIndex + 1} из ${activeLesson.items.length}.`,
        label: CONTINUE_LESSON_ACTION_LABEL,
        icon: "play",
        action: openLesson,
      }
    : activeLessonPending
      ? {
          eyebrow: "СИНХРОНИЗИРУЕМ ПЛАН",
          title: "Проверяем учебную очередь",
          description: "Сначала проверяем незавершённый урок, затем независимые очереди повторения, разбора ошибок и нового материала.",
          label: "Загружаем…",
          icon: "learn",
          disabled: true,
          action: () => undefined,
        }
      : session && activeLessonStatus.phase === "error"
        ? {
            eyebrow: "НУЖНА СИНХРОНИЗАЦИЯ",
            title: "Настройте урок под текущую задачу",
            description: "Не удалось надёжно проверить незавершённый урок. Повторите синхронизацию перед созданием новой очереди.",
            label: "Повторить проверку",
            icon: "repeat",
            action: () => void loadLessonPlan(session),
          }
        : processPending
          ? {
              eyebrow: "СИНХРОНИЗИРУЕМ ПЛАН",
              title: "Проверяем учебные процессы",
              description: "Считаем материал, который действительно пора повторить, отдельно от новых и проблемных элементов.",
              label: "Загружаем…",
              icon: "learn",
              disabled: true,
              action: () => undefined,
            }
          : session && processStatus.phase === "error"
            ? {
                eyebrow: "НУЖНА СИНХРОНИЗАЦИЯ",
                title: "Не удалось проверить учебные процессы",
                description: "Не создаём автоматический урок по приблизительной статистике. Повторите проверку или настройте урок вручную.",
                label: "Повторить проверку",
                icon: "repeat",
                action: () => void loadProcessPreviews(session),
              }
            : recommendedProcessKind === "review"
              ? {
                  eyebrow: "СЕЙЧАС ЛУЧШЕ ПОВТОРИТЬ",
                  title: `${processBacklogs.review} ${russianPlural(processBacklogs.review, "элемент готов", "элемента готовы", "элементов готовы")} к повторению`,
                  description: `${DUE_COPY.explanation} Автоматический блок ограничен ${HOME_AUTOMATIC_LESSON_SIZE} элементами и не заполняется материалом, срок которого ещё не наступил.`,
                  label: processActionLabel("review", processBacklogs.review),
                  icon: "repeat",
                  processKind: "review",
                  action: () => void startLesson("review"),
                }
              : recommendedProcessKind === "remediation"
                ? {
                    eyebrow: "РАЗБЕРИТЕ СЛАБЫЕ МЕСТА",
                    title: `${processBacklogs.remediation} ${russianPlural(processBacklogs.remediation, "элемент требует", "элемента требуют", "элементов требуют")} дополнительной практики`,
                    description: "Здесь только недосрочные элементы с сохранённым сигналом ошибки или слабости. Материал, который уже пора повторить, остаётся в Review.",
                    label: processActionLabel("remediation", processBacklogs.remediation),
                    icon: "repeat",
                    processKind: "remediation",
                    action: () => void startLesson("remediation"),
                  }
                : recommendedProcessKind === "study"
                  ? {
                      eyebrow: "СЛЕДУЮЩИЙ ШАГ",
                      title: `${processBacklogs.study} ${russianPlural(processBacklogs.study, "новый элемент доступен", "новых элемента доступны", "новых элементов доступны")} для изучения`,
                      description: "Откройте короткий блок знакомства. Новый материал не смешивается с очередью повторения или разбором ошибок.",
                      label: processActionLabel("study", processBacklogs.study),
                      icon: "learn",
                      processKind: "study",
                      action: () => void startLesson("study"),
                    }
                  : {
                      eyebrow: "ПЕРВЫЙ ШАГ",
                      title: session ? "Автоматические очереди сейчас пусты" : "Соберите первый учебный блок",
                      description: session
                        ? "Срок повторения ещё не наступил, новых или проблемных элементов нет. Можно настроить отдельную практику вручную."
                        : "Выберите формат обучения и посмотрите состав до регистрации и запуска.",
                      label: "Настроить урок",
                      icon: "learn",
                      action: () => navigate({ view: "learn" }, "home_next_action"),
                    };

  const secondaryProcesses = !activeLesson
    && !activeLessonPending
    && activeLessonStatus.phase === "ready"
    && processStatus.phase === "ready"
    ? HOME_PROCESS_DEFINITIONS.filter(({ kind }) => (
        kind !== recommendedProcessKind && processBacklogs[kind] > 0
      ))
    : [];

  return (
    <div className="lx-app" data-route-client-island="home" data-figma-home-desktop="194:249" data-figma-home-mobile="196:223">
      <header className="lx-header">
        <div className="lx-header-tools">
          {session && progress ? (
            <button className="lx-streak" type="button" onClick={() => navigate({ view: "progress" })}>
              <HomeIcon name="flame" />
              <span>{progress.currentStreak} дн.</span>
            </button>
          ) : null}
          <button
            className="lx-avatar"
            type="button"
            aria-label="Открыть профиль"
            onClick={() => navigate({ view: "profile" })}
          >
            {initial}
          </button>
        </div>
      </header>

      <div className="lx-app-shell">
        <main id="lexigo-main-content" className="lx-main-content" tabIndex={-1} aria-label={viewTitle("home")}>
          {session ? (
            <div className="lx-resource-stack">
              <AsyncResourceNotice label="Прогресс" status={progressStatus} onRetry={() => void loadProgress(session)} />
              <AsyncResourceNotice label="Незавершённый урок" status={activeLessonStatus} onRetry={() => void loadLessonPlan(session)} />
              <AsyncResourceNotice label="Учебные процессы" status={processStatus} onRetry={() => void loadProcessPreviews(session)} />
            </div>
          ) : null}

          <div className="lx-view">
            {actionError ? (
              <AsyncStatePanel
                label="Ошибка текущего действия"
                kind="error"
                title="Действие не выполнено"
                message={actionError}
                compact
              />
            ) : null}

            <section className="lx-home-next-action" aria-label="Следующее рекомендуемое действие">
              <article className="lx-hero-card">
                <div className="lx-home-next-action-copy">
                  <span>{nextAction.eyebrow}</span>
                  <h1>{nextAction.title}</h1>
                  <p>{nextAction.description}</p>
                  <button
                    className="lx-button primary large"
                    type="button"
                    data-journey-intent="home_next_action"
                    data-home-process={nextAction.processKind}
                    disabled={Boolean(busyProcess) || nextAction.disabled}
                    onClick={nextAction.action}
                  >
                    <HomeIcon name={nextAction.icon} />
                    {busyProcess === nextAction.processKind ? "Подготавливаем урок…" : nextAction.label}
                  </button>
                  {secondaryProcesses.length > 0 ? (
                    <div className="lx-home-process-actions" role="group" aria-label="Другие доступные учебные процессы">
                      {secondaryProcesses.map(({ kind, icon }) => (
                        <button
                          key={kind}
                          className="lx-button ghost"
                          type="button"
                          data-home-process={kind}
                          disabled={Boolean(busyProcess)}
                          onClick={() => void startLesson(kind)}
                        >
                          <HomeIcon name={icon} />
                          {busyProcess === kind ? "Подготавливаем урок…" : processActionLabel(kind, processBacklogs[kind])}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="lx-hero-art" aria-hidden="true">
                  <div className="lx-word-preview">
                    <span>{WORD_PREVIEW.phonetic}</span>
                    <strong>{WORD_PREVIEW.prompt}</strong>
                    <p>{WORD_PREVIEW.answer}</p>
                    <small>{WORD_PREVIEW.example}</small>
                  </div>
                </div>
              </article>

              <aside className="lx-progress-panel" aria-label="Краткий прогресс" aria-busy={progressPending || undefined}>
                <div className="lx-panel-heading">
                  <div>
                    <span>Учебный статус</span>
                    <strong>{progress ? `${progress.reviewsToday} из ${progress.dailyGoal}` : progressPending ? "Загружаем…" : session ? "Недоступно" : "После входа"}</strong>
                  </div>
                  <HomeIcon name="chart" />
                </div>
                {progress ? (
                  <>
                    <div
                      className="lx-progress-ring"
                      role="progressbar"
                      aria-label="Выполнение дневной цели"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={normalizeProgressValue(goalPercent(progress))}
                      aria-valuetext={`${progress.reviewsToday} из ${progress.dailyGoal} ответов`}
                    >
                      <span>{goalPercent(progress)}%</span>
                    </div>
                    <div className="lx-progress-list">
                      <div><span>{DUE_COPY.label}</span><strong>{progress.dueNow}</strong></div>
                      <div><span>{RETAINED_COPY.label} за неделю</span><strong>{progress.retainedItemsWeek}</strong></div>
                      <div><span>Серия</span><strong>{progress.currentStreak} дн.</strong></div>
                    </div>
                  </>
                ) : progressPending ? (
                  <>
                    <div className="lx-progress-ring" aria-hidden="true"><span>—</span></div>
                    <div className="lx-progress-list" role="status" aria-live="polite" aria-label="Загрузка краткого прогресса">
                      <div><span>{DUE_COPY.label}</span><strong>—</strong></div>
                      <div><span>{RETAINED_COPY.label} за неделю</span><strong>—</strong></div>
                      <div><span>Серия</span><strong>—</strong></div>
                    </div>
                  </>
                ) : (
                  <AsyncStatePanel
                    label={!session ? "Персональный прогресс доступен после входа" : "Краткий прогресс недоступен"}
                    kind={!session ? "empty" : "error"}
                    title={!session ? "Войдите, чтобы видеть учебную очередь" : progressStatus.problem?.title ?? "Прогресс недоступен"}
                    message={!session ? "Материал к повторению, дневная цель и серия синхронизируются с аккаунтом." : progressStatus.problem?.message ?? "Получаем материал к повторению и дневную цель."}
                    reference={progressStatus.problem?.correlationId}
                    actionLabel={!session ? "Войти" : progressStatus.problem?.retryable ? RETRY_ACTION_LABEL : undefined}
                    onAction={!session ? () => navigate({ view: "profile" }, "authentication") : progressStatus.problem?.retryable ? () => void loadProgress(session) : undefined}
                    compact
                    focusResult={false}
                  />
                )}
                <button className="lx-button ghost" type="button" onClick={() => navigate({ view: "progress" })}>
                  Открыть прогресс
                </button>
              </aside>
            </section>

            <section className="lx-home-paths" aria-label="Назначение основных разделов">
              <article>
                <span>Обучение</span><h2>Настройте урок</h2>
                <p>Режим, раздел, размер и предварительный состав настраиваются на одном экране.</p>
                <button className="lx-button ghost" type="button" data-journey-intent="home_configure_lesson" onClick={() => navigate({ view: "learn" }, "home_configure_lesson")}>Настроить урок</button>
              </article>
              <article>
                <span>Словарь</span><h2>Найдите материал</h2>
                <p>Ищите слова, термины и рабочие фразы, открывайте карточки и сохраняйте контекст.</p>
                <button className="lx-button ghost" type="button" data-journey-intent="home_find_material" onClick={() => navigate({ view: "library" }, "home_find_material")}>Найти материал</button>
              </article>
              <article>
                <span>Прогресс</span><h2>Проверьте результат</h2>
                <p>Материал к повторению, закреплённые знания, объективная успешность и дневная цель собраны отдельно.</p>
                <button className="lx-button ghost" type="button" onClick={() => navigate({ view: "progress" })}>Посмотреть результат</button>
              </article>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
