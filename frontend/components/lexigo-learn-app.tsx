"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";

import {
  failedResourceStatus,
  isActiveLessonPayload,
  isProgressSummaryPayload,
  loadingResourceStatus,
  readyResourceStatus,
  type ResourceStatus,
} from "../lib/account-resources";
import { rovingTargetIndex, type RovingNavigationAxis } from "../lib/accessibility-semantics";
import { authorizedJSON, requestJSON } from "../lib/authorized-json";
import type { Session } from "../lib/auth-session";
import {
  catalogCountText,
  isCatalogMetadataPayload,
  type CatalogMetadata,
  type CatalogMetadataStatus,
  type CatalogSource,
} from "../lib/catalog-metadata";
import { learningTermCopy, topicLabel } from "../lib/interface-copy";
import {
  lessonCompositionDescription,
  lessonCompositionFallbackMessage,
  lessonPriorityDescription,
  type LessonComposition,
} from "../lib/lesson-composition";
import { lessonResumeURL } from "../lib/lesson-resume-intent";
import type { LessonSize } from "../lib/learning";
import {
  navigationURL,
  parseNavigationLocation,
  viewTitle,
  writePersistedNavigation,
  type NavigationTarget,
} from "../lib/navigation";
import { createNavigationHistoryState } from "../lib/navigation-history";
import { queueProductJourneyIntent, type ProductJourneyIntent } from "../lib/product-journey";
import type { ProgressSummary } from "../lib/progress";
import { RequestFailure } from "../lib/request-failure";
import { AsyncResourceNotice, AsyncStatePanel } from "./async-state";
import { LessonComposerProgressiveShell } from "./lesson-composer-progressive-shell";

type LessonSource = CatalogSource;
type StudyMode = "study" | "recall" | "choice";
type LearnIconName = "learn" | "shuffle" | "cube" | "bolt" | "spark" | "code" | "check" | "play" | "flame";

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

type LessonPreviewResponse = {
  source: LessonSource;
  studyMode: StudyMode;
  lessonSize: string;
  composition: LessonComposition;
};

type CollectionDefinition = {
  source: Extract<LessonSource, "daily-life" | "travel" | "data-engineering" | "backend" | "academic-technical-english">;
  label: string;
  description: string;
  symbol: string;
};

type SourceOption = {
  value: Extract<LessonSource, "mixed" | "noun" | "verb" | "adjective" | "phrases">;
  label: string;
  hint: string;
  icon: LearnIconName;
};

type ModeOption = {
  value: StudyMode;
  label: string;
  hint: string;
  icon: LearnIconName;
};

type LexigoLearnAppProps = {
  initialSession: Session | null;
  onSessionUpdated: (session: Session) => void;
};

const PRODUCT_ROUTE_GRAPH_EVENT = "lexigo:product-route-graph";
const ROUTE_GRAPH_HISTORY_KEY = "lexigoRouteGraph";
const DUE_COPY = learningTermCopy("due");
const RECALL_COPY = learningTermCopy("recall");
const CLOZE_COPY = learningTermCopy("cloze");
const CHUNK_COPY = learningTermCopy("chunk");

const COLLECTIONS: CollectionDefinition[] = [
  {
    source: "daily-life",
    label: "Бытовой английский",
    description: "Дом, покупки, услуги, здоровье и повседневное общение",
    symbol: "A1",
  },
  {
    source: "travel",
    label: "Для путешествий",
    description: "Аэропорт, отель, транспорт, документы и навигация",
    symbol: "✈",
  },
  {
    source: "data-engineering",
    label: "Инженерия данных",
    description: "Моделирование, пайплайны, Kafka, качество и хранение данных",
    symbol: "DB",
  },
  {
    source: "backend",
    label: "Backend-разработка",
    description: "API, архитектура, базы данных, конкурентность и надёжность",
    symbol: "</>",
  },
  {
    source: "academic-technical-english",
    label: "Academic Technical English",
    description: "Академическая техническая лексика для документации, исследований и инженерной коммуникации",
    symbol: "AC",
  },
];

const SOURCE_OPTIONS: SourceOption[] = [
  { value: "mixed", label: "Смешанная практика", hint: "Слова и фразы в детерминированном чередовании", icon: "shuffle" },
  { value: "noun", label: "Существительные", hint: "Системы, объекты и метрики", icon: "cube" },
  { value: "verb", label: "Глаголы", hint: "Действия, процессы и операции", icon: "bolt" },
  { value: "adjective", label: "Прилагательные", hint: "Состояния и характеристики", icon: "spark" },
  { value: "phrases", label: "Технические фразы", hint: `${CHUNK_COPY.label}: устойчивые выражения; ${CLOZE_COPY.label.toLocaleLowerCase("ru")}: задания с пропуском`, icon: "code" },
];

const MODE_OPTIONS: ModeOption[] = [
  { value: "study", label: "Простое изучение слов", hint: "Слово, перевод, пример и примечание видны сразу", icon: "learn" },
  { value: "recall", label: RECALL_COPY.label, hint: RECALL_COPY.explanation, icon: "spark" },
  { value: "choice", label: "Выбрать вариант", hint: "Четыре варианта ответа для поддержки", icon: "check" },
];

const SIZE_OPTIONS: Array<{ value: LessonSize; label: string }> = [
  { value: 15, label: "15" },
  { value: 30, label: "30" },
  { value: 50, label: "50" },
  { value: "all", label: "Все" },
];
const SOURCE_VALUES: LessonSource[] = [
  ...SOURCE_OPTIONS.map((option) => option.value),
  ...COLLECTIONS.map((collection) => collection.source),
];
const MODE_VALUES: StudyMode[] = MODE_OPTIONS.map((option) => option.value);
const SIZE_VALUES: LessonSize[] = SIZE_OPTIONS.map((option) => option.value);
const LESSON_SOURCES = new Set<LessonSource>(SOURCE_VALUES);
const STUDY_MODES = new Set<StudyMode>(MODE_VALUES);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && (value as number) >= 0;
}

function isLessonPreviewPayload(value: unknown): value is LessonPreviewResponse {
  if (!isRecord(value)
    || !LESSON_SOURCES.has(value.source as LessonSource)
    || !STUDY_MODES.has(value.studyMode as StudyMode)
    || typeof value.lessonSize !== "string"
    || !isRecord(value.composition)) {
    return false;
  }

  const composition = value.composition;
  const numericFields = [
    composition.total,
    composition.words,
    composition.phrases,
    composition.due,
    composition.new,
    composition.scheduled,
    composition.availableWords,
    composition.availablePhrases,
  ];
  return numericFields.every(isNonNegativeInteger)
    && (composition.fallback === undefined
      || composition.fallback === "words_only"
      || composition.fallback === "phrases_only"
      || composition.fallback === "empty");
}

function LearnIcon({ name, size = 19 }: { name: LearnIconName; size?: number }) {
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

  if (name === "shuffle") return <svg {...common}><path d="M3 7h3c5 0 7 10 12 10h3"/><path d="m18 14 3 3-3 3"/><path d="M3 17h3c2 0 3.5-1.5 5-3.5"/><path d="M14 8.5C15 7.5 16.2 7 18 7h3"/><path d="m18 4 3 3-3 3"/></svg>;
  if (name === "cube") return <svg {...common}><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/></svg>;
  if (name === "bolt") return <svg {...common}><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></svg>;
  if (name === "spark") return <svg {...common}><path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/></svg>;
  if (name === "code") return <svg {...common}><path d="m8 9-3 3 3 3M16 9l3 3-3 3M14 5l-4 14"/></svg>;
  if (name === "check") return <svg {...common}><path d="m5 12 4 4L19 6"/></svg>;
  if (name === "play") return <svg {...common}><path d="m8 5 11 7-11 7V5Z"/></svg>;
  if (name === "flame") return <svg {...common}><path d="M12 22c4 0 7-2.9 7-7 0-3.2-1.8-5.8-4.5-8.4.1 2.4-.8 3.8-2 4.7.1-3.7-1.7-6.7-4.4-9.3.1 4.4-3.1 6.5-3.1 10.8C5 18 8 22 12 22Z"/></svg>;
  return <svg {...common}><path d="m3 7 9-4 9 4-9 4-9-4Z"/><path d="M7 9.5V15c0 1.7 2.2 3 5 3s5-1.3 5-3V9.5"/><path d="M21 7v6"/></svg>;
}

function sourceLabel(source: LessonSource): string {
  return SOURCE_OPTIONS.find((option) => option.value === source)?.label
    ?? COLLECTIONS.find((collection) => collection.source === source)?.label
    ?? source;
}

function requestRouteGraph(routeGraph: "product", targetURL: string): void {
  window.dispatchEvent(new CustomEvent(PRODUCT_ROUTE_GRAPH_EVENT, {
    detail: {
      routeGraph,
      pathname: new URL(targetURL, window.location.origin).pathname,
    },
  }));
}

function currentLearnTarget(source: LessonSource, topic: string): NavigationTarget {
  return {
    view: "learn",
    ...(source === "mixed" ? {} : { source }),
    ...(topic.trim() ? { topic: topic.trim() } : {}),
  };
}

function CollectionCard({
  definition,
  countText,
  selected,
  onSelect,
  onKeyDown,
}: {
  definition: CollectionDefinition;
  countText: string;
  selected: boolean;
  onSelect: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      data-lexigo-collection={definition.source}
      data-lexigo-source={definition.source}
      role="radio"
      aria-checked={selected}
      tabIndex={selected ? 0 : -1}
      className={`lx-themed-selector lx-collection-${definition.source}${selected ? " selected" : ""}`}
      onClick={onSelect}
      onKeyDown={onKeyDown}
    >
      <span className="lx-themed-symbol">{definition.symbol}</span>
      <div><strong>{definition.label}</strong><small>{definition.description}</small></div>
      <b data-catalog-count-state={countText === "Загрузка…" ? "loading" : undefined}>{countText}</b>
    </button>
  );
}

export function LexigoLearnApp({ initialSession, onSessionUpdated }: LexigoLearnAppProps) {
  const router = useRouter();
  const session = initialSession;
  const initialTarget = useMemo<NavigationTarget>(() => (
    typeof window === "undefined" ? { view: "learn" } : parseNavigationLocation(window.location)
  ), []);
  const [source, setSource] = useState<LessonSource>(initialTarget.source ?? "mixed");
  const [lessonTopic, setLessonTopic] = useState(initialTarget.topic ?? "");
  const [studyMode, setStudyMode] = useState<StudyMode>("recall");
  const [lessonSize, setLessonSize] = useState<LessonSize>(15);
  const [mobileComposerExpanded, setMobileComposerExpanded] = useState(false);
  const [catalogMetadata, setCatalogMetadata] = useState<CatalogMetadata | null>(null);
  const [catalogMetadataStatus, setCatalogMetadataStatus] = useState<CatalogMetadataStatus>("loading");
  const [catalogMetadataResourceStatus, setCatalogMetadataResourceStatus] = useState<ResourceStatus>(loadingResourceStatus);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [progressStatus, setProgressStatus] = useState<ResourceStatus>(() => session ? loadingResourceStatus() : readyResourceStatus());
  const [activeLesson, setActiveLesson] = useState<LessonSessionResponse | null>(null);
  const [activeLessonStatus, setActiveLessonStatus] = useState<ResourceStatus>(() => session ? loadingResourceStatus() : readyResourceStatus());
  const [lessonPreview, setLessonPreview] = useState<LessonPreviewResponse | null>(null);
  const [previewingLesson, setPreviewingLesson] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const lessonCreateInFlightRef = useRef(false);

  const adoptSession = useCallback((next: Session) => {
    if (session?.tokens.accessToken !== next.tokens.accessToken) onSessionUpdated(next);
  }, [onSessionUpdated, session?.tokens.accessToken]);

  const loadCatalogMetadata = useCallback(async (signal?: AbortSignal) => {
    setCatalogMetadataStatus("loading");
    setCatalogMetadataResourceStatus(loadingResourceStatus());
    try {
      const metadata = await requestJSON<CatalogMetadata>(
        "/api/v1/catalog/metadata",
        { signal },
        undefined,
        isCatalogMetadataPayload,
      );
      if (signal?.aborted) return;
      setCatalogMetadata(metadata);
      setCatalogMetadataStatus("ready");
      setCatalogMetadataResourceStatus(readyResourceStatus());
    } catch (error) {
      if (signal?.aborted) return;
      setCatalogMetadata(null);
      setCatalogMetadataStatus("error");
      setCatalogMetadataResourceStatus(failedResourceStatus(error, "состав каталога"));
    }
  }, []);

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
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void loadCatalogMetadata(controller.signal);
      if (session) {
        void Promise.all([
          loadProgress(session, controller.signal),
          loadActiveLesson(session, controller.signal),
        ]);
      }
    }, 0);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [loadActiveLesson, loadCatalogMetadata, loadProgress, session]);

  useEffect(() => {
    if (!session) {
      setLessonPreview(null);
      setPreviewingLesson(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setPreviewingLesson(true);
      void authorizedJSON<LessonPreviewResponse>(session, "/api/v1/lessons/preview", {
        method: "POST",
        body: JSON.stringify({
          source,
          studyMode,
          lessonSize: String(lessonSize),
          ...(lessonTopic ? { topic: lessonTopic } : {}),
        }),
      }, isLessonPreviewPayload).then((result) => {
        if (cancelled) return;
        adoptSession(result.activeSession);
        setLessonPreview(result.data);
      }).catch(() => {
        if (!cancelled) setLessonPreview(null);
      }).finally(() => {
        if (!cancelled) setPreviewingLesson(false);
      });
    }, 120);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [adoptSession, lessonSize, lessonTopic, session, source, studyMode]);

  useEffect(() => {
    const syncFromHistory = () => {
      if (window.location.pathname !== "/learn") return;
      const target = parseNavigationLocation(window.location);
      setSource(target.source ?? "mixed");
      setLessonTopic(target.topic ?? "");
    };
    window.addEventListener("popstate", syncFromHistory);
    return () => window.removeEventListener("popstate", syncFromHistory);
  }, []);

  const navigate = useCallback((target: NavigationTarget, intent: ProductJourneyIntent = "in_app_navigation") => {
    const targetURL = navigationURL(target);
    queueProductJourneyIntent(intent);
    requestRouteGraph("product", targetURL);
    router.push(targetURL, { scroll: false });
  }, [router]);

  const persistComposerTarget = useCallback((nextSource: LessonSource, nextTopic: string) => {
    const target = currentLearnTarget(nextSource, nextTopic);
    const targetURL = navigationURL(target);
    window.history.replaceState(
      {
        ...createNavigationHistoryState(target, { x: window.scrollX, y: window.scrollY }),
        [ROUTE_GRAPH_HISTORY_KEY]: "learn",
      },
      "",
      targetURL,
    );
    writePersistedNavigation(window.localStorage, target);
  }, []);

  const selectLessonSource = useCallback((nextSource: LessonSource) => {
    setSource(nextSource);
    setLessonTopic("");
    persistComposerTarget(nextSource, "");
  }, [persistComposerTarget]);

  const clearTopic = useCallback(() => {
    setLessonTopic("");
    persistComposerTarget(source, "");
  }, [persistComposerTarget, source]);

  const selectRovingControl = useCallback(<T extends string | number>(
    event: KeyboardEvent<HTMLButtonElement>,
    values: readonly T[],
    currentValue: T,
    onSelect: (value: T) => void,
    axis: RovingNavigationAxis = "both",
  ) => {
    const currentIndex = values.findIndex((value) => value === currentValue);
    const nextIndex = rovingTargetIndex(currentIndex, values.length, event.key, axis);
    if (nextIndex === null) return;
    const nextValue = values[nextIndex];
    if (nextValue === undefined) return;

    event.preventDefault();
    const group = event.currentTarget.closest<HTMLElement>('[role="radiogroup"]');
    const controls = Array.from(group?.querySelectorAll<HTMLButtonElement>('[role="radio"]') ?? []);
    controls[nextIndex]?.focus();
    onSelect(nextValue);
  }, []);

  const openLesson = useCallback((intent: ProductJourneyIntent) => {
    const targetURL = lessonResumeURL();
    queueProductJourneyIntent(intent);
    requestRouteGraph("product", targetURL);
    router.push(targetURL, { scroll: false });
  }, [router]);

  const requestAuthentication = useCallback(() => {
    const returnTo = navigationURL(currentLearnTarget(source, lessonTopic));
    const parameters = new URLSearchParams({ session: "required", return_to: returnTo });
    const targetURL = `/profile?${parameters.toString()}`;
    queueProductJourneyIntent("authentication");
    requestRouteGraph("product", targetURL);
    router.push(targetURL, { scroll: false });
  }, [lessonTopic, router, source]);

  const startLesson = useCallback(async () => {
    if (lessonCreateInFlightRef.current || busy) return;
    if (!session) {
      requestAuthentication();
      return;
    }

    lessonCreateInFlightRef.current = true;
    setBusy(true);
    setActionError("");
    try {
      const result = await authorizedJSON<LessonSessionResponse>(session, "/api/v1/lessons", {
        method: "POST",
        body: JSON.stringify({
          source,
          studyMode,
          lessonSize: String(lessonSize),
          ...(lessonTopic ? { topic: lessonTopic } : {}),
        }),
      }, isActiveLessonPayload);
      adoptSession(result.activeSession);
      setActiveLesson(result.data);
      openLesson("lesson_start");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Не удалось сформировать учебный блок");
    } finally {
      lessonCreateInFlightRef.current = false;
      setBusy(false);
    }
  }, [adoptSession, busy, lessonSize, lessonTopic, openLesson, requestAuthentication, session, source, studyMode]);

  const discardActiveLesson = useCallback(async () => {
    if (!session || !activeLesson || busy) return;
    setBusy(true);
    setActionError("");
    try {
      const result = await authorizedJSON<void>(session, `/api/v1/lessons/${activeLesson.id}`, {
        method: "DELETE",
        headers: { "If-Match": `"${activeLesson.version}"` },
      });
      adoptSession(result.activeSession);
      setActiveLesson(null);
      setActiveLessonStatus(readyResourceStatus());
    } catch (error) {
      if (error instanceof RequestFailure && error.status === 409) {
        await loadActiveLesson(session);
        setActionError("Урок изменён на другом устройстве. Показано актуальное состояние.");
      } else {
        setActionError(error instanceof Error ? error.message : "Не удалось сбросить урок");
      }
    } finally {
      setBusy(false);
    }
  }, [activeLesson, adoptSession, busy, loadActiveLesson, session]);

  const matchingLessonPreview = lessonPreview
    && lessonPreview.source === source
    && lessonPreview.studyMode === studyMode
    && lessonPreview.lessonSize === String(lessonSize)
    ? lessonPreview
    : null;
  const selectedModeLabel = studyMode === "study" ? "Изучение" : studyMode === "recall" ? "Воспроизведение" : "Варианты";
  const selectedSizeLabel = lessonSize === "all" ? "Все доступные" : `${lessonSize} элементов`;
  const estimatedMinutes = lessonSize === "all"
    ? "по составу"
    : lessonSize === 15
      ? "≈7м"
      : lessonSize === 30
        ? "≈14м"
        : "≈23м";
  const lessonPreviewPending = Boolean(session && (previewingLesson || !matchingLessonPreview));
  const lessonStartDisabled = busy || Boolean(session && (!matchingLessonPreview || matchingLessonPreview.composition.total === 0));
  const reviewedItems = activeLesson?.items.filter((item) => item.rating).length ?? 0;
  const initial = session?.user.displayName.trim().charAt(0).toUpperCase()
    || session?.user.email.charAt(0).toUpperCase()
    || "L";

  return (
    <div className="lx-app" data-route-client-island="learn">
      <header className="lx-header">
        <div className="lx-header-tools">
          {session && progress ? (
            <button className="lx-streak" type="button" onClick={() => navigate({ view: "progress" })}>
              <LearnIcon name="flame" />
              <span>{progress.currentStreak} дн.</span>
            </button>
          ) : null}
          <button className="lx-avatar" type="button" aria-label="Открыть профиль" onClick={() => navigate({ view: "profile" })}>
            {initial}
          </button>
        </div>
      </header>

      <div className="lx-app-shell">
        <main id="lexigo-main-content" className="lx-main-content" tabIndex={-1} aria-label={viewTitle("learn")}>
          <div className="lx-resource-stack">
            <AsyncResourceNotice label="Состав каталога" status={catalogMetadataResourceStatus} onRetry={() => void loadCatalogMetadata()} />
            {session ? <AsyncResourceNotice label="Прогресс" status={progressStatus} onRetry={() => void loadProgress(session)} /> : null}
            {session ? <AsyncResourceNotice label="Незавершённый урок" status={activeLessonStatus} onRetry={() => void loadActiveLesson(session)} /> : null}
          </div>

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

            <section className="lx-page-heading">
              <div>
                <span>ОБУЧЕНИЕ</span>
                <h1>Соберите один сфокусированный урок</h1>
                <p>Здесь находятся только параметры учебной сессии: режим, раздел, размер и предварительный состав.</p>
              </div>
              <div className="lx-heading-badge">
                <LearnIcon name="learn" />
                <span>{session && progress ? `${DUE_COPY.label}: ${progress.dueNow}` : "Прогресс сохраняется после входа"}</span>
              </div>
            </section>

            {session && activeLesson ? (
              <section className="lx-resume-strip">
                <div className="lx-resume-icon"><LearnIcon name="play" /></div>
                <div>
                  <span>Незавершённый урок</span>
                  <strong>{sourceLabel(activeLesson.source)} · {activeLesson.currentIndex + 1} из {activeLesson.items.length}</strong>
                  <small>{reviewedItems} элементов уже оценено</small>
                </div>
                <div className="lx-resume-actions">
                  <button className="lx-button ghost" type="button" disabled={busy} onClick={() => void discardActiveLesson()}>Сбросить</button>
                  <button className="lx-button primary" type="button" disabled={busy} onClick={() => openLesson("lesson_start")}>Продолжить урок</button>
                </div>
              </section>
            ) : null}

            {lessonTopic ? (
              <section className="lx-composer-context" aria-label="Контекст из каталога">
                <div>
                  <span>Перенесено из словаря</span>
                  <strong>{sourceLabel(source)} · {topicLabel(lessonTopic)}</strong>
                  <small>Раздел и тема уже выбраны; повторная настройка не требуется.</small>
                </div>
                <button className="lx-button ghost" type="button" onClick={clearTopic}>Очистить тему</button>
              </section>
            ) : null}

            <LessonComposerProgressiveShell
              expanded={mobileComposerExpanded}
              sourceLabel={sourceLabel(source)}
              modeLabel={selectedModeLabel}
              sizeLabel={selectedSizeLabel}
              dueCount={matchingLessonPreview?.composition.due}
              newCount={matchingLessonPreview?.composition.new}
              estimatedMinutes={estimatedMinutes}
              previewPending={lessonPreviewPending}
              startDisabled={lessonStartDisabled}
              startLabel={lessonSize === "all" ? "Начать весь выбранный материал" : "Начать рекомендуемый урок"}
              busy={busy}
              onToggle={() => setMobileComposerExpanded((current) => !current)}
              onStart={() => void startLesson()}
            >
              <section className="lx-setup-card">
                <div className="lx-setup-block">
                  <div className="lx-block-heading"><span>1</span><div><strong>Выберите режим</strong><small>Рекомендуемый режим — объективное воспроизведение без подсказки</small></div></div>
                  <div className="lx-mode-selector" role="radiogroup" aria-label="Режим обучения" aria-orientation="vertical">
                    {MODE_OPTIONS.map((option) => {
                      const selected = studyMode === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          tabIndex={selected ? 0 : -1}
                          className={selected ? "selected" : ""}
                          onClick={() => setStudyMode(option.value)}
                          onKeyDown={(event) => selectRovingControl(event, MODE_VALUES, option.value, setStudyMode, "vertical")}
                        >
                          <span><LearnIcon name={option.icon} /></span>
                          <div><strong>{option.label}</strong><small>{option.hint}</small></div>
                          <i><LearnIcon name="check" size={14} /></i>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="lx-setup-block">
                  <div className="lx-block-heading"><span>2</span><div><strong>Выберите раздел</strong><small>Можно начать со всех слов или сфокусироваться на части речи</small></div></div>
                  <div className="lx-source-selector" role="radiogroup" aria-label="Раздел обучения">
                    {SOURCE_OPTIONS.map((option) => {
                      const selected = source === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          tabIndex={selected ? 0 : -1}
                          data-lexigo-source={option.value}
                          className={selected ? "selected" : ""}
                          onClick={() => selectLessonSource(option.value)}
                          onKeyDown={(event) => selectRovingControl(event, SOURCE_VALUES, option.value, selectLessonSource)}
                        >
                          <span className={`lx-section-icon ${option.value}`}><LearnIcon name={option.icon} /></span>
                          <div><strong>{option.label}</strong><small>{option.hint}</small></div>
                          <b data-catalog-count-state={catalogMetadataStatus}>{catalogCountText(catalogMetadata, catalogMetadataStatus, option.value, ["элемент", "элемента", "элементов"])}</b>
                        </button>
                      );
                    })}
                    {COLLECTIONS.map((definition) => {
                      const selected = source === definition.source;
                      return (
                        <CollectionCard
                          key={definition.source}
                          definition={definition}
                          countText={catalogCountText(catalogMetadata, catalogMetadataStatus, definition.source, ["элемент", "элемента", "элементов"])}
                          selected={selected}
                          onSelect={() => selectLessonSource(definition.source)}
                          onKeyDown={(event) => selectRovingControl(event, SOURCE_VALUES, definition.source, selectLessonSource)}
                        />
                      );
                    })}
                  </div>
                </div>

                <div className="lx-setup-footer">
                  <fieldset>
                    <legend id="lesson-size-label">Размер урока</legend>
                    <div className="lx-size-control" role="radiogroup" aria-labelledby="lesson-size-label" aria-orientation="horizontal">
                      {SIZE_OPTIONS.map((option) => {
                        const selected = lessonSize === option.value;
                        return (
                          <button
                            key={String(option.value)}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            tabIndex={selected ? 0 : -1}
                            className={selected ? "selected" : ""}
                            onClick={() => setLessonSize(option.value)}
                            onKeyDown={(event) => selectRovingControl(event, SIZE_VALUES, option.value, setLessonSize, "horizontal")}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                  <div className="lx-setup-actions">
                    {!session ? (
                      <div className="lx-lesson-preview"><span>Состав урока</span><strong>Войдите для расчёта</strong><small>При расчёте учитываются материал к повторению и доступные фразы.</small></div>
                    ) : previewingLesson || !matchingLessonPreview ? (
                      <div className="lx-lesson-preview" aria-live="polite"><span>Состав урока</span><strong>Рассчитываем…</strong><small>Проверяем материал к повторению, новые элементы и доступность слов и фраз.</small></div>
                    ) : (
                      <div className="lx-lesson-preview" aria-live="polite">
                        <span>Состав урока</span>
                        <strong>{lessonCompositionDescription(matchingLessonPreview.composition)}</strong>
                        <small>{lessonPriorityDescription(matchingLessonPreview.composition)}</small>
                        {lessonCompositionFallbackMessage(matchingLessonPreview.composition) ? <em>{lessonCompositionFallbackMessage(matchingLessonPreview.composition)}</em> : null}
                      </div>
                    )}
                    <div className="lx-setup-submit">
                      <p>{studyMode === "study" ? "Слово, перевод и пример будут видны сразу." : "Ответы будут сохранены в интервальную очередь."}</p>
                      <button className="lx-button primary large" type="button" disabled={lessonStartDisabled} onClick={() => void startLesson()}>
                        <LearnIcon name="play" />
                        {busy ? "Формируем…" : "Начать урок"}
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </LessonComposerProgressiveShell>
          </div>
        </main>
      </div>
    </div>
  );
}
