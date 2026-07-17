from __future__ import annotations

import re
from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    file = Path(path)
    source = file.read_text()
    count = source.count(old)
    if count != 1:
        raise SystemExit(f"{path}: expected one exact target, found {count}: {old[:120]!r}")
    file.write_text(source.replace(old, new))


def replace_count(path: str, old: str, new: str, expected: int) -> None:
    file = Path(path)
    source = file.read_text()
    count = source.count(old)
    if count != expected:
        raise SystemExit(f"{path}: expected {expected} exact targets, found {count}: {old[:120]!r}")
    file.write_text(source.replace(old, new))


def regex_once(path: str, pattern: str, replacement: str, flags: int = 0) -> None:
    file = Path(path)
    source = file.read_text()
    updated, count = re.subn(pattern, replacement, source, count=1, flags=flags)
    if count != 1:
        raise SystemExit(f"{path}: expected one regex target, found {count}: {pattern[:120]!r}")
    file.write_text(updated)


# Backend: make the database lesson session authoritative for ordering and completion.
replace_once(
    "backend/internal/learning/lesson_repository.go",
    '''\tErrLessonItemNotFound        = errors.New("lesson item was not found")
\tErrLessonItemAlreadyReviewed = errors.New("lesson item was already reviewed")
''',
    '''\tErrLessonItemNotFound        = errors.New("lesson item was not found")
\tErrLessonItemAlreadyReviewed = errors.New("lesson item was already reviewed")
\tErrLessonItemOutOfOrder       = errors.New("lesson item is not the current item")
''',
)

replace_once(
    "backend/internal/learning/lesson_repository.go",
    '''\tvar lockedLessonID string
\tif err := tx.QueryRow(ctx, `
\t\tselect id::text
\t\tfrom lesson_sessions
\t\twhere id = $1::uuid and user_id = $2::uuid and status = 'active'
\t\tfor update
\t`, lessonID, userID).Scan(&lockedLessonID); err != nil {
''',
    '''\tvar lockedLessonID string
\tvar currentIndex int
\tif err := tx.QueryRow(ctx, `
\t\tselect id::text, current_index
\t\tfrom lesson_sessions
\t\twhere id = $1::uuid and user_id = $2::uuid and status = 'active'
\t\tfor update
\t`, lessonID, userID).Scan(&lockedLessonID, &currentIndex); err != nil {
''',
)

replace_once(
    "backend/internal/learning/lesson_repository.go",
    '''\tif existingRating != nil {
\t\treturn LessonReviewResult{}, ErrLessonItemAlreadyReviewed
\t}

\tvar state ReviewState
''',
    '''\tif existingRating != nil {
\t\treturn LessonReviewResult{}, ErrLessonItemAlreadyReviewed
\t}
\tif position != currentIndex {
\t\treturn LessonReviewResult{}, ErrLessonItemOutOfOrder
\t}

\tvar state ReviewState
''',
)

replace_once(
    "backend/internal/learning/lesson_repository.go",
    '''\tvar remaining, nextIndex int
\tif err := tx.QueryRow(ctx, `
\t\tselect count(*) filter (where rating is null)::int,
\t\t       coalesce(min(position) filter (where rating is null), 0)::int
\t\tfrom lesson_session_items
\t\twhere session_id = $1::uuid
\t`, lessonID).Scan(&remaining, &nextIndex); err != nil {
\t\treturn LessonReviewResult{}, fmt.Errorf("calculate lesson progress: %w", err)
\t}
\tcompleted := remaining == 0
''',
    '''\tvar remaining, nextIndex, totalItems int
\tif err := tx.QueryRow(ctx, `
\t\tselect count(*) filter (where rating is null)::int,
\t\t       coalesce(min(position) filter (where rating is null), 0)::int,
\t\t       count(*)::int
\t\tfrom lesson_session_items
\t\twhere session_id = $1::uuid
\t`, lessonID).Scan(&remaining, &nextIndex, &totalItems); err != nil {
\t\treturn LessonReviewResult{}, fmt.Errorf("calculate lesson progress: %w", err)
\t}
\tcompleted := remaining == 0
\treviewedItems := totalItems - remaining
\tif completed {
\t\tnextIndex = totalItems
\t}
''',
)

replace_once(
    "backend/internal/learning/lesson_repository.go",
    '''\t\tLessonID:           lockedLessonID,
\t\tLessonCurrentIndex: nextIndex,
\t\tLessonCompleted:    completed,
''',
    '''\t\tLessonID:            lockedLessonID,
\t\tLessonCurrentIndex:  nextIndex,
\t\tLessonCompleted:     completed,
\t\tLessonReviewedItems: reviewedItems,
\t\tLessonSkippedItems:  0,
\t\tLessonTotalItems:    totalItems,
''',
)

replace_once(
    "backend/internal/learning/lesson.go",
    '''type LessonReviewResult struct {
\tReviewResult
\tLessonID           string `json:"lessonId"`
\tLessonCurrentIndex int    `json:"lessonCurrentIndex"`
\tLessonCompleted    bool   `json:"lessonCompleted"`
}
''',
    '''type LessonReviewResult struct {
\tReviewResult
\tLessonID            string `json:"lessonId"`
\tLessonCurrentIndex  int    `json:"lessonCurrentIndex"`
\tLessonCompleted     bool   `json:"lessonCompleted"`
\tLessonReviewedItems int    `json:"lessonReviewedItems"`
\tLessonSkippedItems  int    `json:"lessonSkippedItems"`
\tLessonTotalItems    int    `json:"lessonTotalItems"`
}
''',
)

replace_once(
    "backend/internal/learning/lesson_http.go",
    '''\t\tcase errors.Is(err, ErrLessonItemAlreadyReviewed):
\t\t\thttpx.WriteError(w, http.StatusConflict, "lesson_item_already_reviewed", "lesson item was already reviewed")
\t\tcase errors.Is(err, ErrWordNotFound):
''',
    '''\t\tcase errors.Is(err, ErrLessonItemAlreadyReviewed):
\t\t\thttpx.WriteError(w, http.StatusConflict, "lesson_item_already_reviewed", "lesson item was already reviewed")
\t\tcase errors.Is(err, ErrLessonItemOutOfOrder):
\t\t\thttpx.WriteError(w, http.StatusConflict, "lesson_item_out_of_order", "review the current lesson item before moving forward")
\t\tcase errors.Is(err, ErrWordNotFound):
''',
)

# Frontend: one legal transition per card, backed by the persisted server result.
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    'import { csrfTokenFromCookie, refreshSession, type Session } from "../lib/auth-session";\n',
    'import { csrfTokenFromCookie, refreshSession, type Session } from "../lib/auth-session";\nimport { decideLessonAdvance, summarizePersistedLesson } from "../lib/lesson-flow";\n',
)

replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '''type LessonReviewResponse = {
  lessonId: string;
  lessonCurrentIndex: number;
  lessonCompleted: boolean;
};
''',
    '''type LessonReviewResponse = {
  lessonId: string;
  lessonCurrentIndex: number;
  lessonCompleted: boolean;
  lessonReviewedItems: number;
  lessonSkippedItems: number;
  lessonTotalItems: number;
};
''',
)

replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '''  const [lessonStarted, setLessonStarted] = useState(false);
  const [lessonComplete, setLessonComplete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState("");
  const cardStartedAt = useRef(Date.now());
''',
    '''  const [lessonStarted, setLessonStarted] = useState(false);
  const [lessonComplete, setLessonComplete] = useState(false);
  const [serverLessonCompleted, setServerLessonCompleted] = useState(false);
  const [serverNextIndex, setServerNextIndex] = useState<number | null>(null);
  const [serverSkippedItems, setServerSkippedItems] = useState(0);
  const [busy, setBusy] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState("");
  const cardStartedAt = useRef(Date.now());
  const reviewInFlightRef = useRef(false);
''',
)

replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '''  const ratingValues = Object.values(ratings);
  const knownCount = ratingValues.filter((rating) => rating === "known").length;
  const almostCount = ratingValues.filter((rating) => rating === "almost").length;
  const againCount = ratingValues.filter((rating) => rating === "again").length;
''',
    '''  const ratingValues = Object.values(ratings);
  const lessonSummary = summarizePersistedLesson(ratings, items.length);
''',
)

replace_count(
    "frontend/components/lexigo-premium-app.tsx",
    '''    setLessonComplete(lessonItems.length === 0);
''',
    '''    setLessonComplete(lessonItems.length === 0);
    setServerLessonCompleted(false);
    setServerNextIndex(null);
    setServerSkippedItems(0);
''',
    2,
)

replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '''    setLessonStarted(false);
    setLessonComplete(false);
    setError("");
''',
    '''    setLessonStarted(false);
    setLessonComplete(false);
    setServerLessonCompleted(false);
    setServerNextIndex(null);
    setServerSkippedItems(0);
    reviewInFlightRef.current = false;
    setError("");
''',
)

replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '''  function moveToIndex(index: number) {
    const target = items[index];
    setCurrentIndex(index);
    resetCardState(studyMode, Boolean(target && ratings[target.id]));
  }
''',
    '''  function moveToIndex(index: number) {
    const target = items[index];
    setCurrentIndex(index);
    setServerNextIndex(null);
    resetCardState(studyMode, Boolean(target && ratings[target.id]));
  }
''',
)

regex_once(
    "frontend/components/lexigo-premium-app.tsx",
    r'''  function previousItem\(\) \{.*?\n  \}\n\n  function nextItem\(\) \{.*?\n  \}\n\n  async function rateCurrent''',
    '''  function previousItem() {
    if (currentIndex === 0 || reviewing) return;
    moveToIndex(currentIndex - 1);
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
      setError(decision.reason === "completion_not_confirmed"
        ? "Сервер ещё не подтвердил завершение урока. Повторите попытку."
        : "Сначала сохраните оценку текущей карточки.");
      return;
    }
    setError("");
    if (decision.kind === "results") {
      setLessonComplete(true);
      return;
    }
    moveToIndex(decision.nextIndex);
  }

  async function rateCurrent''',
    re.DOTALL,
)

replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '''  async function rateCurrent(rating: ReviewRating) {
    if (!currentItem || currentRating) return;
''',
    '''  async function rateCurrent(rating: ReviewRating) {
    if (!currentItem || currentRating || reviewInFlightRef.current) return;
''',
)

replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '''    setReviewing(true);
    setError("");
''',
    '''    reviewInFlightRef.current = true;
    setReviewing(true);
    setError("");
''',
)

replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '''      setSession(result.activeSession);
      setRatings((current) => ({ ...current, [currentItem.id]: rating }));
      if (activeLesson) {
        if (result.data.lessonCompleted) {
          clearPresentationMode(activeLesson.id);
          setActiveLesson(null);
        } else {
          setActiveLesson((current) => current ? { ...current, currentIndex: result.data.lessonCurrentIndex } : current);
        }
      }
      await refreshProgress(result.activeSession);
      nextItem();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось сохранить результат");
    } finally {
      setReviewing(false);
    }
''',
    '''      setSession(result.activeSession);
      setRatings((current) => ({ ...current, [currentItem.id]: rating }));
      setServerLessonCompleted(result.data.lessonCompleted);
      setServerNextIndex(result.data.lessonCompleted ? null : result.data.lessonCurrentIndex);
      setServerSkippedItems(result.data.lessonSkippedItems);
      if (activeLesson) {
        if (result.data.lessonCompleted) {
          clearPresentationMode(activeLesson.id);
          setActiveLesson(null);
        } else {
          setActiveLesson((current) => current ? { ...current, currentIndex: result.data.lessonCurrentIndex } : current);
        }
      }
      try {
        await refreshProgress(result.activeSession);
      } catch {
        setError("Оценка сохранена, но статистика обновится после следующей синхронизации.");
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось сохранить результат");
    } finally {
      reviewInFlightRef.current = false;
      setReviewing(false);
    }
''',
)

regex_once(
    "frontend/components/lexigo-premium-app.tsx",
    r'''    if \(lessonComplete\) return <section className="lx-empty">.*?</section>;''',
    '''    if (lessonComplete) return <section className="lx-empty"><span>СЕССИЯ ЗАВЕРШЕНА</span><h1>{items.length ? "Результаты сохранены" : "Нет доступных элементов"}</h1><p>{items.length ? `Знал: ${lessonSummary.known}. Почти: ${lessonSummary.almost}. Не знал: ${lessonSummary.again}. Пропущено: ${Math.max(lessonSummary.skipped, serverSkippedItems)}.` : "Измените раздел или дождитесь следующего интервала."}</p><div className="lx-hero-actions"><button className="lx-button ghost" type="button" onClick={() => { clearLessonState(); navigate({ view: "progress" }); }}>К прогрессу</button><button className="lx-button primary" type="button" disabled={busy} onClick={() => startLesson()}>Следующий блок</button></div></section>;''',
)

replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '''    const relatedItems = items.filter((item) => item.id !== currentItem.id).slice(currentIndex, currentIndex + 3);
''',
    '''    const relatedItems = items.filter((item) => item.id !== currentItem.id && Boolean(ratings[item.id])).slice(0, 3);
    const advanceDecision = decideLessonAdvance({
      currentIndex,
      itemCount: items.length,
      reviewPersisted: Boolean(currentRating),
      reviewSaving: reviewing,
      serverCompleted: serverLessonCompleted,
      serverNextIndex,
    });
''',
)

replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '''            <div className="lx-lesson-navigation"><button className="lx-button ghost" type="button" onClick={previousItem}>← Предыдущее</button><button className="lx-button primary wide" type="button" onClick={nextItem}>{currentIndex + 1 === items.length ? "К результатам" : "Следующее"} <Icon name="arrow"/></button><button className="lx-button ghost" type="button" onClick={saveAndExitLesson}>♡ Сохранить</button></div>

            {(simpleStudy || revealed) ? currentRating ? <div className="lx-rating-row"><span>Оценка сохранена: {ratingLabel(currentRating)}</span><button className="lx-button primary" type="button" onClick={nextItem}>Дальше</button></div> : <div className="lx-rating-row"><span>Насколько уверенно вы знаете элемент?</span><div><button className="again" type="button" disabled={reviewing} onClick={() => rateCurrent("again")}>Не знал</button><button className="almost" type="button" disabled={reviewing} onClick={() => rateCurrent("almost")}>Почти</button><button className="known" type="button" disabled={reviewing} onClick={() => rateCurrent("known")}>{reviewing ? "Сохраняем…" : "Знал"}</button></div></div> : null}
''',
    '''            <div className="lx-lesson-navigation"><button className="lx-button ghost" type="button" disabled={reviewing || currentIndex === 0} onClick={previousItem}>← Предыдущее</button><button className="lx-button primary wide" type="button" disabled={!advanceDecision.canAdvance} onClick={nextItem}>{advanceDecision.label} <Icon name="arrow"/></button></div>

            {(simpleStudy || revealed) ? currentRating ? <div className="lx-rating-row" role="status"><span>Оценка сохранена: {ratingLabel(currentRating)}. Используйте единственную кнопку перехода выше.</span></div> : <div className="lx-rating-row" aria-busy={reviewing}><span>Насколько уверенно вы знаете элемент?</span><div><button className="again" type="button" disabled={reviewing} onClick={() => rateCurrent("again")}>Не знал</button><button className="almost" type="button" disabled={reviewing} onClick={() => rateCurrent("almost")}>Почти</button><button className="known" type="button" disabled={reviewing} onClick={() => rateCurrent("known")}>{reviewing ? "Сохраняем…" : "Знал"}</button></div></div> : null}
''',
)

replace_once(
    "frontend/app/premium-ui.css",
    ".lx-lesson-navigation { display: flex; gap: 10px; border-top: 1px solid var(--lx-border); padding: 0 16px 16px; }\n",
    ".lx-lesson-navigation { display: grid; grid-template-columns: minmax(140px, auto) minmax(220px, 1fr); gap: 10px; border-top: 1px solid var(--lx-border); padding: 0 16px 16px; }\n.lx-lesson-navigation button:disabled, .lx-rating-row button:disabled { cursor: not-allowed; opacity: .48; }\n",
)
