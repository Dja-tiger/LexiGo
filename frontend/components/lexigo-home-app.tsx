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
import { learningTermCopy } from "../lib/interface-copy";
import { russianPlural } from "../lib/lesson-composition";
import { lessonResumeURL } from "../lib/lesson-resume-intent";
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
  lessonSize: string;
  currentIndex: number;
  version: number;
  status: "active";
  items: LessonItemResponse[];
  createdAt: string;
  updatedAt: string;
};

type LexigoHomeAppProps = {
  initialSession: Session | null;
  onSessionUpdated: (session: Session) => void;
};

type HomeIconName = "play" | "repeat" | "learn" | "chart";

type HomeNextAction = {
  eyebrow: string;
  title: string;
  description: string;
  label: string;
  icon: HomeIconName;
  disabled?: boolean;
  action: () => void;
};

const DUE_COPY = learningTermCopy("due");
const RETAINED_COPY = learningTermCopy("retained");
const WORD_PREVIEW = {
  prompt: "incident",
  phonetic: "/ˈɪnsɪdənt/",
  answer: "инцидент, происшествие",
  example: "We need to identify the cause of the incident.",
};

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
  return <svg {...common}><path d="m3 7 9-4 9 4-9 4-9-4Z" /><path d="M7 9.5V15c0 1.7 2.2 3 5 3s5-1.3 5-3V9.5" /><path d="M21 7v6" /></svg>;
}

function sourceLabel(source: LessonSource): string {
  if (source === "phrases") return "Фразы";
  if (source === "noun") return "Существительные";
  if (source === "verb") return "Глаголы";
  if (source === "adjective") return "Прилагательные";
  if (source === "daily-life") return "Бытовой английский";
  if (source === "travel") return "Путешествия";
  if (source === "data-engineering") return "Инженерия данных";
  if (source === "backend") return "Backend-разработка";
  if (source === "academic-technical-english") return "Academic Technical English";
  return "Смешанная практика";
}

export function LexigoHomeApp({ initialSession, onSessionUpdated }: LexigoHomeAppProps) {
  const router = useRouter();
  const session = initialSession;
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [activeLesson, setActiveLesson] = useState<LessonSessionResponse | null>(null);
  const [progressStatus, setProgressStatus] = useState<ResourceStatus>(() => (
    session ? loadingResourceStatus() : readyResourceStatus()
  ));
  const [activeLessonStatus, setActiveLessonStatus] = useState<ResourceStatus>(() => (
    session ? loadingResourceStatus() : readyResourceStatus()
  ));
  const [busy, setBusy] = useState(false);
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

  const loadActiveLesson = useCallback(async (activeSession: Session, signal?: AbortSignal) => {
    setActiveLessonStatus(loadingResourceStatus());
    try {
      const result = await authorizedJSON<LessonSessionResponse>(
        activeSession,
        "/api/v1/lessons/active",
        { signal },
        isActiveLessonPayload,
      );
      if (signal?.aborted) return;
      adoptSession(result.activeSession);
      setActiveLesson(result.data);
      setActiveLessonStatus(readyResourceStatus());
    } catch (error) {
      if (signal?.aborted) return;
      if (error instanceof RequestFailure && error.status === 404) {
        setActiveLesson(null);
        setActiveLessonStatus(readyResourceStatus());
        return;
      }
      setActiveLesson(null);
      setActiveLessonStatus(failedResourceStatus(error, "незавершённый урок"));
    }
  }, [adoptSession]);

  useEffect(() => {
    if (!session) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setActionError("");
      void Promise.all([
        loadProgress(session, controller.signal),
        loadActiveLesson(session, controller.signal),
      ]);
    }, 0);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [loadActiveLesson, loadProgress, session]);

  const initial = useMemo(() => session?.user.displayName.trim().charAt(0).toUpperCase()
    || session?.user.email.charAt(0).toUpperCase()
    || "L", [session]);

  const navigate = useCallback((target: NavigationTarget, intent: ProductJourneyIntent = "in_app_navigation") => {
    queueProductJourneyIntent(intent);
    router.push(navigationURL(target), { scroll: false });
  }, [router]);

  const openLesson = useCallback(() => {
    queueProductJourneyIntent("home_next_action");
    router.push(lessonResumeURL(), { scroll: false });
  }, [router]);

  const startLesson = useCallback(async (mode: StudyMode, lessonSize: 15 | 30) => {
    if (!session || busy) return;
    setBusy(true);
    setActionError("");
    try {
      const result = await authorizedJSON<LessonSessionResponse>(
        session,
        "/api/v1/lessons",
        {
          method: "POST",
          body: JSON.stringify({
            source: "mixed",
            studyMode: mode,
            lessonSize: String(lessonSize),
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
      setBusy(false);
    }
  }, [adoptSession, busy, openLesson, session]);

  const progressPending = Boolean(session && (
    progressStatus.phase === "idle" || progressStatus.phase === "loading"
  ));
  const activeLessonPending = Boolean(session && (
    activeLessonStatus.phase === "idle" || activeLessonStatus.phase === "loading"
  ));
  const planPending = activeLessonPending || progressPending;
  const dueNow = progress?.dueNow ?? 0;

  const nextAction: HomeNextAction = activeLesson
    ? {
        eyebrow: "НЕЗАВЕРШЁННЫЙ УРОК",
        title: "Продолжите с сохранённой позиции",
        description: `${sourceLabel(activeLesson.source)} · карточка ${activeLesson.currentIndex + 1} из ${activeLesson.items.length}.`,
        label: "Продолжить урок",
        icon: "play",
        action: openLesson,
      }
    : planPending
      ? {
          eyebrow: "СИНХРОНИЗИРУЕМ ПЛАН",
          title: "Проверяем учебную очередь",
          description: "Сначала проверяем незавершённый урок, затем материал к повторению и новые элементы.",
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
            action: () => void loadActiveLesson(session),
          }
        : session && progress && dueNow > 0
          ? {
              eyebrow: "СЕЙЧАС ЛУЧШЕ ПОВТОРИТЬ",
              title: `${dueNow} ${russianPlural(dueNow, "элемент готов", "элемента готовы", "элементов готовы")} к повторению`,
              description: DUE_COPY.explanation,
              label: "Повторить сейчас",
              icon: "repeat",
              action: () => void startLesson("recall", 30),
            }
          : session && progress
            ? {
                eyebrow: "СЛЕДУЮЩИЙ ШАГ",
                title: "Добавьте новые слова в учебный цикл",
                description: "Откройте короткий блок знакомства: ответы будут видны сразу, а самостоятельное воспроизведение начнётся на следующих повторениях.",
                label: "Начать изучение",
                icon: "learn",
                action: () => void startLesson("study", 15),
              }
            : {
                eyebrow: "ПЕРВЫЙ ШАГ",
                title: session ? "Настройте урок под текущую задачу" : "Соберите первый учебный блок",
                description: session
                  ? "Очередь сейчас недоступна, но можно выбрать режим, раздел и размер урока вручную."
                  : "Выберите формат обучения и посмотрите состав до регистрации и запуска.",
                label: "Настроить урок",
                icon: "learn",
                action: () => navigate({ view: "learn" }, "home_next_action"),
              };

  return (
    <div className="lx-app" data-route-client-island="home" data-figma-home-desktop="194:249" data-figma-home-mobile="196:223">
      <header className="lx-header">
        <div className="lx-header-tools">
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
              <AsyncResourceNotice label="Незавершённый урок" status={activeLessonStatus} onRetry={() => void loadActiveLesson(session)} />
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
                    disabled={busy || nextAction.disabled}
                    onClick={nextAction.action}
                  >
                    <HomeIcon name={nextAction.icon} />
                    {busy ? "Подготавливаем урок…" : nextAction.label}
                  </button>
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
                    actionLabel={!session ? "Войти" : progressStatus.problem?.retryable ? "Повторить" : undefined}
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
