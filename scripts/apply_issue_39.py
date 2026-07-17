from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")


def replace_once(path: str, old: str, new: str) -> None:
    target = ROOT / path
    source = target.read_text(encoding="utf-8")
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one exact match, found {count}")
    target.write_text(source.replace(old, new), encoding="utf-8")


def regex_once(path: str, pattern: str, replacement: str) -> None:
    target = ROOT / path
    source = target.read_text(encoding="utf-8")
    updated, count = re.subn(pattern, replacement, source, count=1, flags=re.S)
    if count != 1:
        raise RuntimeError(f"{path}: expected one regex match, found {count}: {pattern}")
    target.write_text(updated, encoding="utf-8")


write("backend/internal/learning/lesson.go", '''package learning

import "time"

type LessonCreateRequest struct {
\tSource     string     `json:"source"`
\tStudyMode  AnswerMode `json:"studyMode"`
\tLessonSize string     `json:"lessonSize"`
\tWordIDs    []int64    `json:"wordIds"`
}

type LessonReviewRequest struct {
\tReviewRequest
\tLessonVersion int64 `json:"lessonVersion"`
}

type LessonItem struct {
\tPosition     int        `json:"position"`
\tWordID       int64      `json:"id"`
\tKind         string     `json:"kind"`
\tSlug         string     `json:"slug,omitempty"`
\tLemma        string     `json:"lemma"`
\tTranslation  string     `json:"translation"`
\tPhonetic     string     `json:"phonetic"`
\tPartOfSpeech string     `json:"partOfSpeech"`
\tTopic        string     `json:"topic"`
\tExamples     []string   `json:"examples"`
\tNote         string     `json:"note"`
\tCloze        string     `json:"cloze,omitempty"`
\tClozeAnswer  string     `json:"clozeAnswer,omitempty"`
\tStatus       string     `json:"status"`
\tRating       *Rating    `json:"rating,omitempty"`
\tReviewedAt   *time.Time `json:"reviewedAt,omitempty"`
}

type LessonSession struct {
\tID           string       `json:"id"`
\tSource       string       `json:"source"`
\tStudyMode    AnswerMode   `json:"studyMode"`
\tLessonSize   string       `json:"lessonSize"`
\tCurrentIndex int          `json:"currentIndex"`
\tVersion      int64        `json:"version"`
\tStatus       string       `json:"status"`
\tItems        []LessonItem `json:"items"`
\tCreatedAt    time.Time    `json:"createdAt"`
\tUpdatedAt    time.Time    `json:"updatedAt"`
}

type LessonReviewResult struct {
\tReviewResult
\tLessonID            string `json:"lessonId"`
\tLessonCurrentIndex  int    `json:"lessonCurrentIndex"`
\tLessonVersion       int64  `json:"lessonVersion"`
\tLessonCompleted     bool   `json:"lessonCompleted"`
\tLessonReviewedItems int    `json:"lessonReviewedItems"`
\tLessonSkippedItems  int    `json:"lessonSkippedItems"`
\tLessonTotalItems    int    `json:"lessonTotalItems"`
}
''')

write("backend/internal/learning/lesson_repository.go", '''package learning

import (
\t"context"
\t"encoding/json"
\t"errors"
\t"fmt"
\t"time"

\t"github.com/jackc/pgx/v5"
)

var (
\tErrNoActiveLesson            = errors.New("active lesson was not found")
\tErrInvalidLessonWords        = errors.New("lesson contains words not assigned to the user")
\tErrLessonItemNotFound        = errors.New("lesson item was not found")
\tErrLessonItemAlreadyReviewed = errors.New("lesson item was already reviewed")
\tErrLessonItemOutOfOrder      = errors.New("lesson item is not the current item")
\tErrLessonModeMismatch        = errors.New("lesson answer mode does not match session")
\tErrLessonVersionConflict     = errors.New("lesson version conflict")
\tErrInvalidLessonState        = errors.New("lesson state is inconsistent")
)

func (r *Repository) CreateLesson(
\tctx context.Context,
\tuserID string,
\trequest LessonCreateRequest,
) (LessonSession, error) {
\ttx, err := r.pool.Begin(ctx)
\tif err != nil {
\t\treturn LessonSession{}, fmt.Errorf("begin lesson transaction: %w", err)
\t}
\tdefer func() { _ = tx.Rollback(ctx) }()

\tvar assigned int
\tif err := tx.QueryRow(ctx, `
\t\tselect count(*)::int
\t\tfrom user_words
\t\twhere user_id = $1::uuid and word_id = any($2::bigint[])
\t`, userID, request.WordIDs).Scan(&assigned); err != nil {
\t\treturn LessonSession{}, fmt.Errorf("validate lesson words: %w", err)
\t}
\tif assigned != len(request.WordIDs) {
\t\treturn LessonSession{}, ErrInvalidLessonWords
\t}

\tif _, err := tx.Exec(ctx, `
\t\tupdate lesson_sessions
\t\tset status = 'discarded', version = version + 1, updated_at = now()
\t\twhere user_id = $1::uuid and status = 'active'
\t`, userID); err != nil {
\t\treturn LessonSession{}, fmt.Errorf("discard previous lesson: %w", err)
\t}

\tvar lessonID string
\tif err := tx.QueryRow(ctx, `
\t\tinsert into lesson_sessions(user_id, source, study_mode, lesson_size)
\t\tvalues ($1::uuid, $2, $3, $4)
\t\treturning id::text
\t`, userID, request.Source, request.StudyMode, request.LessonSize).Scan(&lessonID); err != nil {
\t\treturn LessonSession{}, fmt.Errorf("insert lesson: %w", err)
\t}

\tif _, err := tx.Exec(ctx, `
\t\tinsert into lesson_session_items(session_id, position, word_id)
\t\tselect $1::uuid, (ordinality - 1)::int, word_id
\t\tfrom unnest($2::bigint[]) with ordinality as selected(word_id, ordinality)
\t`, lessonID, request.WordIDs); err != nil {
\t\treturn LessonSession{}, fmt.Errorf("insert lesson items: %w", err)
\t}

\tif err := tx.Commit(ctx); err != nil {
\t\treturn LessonSession{}, fmt.Errorf("commit lesson transaction: %w", err)
\t}
\treturn r.lessonByID(ctx, userID, lessonID, "active")
}

func (r *Repository) ActiveLesson(ctx context.Context, userID string) (LessonSession, error) {
\tvar lessonID string
\tif err := r.pool.QueryRow(ctx, `
\t\tselect id::text
\t\tfrom lesson_sessions
\t\twhere user_id = $1::uuid and status = 'active'
\t\torder by updated_at desc
\t\tlimit 1
\t`, userID).Scan(&lessonID); err != nil {
\t\tif errors.Is(err, pgx.ErrNoRows) {
\t\t\treturn LessonSession{}, ErrNoActiveLesson
\t\t}
\t\treturn LessonSession{}, fmt.Errorf("query active lesson: %w", err)
\t}
\treturn r.lessonByID(ctx, userID, lessonID, "active")
}

func (r *Repository) DiscardLesson(ctx context.Context, userID, lessonID string, expectedVersion int64) error {
\ttx, err := r.pool.Begin(ctx)
\tif err != nil {
\t\treturn fmt.Errorf("begin discard lesson transaction: %w", err)
\t}
\tdefer func() { _ = tx.Rollback(ctx) }()

\tvar version int64
\tif err := tx.QueryRow(ctx, `
\t\tselect version
\t\tfrom lesson_sessions
\t\twhere id = $1::uuid and user_id = $2::uuid and status = 'active'
\t\tfor update
\t`, lessonID, userID).Scan(&version); err != nil {
\t\tif errors.Is(err, pgx.ErrNoRows) {
\t\t\treturn ErrNoActiveLesson
\t\t}
\t\treturn fmt.Errorf("lock lesson for discard: %w", err)
\t}
\tif version != expectedVersion {
\t\treturn ErrLessonVersionConflict
\t}

\tif _, err := tx.Exec(ctx, `
\t\tupdate lesson_sessions
\t\tset status = 'discarded', version = version + 1, updated_at = now()
\t\twhere id = $1::uuid and user_id = $2::uuid and status = 'active' and version = $3
\t`, lessonID, userID, expectedVersion); err != nil {
\t\treturn fmt.Errorf("discard lesson: %w", err)
\t}
\tif err := tx.Commit(ctx); err != nil {
\t\treturn fmt.Errorf("commit discard lesson: %w", err)
\t}
\treturn nil
}

func (r *Repository) ReviewLessonWord(
\tctx context.Context,
\tuserID string,
\tlessonID string,
\twordID int64,
\trequest LessonReviewRequest,
) (LessonReviewResult, error) {
\ttx, err := r.pool.Begin(ctx)
\tif err != nil {
\t\treturn LessonReviewResult{}, fmt.Errorf("begin lesson review transaction: %w", err)
\t}
\tdefer func() { _ = tx.Rollback(ctx) }()

\tvar lockedLessonID string
\tvar currentIndex int
\tvar lessonMode AnswerMode
\tvar version int64
\tif err := tx.QueryRow(ctx, `
\t\tselect id::text, current_index, study_mode, version
\t\tfrom lesson_sessions
\t\twhere id = $1::uuid and user_id = $2::uuid and status = 'active'
\t\tfor update
\t`, lessonID, userID).Scan(&lockedLessonID, &currentIndex, &lessonMode, &version); err != nil {
\t\tif errors.Is(err, pgx.ErrNoRows) {
\t\t\treturn LessonReviewResult{}, ErrLessonItemNotFound
\t\t}
\t\treturn LessonReviewResult{}, fmt.Errorf("lock lesson: %w", err)
\t}
\tif version != request.LessonVersion {
\t\treturn LessonReviewResult{}, ErrLessonVersionConflict
\t}
\tif lessonMode != request.AnswerMode {
\t\treturn LessonReviewResult{}, ErrLessonModeMismatch
\t}

\tvar position int
\tvar existingRating *string
\tif err := tx.QueryRow(ctx, `
\t\tselect position, rating
\t\tfrom lesson_session_items
\t\twhere session_id = $1::uuid and word_id = $2
\t\tfor update
\t`, lessonID, wordID).Scan(&position, &existingRating); err != nil {
\t\tif errors.Is(err, pgx.ErrNoRows) {
\t\t\treturn LessonReviewResult{}, ErrLessonItemNotFound
\t\t}
\t\treturn LessonReviewResult{}, fmt.Errorf("lock lesson item: %w", err)
\t}
\tif existingRating != nil {
\t\treturn LessonReviewResult{}, ErrLessonItemAlreadyReviewed
\t}
\tif position != currentIndex {
\t\treturn LessonReviewResult{}, ErrLessonItemOutOfOrder
\t}

\tvar state ReviewState
\tif err := tx.QueryRow(ctx, `
\t\tselect status, easiness::float8, interval_days, repetitions, due_at
\t\tfrom user_words
\t\twhere user_id = $1::uuid and word_id = $2
\t\tfor update
\t`, userID, wordID).Scan(&state.Status, &state.Easiness, &state.IntervalDays, &state.Repetitions, &state.DueAt); err != nil {
\t\tif errors.Is(err, pgx.ErrNoRows) {
\t\t\treturn LessonReviewResult{}, ErrWordNotFound
\t\t}
\t\treturn LessonReviewResult{}, fmt.Errorf("lock user word: %w", err)
\t}

\tschedule, err := ScheduleAttempt(state, request.Rating, request.AnswerMode)
\tif err != nil {
\t\treturn LessonReviewResult{}, err
\t}
\tnow := time.Now().UTC()
\tdueAt := state.DueAt
\tif !schedule.PreserveDue {
\t\tdueAt = now.Add(schedule.DueAfter)
\t}

\tif _, err := tx.Exec(ctx, `
\t\tupdate user_words
\t\tset status = $3,
\t\t    easiness = $4,
\t\t    interval_days = $5,
\t\t    repetitions = $6,
\t\t    due_at = $7,
\t\t    last_reviewed_at = $8,
\t\t    updated_at = $8
\t\twhere user_id = $1::uuid and word_id = $2
\t`, userID, wordID, schedule.Status, schedule.Easiness, schedule.IntervalDays, schedule.Repetitions, dueAt, now); err != nil {
\t\treturn LessonReviewResult{}, fmt.Errorf("update user word: %w", err)
\t}

\tif _, err := tx.Exec(ctx, `
\t\tinsert into review_events(
\t\t\tuser_id, word_id, grade, response_ms, reviewed_at, rating, answer_mode, correct,
\t\t\tanswer_revealed, event_schema_version
\t\t) values ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, 2)
\t`, userID, wordID, schedule.Grade, request.ResponseMS, now, request.Rating, request.AnswerMode, request.Correct, request.AnswerRevealed); err != nil {
\t\treturn LessonReviewResult{}, fmt.Errorf("insert review event: %w", err)
\t}

\tif _, err := tx.Exec(ctx, `
\t\tupdate lesson_session_items
\t\tset rating = $3, reviewed_at = $4
\t\twhere session_id = $1::uuid and word_id = $2
\t`, lessonID, wordID, request.Rating, now); err != nil {
\t\treturn LessonReviewResult{}, fmt.Errorf("update lesson item: %w", err)
\t}

\tvar remaining, nextIndex, totalItems int
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

\tvar nextVersion int64
\tif err := tx.QueryRow(ctx, `
\t\tupdate lesson_sessions
\t\tset current_index = $3,
\t\t    version = version + 1,
\t\t    status = case when $4 then 'completed' else 'active' end,
\t\t    completed_at = case when $4 then $5::timestamptz else null::timestamptz end,
\t\t    updated_at = $5::timestamptz
\t\twhere id = $1::uuid and user_id = $2::uuid and version = $6
\t\treturning version
\t`, lessonID, userID, nextIndex, completed, now, request.LessonVersion).Scan(&nextVersion); err != nil {
\t\tif errors.Is(err, pgx.ErrNoRows) {
\t\t\treturn LessonReviewResult{}, ErrLessonVersionConflict
\t\t}
\t\treturn LessonReviewResult{}, fmt.Errorf("update lesson progress: %w", err)
\t}

\tif err := tx.Commit(ctx); err != nil {
\t\treturn LessonReviewResult{}, fmt.Errorf("commit lesson review transaction: %w", err)
\t}

\treturn LessonReviewResult{
\t\tReviewResult: ReviewResult{
\t\t\tWordID:         wordID,
\t\t\tStatus:         schedule.Status,
\t\t\tEasiness:       schedule.Easiness,
\t\t\tIntervalDays:   schedule.IntervalDays,
\t\t\tRepetitions:    schedule.Repetitions,
\t\t\tDueAt:          dueAt,
\t\t\tLastReviewedAt: now,
\t\t},
\t\tLessonID:            lockedLessonID,
\t\tLessonCurrentIndex:  nextIndex,
\t\tLessonVersion:       nextVersion,
\t\tLessonCompleted:     completed,
\t\tLessonReviewedItems: reviewedItems,
\t\tLessonSkippedItems:  0,
\t\tLessonTotalItems:    totalItems,
\t}, nil
}

func (r *Repository) lessonByID(
\tctx context.Context,
\tuserID string,
\tlessonID string,
\trequiredStatus string,
) (LessonSession, error) {
\ttx, err := r.pool.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.RepeatableRead, AccessMode: pgx.ReadOnly})
\tif err != nil {
\t\treturn LessonSession{}, fmt.Errorf("begin lesson snapshot: %w", err)
\t}
\tdefer func() { _ = tx.Rollback(ctx) }()

\tvar lesson LessonSession
\tif err := tx.QueryRow(ctx, `
\t\tselect id::text, source, study_mode, lesson_size, current_index, version, status, created_at, updated_at
\t\tfrom lesson_sessions
\t\twhere id = $1::uuid
\t\t  and user_id = $2::uuid
\t\t  and ($3 = '' or status = $3)
\t`, lessonID, userID, requiredStatus).Scan(
\t\t&lesson.ID,
\t\t&lesson.Source,
\t\t&lesson.StudyMode,
\t\t&lesson.LessonSize,
\t\t&lesson.CurrentIndex,
\t\t&lesson.Version,
\t\t&lesson.Status,
\t\t&lesson.CreatedAt,
\t\t&lesson.UpdatedAt,
\t); err != nil {
\t\tif errors.Is(err, pgx.ErrNoRows) {
\t\t\treturn LessonSession{}, ErrNoActiveLesson
\t\t}
\t\treturn LessonSession{}, fmt.Errorf("query lesson: %w", err)
\t}

\trows, err := tx.Query(ctx, `
\t\tselect item.position,
\t\t       word.id,
\t\t       word.lemma,
\t\t       word.translation,
\t\t       word.phonetic,
\t\t       word.part_of_speech,
\t\t       word.topic,
\t\t       word.examples,
\t\t       word.note,
\t\t       user_word.status,
\t\t       item.rating,
\t\t       item.reviewed_at
\t\tfrom lesson_session_items item
\t\tjoin words word on word.id = item.word_id
\t\tjoin user_words user_word
\t\t  on user_word.word_id = item.word_id and user_word.user_id = $2::uuid
\t\twhere item.session_id = $1::uuid
\t\torder by item.position
\t`, lessonID, userID)
\tif err != nil {
\t\treturn LessonSession{}, fmt.Errorf("query lesson items: %w", err)
\t}
\tdefer rows.Close()

\tlesson.Items = make([]LessonItem, 0)
\tfor rows.Next() {
\t\tvar item LessonItem
\t\tvar examples []byte
\t\tvar rating *string
\t\tif err := rows.Scan(
\t\t\t&item.Position,
\t\t\t&item.WordID,
\t\t\t&item.Lemma,
\t\t\t&item.Translation,
\t\t\t&item.Phonetic,
\t\t\t&item.PartOfSpeech,
\t\t\t&item.Topic,
\t\t\t&examples,
\t\t\t&item.Note,
\t\t\t&item.Status,
\t\t\t&rating,
\t\t\t&item.ReviewedAt,
\t\t); err != nil {
\t\t\treturn LessonSession{}, fmt.Errorf("scan lesson item: %w", err)
\t\t}
\t\tif err := json.Unmarshal(examples, &item.Examples); err != nil {
\t\t\treturn LessonSession{}, fmt.Errorf("decode lesson examples: %w", err)
\t\t}
\t\tif rating != nil {
\t\t\tparsed := Rating(*rating)
\t\t\titem.Rating = &parsed
\t\t}
\t\titem.Kind = "word"
\t\tif item.PartOfSpeech == "phrase" {
\t\t\titem.Kind = "phrase"
\t\t\titem.Slug = item.Lemma
\t\t}
\t\tlesson.Items = append(lesson.Items, item)
\t}
\tif err := rows.Err(); err != nil {
\t\treturn LessonSession{}, fmt.Errorf("iterate lesson items: %w", err)
\t}

\tif lesson.Status == "active" {
\t\tif lesson.CurrentIndex < 0 || lesson.CurrentIndex >= len(lesson.Items) || lesson.Items[lesson.CurrentIndex].Rating != nil {
\t\t\treturn LessonSession{}, ErrInvalidLessonState
\t\t}
\t}
\tif lesson.Status == "completed" && lesson.CurrentIndex != len(lesson.Items) {
\t\treturn LessonSession{}, ErrInvalidLessonState
\t}

\tif err := tx.Commit(ctx); err != nil {
\t\treturn LessonSession{}, fmt.Errorf("commit lesson snapshot: %w", err)
\t}
\treturn lesson, nil
}
''')

write("backend/internal/learning/lesson_http.go", '''package learning

import (
\t"errors"
\t"log/slog"
\t"net/http"
\t"strconv"
\t"strings"

\t"github.com/Dja-tiger/New-project/backend/internal/httpx"
\t"github.com/jackc/pgx/v5/pgtype"
)

func (h *Handler) CreateLesson(w http.ResponseWriter, r *http.Request) {
\tuserID, ok := httpx.UserID(r.Context())
\tif !ok {
\t\thttpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
\t\treturn
\t}

\tvar request LessonCreateRequest
\tif err := httpx.DecodeJSON(w, r, &request); err != nil {
\t\thttpx.WriteError(w, http.StatusBadRequest, "invalid_json", "invalid JSON request")
\t\treturn
\t}
\tif !validLessonSource(request.Source) {
\t\thttpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_source", "source must be a supported vocabulary or phrase collection")
\t\treturn
\t}
\tif !validAnswerMode(request.StudyMode) {
\t\thttpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_study_mode", "studyMode must be study, recall or choice")
\t\treturn
\t}
\tif !validLessonSize(request.LessonSize) {
\t\thttpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_lesson_size", "lessonSize must be 15, 30, 60 or all")
\t\treturn
\t}
\tif len(request.WordIDs) == 0 || len(request.WordIDs) > 1000 || !uniquePositiveWordIDs(request.WordIDs) {
\t\thttpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_word_ids", "wordIds must contain between 1 and 1000 unique positive ids")
\t\treturn
\t}

\tlesson, err := h.repository.CreateLesson(r.Context(), userID, request)
\tif err != nil {
\t\tif errors.Is(err, ErrInvalidLessonWords) {
\t\t\thttpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_lesson_words", "all lesson items must be assigned to the current user")
\t\t\treturn
\t\t}
\t\tslog.ErrorContext(r.Context(), "create lesson failed", "user_id", userID, "error", err)
\t\thttpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
\t\treturn
\t}
\thttpx.WriteJSON(w, http.StatusCreated, lesson)
}

func (h *Handler) ActiveLesson(w http.ResponseWriter, r *http.Request) {
\tuserID, ok := httpx.UserID(r.Context())
\tif !ok {
\t\thttpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
\t\treturn
\t}
\tlesson, err := h.repository.ActiveLesson(r.Context(), userID)
\tif err != nil {
\t\tif errors.Is(err, ErrNoActiveLesson) {
\t\t\thttpx.WriteError(w, http.StatusNotFound, "active_lesson_not_found", "there is no active lesson")
\t\t\treturn
\t\t}
\t\tslog.ErrorContext(r.Context(), "load active lesson failed", "user_id", userID, "error", err)
\t\thttpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
\t\treturn
\t}
\thttpx.WriteJSON(w, http.StatusOK, lesson)
}

func (h *Handler) DiscardLesson(w http.ResponseWriter, r *http.Request) {
\tuserID, ok := httpx.UserID(r.Context())
\tif !ok {
\t\thttpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
\t\treturn
\t}
\tlessonID := r.PathValue("lessonID")
\tif !validUUID(lessonID) {
\t\thttpx.WriteError(w, http.StatusBadRequest, "invalid_lesson_id", "lesson id must be a UUID")
\t\treturn
\t}
\texpectedVersion, code := lessonVersionFromIfMatch(r.Header.Get("If-Match"))
\tif code != "" {
\t\tstatus := http.StatusUnprocessableEntity
\t\tmessage := "If-Match must contain a positive lesson version"
\t\tif code == "lesson_version_required" {
\t\t\tstatus = http.StatusPreconditionRequired
\t\t\tmessage = "If-Match lesson version is required"
\t\t}
\t\thttpx.WriteError(w, status, code, message)
\t\treturn
\t}
\tif err := h.repository.DiscardLesson(r.Context(), userID, lessonID, expectedVersion); err != nil {
\t\tswitch {
\t\tcase errors.Is(err, ErrNoActiveLesson):
\t\t\thttpx.WriteError(w, http.StatusNotFound, "active_lesson_not_found", "active lesson was not found")
\t\tcase errors.Is(err, ErrLessonVersionConflict):
\t\t\thttpx.WriteError(w, http.StatusConflict, "lesson_version_conflict", "lesson changed on another device; reload the active lesson")
\t\tdefault:
\t\t\tslog.ErrorContext(r.Context(), "discard lesson failed", "user_id", userID, "lesson_id", lessonID, "error", err)
\t\t\thttpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
\t\t}
\t\treturn
\t}
\tw.WriteHeader(http.StatusNoContent)
}

func (h *Handler) ReviewLessonWord(w http.ResponseWriter, r *http.Request) {
\tuserID, ok := httpx.UserID(r.Context())
\tif !ok {
\t\thttpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
\t\treturn
\t}
\tlessonID := r.PathValue("lessonID")
\tif !validUUID(lessonID) {
\t\thttpx.WriteError(w, http.StatusBadRequest, "invalid_lesson_id", "lesson id must be a UUID")
\t\treturn
\t}
\twordID, err := strconv.ParseInt(r.PathValue("wordID"), 10, 64)
\tif err != nil || wordID <= 0 {
\t\thttpx.WriteError(w, http.StatusBadRequest, "invalid_word_id", "learning item id must be a positive integer")
\t\treturn
\t}

\tvar request LessonReviewRequest
\tif err := httpx.DecodeJSON(w, r, &request); err != nil {
\t\thttpx.WriteError(w, http.StatusBadRequest, "invalid_json", "invalid JSON request")
\t\treturn
\t}
\tif request.LessonVersion <= 0 {
\t\thttpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_lesson_version", "lessonVersion must be a positive integer")
\t\treturn
\t}
\tif !validRating(request.Rating) {
\t\thttpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_rating", "rating must be again, almost or known")
\t\treturn
\t}
\tif request.ResponseMS != nil && (*request.ResponseMS < 0 || *request.ResponseMS > 3_600_000) {
\t\thttpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_response_ms", "responseMs must be between 0 and 3600000")
\t\treturn
\t}
\tif code, message := normalizeAndValidateReviewRequest(&request.ReviewRequest); code != "" {
\t\thttpx.WriteError(w, http.StatusUnprocessableEntity, code, message)
\t\treturn
\t}

\tresult, err := h.repository.ReviewLessonWord(r.Context(), userID, lessonID, wordID, request)
\tif err != nil {
\t\tswitch {
\t\tcase errors.Is(err, ErrLessonVersionConflict):
\t\t\thttpx.WriteError(w, http.StatusConflict, "lesson_version_conflict", "lesson changed on another device; reload the active lesson")
\t\tcase errors.Is(err, ErrLessonItemNotFound):
\t\t\thttpx.WriteError(w, http.StatusNotFound, "lesson_item_not_found", "learning item is not part of the active lesson")
\t\tcase errors.Is(err, ErrLessonItemAlreadyReviewed):
\t\t\thttpx.WriteError(w, http.StatusConflict, "lesson_item_already_reviewed", "lesson item was already reviewed")
\t\tcase errors.Is(err, ErrLessonItemOutOfOrder):
\t\t\thttpx.WriteError(w, http.StatusConflict, "lesson_item_out_of_order", "review the current lesson item before moving forward")
\t\tcase errors.Is(err, ErrLessonModeMismatch):
\t\t\thttpx.WriteError(w, http.StatusConflict, "lesson_mode_mismatch", "answerMode must match the active lesson studyMode")
\t\tcase errors.Is(err, ErrWordNotFound):
\t\t\thttpx.WriteError(w, http.StatusNotFound, "word_not_found", "learning item is not assigned to the current user")
\t\tcase errors.Is(err, ErrInvalidRating):
\t\t\thttpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_rating", "rating must be again, almost or known")
\t\tdefault:
\t\t\tslog.ErrorContext(r.Context(), "review lesson item failed", "user_id", userID, "lesson_id", lessonID, "word_id", wordID, "error", err)
\t\t\thttpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
\t\t}
\t\treturn
\t}
\thttpx.WriteJSON(w, http.StatusOK, result)
}

func lessonVersionFromIfMatch(value string) (int64, string) {
\tvalue = strings.TrimSpace(value)
\tif value == "" {
\t\treturn 0, "lesson_version_required"
\t}
\tvalue = strings.TrimSpace(strings.TrimPrefix(value, "W/"))
\tvalue = strings.Trim(value, "\"")
\tversion, err := strconv.ParseInt(value, 10, 64)
\tif err != nil || version <= 0 {
\t\treturn 0, "invalid_lesson_version"
\t}
\treturn version, ""
}

func validLessonSource(value string) bool {
\tswitch value {
\tcase "mixed", "noun", "verb", "adjective", "phrases", "daily-life", "travel", "data-engineering", "backend":
\t\treturn true
\tdefault:
\t\treturn false
\t}
}

func validLessonSize(value string) bool {
\treturn value == "15" || value == "30" || value == "60" || value == "all"
}

func uniquePositiveWordIDs(values []int64) bool {
\tseen := make(map[int64]struct{}, len(values))
\tfor _, value := range values {
\t\tif value <= 0 {
\t\t\treturn false
\t\t}
\t\tif _, exists := seen[value]; exists {
\t\t\treturn false
\t\t}
\t\tseen[value] = struct{}{}
\t}
\treturn true
}

func validUUID(value string) bool {
\tvar parsed pgtype.UUID
\treturn parsed.Scan(value) == nil && parsed.Valid
}
''')

write("frontend/lib/lesson-flow.ts", '''import type { ReviewRating } from "./progress";

export type LessonAdvanceDecision =
  | {
      kind: "blocked";
      canAdvance: false;
      label: string;
      reason:
        | "saving"
        | "review_required"
        | "completion_not_confirmed"
        | "server_position_missing"
        | "server_position_invalid";
    }
  | {
      kind: "next";
      canAdvance: true;
      label: "Дальше";
      nextIndex: number;
    }
  | {
      kind: "results";
      canAdvance: true;
      label: "К результатам";
    };

export type LessonAdvanceInput = {
  currentIndex: number;
  itemCount: number;
  reviewPersisted: boolean;
  reviewSaving: boolean;
  serverCompleted: boolean;
  serverNextIndex?: number | null;
};

export type LessonResultSummary = {
  known: number;
  almost: number;
  again: number;
  reviewed: number;
  skipped: number;
};

export function resolveActiveLessonIndex(
  currentIndex: number,
  itemCount: number,
  currentItemReviewed: boolean,
): number | null {
  if (!Number.isInteger(currentIndex) || currentIndex < 0 || currentIndex >= itemCount) return null;
  if (currentItemReviewed) return null;
  return currentIndex;
}

/**
 * Determines the only legal transition for an active persisted lesson. The
 * browser never invents the next index: the backend must return exactly the
 * next sequential position after a committed review.
 */
export function decideLessonAdvance(input: LessonAdvanceInput): LessonAdvanceDecision {
  if (input.reviewSaving) {
    return { kind: "blocked", canAdvance: false, label: "Сохраняем оценку…", reason: "saving" };
  }
  if (!input.reviewPersisted) {
    return { kind: "blocked", canAdvance: false, label: "Сначала сохраните оценку", reason: "review_required" };
  }

  const lastIndex = Math.max(0, input.itemCount - 1);
  if (input.currentIndex >= lastIndex) {
    if (!input.serverCompleted) {
      return { kind: "blocked", canAdvance: false, label: "Проверяем завершение…", reason: "completion_not_confirmed" };
    }
    return { kind: "results", canAdvance: true, label: "К результатам" };
  }

  if (input.serverNextIndex === null || input.serverNextIndex === undefined) {
    return { kind: "blocked", canAdvance: false, label: "Синхронизируем позицию…", reason: "server_position_missing" };
  }
  if (
    !Number.isInteger(input.serverNextIndex)
    || input.serverNextIndex !== input.currentIndex + 1
    || input.serverNextIndex < 0
    || input.serverNextIndex >= input.itemCount
  ) {
    return { kind: "blocked", canAdvance: false, label: "Обновите урок", reason: "server_position_invalid" };
  }
  return { kind: "next", canAdvance: true, label: "Дальше", nextIndex: input.serverNextIndex };
}

export function summarizePersistedLesson(
  ratings: Record<string, ReviewRating>,
  itemCount: number,
): LessonResultSummary {
  const values = Object.values(ratings);
  const known = values.filter((rating) => rating === "known").length;
  const almost = values.filter((rating) => rating === "almost").length;
  const again = values.filter((rating) => rating === "again").length;
  const reviewed = known + almost + again;

  return {
    known,
    almost,
    again,
    reviewed,
    skipped: Math.max(0, itemCount - reviewed),
  };
}
''')

write("frontend/lib/lesson-flow.test.ts", '''import { describe, expect, it } from "vitest";

import { decideLessonAdvance, resolveActiveLessonIndex, summarizePersistedLesson } from "./lesson-flow";

describe("lesson completion state machine", () => {
  it.each(["study", "recall", "choice"])(
    "blocks forward navigation before a persisted review in %s mode",
    () => {
      expect(decideLessonAdvance({
        currentIndex: 0,
        itemCount: 2,
        reviewPersisted: false,
        reviewSaving: false,
        serverCompleted: false,
      })).toMatchObject({ kind: "blocked", reason: "review_required", canAdvance: false });
    },
  );

  it("blocks repeat navigation while the review request is in flight", () => {
    expect(decideLessonAdvance({
      currentIndex: 0,
      itemCount: 2,
      reviewPersisted: false,
      reviewSaving: true,
      serverCompleted: false,
    })).toMatchObject({ kind: "blocked", reason: "saving", canAdvance: false });
  });

  it("requires the exact server next index", () => {
    expect(decideLessonAdvance({
      currentIndex: 0,
      itemCount: 3,
      reviewPersisted: true,
      reviewSaving: false,
      serverCompleted: false,
      serverNextIndex: 1,
    })).toEqual({ kind: "next", canAdvance: true, label: "Дальше", nextIndex: 1 });
  });

  it.each([undefined, null])("blocks when the server position is %s", (serverNextIndex) => {
    expect(decideLessonAdvance({
      currentIndex: 0,
      itemCount: 3,
      reviewPersisted: true,
      reviewSaving: false,
      serverCompleted: false,
      serverNextIndex,
    })).toMatchObject({ kind: "blocked", reason: "server_position_missing" });
  });

  it.each([-1, 0, 2, 99, 1.5])("rejects unsafe server index %s", (serverNextIndex) => {
    expect(decideLessonAdvance({
      currentIndex: 0,
      itemCount: 3,
      reviewPersisted: true,
      reviewSaving: false,
      serverCompleted: false,
      serverNextIndex,
    })).toMatchObject({ kind: "blocked", reason: "server_position_invalid" });
  });

  it("does not infer completion from the local last index", () => {
    expect(decideLessonAdvance({
      currentIndex: 1,
      itemCount: 2,
      reviewPersisted: true,
      reviewSaving: false,
      serverCompleted: false,
    })).toMatchObject({ kind: "blocked", reason: "completion_not_confirmed", canAdvance: false });
  });

  it("opens results only after the backend confirms the last review", () => {
    expect(decideLessonAdvance({
      currentIndex: 1,
      itemCount: 2,
      reviewPersisted: true,
      reviewSaving: false,
      serverCompleted: true,
    })).toEqual({ kind: "results", canAdvance: true, label: "К результатам" });
  });

  it.each([-1, 2, 1.5])("rejects invalid active lesson index %s", (index) => {
    expect(resolveActiveLessonIndex(index, 2, false)).toBeNull();
  });

  it("rejects a server position that already has a rating", () => {
    expect(resolveActiveLessonIndex(1, 3, true)).toBeNull();
  });

  it("accepts the current unrated server position", () => {
    expect(resolveActiveLessonIndex(1, 3, false)).toBe(1);
  });

  it("reports only persisted ratings and exposes divergence as skipped", () => {
    expect(summarizePersistedLesson({ first: "known", second: "almost", third: "again" }, 4)).toEqual({
      known: 1,
      almost: 1,
      again: 1,
      reviewed: 3,
      skipped: 1,
    });
  });
});
''')

premium = "frontend/components/lexigo-premium-app.tsx"
replace_once(
    premium,
    'import { decideLessonAdvance, summarizePersistedLesson } from "../lib/lesson-flow";',
    'import { decideLessonAdvance, resolveActiveLessonIndex, summarizePersistedLesson } from "../lib/lesson-flow";',
)
replace_once(
    premium,
    '''type LessonSessionResponse = {
  id: string;
  source: LessonSource;
  studyMode: AnswerMode;
  lessonSize: string;
  currentIndex: number;
  status: "active" | "completed" | "discarded";''',
    '''type LessonSessionResponse = {
  id: string;
  source: LessonSource;
  studyMode: AnswerMode;
  lessonSize: string;
  currentIndex: number;
  version: number;
  status: "active" | "completed" | "discarded";''',
)
replace_once(
    premium,
    '''  lessonCurrentIndex: number;
  lessonCompleted: boolean;''',
    '''  lessonCurrentIndex: number;
  lessonVersion: number;
  lessonCompleted: boolean;''',
)
replace_once(
    premium,
    '''type ErrorResponse = {
  error?: { message?: string };
};''',
    '''type ErrorResponse = {
  error?: { code?: string; message?: string };
};''',
)
replace_once(
    premium,
    '''class APIError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}''',
    '''class APIError extends Error {
  constructor(readonly status: number, readonly code: string, message: string) {
    super(message);
  }
}''',
)
replace_once(
    premium,
    '''    let message = `Request failed with status ${response.status}`;
    try {
      const payload = (await response.json()) as ErrorResponse;
      message = payload.error?.message ?? message;
    } catch {
      // Keep the HTTP status when the upstream response is not JSON.
    }
    throw new APIError(response.status, localizeAPIMessage(message));''',
    '''    let code = "request_failed";
    let message = `Request failed with status ${response.status}`;
    try {
      const payload = (await response.json()) as ErrorResponse;
      code = payload.error?.code ?? code;
      message = payload.error?.message ?? message;
    } catch {
      // Keep the HTTP status when the upstream response is not JSON.
    }
    throw new APIError(response.status, code, localizeAPIMessage(message));''',
)
replace_once(
    premium,
    '''    const safeIndex = Math.min(Math.max(lesson.currentIndex, 0), Math.max(lessonItems.length - 1, 0));
    const presentationMode = lesson.studyMode;''',
    '''    const candidate = lessonItems[lesson.currentIndex];
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
    const presentationMode = lesson.studyMode;''',
)
replace_once(
    premium,
    '''    setLessonStarted(true);
  }

  async function resumeLesson() {''',
    '''    setLessonStarted(true);
    return true;
  }

  async function resynchronizeActiveLesson(message: string) {
    if (!session) return;
    try {
      const result = await authorizedRequest<LessonSessionResponse>(session, "/api/v1/lessons/active");
      setSession(result.activeSession);
      if (applyLesson(result.data)) {
        navigate({ view: "lesson", source: result.data.source }, true);
        setError(message);
      } else {
        navigate({ view: "learn" }, true);
      }
    } catch (requestError) {
      if (requestError instanceof APIError && requestError.status === 404) {
        setActiveLesson(null);
        clearLessonState();
        navigate({ view: "learn" }, true);
        setError("Активный урок уже завершён или сброшен на другом устройстве.");
        return;
      }
      setError(requestError instanceof Error ? requestError.message : "Не удалось синхронизировать урок");
    }
  }

  async function resumeLesson() {''',
)
replace_once(
    premium,
    '''      applyLesson(result.data);
      navigate({ view: "lesson", source: result.data.source });''',
    '''      if (applyLesson(result.data)) navigate({ view: "lesson", source: result.data.source });
      else navigate({ view: "learn" }, true);''',
)
replace_once(
    premium,
    '''      const result = await authorizedRequest<void>(session, `/api/v1/lessons/${activeLesson.id}`, { method: "DELETE" });''',
    '''      const result = await authorizedRequest<void>(session, `/api/v1/lessons/${activeLesson.id}`, {
        method: "DELETE",
        headers: { "If-Match": `"${activeLesson.version}"` },
      });''',
)
replace_once(
    premium,
    '''    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось сбросить урок");
    } finally {
      setBusy(false);
    }
  }

  function resolveSelectedPhrases''',
    '''    } catch (requestError) {
      if (requestError instanceof APIError && requestError.status === 409) {
        await resynchronizeActiveLesson("Урок изменён на другом устройстве. Показана актуальная позиция.");
      } else {
        setError(requestError instanceof Error ? requestError.message : "Не удалось сбросить урок");
      }
    } finally {
      setBusy(false);
    }
  }

  function resolveSelectedPhrases''',
)
replace_once(
    premium,
    '''  function moveToIndex(index: number) {
    const target = items[index];
    setCurrentIndex(index);
    setServerNextIndex(null);
    resetCardState(studyMode, Boolean(target && ratings[target.id]));
  }

  function previousItem() {
    if (currentIndex === 0 || reviewing) return;
    moveToIndex(currentIndex - 1);
  }''',
    '''  function moveToServerIndex(index: number) {
    if (!Number.isInteger(index) || index < 0 || index >= items.length || !items[index]) {
      setError("Сервер вернул недопустимую позицию урока. Выполнена повторная синхронизация.");
      void resynchronizeActiveLesson("Урок синхронизирован с сервером.");
      return;
    }
    const target = items[index];
    setCurrentIndex(index);
    setServerNextIndex(null);
    resetCardState(studyMode, Boolean(ratings[target.id]));
  }''',
)
replace_once(premium, '    moveToIndex(decision.nextIndex);', '    moveToServerIndex(decision.nextIndex);')
replace_once(
    premium,
    '''          rating,
          responseMs:''',
    '''          lessonVersion: activeLesson?.version,
          rating,
          responseMs:''',
)
replace_once(
    premium,
    '''      setServerLessonCompleted(result.data.lessonCompleted);
      setServerNextIndex(result.data.lessonCompleted ? null : result.data.lessonCurrentIndex);''',
    '''      setServerLessonCompleted(result.data.lessonCompleted);
      setServerNextIndex(result.data.lessonCompleted ? null : result.data.lessonCurrentIndex);''',
)
replace_once(
    premium,
    '''        } else {
          setActiveLesson((current) => current ? { ...current, currentIndex: result.data.lessonCurrentIndex } : current);
        }''',
    '''        } else {
          setActiveLesson((current) => current ? {
            ...current,
            currentIndex: result.data.lessonCurrentIndex,
            version: result.data.lessonVersion,
            items: current.items.map((item) => item.id === currentItem.wordId
              ? { ...item, rating, reviewedAt: result.data.lastReviewedAt }
              : item),
          } : current);
        }''',
)
replace_once(
    premium,
    '''    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось сохранить результат");
    } finally {''',
    '''    } catch (requestError) {
      if (requestError instanceof APIError && (
        requestError.status === 409
        || requestError.code === "lesson_item_not_found"
        || requestError.code === "active_lesson_not_found"
      )) {
        await resynchronizeActiveLesson("Урок изменён на другом устройстве. Показана актуальная карточка.");
      } else {
        setError(requestError instanceof Error ? requestError.message : "Не удалось сохранить результат");
      }
    } finally {''',
)
replace_once(
    premium,
    '''            <div className="lx-lesson-navigation"><button className="lx-button ghost" type="button" disabled={reviewing || currentIndex === 0} onClick={previousItem}>← Предыдущее</button><button className="lx-button primary wide" type="button" disabled={!advanceDecision.canAdvance} onClick={nextItem}>{advanceDecision.label} <Icon name="arrow"/></button></div>''',
    '''            <div className="lx-lesson-navigation"><button className="lx-button ghost" type="button" disabled title="Активный урок проходит в серверном порядке">← Предыдущее недоступно</button><button className="lx-button primary wide" type="button" disabled={!advanceDecision.canAdvance} onClick={nextItem}>{advanceDecision.label} <Icon name="arrow"/></button></div>''',
)
replace_once(
    premium,
    '''            {relatedItems.length ? <section className="lx-related"><div><span>Похожие и следующие элементы</span></div><div>{relatedItems.map((item) => <button key={item.id} type="button" onClick={() => moveToIndex(items.findIndex((candidate) => candidate.id === item.id))}><strong>{item.prompt}</strong><small>{item.answer}</small><Icon name="arrow" size={15}/></button>)}</div></section> : null}''',
    '''            {relatedItems.length ? <section className="lx-related"><div><span>Уже оценённые элементы</span><small>Просмотр доступен после завершения урока</small></div><div>{relatedItems.map((item) => <article key={item.id} aria-label={`${item.prompt}: уже оценено`}><strong>{item.prompt}</strong><small>{item.answer}</small><span>Сохранено</span></article>)}</div></section> : null}''',
)

# Existing active-lesson error construction now requires an API code argument.
source = (ROOT / premium).read_text(encoding="utf-8")
if 'new APIError(' in source:
    raise RuntimeError("unexpected direct APIError construction remains")
if 'moveToIndex(' in source or 'previousItem' in source:
    raise RuntimeError("legacy random-access navigation remains")
(ROOT / premium).write_text(source, encoding="utf-8")

write("backend/integration/lesson_resume_test.go", '''//go:build integration

package integration

import (
\t"bytes"
\t"context"
\t"encoding/json"
\t"fmt"
\t"io"
\t"log/slog"
\t"net/http"
\t"net/http/httptest"
\t"sort"
\t"sync"
\t"testing"
\t"time"

\t"github.com/Dja-tiger/New-project/backend/internal/catalog"
\t"github.com/Dja-tiger/New-project/backend/internal/config"
\t"github.com/Dja-tiger/New-project/backend/internal/platform/migrate"
\tpostgresplatform "github.com/Dja-tiger/New-project/backend/internal/platform/postgres"
\tredisplatform "github.com/Dja-tiger/New-project/backend/internal/platform/redis"
\t"github.com/Dja-tiger/New-project/backend/internal/server"
)

type lessonProgressPayload struct {
\tLessonCurrentIndex  int   `json:"lessonCurrentIndex"`
\tLessonVersion       int64 `json:"lessonVersion"`
\tLessonCompleted     bool  `json:"lessonCompleted"`
\tLessonReviewedItems int   `json:"lessonReviewedItems"`
\tLessonSkippedItems  int   `json:"lessonSkippedItems"`
\tLessonTotalItems    int   `json:"lessonTotalItems"`
}

type lessonHTTPResult struct {
\tstatus int
\tbody   []byte
\terr    error
}

func TestResumeAndCompleteLessonWithOptimisticConcurrency(t *testing.T) {
\tctx, cancel := context.WithTimeout(context.Background(), 40*time.Second)
\tdefer cancel()

\tpg, err := postgresplatform.Open(ctx, requiredEnv(t, "TEST_POSTGRES_DSN"))
\tif err != nil { t.Fatal(err) }
\tdefer pg.Close()
\tif err := migrate.Up(ctx, pg); err != nil { t.Fatalf("migrate.Up() error = %v", err) }
\tif _, err := pg.Exec(ctx, "truncate table lesson_session_items, lesson_sessions, review_events, user_learning_preferences, user_words, refresh_tokens, words, users restart identity cascade"); err != nil {
\t\tt.Fatalf("truncate test data: %v", err)
\t}
\tif _, err := catalog.Seed(ctx, pg); err != nil { t.Fatalf("catalog.Seed() error = %v", err) }

\trdb, err := redisplatform.Open(ctx, config.Redis{Addr: requiredEnv(t, "TEST_REDIS_ADDR")})
\tif err != nil { t.Fatal(err) }
\tdefer rdb.Close()
\tif err := rdb.FlushDB(ctx).Err(); err != nil { t.Fatalf("flush redis: %v", err) }

\tcfg := config.Config{
\t\tAppEnv: "test", HTTPAddr: ":0", LogLevel: "error", CORSAllowedOrigin: "http://test.local",
\t\tPostgresDSN: requiredEnv(t, "TEST_POSTGRES_DSN"), Redis: config.Redis{Addr: requiredEnv(t, "TEST_REDIS_ADDR")},
\t\tJWTSecret: "integration-test-secret-with-at-least-32-bytes", AccessTokenTTL: 15 * time.Minute, RefreshTokenTTL: 24 * time.Hour,
\t}
\tapp, err := server.New(cfg, slog.New(slog.NewTextHandler(io.Discard, nil)), pg, rdb)
\tif err != nil { t.Fatalf("server.New() error = %v", err) }
\ttestServer := httptest.NewServer(app.Handler())
\tdefer testServer.Close()

\tregistered := postJSON[integrationAuthResponse](t, testServer.URL+"/api/v1/auth/register", map[string]string{
\t\t"email": fmt.Sprintf("resume-%d@example.com", time.Now().UnixNano()), "password": "strong-password", "displayName": "Learner",
\t}, http.StatusCreated)

\tvar due struct { Items []struct { ID int64 `json:"id"` } `json:"items"` }
\tgetAuthenticatedJSON(t, testServer.URL+"/api/v1/words/due?limit=3", registered.Tokens.AccessToken, http.StatusOK, &due)
\tif len(due.Items) != 3 { t.Fatalf("due items = %d, want 3", len(due.Items)) }
\twordIDs := []int64{due.Items[0].ID, due.Items[1].ID, due.Items[2].ID}

\ttype lessonItem struct { ID int64 `json:"id"`; Rating *string `json:"rating"` }
\ttype lessonPayload struct {
\t\tID string `json:"id"`; CurrentIndex int `json:"currentIndex"`; Version int64 `json:"version"`; Status string `json:"status"`; Items []lessonItem `json:"items"`
\t}

\tvar created lessonPayload
\tpostAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons", registered.Tokens.AccessToken, map[string]any{
\t\t"source": "mixed", "studyMode": "recall", "lessonSize": "15", "wordIds": wordIDs,
\t}, http.StatusCreated, &created)
\tif created.ID == "" || created.CurrentIndex != 0 || created.Version != 1 || created.Status != "active" || len(created.Items) != 3 {
\t\tt.Fatalf("unexpected created lesson: %+v", created)
\t}

\tvar resumed lessonPayload
\tgetAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons/active", registered.Tokens.AccessToken, http.StatusOK, &resumed)
\tif resumed.ID != created.ID || resumed.CurrentIndex != 0 || resumed.Version != 1 { t.Fatalf("unexpected resumed lesson: %+v", resumed) }

\tpostAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/lessons/%s/words/%d/review", testServer.URL, created.ID, wordIDs[1]), registered.Tokens.AccessToken, lessonReviewPayload("known", 1), http.StatusConflict, nil)
\tpostAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/lessons/%s/words/%d/review", testServer.URL, created.ID, wordIDs[0]), registered.Tokens.AccessToken, lessonReviewPayload("known", 0), http.StatusUnprocessableEntity, nil)

\tendpoint := fmt.Sprintf("%s/api/v1/lessons/%s/words/%d/review", testServer.URL, created.ID, wordIDs[0])
\tstart := make(chan struct{})
\tresults := make(chan lessonHTTPResult, 2)
\tvar wg sync.WaitGroup
\tfor range 2 {
\t\twg.Add(1)
\t\tgo func() {
\t\t\tdefer wg.Done()
\t\t\t<-start
\t\t\tresults <- sendLessonReview(endpoint, registered.Tokens.AccessToken, lessonReviewPayload("known", 1))
\t\t}()
\t}
\tclose(start)
\twg.Wait()
\tclose(results)

\tstatuses := make([]int, 0, 2)
\tvar first lessonProgressPayload
\tvar conflictCode string
\tfor result := range results {
\t\tif result.err != nil { t.Fatalf("concurrent review: %v", result.err) }
\t\tstatuses = append(statuses, result.status)
\t\tif result.status == http.StatusOK {
\t\t\tif err := json.Unmarshal(result.body, &first); err != nil { t.Fatalf("decode review: %v; body=%s", err, result.body) }
\t\t} else {
\t\t\tvar payload struct { Error struct { Code string `json:"code"` } `json:"error"` }
\t\t\tif err := json.Unmarshal(result.body, &payload); err != nil { t.Fatalf("decode conflict: %v; body=%s", err, result.body) }
\t\t\tconflictCode = payload.Error.Code
\t\t}
\t}
\tsort.Ints(statuses)
\tif len(statuses) != 2 || statuses[0] != http.StatusOK || statuses[1] != http.StatusConflict || conflictCode != "lesson_version_conflict" {
\t\tt.Fatalf("concurrent statuses=%v conflict=%q", statuses, conflictCode)
\t}
\tassertLessonProgress(t, first, 1, 3, 2, false)

\tgetAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons/active", registered.Tokens.AccessToken, http.StatusOK, &resumed)
\tif resumed.CurrentIndex != 1 || resumed.Version != 2 || resumed.Items[0].Rating == nil { t.Fatalf("resume after first review: %+v", resumed) }

\tsecondURL := fmt.Sprintf("%s/api/v1/lessons/%s/words/%d/review", testServer.URL, created.ID, wordIDs[1])
\tpostAuthenticatedJSON(t, secondURL, registered.Tokens.AccessToken, lessonReviewPayload("almost", 1), http.StatusConflict, nil)
\tvar second lessonProgressPayload
\tpostAuthenticatedJSON(t, secondURL, registered.Tokens.AccessToken, lessonReviewPayload("almost", 2), http.StatusOK, &second)
\tassertLessonProgress(t, second, 2, 3, 3, false)

\tpostAuthenticatedJSON(t, endpoint, registered.Tokens.AccessToken, lessonReviewPayload("known", 3), http.StatusConflict, nil)

\tvar completed lessonProgressPayload
\tpostAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/lessons/%s/words/%d/review", testServer.URL, created.ID, wordIDs[2]), registered.Tokens.AccessToken, lessonReviewPayload("again", 3), http.StatusOK, &completed)
\tassertLessonProgress(t, completed, 3, 3, 4, true)

\tgetAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons/active", registered.Tokens.AccessToken, http.StatusNotFound, nil)

\tvar status string
\tvar currentIndex, ratedItems, reviewEvents int
\tvar version int64
\tif err := pg.QueryRow(ctx, `
\t\tselect lesson_sessions.status, lesson_sessions.current_index, lesson_sessions.version, count(lesson_session_items.rating)::int
\t\tfrom lesson_sessions join lesson_session_items on lesson_session_items.session_id = lesson_sessions.id
\t\twhere lesson_sessions.id = $1::uuid
\t\tgroup by lesson_sessions.status, lesson_sessions.current_index, lesson_sessions.version
\t`, created.ID).Scan(&status, &currentIndex, &version, &ratedItems); err != nil { t.Fatalf("query completed lesson: %v", err) }
\tif err := pg.QueryRow(ctx, "select count(*)::int from review_events where word_id = any($1::bigint[])", wordIDs).Scan(&reviewEvents); err != nil { t.Fatalf("count review events: %v", err) }
\tif status != "completed" || currentIndex != 3 || version != 4 || ratedItems != 3 || reviewEvents != 3 {
\t\tt.Fatalf("completed lesson status=%s index=%d version=%d rated=%d events=%d", status, currentIndex, version, ratedItems, reviewEvents)
\t}
}

func lessonReviewPayload(rating string, version int64) map[string]any {
\treturn map[string]any{
\t\t"lessonVersion": version, "rating": rating, "responseMs": 500, "answerMode": "recall", "correct": true, "timezoneOffsetMinutes": 0,
\t}
}

func sendLessonReview(endpoint, accessToken string, payload any) lessonHTTPResult {
\tbody, err := json.Marshal(payload)
\tif err != nil { return lessonHTTPResult{err: err} }
\trequest, err := http.NewRequestWithContext(context.Background(), http.MethodPost, endpoint, bytes.NewReader(body))
\tif err != nil { return lessonHTTPResult{err: err} }
\trequest.Header.Set("Authorization", "Bearer "+accessToken)
\trequest.Header.Set("Content-Type", "application/json")
\tresponse, err := http.DefaultClient.Do(request)
\tif err != nil { return lessonHTTPResult{err: err} }
\tdefer response.Body.Close()
\tresponseBody, err := io.ReadAll(response.Body)
\treturn lessonHTTPResult{status: response.StatusCode, body: responseBody, err: err}
}

func assertLessonProgress(t *testing.T, payload lessonProgressPayload, reviewed, total int, version int64, completed bool) {
\tt.Helper()
\tif payload.LessonReviewedItems != reviewed || payload.LessonTotalItems != total || payload.LessonSkippedItems != 0 || payload.LessonCompleted != completed || payload.LessonCurrentIndex != reviewed || payload.LessonVersion != version {
\t\tt.Fatalf("unexpected lesson progress: %+v", payload)
\t}
}
''')

# Review-mode integration creates a one-item lesson and must send its version.
replace_once(
    "backend/integration/review_modes_test.go",
    '''\tvar lesson struct {
\t\tID        string `json:"id"`
\t\tStudyMode string `json:"studyMode"`
\t}''',
    '''\tvar lesson struct {
\t\tID        string `json:"id"`
\t\tStudyMode string `json:"studyMode"`
\t\tVersion   int64  `json:"version"`
\t}''',
)
replace_once(
    "backend/integration/review_modes_test.go",
    '''\tpostAuthenticatedJSON(t, lessonReviewURL, registered.Tokens.AccessToken, map[string]any{
\t\t"rating": "known", "answerMode": "recall",''',
    '''\tpostAuthenticatedJSON(t, lessonReviewURL, registered.Tokens.AccessToken, map[string]any{
\t\t"lessonVersion": lesson.Version, "rating": "known", "answerMode": "recall",''',
)
replace_once(
    "backend/integration/review_modes_test.go",
    '''\tpostAuthenticatedJSON(t, lessonReviewURL, registered.Tokens.AccessToken, map[string]any{
\t\t"rating": "known", "answerMode": "study",''',
    '''\tpostAuthenticatedJSON(t, lessonReviewURL, registered.Tokens.AccessToken, map[string]any{
\t\t"lessonVersion": lesson.Version, "rating": "known", "answerMode": "study",''',
)

# Add a complete browser contract with versioned mocks and a shared two-device conflict.
write("frontend/e2e/lesson-flow.spec.ts", '''import { expect, test, type BrowserContext, type Page } from "@playwright/test";

type LessonMode = "study" | "recall" | "choice";
type RequestRecord = Record<string, unknown>;

type MockLesson = {
  reviewCalls: () => number;
  lessonRequests: () => RequestRecord[];
  reviewRequests: () => RequestRecord[];
};

const SESSION = {
  user: { id: "00000000-0000-0000-0000-000000000035", email: "lesson@example.com", displayName: "Lesson Tester", createdAt: "2026-01-01T00:00:00Z" },
  tokens: { accessToken: "e2e-access-token", tokenType: "Bearer", expiresIn: 900 },
};
const EMPTY_MODE = { attemptsToday: 0, successfulToday: 0, attemptsTotal: 0, successfulTotal: 0 };
const PROGRESS = {
  dueNow: 0, dueWords: 0, duePhrases: 0, totalWords: 4, totalPhrases: 0, newWords: 4, learningWords: 0,
  reviewWords: 0, masteredWords: 0, masteredPhrases: 0, reviewsToday: 0, successfulToday: 0,
  objectiveReviewsToday: 0, objectiveSuccessfulToday: 0, reviewsTotal: 0, dailyGoal: 30, currentStreak: 0,
  longestStreak: 0, retainedItemsWeek: 0, retainedWordsWeek: 0, retainedPhrasesWeek: 0, eventSchemaVersion: 2,
  modes: { study: EMPTY_MODE, recall: EMPTY_MODE, choice: EMPTY_MODE, legacy: EMPTY_MODE },
};
const WORDS = [
  { id: 101, lemma: "absolute", translation: "абсолютный", phonetic: "/ˈæbsəluːt/", partOfSpeech: "adjective", topic: "General", examples: ["The value is absolute."], note: "", status: "new" },
  { id: 102, lemma: "build", translation: "собирать", phonetic: "/bɪld/", partOfSpeech: "verb", topic: "Development", examples: ["Build the service."], note: "", status: "new" },
  { id: 103, lemma: "cache", translation: "кэш", phonetic: "/kæʃ/", partOfSpeech: "noun", topic: "Backend", examples: ["Clear the cache."], note: "", status: "new" },
  { id: 104, lemma: "durable", translation: "надёжный", phonetic: "/ˈdjʊərəbl/", partOfSpeech: "adjective", topic: "Data", examples: ["Use durable storage."], note: "", status: "new" },
];

function lessonItems(count: number, ratings: Record<number, "again" | "almost" | "known"> = {}) {
  return WORDS.slice(0, count).map((item, position) => ({ ...item, kind: "word", position, ...(ratings[item.id] ? { rating: ratings[item.id], reviewedAt: "2026-07-17T00:00:00Z" } : {}) }));
}

async function installBaseRoutes(page: Page) {
  await page.context().addCookies([{ name: "lexigo_csrf", value: "e2e-csrf-token", url: "http://127.0.0.1:3000", sameSite: "Lax" }]);
}

async function installLessonAPI(page: Page, itemCount: number, reviewDelayMs = 0): Promise<MockLesson> {
  let reviewCalls = 0;
  let reviewedItems = 0;
  let version = 1;
  const selectedItems = lessonItems(itemCount);
  const lessonRequests: RequestRecord[] = [];
  const reviewRequests: RequestRecord[] = [];
  await installBaseRoutes(page);

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    if (path === "/api/v1/auth/refresh") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SESSION) });
    if (path === "/api/v1/progress") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PROGRESS) });
    if ((path === "/api/v1/words" || path === "/api/v1/words/due") && url.searchParams.get("kind") === "phrase") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [], count: 0 }) });
    if (path === "/api/v1/words" || path === "/api/v1/words/due") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: WORDS, count: WORDS.length }) });
    if (path === "/api/v1/lessons/active") return route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: { code: "active_lesson_not_found", message: "active lesson was not found" } }) });
    if (path === "/api/v1/lessons" && request.method() === "POST") {
      const payload = request.postDataJSON() as RequestRecord;
      lessonRequests.push(payload);
      return route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({
        id: "00000000-0000-0000-0000-000000000350", source: "mixed", studyMode: payload.studyMode, lessonSize: String(itemCount),
        currentIndex: 0, version: 1, status: "active", items: selectedItems, createdAt: "2026-07-17T00:00:00Z", updatedAt: "2026-07-17T00:00:00Z",
      }) });
    }
    if (path.endsWith("/review") && request.method() === "POST") {
      const payload = request.postDataJSON() as RequestRecord;
      reviewCalls += 1;
      reviewRequests.push(payload);
      if (payload.lessonVersion !== version) return route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ error: { code: "lesson_version_conflict", message: "stale" } }) });
      if (reviewDelayMs > 0) await new Promise((resolve) => setTimeout(resolve, reviewDelayMs));
      reviewedItems += 1;
      version += 1;
      const completed = reviewedItems === itemCount;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        wordId: selectedItems[Math.min(reviewedItems - 1, selectedItems.length - 1)].id, status: "learning", easiness: 2.5,
        intervalDays: 1, repetitions: reviewedItems, dueAt: "2026-07-18T00:00:00Z", lastReviewedAt: "2026-07-17T00:00:00Z",
        lessonId: "00000000-0000-0000-0000-000000000350", lessonCurrentIndex: reviewedItems, lessonVersion: version,
        lessonCompleted: completed, lessonReviewedItems: reviewedItems, lessonSkippedItems: 0, lessonTotalItems: itemCount,
      }) });
    }
    return route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: { code: "not_mocked", message: path } }) });
  });
  return { reviewCalls: () => reviewCalls, lessonRequests: () => lessonRequests, reviewRequests: () => reviewRequests };
}

async function openLesson(page: Page, mode: LessonMode) {
  await page.goto("/?view=learn");
  await expect(page.getByText("0 элементов готовы")).toBeVisible();
  const label = mode === "study" ? "Простое изучение слов" : mode === "recall" ? "Вспомнить самому" : "Выбрать вариант";
  await page.getByRole("button", { name: new RegExp(label) }).click();
  await page.getByRole("button", { name: "Начать урок", exact: true }).click();
  await expect(page).toHaveURL(/view=lesson/);
}

test("study: persists exposure with the current lesson version", async ({ page }) => {
  const api = await installLessonAPI(page, 2, 350);
  await openLesson(page, "study");
  expect(api.lessonRequests()[0]).toMatchObject({ studyMode: "study" });
  await expect(page.getByRole("button", { name: "← Предыдущее недоступно", exact: true })).toBeDisabled();

  const known = page.getByRole("button", { name: "Знал", exact: true });
  await known.evaluate((element) => { const button = element as HTMLButtonElement; button.click(); button.click(); });
  await expect(page.getByRole("button", { name: "Дальше", exact: true })).toBeEnabled();
  expect(api.reviewCalls()).toBe(1);
  expect(api.reviewRequests()[0]).toMatchObject({ lessonVersion: 1, answerMode: "study", answerRevealed: true });
  expect(api.reviewRequests()[0]).not.toHaveProperty("correct");

  await page.getByRole("button", { name: "Дальше", exact: true }).click();
  await page.getByRole("button", { name: "Не знал", exact: true }).click();
  expect(api.reviewRequests()[1]).toMatchObject({ lessonVersion: 2 });
  await expect(page.getByRole("button", { name: "К результатам", exact: true })).toBeEnabled();
});

test("recall and choice send versioned objective payloads", async ({ page }) => {
  const recall = await installLessonAPI(page, 1);
  await openLesson(page, "recall");
  await page.locator("#premium-answer").fill("абсолютный");
  await page.getByRole("button", { name: "Сверить ответ", exact: true }).click();
  await page.getByRole("button", { name: "Почти", exact: true }).click();
  expect(recall.reviewRequests()[0]).toMatchObject({ lessonVersion: 1, answerMode: "recall", correct: true });
});

type SharedState = { version: number; currentIndex: number; ratings: Record<number, "known">; reviewEvents: number };

async function installSharedAPI(page: Page, state: SharedState) {
  await installBaseRoutes(page);
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === "/api/v1/auth/refresh") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SESSION) });
    if (path === "/api/v1/progress") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PROGRESS) });
    if (path === "/api/v1/words" || path === "/api/v1/words/due") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: WORDS, count: WORDS.length }) });
    if (path === "/api/v1/lessons/active") return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
      id: "00000000-0000-0000-0000-000000000390", source: "mixed", studyMode: "study", lessonSize: "2",
      currentIndex: state.currentIndex, version: state.version, status: "active", items: lessonItems(2, state.ratings),
      createdAt: "2026-07-17T00:00:00Z", updatedAt: "2026-07-17T00:00:00Z",
    }) });
    if (path.endsWith("/review") && request.method() === "POST") {
      const payload = request.postDataJSON() as RequestRecord;
      if (payload.lessonVersion !== state.version) return route.fulfill({ status: 409, contentType: "application/json", body: JSON.stringify({ error: { code: "lesson_version_conflict", message: "stale lesson" } }) });
      const word = WORDS[state.currentIndex];
      state.ratings[word.id] = "known";
      state.currentIndex += 1;
      state.version += 1;
      state.reviewEvents += 1;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        wordId: word.id, status: "learning", easiness: 2.5, intervalDays: 0, repetitions: 0, dueAt: "2026-07-18T00:00:00Z",
        lastReviewedAt: "2026-07-17T00:00:00Z", lessonId: "00000000-0000-0000-0000-000000000390",
        lessonCurrentIndex: state.currentIndex, lessonVersion: state.version, lessonCompleted: false,
        lessonReviewedItems: state.currentIndex, lessonSkippedItems: 0, lessonTotalItems: 2,
      }) });
    }
    return route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: { code: "not_mocked", message: path } }) });
  });
}

async function resumeFromHome(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Продолжить урок", exact: true }).first().click();
  await expect(page).toHaveURL(/view=lesson/);
}

test("stale device resynchronizes to the server position without duplicate review", async ({ context }) => {
  const state: SharedState = { version: 1, currentIndex: 0, ratings: {}, reviewEvents: 0 };
  const first = await context.newPage();
  const second = await context.newPage();
  await installSharedAPI(first, state);
  await installSharedAPI(second, state);

  await resumeFromHome(first);
  await resumeFromHome(second);
  await expect(first.getByText("Слово 1 из 2")).toBeVisible();
  await expect(second.getByText("Слово 1 из 2")).toBeVisible();

  await first.getByRole("button", { name: "Знал", exact: true }).click();
  expect(state.reviewEvents).toBe(1);

  await second.getByRole("button", { name: "Знал", exact: true }).click();
  await expect(second.getByRole("alert")).toContainText("Урок изменён на другом устройстве");
  await expect(second.getByText("Слово 2 из 2")).toBeVisible();
  expect(state.reviewEvents).toBe(1);
  await expect(second.getByRole("button", { name: "← Предыдущее недоступно", exact: true })).toBeDisabled();
  await expect(second.getByRole("button", { name: /absolute: уже оценено/ })).toHaveCount(0);
  await expect(second.getByLabel("absolute: уже оценено")).toBeVisible();

  await second.reload();
  await expect(second.getByText("Слово 2 из 2")).toBeVisible();
  expect(state.reviewEvents).toBe(1);
});
''')

# API version and lesson endpoints/schemas.
openapi = ROOT / "api/openapi.yaml"
api = openapi.read_text(encoding="utf-8")
api = api.replace("  version: 0.4.0", "  version: 0.5.0", 1)
lesson_paths = '''  /api/v1/lessons:
    post:
      operationId: createLesson
      tags: [learning]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/LessonCreateRequest"
      responses:
        "201":
          description: Создан новый серверный урок с version=1.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/LessonSession"
        "422":
          $ref: "#/components/responses/ValidationError"
  /api/v1/lessons/active:
    get:
      operationId: getActiveLesson
      tags: [learning]
      security:
        - bearerAuth: []
      responses:
        "200":
          description: Snapshot активного урока и фактическая серверная позиция.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/LessonSession"
        "404":
          description: Активный урок отсутствует.
  /api/v1/lessons/{lessonID}:
    delete:
      operationId: discardLesson
      tags: [learning]
      security:
        - bearerAuth: []
      parameters:
        - $ref: "#/components/parameters/LessonID"
        - name: If-Match
          in: header
          required: true
          description: Текущая lesson version, например `"3"`.
          schema:
            type: string
      responses:
        "204":
          description: Урок сброшен; version атомарно увеличена.
        "409":
          $ref: "#/components/responses/Conflict"
        "428":
          description: If-Match отсутствует.
  /api/v1/lessons/{lessonID}/words/{wordID}/review:
    post:
      operationId: reviewLessonWord
      tags: [learning]
      security:
        - bearerAuth: []
      parameters:
        - $ref: "#/components/parameters/LessonID"
        - name: wordID
          in: path
          required: true
          schema:
            type: integer
            format: int64
            minimum: 1
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/LessonReviewRequest"
      responses:
        "200":
          description: Review и переход к следующей серверной позиции сохранены атомарно.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/LessonReviewResult"
        "409":
          $ref: "#/components/responses/Conflict"
        "422":
          $ref: "#/components/responses/ValidationError"
'''
anchor = "  /api/v1/progress:\n"
if api.count(anchor) != 1:
    raise RuntimeError("OpenAPI progress path anchor missing")
api = api.replace(anchor, lesson_paths + anchor)
parameter_anchor = '''  parameters:
    TimezoneOffsetMinutes:'''
parameter_replacement = '''  parameters:
    LessonID:
      name: lessonID
      in: path
      required: true
      schema:
        type: string
        format: uuid
    TimezoneOffsetMinutes:'''
if api.count(parameter_anchor) != 1:
    raise RuntimeError("OpenAPI parameters anchor missing")
api = api.replace(parameter_anchor, parameter_replacement)
lesson_schemas = '''    LessonCreateRequest:
      type: object
      required: [source, studyMode, lessonSize, wordIds]
      properties:
        source: { type: string }
        studyMode:
          type: string
          enum: [study, recall, choice]
        lessonSize:
          type: string
          enum: [15, 30, 60, all]
        wordIds:
          type: array
          minItems: 1
          maxItems: 1000
          uniqueItems: true
          items:
            type: integer
            format: int64
    LessonItem:
      allOf:
        - $ref: "#/components/schemas/UserWord"
        - type: object
          required: [position]
          properties:
            position: { type: integer, minimum: 0 }
            rating:
              type: [string, "null"]
              enum: [again, almost, known, null]
            reviewedAt:
              type: [string, "null"]
              format: date-time
    LessonSession:
      type: object
      required: [id, source, studyMode, lessonSize, currentIndex, version, status, items, createdAt, updatedAt]
      properties:
        id: { type: string, format: uuid }
        source: { type: string }
        studyMode:
          type: string
          enum: [study, recall, choice]
        lessonSize: { type: string }
        currentIndex: { type: integer, minimum: 0 }
        version:
          type: integer
          format: int64
          minimum: 1
          description: Monotonic optimistic-concurrency version.
        status:
          type: string
          enum: [active, completed, discarded]
        items:
          type: array
          items:
            $ref: "#/components/schemas/LessonItem"
        createdAt: { type: string, format: date-time }
        updatedAt: { type: string, format: date-time }
    LessonReviewRequest:
      allOf:
        - $ref: "#/components/schemas/ReviewRequest"
        - type: object
          required: [lessonVersion]
          properties:
            lessonVersion:
              type: integer
              format: int64
              minimum: 1
    LessonReviewResult:
      allOf:
        - $ref: "#/components/schemas/ReviewResult"
        - type: object
          required: [lessonId, lessonCurrentIndex, lessonVersion, lessonCompleted, lessonReviewedItems, lessonSkippedItems, lessonTotalItems]
          properties:
            lessonId: { type: string, format: uuid }
            lessonCurrentIndex: { type: integer, minimum: 0 }
            lessonVersion: { type: integer, format: int64, minimum: 1 }
            lessonCompleted: { type: boolean }
            lessonReviewedItems: { type: integer, minimum: 0 }
            lessonSkippedItems: { type: integer, minimum: 0 }
            lessonTotalItems: { type: integer, minimum: 1 }
'''
schema_anchor = "    GoalRequest:\n"
if api.count(schema_anchor) != 1:
    raise RuntimeError("OpenAPI GoalRequest anchor missing")
api = api.replace(schema_anchor, lesson_schemas + schema_anchor)
openapi.write_text(api, encoding="utf-8")

write("docs/lesson-concurrency.md", '''# Lesson concurrency and navigation

## Contract

An active lesson is a server-owned linear state machine. The browser may display only `currentIndex` returned by the backend and may advance only to the exact `lessonCurrentIndex` returned after a committed review. Backward navigation and related-item jumps are deliberately disabled until the session is completed.

Every `lesson_sessions` row has a monotonic `version` starting at 1. A review request contains `lessonVersion`; discard uses `If-Match`. The mutation locks the session row, compares the expected version and increments it in the same transaction as the item review/status update. A stale device receives `409 lesson_version_conflict` and must reload `/api/v1/lessons/active`.

## Safety properties

- An unexpected item cannot be reviewed because position, rating, lesson mode and version are checked under row locks.
- A duplicate or stale request cannot create a second review event.
- Session and item arrays are returned from a repeatable-read snapshot.
- An active snapshot is rejected if `currentIndex` is negative, outside the item array or points to an already reviewed item.
- The frontend never clamps or invents an invalid server index.
- Creating a new lesson or discarding the current lesson invalidates prior device versions.

## Compatibility

Migration `000008` assigns version 1 to existing sessions. Old clients can still read lessons but cannot mutate them without a version precondition; this is intentional because unversioned writes are unsafe in multi-device use.
''')

# Source invariants.
for path, forbidden in {
    premium: ["moveToIndex(", "previousItem", "Math.min(Math.max(lesson.currentIndex"],
    "backend/internal/learning/lesson_repository.go": ["set status = 'discarded', updated_at = now()"],
}.items():
    source = (ROOT / path).read_text(encoding="utf-8")
    for fragment in forbidden:
        if fragment in source:
            raise RuntimeError(f"{path}: forbidden legacy fragment remains: {fragment}")

print("Issue 39 codemod applied successfully")
