#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
APP = ROOT / "frontend/components/lexigo-premium-app.tsx"
LAYOUT = ROOT / "frontend/app/layout.tsx"
PACKAGE = ROOT / "frontend/package.json"
NEXT_SPEC = ROOT / "frontend/e2e/next-lesson-progression.spec.ts"


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


def replace_regex(text: str, pattern: str, replacement: str, label: str) -> str:
    updated, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
    if count != 1:
        raise RuntimeError(f"{label}: expected one regex match, found {count}")
    return updated


app = APP.read_text()
app = replace_once(
    app,
    'import { decideLessonAdvance, resolveActiveLessonIndex, summarizePersistedLesson } from "../lib/lesson-flow";',
    '''import { decideLessonAdvance, resolveActiveLessonIndex } from "../lib/lesson-flow";
import {
  buildLessonResultSnapshot,
  claimDailyGoalCelebration,
  clearLessonResultSnapshot,
  isDistinctLessonResultCandidate,
  readLessonResultSnapshot,
  resolveLessonResultContinuation,
  writeLessonResultSnapshot,
  type LessonResultContinuation,
  type LessonResultJudgement,
  type LessonResultSnapshot,
} from "../lib/lesson-result";''',
    "lesson result imports",
)
app = replace_once(
    app,
    'import { ActiveLessonPresentation } from "./active-lesson-presentation";',
    '''import { ActiveLessonPresentation } from "./active-lesson-presentation";
import { LessonResultPresentation } from "./lesson-result-presentation";''',
    "lesson result component import",
)
app = replace_once(
    app,
    '''  catalogQuery?: CatalogBrowseQuery;
  journeyIntent?: ProductJourneyIntent;
};''',
    '''  catalogQuery?: CatalogBrowseQuery;
  journeyIntent?: ProductJourneyIntent;
  previousResult?: LessonResultSnapshot;
};''',
    "start overrides",
)
app = replace_once(
    app,
    '''  const [serverSkippedItems, setServerSkippedItems] = useState(0);
  const [busy, setBusy] = useState(false);''',
    '''  const [serverSkippedItems, setServerSkippedItems] = useState(0);
  const [lessonResult, setLessonResult] = useState<LessonResultSnapshot | null>(null);
  const [lessonResultContinuation, setLessonResultContinuation] = useState<LessonResultContinuation>({ kind: "checking" });
  const [lessonResultCelebrate, setLessonResultCelebrate] = useState(false);
  const [busy, setBusy] = useState(false);''',
    "result state",
)
app = replace_once(
    app,
    '''  const reviewInFlightRef = useRef(false);
  const lessonCreateInFlightRef = useRef(false);
  const mainContentRef = useRef<HTMLElement | null>(null);''',
    '''  const reviewInFlightRef = useRef(false);
  const lessonCreateInFlightRef = useRef(false);
  const lessonJudgementsRef = useRef<Record<string, LessonResultJudgement>>({});
  const lessonProgressBeforeRef = useRef<number | null>(null);
  const latestProgressRef = useRef<ProgressSummary | null>(null);
  const mainContentRef = useRef<HTMLElement | null>(null);''',
    "result refs",
)
app = replace_once(
    app,
    '''  const [routeAnnouncement, setRouteAnnouncement] = useState({ id: 0, message: "" });
  const lessonNavigationLocked = navigation.view === "lesson" && lessonStarted && !lessonComplete;''',
    '''  const [routeAnnouncement, setRouteAnnouncement] = useState({ id: 0, message: "" });
  const lessonFocusMode = navigation.view === "lesson" && lessonStarted;
  const lessonNavigationLocked = lessonFocusMode && !lessonComplete;''',
    "lesson focus mode",
)
app = replace_once(
    app,
    '''      setProgress(result.data);
      setProgressStatus(readyResourceStatus());''',
    '''      latestProgressRef.current = result.data;
      setProgress(result.data);
      setProgressStatus(readyResourceStatus());''',
    "progress resource ref",
)
app = replace_once(
    app,
    '''  const lessonSummary = summarizePersistedLesson(ratings, items.length);
  const successRate = objectiveSuccessRate(progress);''',
    '''  const successRate = objectiveSuccessRate(progress);''',
    "remove legacy result summary",
)
app = replace_regex(
    app,
    r'''  async function refreshProgress\(activeSession: Session\): Promise<Session> \{.*?\n  \}\n\n  function updateCatalogSort''',
    '''  async function refreshProgress(activeSession: Session): Promise<{ activeSession: Session; progress: ProgressSummary }> {
    setProgressStatus(loadingResourceStatus());
    try {
      const result = await authorizedRequest<ProgressSummary>(
        activeSession,
        `/api/v1/progress?timezoneOffsetMinutes=${timezoneOffsetMinutes()}`,
        {},
        isProgressSummaryPayload,
      );
      latestProgressRef.current = result.data;
      setSession(result.activeSession);
      setProgress(result.data);
      setProgressStatus(readyResourceStatus());
      return { activeSession: result.activeSession, progress: result.data };
    } catch (requestError) {
      setProgressStatus(failedResourceStatus(requestError, "прогресс"));
      throw requestError;
    }
  }

  function updateCatalogSort''',
    "refresh progress",
)
app = replace_regex(
    app,
    r'''  function applyLesson\(lesson: LessonSessionResponse\) \{.*?\n  \}\n\n  async function resynchronizeActiveLesson''',
    '''  function applyLesson(lesson: LessonSessionResponse) {
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
      setError("Сервер вернул некорректную позицию урока. Обновите страницу или начните новый блок.");
      return false;
    }
    const presentationMode = lesson.studyMode;
    if (session) {
      try {
        clearLessonResultSnapshot(window.sessionStorage, session.user.id);
      } catch {
        // A new active server lesson still replaces the transient result in memory.
      }
    }
    setLessonResult(null);
    setLessonResultContinuation({ kind: "checking" });
    setLessonResultCelebrate(false);
    lessonJudgementsRef.current = restoredJudgements;
    lessonProgressBeforeRef.current = latestProgressRef.current?.reviewsToday ?? null;
    setActiveLesson(lesson);
    setSource(lesson.source);
    setStudyMode(presentationMode);
    setLessonSize(lessonSizeFromAPI(lesson.lessonSize));
    setItems(lessonItems);
    setRatings(restoredRatings);
    setCurrentIndex(safeIndex);
    resetCardState(presentationMode, Boolean(lessonItems[safeIndex] && restoredRatings[lessonItems[safeIndex].id]));
    setLessonComplete(lessonItems.length === 0);
    setServerLessonCompleted(false);
    setServerNextIndex(null);
    setServerSkippedItems(0);
    setLessonStarted(true);
    return true;
  }

  async function resynchronizeActiveLesson''',
    "apply lesson",
)
app = replace_once(
    app,
    '''  useEffect(() => {
    document.title = `${viewTitle(navigation.view)} · LexiGo`;
  }, [navigation.view]);

  useEffect(() => {
    lessonNavigationLockRef.current = lessonNavigationLocked;
  }, [lessonNavigationLocked]);''',
    '''  useEffect(() => {
    document.title = `${viewTitle(navigation.view)} · LexiGo`;
  }, [navigation.view]);

  useEffect(() => {
    latestProgressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    if (
      !session
      || navigation.view !== "lesson"
      || lessonStarted
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

    const restoredSource = SOURCE_VALUES.includes(restored.source as LessonSource)
      ? restored.source as LessonSource
      : "mixed";
    setSource(restoredSource);
    setStudyMode(restored.studyMode);
    setLessonSize(lessonSizeFromAPI(restored.lessonSize));
    setLessonTopic(restored.topic);
    setItems([]);
    setRatings({});
    lessonJudgementsRef.current = {};
    lessonProgressBeforeRef.current = restored.reviewsBefore;
    setLessonResult(restored);
    setLessonResultContinuation(resolveLessonResultContinuation({ snapshot: restored, previewTotal: null }));
    setLessonResultCelebrate(false);
    setLessonStarted(true);
    setLessonComplete(true);
    setServerLessonCompleted(true);
    setServerNextIndex(null);
    setServerSkippedItems(restored.skipped);
    setError("");
  }, [activeLesson, activeLessonStatus.phase, lessonStarted, navigation.view, session]);

  useEffect(() => {
    if (!session || !lessonResult || !lessonComplete || navigation.view !== "lesson") return;
    const immediate = resolveLessonResultContinuation({ snapshot: lessonResult, previewTotal: null });
    if (immediate.kind !== "checking") {
      setLessonResultContinuation(immediate);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    setLessonResultContinuation({ kind: "checking" });
    void authorizedRequest<LessonPreviewResponse>(session, "/api/v1/lessons/preview", {
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
      setSession((current) => current?.tokens.accessToken === result.activeSession.tokens.accessToken
        ? current
        : result.activeSession);
      const sourceName = SOURCE_VALUES.includes(lessonResult.source as LessonSource)
        ? sourceLabel(lessonResult.source as LessonSource)
        : "Следующий учебный блок";
      setLessonResultContinuation(resolveLessonResultContinuation({
        snapshot: lessonResult,
        previewTotal: result.data.composition.total,
        nextTitle: sourceName,
        estimatedMinutes: Math.max(1, Math.round(result.data.composition.total / 2)),
      }));
    }).catch(() => {
      if (cancelled) return;
      setLessonResultContinuation(resolveLessonResultContinuation({ snapshot: lessonResult, previewTotal: 0 }));
    });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [lessonComplete, lessonResult, navigation.view, session]);

  useEffect(() => {
    lessonNavigationLockRef.current = lessonNavigationLocked;
  }, [lessonNavigationLocked]);''',
    "result restore and continuation effects",
)
app = replace_regex(
    app,
    r'''  async function startLesson\(activeSession = session, overrides: StartOverrides = \{\}\) \{.*?\n  \}\n  function clearAuthFieldError''',
    '''  async function startLesson(activeSession = session, overrides: StartOverrides = {}) {
    if (lessonCreateInFlightRef.current) return;
    const resolvedSource = overrides.source ?? source;
    const resolvedSize = overrides.size ?? lessonSize;
    const resolvedMode = overrides.mode ?? studyMode;
    const resolvedTopic = overrides.topic?.trim() ?? lessonTopic.trim();
    setSource(resolvedSource);
    setLessonSize(resolvedSize);
    setStudyMode(resolvedMode);
    setLessonTopic(resolvedTopic);

    if (resolvedMode !== "all" && !activeSession) {
      requestAuthentication(resolvedSource === "phrases" ? "phrases" : "learn");
      return;
    }
    if (resolvedSource !== "phrases" && !activeSession) {
      requestAuthentication("learn");
      return;
    }

    lessonCreateInFlightRef.current = true;
    setBusy(true);
    setError("");
    setLessonQueueNotice("");
    try {
      const currentSession = activeSession;
      if (resolvedMode !== "all") {
        const explicitItems = overrides.items?.filter((item) => typeof item.wordId === "number") ?? [];
        if (overrides.items && explicitItems.length !== overrides.items.length) {
          throw new Error("Выбранные элементы ещё не синхронизированы с сервером");
        }
        lessonProgressBeforeRef.current = latestProgressRef.current?.reviewsToday ?? null;
        const result = await authorizedRequest<LessonSessionResponse>(
          currentSession as Session,
          "/api/v1/lessons",
          {
            method: "POST",
            body: JSON.stringify({
              source: resolvedSource,
              studyMode: resolvedMode,
              lessonSize: String(resolvedSize),
              ...(resolvedTopic ? { topic: resolvedTopic } : {}),
              ...(overrides.items ? { wordIds: explicitItems.map((item) => item.wordId) } : {}),
            }),
          },
        );
        if (overrides.previousResult && !isDistinctLessonResultCandidate(overrides.previousResult, {
          id: result.data.id,
          itemIds: result.data.items.map((item) => item.id),
        })) {
          throw new Error("Следующий урок совпал с завершённым блоком. Обновите очередь и повторите попытку.");
        }
        try {
          clearLessonResultSnapshot(window.sessionStorage, result.activeSession.user.id);
        } catch {
          // The new active server lesson remains authoritative when storage is restricted.
        }
        setSession(result.activeSession);
        if (applyLesson(result.data)) {
          setLessonQueueNotice(mixedLessonFallbackMessage(result.data));
          navigate({ view: "lesson", source: resolvedSource }, false, { intent: overrides.journeyIntent ?? "lesson_start" });
        }
        return;
      }

      const browseQuery = overrides.catalogQuery ?? {};
      setAllItemsQuery(browseQuery);
      setAllItemsSearchInput(browseQuery.query ?? "");
      setAllItemsSearch(browseQuery.query ?? "");
      setAllItemsSortMode(browseQuery.sort ?? "default");
      await loadCatalogBrowsePage(currentSession, resolvedSource, 1, browseQuery);
      setActiveLesson(null);
      setCurrentIndex(0);
      setRatings({});
      resetCardState(resolvedMode);
      setLessonStarted(true);
      setLessonComplete(false);
      setServerLessonCompleted(false);
      setServerNextIndex(null);
      setServerSkippedItems(0);
      navigate({ view: "lesson", source: resolvedSource }, false, { intent: overrides.journeyIntent ?? "lesson_start" });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось сформировать учебный блок");
    } finally {
      lessonCreateInFlightRef.current = false;
      setBusy(false);
    }
  }
  function clearAuthFieldError''',
    "start lesson",
)
app = replace_regex(
    app,
    r'''  function clearLessonState\(\) \{.*?\n  \}\n\n  function saveAndExitLesson.*?\n  \}\n\n  function moveToServerIndex''',
    '''  function clearLessonState() {
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
    setServerSkippedItems(0);
    setLessonResult(null);
    setLessonResultContinuation({ kind: "checking" });
    setLessonResultCelebrate(false);
    setReviewFeedback(null);
    setSuggestionStatus("idle");
    setSuggestionError("");
    lessonJudgementsRef.current = {};
    lessonProgressBeforeRef.current = null;
    reviewInFlightRef.current = false;
    setError("");
    setLessonQueueNotice("");
  }

  function saveAndExitLesson(target: PrimaryNavigationView = "home") {
    clearLessonState();
    navigate({ view: target }, true, { allowLessonExit: true, intent: "lesson_exit" });
  }

  function moveToServerIndex''',
    "clear lesson state",
)
app = replace_regex(
    app,
    r'''  async function rateCurrent\(.*?\n  \}\n\n  async function submitAnswerSuggestion''',
    '''  async function rateCurrent(
    rating: ReviewRating,
    submittedAt: number,
    restoreFocusAfterSave = false,
  ) {
    if (!currentItem || currentRating || reviewInFlightRef.current) return;
    if (!session || !activeLesson || currentItem.wordId === undefined) {
      requestAuthentication("lesson");
      return;
    }
    reviewInFlightRef.current = true;
    setReviewing(true);
    setError("");
    setReviewFeedback(null);
    setSuggestionStatus("idle");
    setSuggestionError("");
    let reviewPersisted = false;
    try {
      const reviewMode: AnswerMode = studyMode === "all" ? "study" : studyMode;
      const path = `/api/v1/lessons/${activeLesson.id}/words/${currentItem.wordId}/review`;
      const result = await authorizedRequest<LessonReviewResponse>(session, path, {
        method: "POST",
        body: JSON.stringify({
          lessonVersion: activeLesson.version,
          rating,
          responseMs: Math.max(0, Math.round(submittedAt - cardStartedAt)),
          answerMode: reviewMode,
          answerRevealed: revealed || reviewMode === "study",
          ...(reviewMode === "study" ? {} : { submittedAnswer }),
          timezoneOffsetMinutes: timezoneOffsetMinutes(),
        }),
      });
      const nextRatings = { ...ratings, [currentItem.id]: rating };
      const nextJudgements = {
        ...lessonJudgementsRef.current,
        [currentItem.id]: {
          mode: reviewMode,
          correct: typeof result.data.correct === "boolean" ? result.data.correct : null,
        },
      } satisfies Record<string, LessonResultJudgement>;
      lessonJudgementsRef.current = nextJudgements;
      setSession(result.activeSession);
      setRatings(nextRatings);
      setReviewFeedback(result.data);
      reviewPersisted = true;
      setServerLessonCompleted(result.data.lessonCompleted);
      setServerNextIndex(result.data.lessonCompleted ? null : result.data.lessonCurrentIndex);
      setServerSkippedItems(result.data.lessonSkippedItems);
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
        const refreshed = await refreshProgress(result.activeSession);
        completionProgress = refreshed.progress;
      } catch {
        syncPending = true;
        setError("Оценка сохранена, но статистика обновится после следующей синхронизации.");
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
          dailyGoal: completionProgress?.dailyGoal ?? 0,
          reviewsBefore: lessonProgressBeforeRef.current,
          reviewsAfter: completionProgress?.reviewsToday ?? null,
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
    } catch (requestError) {
      if (requestError instanceof RequestFailure && (
        requestError.status === 409
        || requestError.code === "lesson_item_not_found"
        || requestError.code === "active_lesson_not_found"
      )) {
        await resynchronizeActiveLesson("Урок изменён на другом устройстве. Показана актуальная карточка.");
      } else {
        setError(requestError instanceof Error ? requestError.message : "Не удалось сохранить результат");
      }
    } finally {
      reviewInFlightRef.current = false;
      setReviewing(false);
      if (reviewPersisted && restoreFocusAfterSave) {
        window.requestAnimationFrame(() => lessonAdvanceRef.current?.focus({ preventScroll: true }));
      }
    }
  }

  async function submitAnswerSuggestion''',
    "rate current",
)
app = replace_once(
    app,
    '''    if (lessonNavigationLocked) return null;''',
    '''    if (lessonFocusMode) return null;''',
    "hide header in lesson focus mode",
)
app = replace_once(
    app,
    '''      await requestJSON<void>("/api/v1/auth/logout", { method: "POST" });
      setSession(null);''',
    '''      await requestJSON<void>("/api/v1/auth/logout", { method: "POST" });
      try {
        clearLessonResultSnapshot(window.sessionStorage, session.user.id);
      } catch {
        // Logout still clears in-memory state when storage is restricted.
      }
      setSession(null);''',
    "clear result on logout",
)
app = replace_once(
    app,
    '''  function renderLesson() {''',
    '''  function leaveLessonResult(target: "home" | "progress") {
    clearLessonState();
    navigate({ view: target }, true, { allowLessonExit: true, intent: "in_app_navigation" });
  }

  function startNextLessonFromResult() {
    if (!session || !lessonResult) return;
    const resultSource = SOURCE_VALUES.includes(lessonResult.source as LessonSource)
      ? lessonResult.source as LessonSource
      : "mixed";
    void startLesson(session, {
      source: resultSource,
      size: lessonSizeFromAPI(lessonResult.lessonSize),
      mode: lessonResult.studyMode,
      topic: lessonResult.topic,
      previousResult: lessonResult,
      journeyIntent: "lesson_start",
    });
  }

  function startDueReviewFromResult() {
    if (!session) return;
    void startLesson(session, {
      source: "mixed",
      size: 30,
      mode: "recall",
      journeyIntent: "lesson_start",
    });
  }

  function renderLesson() {''',
    "result navigation handlers",
)
app = replace_once(
    app,
    '''    if (studyMode === "all") return renderAllItems();
    if (lessonComplete) return <section className="lx-empty"><span>СЕССИЯ ЗАВЕРШЕНА</span><h1>{items.length ? "Результаты сохранены" : "Нет доступных элементов"}</h1><p>{items.length ? `Знал: ${lessonSummary.known}. Почти: ${lessonSummary.almost}. Не знал: ${lessonSummary.again}. Пропущено: ${Math.max(lessonSummary.skipped, serverSkippedItems)}.` : "Измените раздел или дождитесь следующего интервала."}</p><div className="lx-hero-actions"><button className="lx-button ghost" type="button" onClick={() => { clearLessonState(); navigate({ view: "progress" }); }}>К прогрессу</button><button className="lx-button primary" type="button" disabled={busy} onClick={() => startLesson()}>Следующий блок</button></div></section>;
    if (!currentItem) return <AsyncStatePanel''',
    '''    if (studyMode === "all") return renderAllItems();
    if (lessonComplete && lessonResult) return (
      <LessonResultPresentation
        snapshot={lessonResult}
        continuation={lessonResultContinuation}
        sourceLabel={SOURCE_VALUES.includes(lessonResult.source as LessonSource)
          ? sourceLabel(lessonResult.source as LessonSource)
          : "Учебный блок"}
        busy={busy}
        celebrate={lessonResultCelebrate}
        onHome={() => leaveLessonResult("home")}
        onProgress={() => leaveLessonResult("progress")}
        onNextLesson={startNextLessonFromResult}
        onDueReview={startDueReviewFromResult}
        onStay={() => setLessonQueueNotice("Результат сохранён и останется доступен на этом экране.")}
      />
    );
    if (lessonComplete) return <AsyncStatePanel label="Результат урока недоступен" kind="error" title="Не удалось восстановить итог" message="Ответы сохранены, но представление результата не сформировано. Откройте прогресс для проверки." actionLabel="Открыть прогресс" onAction={() => leaveLessonResult("progress")} />;
    if (!currentItem) return <AsyncStatePanel''',
    "render lesson result",
)
app = replace_once(
    app,
    '''    <div className={`lx-app${lessonNavigationLocked ? " lx-lesson-focus-mode" : ""}`}>''',
    '''    <div className={`lx-app${lessonFocusMode ? " lx-lesson-focus-mode" : ""}`}>''',
    "focus class",
)
app = app.replace('{!lessonNavigationLocked ? (\n          <PrimaryNavigation', '{!lessonFocusMode ? (\n          <PrimaryNavigation')
app = app.replace('{!lessonNavigationLocked ? (\n        <PrimaryNavigation', '{!lessonFocusMode ? (\n        <PrimaryNavigation')
if app.count('!lessonNavigationLocked ?') != 0:
    raise RuntimeError("navigation focus replacements incomplete")

APP.write_text(app)

layout = LAYOUT.read_text()
layout = replace_once(
    layout,
    'import "./active-lesson.css";',
    'import "./active-lesson.css";\nimport "./lesson-result.css";',
    "layout css import",
)
LAYOUT.write_text(layout)

package = PACKAGE.read_text()
package = replace_once(
    package,
    'e2e/active-lesson-figma.spec.ts e2e/lesson-flow.spec.ts e2e/next-lesson-progression.spec.ts',
    'e2e/active-lesson-figma.spec.ts e2e/lesson-result.spec.ts e2e/lesson-flow.spec.ts e2e/next-lesson-progression.spec.ts',
    "lesson script",
)
package = replace_once(
    package,
    'e2e/active-lesson-figma.spec.ts e2e/app-router-routes.spec.ts',
    'e2e/active-lesson-figma.spec.ts e2e/lesson-result.spec.ts e2e/app-router-routes.spec.ts',
    "ui script",
)
PACKAGE.write_text(package)

next_spec = NEXT_SPEC.read_text()
next_spec = replace_once(
    next_spec,
    'const next = page.getByRole("button", { name: "Следующий блок", exact: true });',
    'const next = page.getByRole("button", { name: "Следующий урок", exact: true });',
    "next lesson locator",
)
NEXT_SPEC.write_text(next_spec)

print("Lesson Result patch applied")
