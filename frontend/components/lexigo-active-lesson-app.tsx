"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import {
  failedResourceStatus,
  isActiveLessonPayload,
  isProgressSummaryPayload,
  loadingResourceStatus,
  readyResourceStatus,
  type ResourceStatus,
} from "../lib/account-resources";
import { authorizedJSON } from "../lib/authorized-json";
import type { Session } from "../lib/auth-session";
import { decideLessonAdvance, resolveActiveLessonIndex } from "../lib/lesson-flow";
import {
  buildLessonResultSnapshot,
  claimDailyGoalCelebration,
  clearLessonResultSnapshot,
  isDistinctLessonResultCandidate,
  lessonResultRecommendedAction,
  readLessonResultSnapshot,
  resolveLessonResultContinuation,
  writeLessonResultSnapshot,
  type LessonResultContinuation,
  type LessonResultJudgement,
  type LessonResultSelectedAction,
  type LessonResultSnapshot,
} from "../lib/lesson-result";
import {
  buildAnswerOptions,
  exerciseAnswer,
  judgeLearningAnswer,
  normalizePartOfSpeech,
  type LearningItem,
  type LessonSelectionReason,
  type LessonSize,
  type WordSection,
} from "../lib/learning";
import {
  navigationURL,
  parseNavigationLocation,
  viewTitle,
  type NavigationTarget,
} from "../lib/navigation";
import { queueProductJourneyIntent, type ProductJourneyIntent } from "../lib/product-journey";
import type { AnswerMode, ProgressSummary, ReviewRating } from "../lib/progress";
import { RequestFailure } from "../lib/request-failure";
import { ActiveLessonPresentation } from "./active-lesson-presentation";
import { AsyncResourceNotice, AsyncStatePanel } from "./async-state";
import { LessonResultPresentation } from "./lesson-result-presentation";
import { RouteBrand, RoutePrimaryNavigation } from "./route-primary-navigation";

type APIItem = {
  id: number;
  kind?: "word" | "phrase";
  slug?: string;
  lemma: string;
  translation: string;
  phonetic: string;
  partOfSpeech: string;
  topic: string;
  aliases?: string[];
  acceptedAnswers?: string[];
  examples: string[];
  note: string;
  cloze?: string;
  clozeAnswer?: string;
  status: string;
  reason?: LessonSelectionReason;
};

type LessonItemResponse = APIItem & {
  position: number;
  rating?: ReviewRating;
  reviewedAt?: string;
};

type LessonSource = WordSection | "phrases";

type LessonSessionResponse = {
  id: string;
  source: LessonSource;
  studyMode: AnswerMode;
  lessonSize: string;
  currentIndex: number;
  version: number;
  status: "active" | "completed" | "discarded";
  items: LessonItemResponse[];
  createdAt: string;
  updatedAt: string;
};

type LessonReviewResponse = {
  wordId: number;
  requestedRating: ReviewRating;
  effectiveRating: ReviewRating;
  correct?: boolean;
  judgementSource: "study" | "server" | "legacy_client";
  judgementReason: string;
  matchedAnswer?: string;
  reviewEventId: number;
  suggestionAvailable: boolean;
  lessonId: string;
  lessonCurrentIndex: number;
  lessonVersion: number;
  lastReviewedAt: string;
  lessonCompleted: boolean;
  lessonReviewedItems: number;
  lessonSkippedItems: number;
  lessonTotalItems: number;
};

type LessonPreviewResponse = {
  source: LessonSource;
  studyMode: AnswerMode;
  lessonSize: string;
  composition: {
    total: number;
  };
};

type LexigoActiveLessonAppProps = {
  initialSession: Session;
  onSessionUpdated: (session: Session) => void;
};

type RouteGraphHint = "home" | "learn" | "product";

const PRODUCT_ROUTE_GRAPH_EVENT = "lexigo:product-route-graph";
const SOURCE_LABELS: Record<LessonSource, string> = {
  mixed: "Смешанная практика",
  noun: "Существительные",
  verb: "Глаголы",
  adjective: "Прилагательные",
  "daily-life": "Бытовой английский",
  travel: "Для путешествий",
  "data-engineering": "Инженерия данных",
  backend: "Backend-разработка",
  "academic-technical-english": "Academic Technical English",
  phrases: "Технические фразы",
};

function toLearningItem(item: APIItem): LearningItem {
  const kind = item.kind === "phrase" || item.partOfSpeech.toLowerCase() === "phrase"
    ? "phrase"
    : "word";
  return {
    id: `${kind}-${item.id}`,
    wordId: item.id,
    kind,
    slug: item.slug,
    prompt: item.lemma,
    answer: item.translation,
    phonetic: item.phonetic,
    partOfSpeech: item.partOfSpeech,
    section: kind === "phrase" ? "phrase" : normalizePartOfSpeech(item.partOfSpeech),
    topic: item.topic,
    aliases: item.aliases,
    acceptedAnswers: item.acceptedAnswers,
    examples: item.examples,
    note: item.note,
    status: item.status,
    selectionReason: item.reason,
    cloze: item.cloze,
    clozeAnswer: item.clozeAnswer,
  };
}

function lessonSizeFromAPI(value: string): LessonSize {
  if (value === "all") return "all";
  const parsed = Number(value);
  if (parsed === 15 || parsed === 50 || parsed === 60) return parsed;
  return 30;
}

function timezoneOffsetMinutes(): number {
  return new Date().getTimezoneOffset();
}

function routeGraphHint(target: NavigationTarget): RouteGraphHint {
  if (target.view === "home") return "home";
  if (target.view === "learn") return "learn";
  return "product";
}

function sourceLabel(source: string): string {
  return SOURCE_LABELS[source as LessonSource] ?? source;
}

export function LexigoActiveLessonApp({
  initialSession,
  onSessionUpdated,
}: LexigoActiveLessonAppProps) {
  const router = useRouter();
  const initialTarget = useMemo(
    () => (typeof window === "undefined"
      ? { view: "lesson" } satisfies NavigationTarget
      : parseNavigationLocation(window.location)),
    [],
  );
  const session = initialSession;
  const [activeLesson, setActiveLesson] = useState<LessonSessionResponse | null>(null);
  const [activeLessonStatus, setActiveLessonStatus] = useState<ResourceStatus>(loadingResourceStatus);
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [progressStatus, setProgressStatus] = useState<ResourceStatus>(loadingResourceStatus);
  const [items, setItems] = useState<LearningItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [studyMode, setStudyMode] = useState<AnswerMode>("recall");
  const [lessonTopic, setLessonTopic] = useState(initialTarget.topic ?? "");
  const [revealed, setRevealed] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [typedAnswer, setTypedAnswer] = useState("");
  const [ratings, setRatings] = useState<Record<string, ReviewRating>>({});
  const [lessonStarted, setLessonStarted] = useState(false);
  const [lessonComplete, setLessonComplete] = useState(false);
  const [serverLessonCompleted, setServerLessonCompleted] = useState(false);
  const [serverNextIndex, setServerNextIndex] = useState<number | null>(null);
  const [lessonResult, setLessonResult] = useState<LessonResultSnapshot | null>(null);
  const [lessonResultContinuation, setLessonResultContinuation] = useState<LessonResultContinuation>({ kind: "checking" });
  const [lessonResultCelebrate, setLessonResultCelebrate] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState<LessonReviewResponse | null>(null);
  const [suggestionStatus, setSuggestionStatus] = useState<"idle" | "submitting" | "submitted" | "error">("idle");
  const [suggestionError, setSuggestionError] = useState("");
  const [actionError, setActionError] = useState("");
  const [lessonQueueNotice, setLessonQueueNotice] = useState("");
  const [cardStartedAt, setCardStartedAt] = useState(0);
  const reviewInFlightRef = useRef(false);
  const lessonCreateInFlightRef = useRef(false);
  const lessonJudgementsRef = useRef<Record<string, LessonResultJudgement>>({});
  const lessonProgressBeforeRef = useRef<number | null>(null);
  const latestProgressRef = useRef<ProgressSummary | null>(null);
  const lessonAdvanceRef = useRef<HTMLButtonElement | null>(null);
  const mainContentRef = useRef<HTMLElement | null>(null);

  const adoptSession = useCallback((nextSession: Session) => {
    if (session.tokens.accessToken !== nextSession.tokens.accessToken) {
      onSessionUpdated(nextSession);
    }
  }, [onSessionUpdated, session.tokens.accessToken]);

  const navigate = useCallback((
    target: NavigationTarget,
    intent: ProductJourneyIntent = "in_app_navigation",
    replace = false,
  ) => {
    const targetURL = navigationURL(target);
    queueProductJourneyIntent(intent);
    window.dispatchEvent(new CustomEvent(PRODUCT_ROUTE_GRAPH_EVENT, {
      detail: {
        routeGraph: routeGraphHint(target),
        pathname: new URL(targetURL, window.location.origin).pathname,
      },
    }));
    if (replace) router.replace(targetURL, { scroll: false });
    else router.push(targetURL, { scroll: false });
  }, [router]);

  const loadProgress = useCallback(async (activeSession: Session, signal?: AbortSignal) => {
    setProgressStatus(loadingResourceStatus());
    try {
      const result = await authorizedJSON<ProgressSummary>(
        activeSession,
        `/api/v1/progress?timezoneOffsetMinutes=${timezoneOffsetMinutes()}`,
        { signal },
        isProgressSummaryPayload,
      );
      if (signal?.aborted) return null;
      adoptSession(result.activeSession);
      latestProgressRef.current = result.data;
      setProgress(result.data);
      setProgressStatus(readyResourceStatus());
      return result.data;
    } catch (error) {
      if (signal?.aborted) return null;
      setProgressStatus(failedResourceStatus(error, "прогресс"));
      throw error;
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
      if (signal?.aborted) return null;
      adoptSession(result.activeSession);
      setActiveLesson(result.data);
      setActiveLessonStatus(readyResourceStatus());
      return result.data;
    } catch (error) {
      if (signal?.aborted) return null;
      if (error instanceof RequestFailure && error.status === 404) {
        setActiveLesson(null);
        setActiveLessonStatus(readyResourceStatus());
        return null;
      }
      setActiveLessonStatus(failedResourceStatus(error, "незавершённый урок"));
      return null;
    }
  }, [adoptSession]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void Promise.allSettled([
        loadProgress(session, controller.signal),
        loadActiveLesson(session, controller.signal),
      ]);
    }, 0);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [loadActiveLesson, loadProgress, session]);

  useEffect(() => {
    if (!lessonStarted) return;
    const timer = window.setTimeout(() => setCardStartedAt(window.performance.now()), 0);
    return () => window.clearTimeout(timer);
  }, [currentIndex, lessonStarted, studyMode]);

  useEffect(() => {
    latestProgressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    document.title = `${viewTitle("lesson")} · LexiGo`;
  }, []);

  useEffect(() => {
    if (!lessonStarted || lessonComplete) return;
    const preventAccidentalUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", preventAccidentalUnload);
    return () => window.removeEventListener("beforeunload", preventAccidentalUnload);
  }, [lessonComplete, lessonStarted]);

  useLayoutEffect(() => {
    if (!lessonStarted) return;
    const frame = window.requestAnimationFrame(() => {
      mainContentRef.current?.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [lessonStarted]);

  const resetCardState = useCallback((mode: AnswerMode, rated = false) => {
    setRevealed(rated || mode === "study");
    setSelectedAnswer("");
    setTypedAnswer("");
    setReviewFeedback(null);
    setSuggestionStatus("idle");
    setSuggestionError("");
  }, []);

  function clearLessonState() {
    setItems([]);
    setCurrentIndex(0);
    setRevealed(false);
    setSelectedAnswer("");
    setTypedAnswer("");
    setRatings({});
    setLessonStarted(false);
    setLessonComplete(false);
    setServerLessonCompleted(false);
    setServerNextIndex(null);
    setLessonResult(null);
    setLessonResultContinuation({ kind: "checking" });
    setLessonResultCelebrate(false);
    setReviewFeedback(null);
    setSuggestionStatus("idle");
    setSuggestionError("");
    lessonJudgementsRef.current = {};
    lessonProgressBeforeRef.current = null;
    reviewInFlightRef.current = false;
    setActionError("");
    setLessonQueueNotice("");
  }

  const applyLesson = useCallback((lesson: LessonSessionResponse) => {
    const lessonItems = lesson.items.map(toLearningItem);
    const restoredRatings: Record<string, ReviewRating> = {};
    const restoredJudgements: Record<string, LessonResultJudgement> = {};
    lesson.items.forEach((item, index) => {
      const learningItem = lessonItems[index];
      if (item.rating && learningItem) {
        restoredRatings[learningItem.id] = item.rating;
        restoredJudgements[learningItem.id] = { mode: lesson.studyMode, correct: null };
      }
    });
    const candidate = lessonItems[lesson.currentIndex];
    const safeIndex = resolveActiveLessonIndex(
      lesson.currentIndex,
      lessonItems.length,
      Boolean(candidate && restoredRatings[candidate.id]),
    );
    if (safeIndex === null || !Number.isInteger(lesson.version) || lesson.version <= 0) {
      setActiveLesson(null);
      clearLessonState();
      setActionError("Сервер вернул некорректную позицию урока. Обновите страницу или начните новый блок.");
      return false;
    }

    try {
      clearLessonResultSnapshot(window.sessionStorage, session.user.id);
    } catch {
      // The active server lesson remains authoritative when storage is restricted.
    }
    setLessonResult(null);
    setLessonResultContinuation({ kind: "checking" });
    setLessonResultCelebrate(false);
    lessonJudgementsRef.current = restoredJudgements;
    lessonProgressBeforeRef.current = latestProgressRef.current?.reviewsToday ?? null;
    setActiveLesson(lesson);
    setStudyMode(lesson.studyMode);
    setItems(lessonItems);
    setRatings(restoredRatings);
    setCurrentIndex(safeIndex);
    resetCardState(
      lesson.studyMode,
      Boolean(lessonItems[safeIndex] && restoredRatings[lessonItems[safeIndex].id]),
    );
    setLessonComplete(lessonItems.length === 0);
    setServerLessonCompleted(false);
    setServerNextIndex(null);
    setLessonStarted(true);
    return true;
  }, [resetCardState, session.user.id]);

  const resynchronizeActiveLesson = useCallback(async (message: string) => {
    try {
      const result = await authorizedJSON<LessonSessionResponse>(
        session,
        "/api/v1/lessons/active",
        {},
        isActiveLessonPayload,
      );
      adoptSession(result.activeSession);
      if (applyLesson(result.data)) {
        setActionError(message);
      } else {
        navigate({ view: "learn" });
      }
    } catch (error) {
      if (error instanceof RequestFailure && error.status === 404) {
        setActiveLesson(null);
        clearLessonState();
        navigate({ view: "learn" });
        return;
      }
      setActionError(error instanceof Error ? error.message : "Не удалось синхронизировать урок");
    }
  }, [adoptSession, applyLesson, navigate, session]);

  const resumeLesson = useCallback(async () => {
    setBusy(true);
    setActionError("");
    try {
      const result = await authorizedJSON<LessonSessionResponse>(
        session,
        "/api/v1/lessons/active",
        {},
        isActiveLessonPayload,
      );
      adoptSession(result.activeSession);
      if (!applyLesson(result.data)) navigate({ view: "learn" });
    } catch (error) {
      if (error instanceof RequestFailure && error.status === 404) {
        setActiveLesson(null);
        setActiveLessonStatus(readyResourceStatus());
        setActionError("Незавершённый урок отсутствует. Начните новый блок.");
      } else {
        setActionError(error instanceof Error ? error.message : "Не удалось продолжить урок");
      }
    } finally {
      setBusy(false);
    }
  }, [adoptSession, applyLesson, navigate, session]);

  useEffect(() => {
    if (
      lessonStarted
      || activeLesson
      || activeLessonStatus.phase !== "ready"
    ) return;

    let restored: LessonResultSnapshot | null = null;
    try {
      restored = readLessonResultSnapshot(window.sessionStorage, session.user.id);
    } catch {
      restored = null;
    }
    if (!restored) return;

    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled || !restored) return;
      setStudyMode(restored.studyMode);
      setLessonTopic(restored.topic);
      setLessonResult(restored);
      setLessonResultContinuation(resolveLessonResultContinuation({ snapshot: restored, previewTotal: null }));
      setLessonResultCelebrate(false);
      setLessonStarted(true);
      setLessonComplete(true);
      setServerLessonCompleted(true);
      setServerNextIndex(null);
      setActionError("");
    });
    return () => {
      cancelled = true;
    };
  }, [activeLesson, activeLessonStatus.phase, lessonStarted, session.user.id]);

  useEffect(() => {
    if (!lessonResult || !lessonComplete) return;
    const immediate = resolveLessonResultContinuation({ snapshot: lessonResult, previewTotal: null });
    if (immediate.kind !== "checking") {
      let cancelled = false;
      queueMicrotask(() => {
        if (!cancelled) setLessonResultContinuation(immediate);
      });
      return () => {
        cancelled = true;
      };
    }

    let cancelled = false;
    const controller = new AbortController();
    void authorizedJSON<LessonPreviewResponse>(session, "/api/v1/lessons/preview", {
      method: "POST",
      signal: controller.signal,
      body: JSON.stringify({
        source: lessonResult.source,
        studyMode: lessonResult.studyMode,
        lessonSize: lessonResult.lessonSize,
        ...(lessonResult.topic ? { topic: lessonResult.topic } : {}),
      }),
    }).then((result) => {
      if (cancelled) return;
      adoptSession(result.activeSession);
      setLessonResultContinuation(resolveLessonResultContinuation({
        snapshot: lessonResult,
        previewTotal: result.data.composition.total,
        nextTitle: sourceLabel(lessonResult.source),
        estimatedMinutes: Math.max(1, Math.round(result.data.composition.total / 2)),
      }));
    }).catch(() => {
      if (!cancelled) {
        setLessonResultContinuation(resolveLessonResultContinuation({
          snapshot: lessonResult,
          previewTotal: 0,
        }));
      }
    });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [adoptSession, lessonComplete, lessonResult, session]);

  const currentItem = items[currentIndex];
  const currentRating = currentItem ? ratings[currentItem.id] : undefined;
  const expectedAnswer = currentItem ? exerciseAnswer(currentItem) : "";
  const submittedAnswer = selectedAnswer || typedAnswer;
  const localJudgement = currentItem && submittedAnswer.trim()
    ? judgeLearningAnswer(currentItem, submittedAnswer)
    : null;
  const literalMatch = Boolean(localJudgement?.correct);
  const answerOptions = useMemo(
    () => (currentItem ? buildAnswerOptions(currentItem, items) : []),
    [currentItem, items],
  );

  function moveToServerIndex(index: number) {
    if (!Number.isInteger(index) || index < 0 || index >= items.length || !items[index]) {
      setActionError("Сервер вернул недопустимую позицию урока. Выполнена повторная синхронизация.");
      void resynchronizeActiveLesson("Урок синхронизирован с сервером.");
      return;
    }
    const target = items[index];
    setCurrentIndex(index);
    setServerNextIndex(null);
    resetCardState(studyMode, Boolean(ratings[target.id]));
  }

  function nextItem() {
    const decision = decideLessonAdvance({
      currentIndex,
      itemCount: items.length,
      reviewPersisted: Boolean(currentRating),
      reviewSaving: reviewing,
      serverCompleted: serverLessonCompleted,
      serverNextIndex,
    });
    if (!decision.canAdvance) {
      setActionError(decision.reason === "completion_not_confirmed"
        ? "Сервер ещё не подтвердил завершение урока. Повторите попытку."
        : "Сначала сохраните оценку текущей карточки.");
      return;
    }
    setActionError("");
    if (decision.kind === "results") {
      setLessonComplete(true);
      return;
    }
    moveToServerIndex(decision.nextIndex);
  }

  async function rateCurrent(
    rating: ReviewRating,
    submittedAt: number,
    restoreFocusAfterSave = false,
  ) {
    if (!currentItem || currentRating || reviewInFlightRef.current || currentItem.wordId === undefined || !activeLesson) {
      return;
    }
    reviewInFlightRef.current = true;
    setReviewing(true);
    setActionError("");
    setReviewFeedback(null);
    setSuggestionStatus("idle");
    setSuggestionError("");
    let reviewPersisted = false;
    try {
      const path = `/api/v1/lessons/${activeLesson.id}/words/${currentItem.wordId}/review`;
      const result = await authorizedJSON<LessonReviewResponse>(session, path, {
        method: "POST",
        body: JSON.stringify({
          lessonVersion: activeLesson.version,
          rating,
          responseMs: Math.max(0, Math.round(submittedAt - cardStartedAt)),
          answerMode: studyMode,
          answerRevealed: revealed || studyMode === "study",
          ...(studyMode === "study" ? {} : { submittedAnswer }),
          timezoneOffsetMinutes: timezoneOffsetMinutes(),
        }),
      });
      const nextRatings = { ...ratings, [currentItem.id]: rating };
      const nextJudgements = {
        ...lessonJudgementsRef.current,
        [currentItem.id]: {
          mode: studyMode,
          correct: typeof result.data.correct === "boolean" ? result.data.correct : null,
        },
      } satisfies Record<string, LessonResultJudgement>;
      lessonJudgementsRef.current = nextJudgements;
      adoptSession(result.activeSession);
      setRatings(nextRatings);
      setReviewFeedback(result.data);
      reviewPersisted = true;
      setServerLessonCompleted(result.data.lessonCompleted);
      setServerNextIndex(result.data.lessonCompleted ? null : result.data.lessonCurrentIndex);
      if (result.data.lessonCompleted) {
        setActiveLesson(null);
      } else {
        setActiveLesson((current) => current ? {
          ...current,
          currentIndex: result.data.lessonCurrentIndex,
          version: result.data.lessonVersion,
          items: current.items.map((item) => item.id === currentItem.wordId
            ? { ...item, rating, reviewedAt: result.data.lastReviewedAt }
            : item),
        } : current);
      }

      let completionProgress = latestProgressRef.current;
      let syncPending = false;
      try {
        completionProgress = await loadProgress(result.activeSession);
      } catch {
        syncPending = true;
        setActionError("Оценка сохранена, но статистика обновится после следующей синхронизации.");
      }

      if (result.data.lessonCompleted) {
        const completedSnapshot = buildLessonResultSnapshot({
          userId: result.activeSession.user.id,
          lessonId: activeLesson.id,
          source: activeLesson.source,
          studyMode: activeLesson.studyMode,
          lessonSize: activeLesson.lessonSize,
          topic: lessonTopic,
          itemIds: activeLesson.items.map((item) => item.id),
          judgements: nextJudgements,
          ratings: nextRatings,
          skipped: result.data.lessonSkippedItems,
          dueNow: completionProgress?.dueNow ?? 0,
          nextDueAt: completionProgress?.nextDueAt ?? null,
          dailyGoal: completionProgress?.dailyGoal ?? 0,
          reviewsBefore: lessonProgressBeforeRef.current,
          reviewsAfter: completionProgress?.reviewsToday ?? null,
          objectiveReviewsToday: completionProgress?.objectiveReviewsToday ?? null,
          objectiveSuccessfulToday: completionProgress?.objectiveSuccessfulToday ?? null,
          currentStreak: completionProgress?.currentStreak ?? null,
          syncPending,
        });
        let celebrate = false;
        try {
          writeLessonResultSnapshot(window.sessionStorage, completedSnapshot);
          celebrate = claimDailyGoalCelebration(window.sessionStorage, completedSnapshot);
        } catch {
          // In-memory result remains available when storage is restricted.
        }
        setLessonResult(completedSnapshot);
        setLessonResultContinuation(resolveLessonResultContinuation({
          snapshot: completedSnapshot,
          previewTotal: null,
        }));
        setLessonResultCelebrate(celebrate);
      }
    } catch (error) {
      if (error instanceof RequestFailure && (
        error.status === 409
        || error.code === "lesson_item_not_found"
        || error.code === "active_lesson_not_found"
      )) {
        await resynchronizeActiveLesson("Урок изменён на другом устройстве. Показана актуальная карточка.");
      } else {
        setActionError(error instanceof Error ? error.message : "Не удалось сохранить результат");
      }
    } finally {
      reviewInFlightRef.current = false;
      setReviewing(false);
      if (reviewPersisted && restoreFocusAfterSave) {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => lessonAdvanceRef.current?.focus({ preventScroll: true }));
        });
      }
    }
  }

  async function submitAnswerSuggestion() {
    if (!currentItem || currentItem.wordId === undefined || !reviewFeedback) return;
    const answer = submittedAnswer.trim();
    if (!answer || !reviewFeedback.suggestionAvailable || reviewFeedback.reviewEventId <= 0) return;

    setSuggestionStatus("submitting");
    setSuggestionError("");
    try {
      const result = await authorizedJSON(
        session,
        `/api/v1/words/${currentItem.wordId}/answer-suggestions`,
        {
          method: "POST",
          body: JSON.stringify({
            reviewEventId: reviewFeedback.reviewEventId,
            exerciseKind: currentItem.kind === "phrase" ? "cloze" : "translation",
            submittedAnswer: answer,
          }),
        },
      );
      adoptSession(result.activeSession);
      setSuggestionStatus("submitted");
    } catch (error) {
      setSuggestionStatus("error");
      setSuggestionError(error instanceof Error ? error.message : "Не удалось отправить вариант на проверку");
    }
  }

  const startLesson = useCallback(async (
    nextSource: LessonSource,
    nextSize: LessonSize,
    nextMode: AnswerMode,
    nextTopic: string,
    previousResult: LessonResultSnapshot,
  ) => {
    if (lessonCreateInFlightRef.current) return;
    lessonCreateInFlightRef.current = true;
    setBusy(true);
    setActionError("");
    try {
      lessonProgressBeforeRef.current = latestProgressRef.current?.reviewsToday ?? null;
      const result = await authorizedJSON<LessonSessionResponse>(
        session,
        "/api/v1/lessons",
        {
          method: "POST",
          body: JSON.stringify({
            source: nextSource,
            studyMode: nextMode,
            lessonSize: String(nextSize),
            ...(nextTopic ? { topic: nextTopic } : {}),
          }),
        },
        isActiveLessonPayload,
      );
      if (!isDistinctLessonResultCandidate(previousResult, {
        id: result.data.id,
        itemIds: result.data.items.map((item) => item.id),
      })) {
        throw new Error("Следующий урок совпал с завершённым блоком. Обновите очередь и повторите попытку.");
      }
      adoptSession(result.activeSession);
      if (applyLesson(result.data)) {
        queueProductJourneyIntent("lesson_start");
      }
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Не удалось сформировать учебный блок");
    } finally {
      lessonCreateInFlightRef.current = false;
      setBusy(false);
    }
  }, [adoptSession, applyLesson, session]);

  function recordLessonResultAction(selectedAction: LessonResultSelectedAction) {
    if (!lessonResult) return;
    const completed = lessonResult;
    void authorizedJSON<void>(
      session,
      `/api/v1/lessons/${completed.lessonId}/result-action`,
      {
        method: "POST",
        keepalive: true,
        body: JSON.stringify({
          recommendedAction: lessonResultRecommendedAction(lessonResultContinuation),
          selectedAction,
        }),
      },
    ).then((result) => adoptSession(result.activeSession)).catch(() => {
      // Retention telemetry must never block the learner's selected continuation.
    });
  }

  function leaveLesson(target: NavigationTarget, intent: ProductJourneyIntent) {
    clearLessonState();
    navigate(target, intent, intent === "lesson_exit");
  }

  function startNextLessonFromResult() {
    if (!lessonResult) return;
    recordLessonResultAction("next_lesson");
    const nextSource = SOURCE_LABELS[lessonResult.source as LessonSource]
      ? lessonResult.source as LessonSource
      : "mixed";
    void startLesson(
      nextSource,
      lessonSizeFromAPI(lessonResult.lessonSize),
      lessonResult.studyMode,
      lessonResult.topic,
      lessonResult,
    );
  }

  function startDueReviewFromResult() {
    if (!lessonResult) return;
    recordLessonResultAction("due_review");
    void startLesson("mixed", 30, "recall", "", lessonResult);
  }

  function renderLesson() {
    if (!lessonStarted) {
      if (activeLessonStatus.phase === "idle" || activeLessonStatus.phase === "loading") {
        return (
          <AsyncStatePanel
            label="Загрузка активного урока"
            kind="loading"
            title="Проверяем незавершённый урок…"
            message="Синхронизируем текущую позицию и сохранённые оценки."
            focusResult={false}
          />
        );
      }
      if (activeLessonStatus.phase === "error" && activeLessonStatus.problem) {
        return (
          <AsyncStatePanel
            label="Активный урок недоступен"
            kind="error"
            title={activeLessonStatus.problem.title}
            message={activeLessonStatus.problem.message}
            reference={activeLessonStatus.problem.correlationId}
            actionLabel={activeLessonStatus.problem.retryable ? "Повторить" : undefined}
            onAction={activeLessonStatus.problem.retryable ? () => void loadActiveLesson(session) : undefined}
          />
        );
      }
      return activeLesson ? (
        <AsyncStatePanel
          label="Сохранённый активный урок"
          kind="success"
          title="Урок сохранён"
          message={`${sourceLabel(activeLesson.source)} · позиция ${activeLesson.currentIndex + 1} из ${activeLesson.items.length}`}
          actionLabel="Продолжить урок"
          onAction={() => void resumeLesson()}
        />
      ) : (
        <AsyncStatePanel
          label="Активный урок отсутствует"
          kind="empty"
          title="Активного урока нет"
          message="Выберите режим, раздел и размер блока."
          actionLabel="Настроить урок"
          onAction={() => navigate({ view: "learn" })}
        />
      );
    }

    if (lessonComplete && lessonResult) {
      return (
        <LessonResultPresentation
          snapshot={lessonResult}
          continuation={lessonResultContinuation}
          sourceLabel={sourceLabel(lessonResult.source)}
          busy={busy}
          celebrate={lessonResultCelebrate}
          onHome={() => {
            recordLessonResultAction("home");
            leaveLesson({ view: "home" }, "in_app_navigation");
          }}
          onProgress={() => {
            recordLessonResultAction("progress");
            leaveLesson({ view: "progress" }, "in_app_navigation");
          }}
          onNextLesson={startNextLessonFromResult}
          onDueReview={startDueReviewFromResult}
          onStay={() => {
            recordLessonResultAction("stay");
            setLessonQueueNotice("Результат сохранён и останется доступен на этом экране.");
          }}
        />
      );
    }
    if (lessonComplete) {
      return (
        <AsyncStatePanel
          label="Результат урока недоступен"
          kind="error"
          title="Не удалось восстановить итог"
          message="Ответы сохранены, но представление результата не сформировано. Откройте прогресс для проверки."
          actionLabel="Открыть прогресс"
          onAction={() => leaveLesson({ view: "progress" }, "in_app_navigation")}
        />
      );
    }
    if (!currentItem) {
      return (
        <AsyncStatePanel
          label="Ошибка учебной карточки"
          kind="error"
          title="Карточка урока недоступна"
          message="Серверная сессия не содержит ожидаемую текущую карточку."
          actionLabel="Синхронизировать урок"
          onAction={() => void resynchronizeActiveLesson("Урок синхронизирован с сервером.")}
        />
      );
    }

    const lessonPercent = Math.round(((currentIndex + 1) / items.length) * 100);
    const advanceDecision = decideLessonAdvance({
      currentIndex,
      itemCount: items.length,
      reviewPersisted: Boolean(currentRating),
      reviewSaving: reviewing,
      serverCompleted: serverLessonCompleted,
      serverNextIndex,
    });

    return (
      <ActiveLessonPresentation
        mode={studyMode}
        item={currentItem}
        currentIndex={currentIndex}
        itemCount={items.length}
        progressPercent={Math.min(100, Math.max(0, lessonPercent))}
        typedAnswer={typedAnswer}
        selectedAnswer={selectedAnswer}
        expectedAnswer={expectedAnswer}
        answerOptions={answerOptions}
        revealed={revealed}
        localCorrect={literalMatch}
        currentRating={currentRating}
        reviewing={reviewing}
        reviewFeedback={reviewFeedback}
        suggestionStatus={suggestionStatus}
        suggestionError={suggestionError}
        advance={advanceDecision}
        advanceButtonRef={lessonAdvanceRef}
        onTypedAnswerChange={setTypedAnswer}
        onReveal={() => setRevealed(true)}
        onChoice={(answer) => {
          setSelectedAnswer(answer);
          setRevealed(true);
        }}
        onRate={(rating, submittedAt, restoreFocusAfterSave) => {
          void rateCurrent(rating, submittedAt, restoreFocusAfterSave);
        }}
        onAdvance={nextItem}
        onExit={() => leaveLesson({ view: "home" }, "lesson_exit")}
        onSubmitSuggestion={() => void submitAnswerSuggestion()}
      />
    );
  }

  const focusMode = lessonStarted;
  const initial = session.user.displayName.trim().charAt(0).toUpperCase()
    || session.user.email.charAt(0).toUpperCase()
    || "L";

  return (
    <div
      className={`lx-app${focusMode ? " lx-lesson-focus-mode" : ""}`}
      data-route-client-island="active-lesson"
    >
      <a className="lx-skip-link" href="#lexigo-main-content">Перейти к основному содержимому</a>
      {!focusMode ? (
        <header className="lx-header">
          <RouteBrand />
          <RoutePrimaryNavigation variant="header" />
          <div className="lx-header-tools">
            {progress ? (
              <button className="lx-streak" type="button" onClick={() => navigate({ view: "progress" })}>
                <span aria-hidden="true">🔥</span>
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
      ) : null}

      <div className="lx-app-shell">
        {!focusMode ? <RoutePrimaryNavigation variant="rail" /> : null}
        <main
          id="lexigo-main-content"
          ref={mainContentRef}
          className="lx-main-content"
          tabIndex={-1}
          aria-label={viewTitle("lesson")}
        >
          {actionError ? (
            <AsyncStatePanel
              label="Ошибка текущего действия"
              kind="error"
              title="Действие не выполнено"
              message={actionError}
              compact
            />
          ) : null}
          {!focusMode ? (
            <div className="lx-resource-stack">
              <AsyncResourceNotice
                label="Прогресс"
                status={progressStatus}
                onRetry={() => void loadProgress(session)}
              />
              <AsyncResourceNotice
                label="Незавершённый урок"
                status={activeLessonStatus}
                onRetry={() => void loadActiveLesson(session)}
              />
            </div>
          ) : null}
          {lessonQueueNotice ? <p className="lx-queue-notice" role="status">{lessonQueueNotice}</p> : null}
          <div className="lx-view">{renderLesson()}</div>
        </main>
      </div>
      {!focusMode ? <RoutePrimaryNavigation variant="mobile" /> : null}
      {focusMode ? (
        <p
          className="lx-route-announcement"
          data-announcement-id="1"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          Урок. Экран загружен.
        </p>
      ) : null}
    </div>
  );
}
