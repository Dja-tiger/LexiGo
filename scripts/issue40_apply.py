from __future__ import annotations

from pathlib import Path


def read(path: str) -> str:
    return Path(path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")


def replace_once(content: str, old: str, new: str, path: str) -> str:
    count = content.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one occurrence, found {count}: {old[:120]!r}")
    return content.replace(old, new, 1)


def replace_between(content: str, start: str, end: str, replacement: str, path: str) -> str:
    start_index = content.find(start)
    if start_index < 0:
        raise RuntimeError(f"{path}: start marker not found: {start!r}")
    end_index = content.find(end, start_index)
    if end_index < 0:
        raise RuntimeError(f"{path}: end marker not found: {end!r}")
    return content[:start_index] + replacement + content[end_index:]


# Backend models.
path = "backend/internal/learning/lesson.go"
content = read(path)
content = replace_once(
    content,
    '''type LessonCreateRequest struct {
\tSource     string     `json:"source"`
\tStudyMode  AnswerMode `json:"studyMode"`
\tLessonSize string     `json:"lessonSize"`
\tWordIDs    []int64    `json:"wordIds"`
}
''',
    '''type LessonCreateRequest struct {
\tSource     string     `json:"source"`
\tStudyMode  AnswerMode `json:"studyMode"`
\tLessonSize string     `json:"lessonSize"`
\tWordIDs    []int64    `json:"wordIds,omitempty"`
}

type LessonPreviewRequest struct {
\tSource     string     `json:"source"`
\tStudyMode  AnswerMode `json:"studyMode"`
\tLessonSize string     `json:"lessonSize"`
}

type LessonComposition struct {
\tTotal            int    `json:"total"`
\tWords            int    `json:"words"`
\tPhrases          int    `json:"phrases"`
\tDue              int    `json:"due"`
\tNew              int    `json:"new"`
\tScheduled        int    `json:"scheduled"`
\tAvailableWords   int    `json:"availableWords"`
\tAvailablePhrases int    `json:"availablePhrases"`
\tFallback         string `json:"fallback,omitempty"`
}

type LessonPreview struct {
\tSource      string            `json:"source"`
\tStudyMode   AnswerMode        `json:"studyMode"`
\tLessonSize  string            `json:"lessonSize"`
\tComposition LessonComposition `json:"composition"`
}
''',
    path,
)
write(path, content)


# Shared deterministic composer.
write(
    "backend/internal/learning/lesson_composer.go",
    '''package learning

import (
\t"context"
\t"fmt"
\t"sort"
\t"strconv"
\t"time"

\t"github.com/jackc/pgx/v5"
)

const (
\tlessonFallbackWordsOnly   = "words_only"
\tlessonFallbackPhrasesOnly = "phrases_only"
\tlessonFallbackEmpty       = "empty"
)

type lessonCandidate struct {
\tWordID int64
\tKind   string
\tStatus string
\tDueAt  time.Time
\tDue    bool
}

func (r *Repository) PreviewLesson(ctx context.Context, userID string, request LessonPreviewRequest) (LessonPreview, error) {
\ttx, err := r.pool.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.RepeatableRead, AccessMode: pgx.ReadOnly})
\tif err != nil {
\t\treturn LessonPreview{}, fmt.Errorf("begin lesson preview snapshot: %w", err)
\t}
\tdefer func() { _ = tx.Rollback(ctx) }()

\tcandidates, err := queryLessonCandidates(ctx, tx, userID, request.Source, request.StudyMode)
\tif err != nil {
\t\treturn LessonPreview{}, err
\t}
\t_, composition := composeLessonCandidates(candidates, request.Source, lessonSizeLimit(request.LessonSize))
\tif err := tx.Commit(ctx); err != nil {
\t\treturn LessonPreview{}, fmt.Errorf("commit lesson preview snapshot: %w", err)
\t}
\treturn LessonPreview{
\t\tSource:      request.Source,
\t\tStudyMode:   request.StudyMode,
\t\tLessonSize:  request.LessonSize,
\t\tComposition: composition,
\t}, nil
}

func queryLessonCandidates(
\tctx context.Context,
\ttx pgx.Tx,
\tuserID string,
\tsource string,
\tstudyMode AnswerMode,
) ([]lessonCandidate, error) {
\tdueOnly := studyMode == AnswerModeRecall || studyMode == AnswerModeChoice
\trows, err := tx.Query(ctx, `
\t\tselect word.id,
\t\t       word.kind,
\t\t       user_word.status,
\t\t       user_word.due_at,
\t\t       user_word.due_at <= now()
\t\tfrom user_words user_word
\t\tjoin words word on word.id = user_word.word_id
\t\twhere user_word.user_id = $1::uuid
\t\t  and (not $3 or user_word.due_at <= now())
\t\t  and (
\t\t      $2 = 'mixed'
\t\t      or ($2 = 'phrases' and word.kind = 'phrase')
\t\t      or ($2 = 'noun' and word.kind = 'word' and lower(word.part_of_speech) = 'noun')
\t\t      or ($2 = 'verb' and word.kind = 'word' and lower(word.part_of_speech) = 'verb')
\t\t      or ($2 = 'adjective' and word.kind = 'word' and lower(word.part_of_speech) = 'adjective')
\t\t      or ($2 = 'daily-life' and word.kind = 'word' and word.topic = 'Daily Life')
\t\t      or ($2 = 'travel' and word.kind = 'word' and word.topic = 'Travel')
\t\t      or ($2 = 'data-engineering' and word.kind = 'word' and word.topic = 'Data Engineering')
\t\t      or ($2 = 'backend' and word.kind = 'word' and word.topic = 'Backend Development')
\t\t  )
\t\torder by user_word.due_at, word.id
\t`, userID, source, dueOnly)
\tif err != nil {
\t\treturn nil, fmt.Errorf("query lesson candidates: %w", err)
\t}
\tdefer rows.Close()

\tcandidates := make([]lessonCandidate, 0)
\tfor rows.Next() {
\t\tvar candidate lessonCandidate
\t\tif err := rows.Scan(&candidate.WordID, &candidate.Kind, &candidate.Status, &candidate.DueAt, &candidate.Due); err != nil {
\t\t\treturn nil, fmt.Errorf("scan lesson candidate: %w", err)
\t\t}
\t\tcandidates = append(candidates, candidate)
\t}
\tif err := rows.Err(); err != nil {
\t\treturn nil, fmt.Errorf("iterate lesson candidates: %w", err)
\t}
\treturn candidates, nil
}

func composeLessonCandidates(candidates []lessonCandidate, source string, limit int) ([]lessonCandidate, LessonComposition) {
\twordQueue := make([]lessonCandidate, 0)
\tphraseQueue := make([]lessonCandidate, 0)
\tfor _, candidate := range candidates {
\t\tif candidate.Kind == "phrase" {
\t\t\tphraseQueue = append(phraseQueue, candidate)
\t\t} else {
\t\t\twordQueue = append(wordQueue, candidate)
\t\t}
\t}
\tsortLessonQueue(wordQueue)
\tsortLessonQueue(phraseQueue)

\tcomposition := LessonComposition{
\t\tAvailableWords:   len(wordQueue),
\t\tAvailablePhrases: len(phraseQueue),
\t}
\tif len(wordQueue) == 0 && len(phraseQueue) == 0 {
\t\tcomposition.Fallback = lessonFallbackEmpty
\t\treturn nil, composition
\t}
\tif source == "mixed" {
\t\tif len(wordQueue) == 0 {
\t\t\tcomposition.Fallback = lessonFallbackPhrasesOnly
\t\t} else if len(phraseQueue) == 0 {
\t\t\tcomposition.Fallback = lessonFallbackWordsOnly
\t\t}
\t}

\tif limit <= 0 || limit > len(candidates) {
\t\tlimit = len(candidates)
\t}
\tselected := make([]lessonCandidate, 0, limit)
\tif source == "mixed" {
\t\tselected = alternateLessonKinds(wordQueue, phraseQueue, limit)
\t} else {
\t\tqueue := wordQueue
\t\tif source == "phrases" {
\t\t\tqueue = phraseQueue
\t\t}
\t\tselected = append(selected, queue[:min(limit, len(queue))]...)
\t}

\tfor _, candidate := range selected {
\t\tcomposition.Total++
\t\tif candidate.Kind == "phrase" {
\t\t\tcomposition.Phrases++
\t\t} else {
\t\t\tcomposition.Words++
\t\t}
\t\tswitch {
\t\tcase candidate.Due:
\t\t\tcomposition.Due++
\t\tcase candidate.Status == "new":
\t\t\tcomposition.New++
\t\tdefault:
\t\t\tcomposition.Scheduled++
\t\t}
\t}
\treturn selected, composition
}

func sortLessonQueue(queue []lessonCandidate) {
\tsort.SliceStable(queue, func(left, right int) bool {
\t\tleftPriority := lessonCandidatePriority(queue[left])
\t\trightPriority := lessonCandidatePriority(queue[right])
\t\tif leftPriority != rightPriority {
\t\t\treturn leftPriority < rightPriority
\t\t}
\t\tif !queue[left].DueAt.Equal(queue[right].DueAt) {
\t\t\treturn queue[left].DueAt.Before(queue[right].DueAt)
\t\t}
\t\treturn queue[left].WordID < queue[right].WordID
\t})
}

func lessonCandidatePriority(candidate lessonCandidate) int {
\tif candidate.Due {
\t\treturn 0
\t}
\tif candidate.Status == "new" {
\t\treturn 1
\t}
\treturn 2
}

func alternateLessonKinds(words, phrases []lessonCandidate, limit int) []lessonCandidate {
\tselected := make([]lessonCandidate, 0, limit)
\twordIndex, phraseIndex := 0, 0
\tnextKind := "word"
\tif dueCount(phrases) > dueCount(words) {
\t\tnextKind = "phrase"
\t}
\tfor len(selected) < limit && (wordIndex < len(words) || phraseIndex < len(phrases)) {
\t\tif nextKind == "word" && wordIndex < len(words) {
\t\t\tselected = append(selected, words[wordIndex])
\t\t\twordIndex++
\t\t\tnextKind = "phrase"
\t\t\tcontinue
\t\t}
\t\tif nextKind == "phrase" && phraseIndex < len(phrases) {
\t\t\tselected = append(selected, phrases[phraseIndex])
\t\t\tphraseIndex++
\t\t\tnextKind = "word"
\t\t\tcontinue
\t\t}
\t\tif wordIndex < len(words) {
\t\t\tselected = append(selected, words[wordIndex])
\t\t\twordIndex++
\t\t\tnextKind = "phrase"
\t\t} else {
\t\t\tselected = append(selected, phrases[phraseIndex])
\t\t\tphraseIndex++
\t\t\tnextKind = "word"
\t\t}
\t}
\treturn selected
}

func dueCount(candidates []lessonCandidate) int {
\tcount := 0
\tfor _, candidate := range candidates {
\t\tif candidate.Due {
\t\t\tcount++
\t\t}
\t}
\treturn count
}

func lessonSizeLimit(value string) int {
\tif value == "all" {
\t\treturn 1000
\t}
\tlimit, _ := strconv.Atoi(value)
\treturn limit
}
''',
)


# Repository create path now composes server-side when wordIds are omitted.
path = "backend/internal/learning/lesson_repository.go"
content = read(path)
content = replace_between(
    content,
    "func (r *Repository) CreateLesson(\n",
    "func (r *Repository) ActiveLesson",
    '''func (r *Repository) CreateLesson(
\tctx context.Context,
\tuserID string,
\trequest LessonCreateRequest,
) (LessonSession, error) {
\ttx, err := r.pool.Begin(ctx)
\tif err != nil {
\t\treturn LessonSession{}, fmt.Errorf("begin lesson transaction: %w", err)
\t}
\tdefer func() { _ = tx.Rollback(ctx) }()

\twordIDs := request.WordIDs
\tif wordIDs == nil {
\t\tcandidates, candidateErr := queryLessonCandidates(ctx, tx, userID, request.Source, request.StudyMode)
\t\tif candidateErr != nil {
\t\t\treturn LessonSession{}, candidateErr
\t\t}
\t\tselected, _ := composeLessonCandidates(candidates, request.Source, lessonSizeLimit(request.LessonSize))
\t\tif len(selected) == 0 {
\t\t\treturn LessonSession{}, ErrLessonQueueEmpty
\t\t}
\t\twordIDs = make([]int64, 0, len(selected))
\t\tfor _, candidate := range selected {
\t\t\twordIDs = append(wordIDs, candidate.WordID)
\t\t}
\t} else {
\t\tvar assigned int
\t\tif err := tx.QueryRow(ctx, `
\t\t\tselect count(*)::int
\t\t\tfrom user_words
\t\t\twhere user_id = $1::uuid and word_id = any($2::bigint[])
\t\t`, userID, wordIDs).Scan(&assigned); err != nil {
\t\t\treturn LessonSession{}, fmt.Errorf("validate lesson words: %w", err)
\t\t}
\t\tif assigned != len(wordIDs) {
\t\t\treturn LessonSession{}, ErrInvalidLessonWords
\t\t}
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
\t`, lessonID, wordIDs); err != nil {
\t\treturn LessonSession{}, fmt.Errorf("insert lesson items: %w", err)
\t}

\tif err := tx.Commit(ctx); err != nil {
\t\treturn LessonSession{}, fmt.Errorf("commit lesson transaction: %w", err)
\t}
\treturn r.lessonByID(ctx, userID, lessonID, "active")
}

''',
    path,
)
content = replace_once(
    content,
    '\tErrInvalidLessonState        = errors.New("lesson state is inconsistent")\n',
    '\tErrInvalidLessonState        = errors.New("lesson state is inconsistent")\n\tErrLessonQueueEmpty          = errors.New("lesson queue is empty")\n',
    path,
)
write(path, content)


# HTTP preview endpoint and optional explicit IDs.
path = "backend/internal/learning/lesson_http.go"
content = read(path)
content = replace_between(
    content,
    "func (h *Handler) CreateLesson",
    "func (h *Handler) ActiveLesson",
    '''func (h *Handler) PreviewLesson(w http.ResponseWriter, r *http.Request) {
\tuserID, ok := httpx.UserID(r.Context())
\tif !ok {
\t\thttpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
\t\treturn
\t}
\tvar request LessonPreviewRequest
\tif err := httpx.DecodeJSON(w, r, &request); err != nil {
\t\thttpx.WriteError(w, http.StatusBadRequest, "invalid_json", "invalid JSON request")
\t\treturn
\t}
\tif !validateLessonConfiguration(w, request.Source, request.StudyMode, request.LessonSize) {
\t\treturn
\t}
\tpreview, err := h.repository.PreviewLesson(r.Context(), userID, request)
\tif err != nil {
\t\tslog.ErrorContext(r.Context(), "preview lesson failed", "user_id", userID, "error", err)
\t\thttpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
\t\treturn
\t}
\thttpx.WriteJSON(w, http.StatusOK, preview)
}

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
\tif !validateLessonConfiguration(w, request.Source, request.StudyMode, request.LessonSize) {
\t\treturn
\t}
\tif request.WordIDs != nil && (len(request.WordIDs) == 0 || len(request.WordIDs) > 1000 || !uniquePositiveWordIDs(request.WordIDs)) {
\t\thttpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_word_ids", "wordIds must be omitted or contain between 1 and 1000 unique positive ids")
\t\treturn
\t}

\tlesson, err := h.repository.CreateLesson(r.Context(), userID, request)
\tif err != nil {
\t\tswitch {
\t\tcase errors.Is(err, ErrInvalidLessonWords):
\t\t\thttpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_lesson_words", "all lesson items must be assigned to the current user")
\t\tcase errors.Is(err, ErrLessonQueueEmpty):
\t\t\thttpx.WriteError(w, http.StatusUnprocessableEntity, "lesson_queue_empty", "no learning items are available for this lesson configuration")
\t\tdefault:
\t\t\tslog.ErrorContext(r.Context(), "create lesson failed", "user_id", userID, "error", err)
\t\t\thttpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
\t\t}
\t\treturn
\t}
\thttpx.WriteJSON(w, http.StatusCreated, lesson)
}

func validateLessonConfiguration(w http.ResponseWriter, source string, studyMode AnswerMode, lessonSize string) bool {
\tif !validLessonSource(source) {
\t\thttpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_source", "source must be a supported vocabulary or phrase collection")
\t\treturn false
\t}
\tif !validAnswerMode(studyMode) {
\t\thttpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_study_mode", "studyMode must be study, recall or choice")
\t\treturn false
\t}
\tif !validLessonSize(lessonSize) {
\t\thttpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_lesson_size", "lessonSize must be 15, 30, 60 or all")
\t\treturn false
\t}
\treturn true
}

''',
    path,
)
write(path, content)


# Route preview through the existing authenticated learning handler.
path = "backend/internal/server/server.go"
content = read(path)
content = replace_once(
    content,
    '\tmux.Handle("POST /api/v1/lessons", authenticated(http.HandlerFunc(learningHandler.CreateLesson)))\n',
    '\tmux.Handle("POST /api/v1/lessons/preview", authenticated(http.HandlerFunc(learningHandler.PreviewLesson)))\n\tmux.Handle("POST /api/v1/lessons", authenticated(http.HandlerFunc(learningHandler.CreateLesson)))\n',
    path,
)
write(path, content)


# Backend unit coverage.
write(
    "backend/internal/learning/lesson_composer_test.go",
    '''package learning

import (
\t"reflect"
\t"testing"
\t"time"
)

func TestComposeMixedLessonAlternatesKindsAndPrioritizesWithinEachKind(t *testing.T) {
\tnow := time.Date(2026, 7, 17, 10, 0, 0, 0, time.UTC)
\tcandidates := []lessonCandidate{
\t\t{WordID: 6, Kind: "phrase", Status: "review", DueAt: now.Add(3 * time.Hour)},
\t\t{WordID: 2, Kind: "word", Status: "new", DueAt: now.Add(2 * time.Hour)},
\t\t{WordID: 4, Kind: "phrase", Status: "new", DueAt: now.Add(2 * time.Hour)},
\t\t{WordID: 1, Kind: "word", Status: "review", DueAt: now.Add(-2 * time.Hour), Due: true},
\t\t{WordID: 3, Kind: "phrase", Status: "review", DueAt: now.Add(-time.Hour), Due: true},
\t\t{WordID: 5, Kind: "word", Status: "review", DueAt: now.Add(4 * time.Hour)},
\t}

\tselected, composition := composeLessonCandidates(candidates, "mixed", 6)
\tids := make([]int64, 0, len(selected))
\tfor _, candidate := range selected {
\t\tids = append(ids, candidate.WordID)
\t}
\twant := []int64{1, 3, 2, 4, 5, 6}
\tif !reflect.DeepEqual(ids, want) {
\t\tt.Fatalf("selected ids = %v, want %v", ids, want)
\t}
\tif composition.Total != 6 || composition.Words != 3 || composition.Phrases != 3 || composition.Due != 2 || composition.New != 2 || composition.Scheduled != 2 || composition.Fallback != "" {
\t\tt.Fatalf("unexpected composition: %+v", composition)
\t}
}

func TestComposeMixedLessonStartsWithKindThatHasMoreDueItems(t *testing.T) {
\tnow := time.Now().UTC()
\tcandidates := []lessonCandidate{
\t\t{WordID: 1, Kind: "word", Status: "new", DueAt: now.Add(time.Hour)},
\t\t{WordID: 2, Kind: "phrase", Status: "review", DueAt: now.Add(-2 * time.Hour), Due: true},
\t\t{WordID: 3, Kind: "phrase", Status: "review", DueAt: now.Add(-time.Hour), Due: true},
\t}
\tselected, _ := composeLessonCandidates(candidates, "mixed", 3)
\tif len(selected) != 3 || selected[0].Kind != "phrase" || selected[1].Kind != "word" || selected[2].Kind != "phrase" {
\t\tt.Fatalf("unexpected order: %+v", selected)
\t}
}

func TestComposeMixedLessonFallsBackWithoutStopping(t *testing.T) {
\tnow := time.Now().UTC()
\tcandidates := []lessonCandidate{
\t\t{WordID: 1, Kind: "word", Status: "review", DueAt: now.Add(-time.Hour), Due: true},
\t\t{WordID: 2, Kind: "word", Status: "new", DueAt: now.Add(time.Hour)},
\t}
\tselected, composition := composeLessonCandidates(candidates, "mixed", 15)
\tif len(selected) != 2 || composition.Words != 2 || composition.Phrases != 0 || composition.Fallback != lessonFallbackWordsOnly {
\t\tt.Fatalf("unexpected fallback composition: %+v", composition)
\t}
}

func TestComposeEmptyLessonReportsEmptyFallback(t *testing.T) {
\tselected, composition := composeLessonCandidates(nil, "mixed", 15)
\tif len(selected) != 0 || composition.Total != 0 || composition.Fallback != lessonFallbackEmpty {
\t\tt.Fatalf("unexpected empty composition: %+v", composition)
\t}
}
''',
)


# PostgreSQL integration coverage for preview, composition, due priority and fallback.
write(
    "backend/integration/mixed_lesson_composer_test.go",
    '''//go:build integration

package integration

import (
\t"context"
\t"fmt"
\t"io"
\t"log/slog"
\t"net/http"
\t"net/http/httptest"
\t"testing"
\t"time"

\t"github.com/Dja-tiger/New-project/backend/internal/catalog"
\t"github.com/Dja-tiger/New-project/backend/internal/config"
\t"github.com/Dja-tiger/New-project/backend/internal/platform/migrate"
\tpostgresplatform "github.com/Dja-tiger/New-project/backend/internal/platform/postgres"
\tredisplatform "github.com/Dja-tiger/New-project/backend/internal/platform/redis"
\t"github.com/Dja-tiger/New-project/backend/internal/server"
)

type lessonCompositionPayload struct {
\tTotal            int    `json:"total"`
\tWords            int    `json:"words"`
\tPhrases          int    `json:"phrases"`
\tDue              int    `json:"due"`
\tNew              int    `json:"new"`
\tScheduled        int    `json:"scheduled"`
\tAvailableWords   int    `json:"availableWords"`
\tAvailablePhrases int    `json:"availablePhrases"`
\tFallback         string `json:"fallback"`
}

func TestMixedLessonComposerPreviewCreateAndFallback(t *testing.T) {
\tctx, cancel := context.WithTimeout(context.Background(), 45*time.Second)
\tdefer cancel()
\tpg, err := postgresplatform.Open(ctx, requiredEnv(t, "TEST_POSTGRES_DSN"))
\tif err != nil {
\t\tt.Fatal(err)
\t}
\tdefer pg.Close()
\tif err := migrate.Up(ctx, pg); err != nil {
\t\tt.Fatalf("migrate.Up() error = %v", err)
\t}
\tif _, err := pg.Exec(ctx, "truncate table lesson_session_items, lesson_sessions, review_events, user_learning_preferences, user_words, refresh_tokens, words, users restart identity cascade"); err != nil {
\t\tt.Fatalf("truncate test data: %v", err)
\t}
\tif _, err := catalog.Seed(ctx, pg); err != nil {
\t\tt.Fatalf("catalog.Seed() error = %v", err)
\t}
\trdb, err := redisplatform.Open(ctx, config.Redis{Addr: requiredEnv(t, "TEST_REDIS_ADDR")})
\tif err != nil {
\t\tt.Fatal(err)
\t}
\tdefer rdb.Close()
\tif err := rdb.FlushDB(ctx).Err(); err != nil {
\t\tt.Fatalf("flush redis: %v", err)
\t}
\tcfg := config.Config{
\t\tAppEnv: "test", HTTPAddr: ":0", LogLevel: "error", CORSAllowedOrigin: "http://test.local",
\t\tPostgresDSN: requiredEnv(t, "TEST_POSTGRES_DSN"), Redis: config.Redis{Addr: requiredEnv(t, "TEST_REDIS_ADDR")},
\t\tJWTSecret: "integration-test-secret-with-at-least-32-bytes", AccessTokenTTL: 15 * time.Minute, RefreshTokenTTL: 24 * time.Hour,
\t}
\tapp, err := server.New(cfg, slog.New(slog.NewTextHandler(io.Discard, nil)), pg, rdb)
\tif err != nil {
\t\tt.Fatalf("server.New() error = %v", err)
\t}
\ttestServer := httptest.NewServer(app.Handler())
\tdefer testServer.Close()

\temail := fmt.Sprintf("mixed-composer-%d@example.com", time.Now().UnixNano())
\tregistered := postJSON[integrationAuthResponse](t, testServer.URL+"/api/v1/auth/register", map[string]string{
\t\t"email": email, "password": "strong-password", "displayName": "Mixed Learner",
\t}, http.StatusCreated)

\tvar userID string
\tif err := pg.QueryRow(ctx, "select id::text from users where email = $1", email).Scan(&userID); err != nil {
\t\tt.Fatalf("query user id: %v", err)
\t}
\tvar wordOne, wordTwo, phraseOne, phraseTwo int64
\tif err := pg.QueryRow(ctx, `select min(id), max(id) filter (where id = (select min(id) from words where kind = 'word') + 1) from words where kind = 'word'`).Scan(&wordOne, &wordTwo); err != nil || wordTwo == 0 {
\t\trows, queryErr := pg.Query(ctx, "select id from words where kind = 'word' order by id limit 2")
\t\tif queryErr != nil {
\t\t\tt.Fatalf("query word ids: %v", queryErr)
\t\t}
\t\tdefer rows.Close()
\t\tids := make([]int64, 0, 2)
\t\tfor rows.Next() {
\t\t\tvar id int64
\t\t\tif scanErr := rows.Scan(&id); scanErr != nil {
\t\t\t\tt.Fatalf("scan word id: %v", scanErr)
\t\t\t}
\t\t\tids = append(ids, id)
\t\t}
\t\tif len(ids) != 2 {
\t\t\tt.Fatalf("word ids = %v", ids)
\t\t}
\t\twordOne, wordTwo = ids[0], ids[1]
\t}
\trows, err := pg.Query(ctx, "select id from words where kind = 'phrase' order by id limit 2")
\tif err != nil {
\t\tt.Fatalf("query phrase ids: %v", err)
\t}
\tphraseIDs := make([]int64, 0, 2)
\tfor rows.Next() {
\t\tvar id int64
\t\tif err := rows.Scan(&id); err != nil {
\t\t\tt.Fatalf("scan phrase id: %v", err)
\t\t}
\t\tphraseIDs = append(phraseIDs, id)
\t}
\trows.Close()
\tif len(phraseIDs) != 2 {
\t\tt.Fatalf("phrase ids = %v", phraseIDs)
\t}
\tphraseOne, phraseTwo = phraseIDs[0], phraseIDs[1]

\tif _, err := pg.Exec(ctx, "update user_words set due_at = now() + interval '30 days', status = 'new' where user_id = $1::uuid", userID); err != nil {
\t\tt.Fatalf("move queue to future: %v", err)
\t}
\tif _, err := pg.Exec(ctx, "update user_words set due_at = now() - interval '2 hours', status = 'review' where user_id = $1::uuid and word_id = any($2::bigint[])", userID, []int64{wordOne, phraseOne}); err != nil {
\t\tt.Fatalf("mark due candidates: %v", err)
\t}

\tvar preview struct {
\t\tComposition lessonCompositionPayload `json:"composition"`
\t}
\tpostAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons/preview", registered.Tokens.AccessToken, map[string]any{
\t\t"source": "mixed", "studyMode": "study", "lessonSize": "15",
\t}, http.StatusOK, &preview)
\tif preview.Composition.Total != 15 || preview.Composition.Words != 8 || preview.Composition.Phrases != 7 || preview.Composition.Due != 2 || preview.Composition.New != 13 || preview.Composition.Fallback != "" {
\t\tt.Fatalf("unexpected mixed preview: %+v", preview.Composition)
\t}

\tvar lesson struct {
\t\tID    string `json:"id"`
\t\tItems []struct {
\t\t\tID   int64  `json:"id"`
\t\t\tKind string `json:"kind"`
\t\t} `json:"items"`
\t}
\tpostAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons", registered.Tokens.AccessToken, map[string]any{
\t\t"source": "mixed", "studyMode": "study", "lessonSize": "15",
\t}, http.StatusCreated, &lesson)
\tif lesson.ID == "" || len(lesson.Items) != 15 {
\t\tt.Fatalf("unexpected lesson: %+v", lesson)
\t}
\tif lesson.Items[0].ID != wordOne || lesson.Items[0].Kind != "word" || lesson.Items[1].ID != phraseOne || lesson.Items[1].Kind != "phrase" {
\t\tt.Fatalf("due candidates were not first and alternating: %+v", lesson.Items[:2])
\t}
\tfor index := 1; index < len(lesson.Items); index++ {
\t\tif lesson.Items[index].Kind == lesson.Items[index-1].Kind {
\t\t\tt.Fatalf("mixed items did not alternate at %d: %+v", index, lesson.Items)
\t\t}
\t}

\tif _, err := pg.Exec(ctx, "update user_words set due_at = now() + interval '30 days' where user_id = $1::uuid and word_id in (select id from words where kind = 'phrase')", userID); err != nil {
\t\tt.Fatalf("move phrases out of due queue: %v", err)
\t}
\tif _, err := pg.Exec(ctx, "update user_words set due_at = now() - interval '1 hour' where user_id = $1::uuid and word_id = $2", userID, wordTwo); err != nil {
\t\tt.Fatalf("mark word due: %v", err)
\t}
\tpostAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons/preview", registered.Tokens.AccessToken, map[string]any{
\t\t"source": "mixed", "studyMode": "recall", "lessonSize": "15",
\t}, http.StatusOK, &preview)
\tif preview.Composition.Total < 1 || preview.Composition.Words < 1 || preview.Composition.Phrases != 0 || preview.Composition.Fallback != "words_only" {
\t\tt.Fatalf("unexpected words-only fallback: %+v", preview.Composition)
\t}

\t_ = phraseTwo
}
''',
)


# Frontend composition presentation helpers.
write(
    "frontend/lib/lesson-composition.ts",
    '''export type LessonCompositionFallback = "words_only" | "phrases_only" | "empty";

export type LessonComposition = {
  total: number;
  words: number;
  phrases: number;
  due: number;
  new: number;
  scheduled: number;
  availableWords: number;
  availablePhrases: number;
  fallback?: LessonCompositionFallback;
};

function plural(value: number, one: string, few: string, many: string): string {
  const mod100 = value % 100;
  const mod10 = value % 10;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

export function lessonCompositionDescription(composition: LessonComposition): string {
  const itemLabel = plural(composition.total, "элемент", "элемента", "элементов");
  const wordLabel = plural(composition.words, "слово", "слова", "слов");
  const phraseLabel = plural(composition.phrases, "фраза", "фразы", "фраз");
  return `${composition.total} ${itemLabel} · ${composition.words} ${wordLabel} · ${composition.phrases} ${phraseLabel}`;
}

export function lessonPriorityDescription(composition: LessonComposition): string {
  const parts = [`${composition.due} due`, `${composition.new} новых`];
  if (composition.scheduled > 0) parts.push(`${composition.scheduled} запланированных`);
  return parts.join(" · ");
}

export function lessonCompositionFallbackMessage(composition: LessonComposition): string {
  if (composition.fallback === "words_only") {
    return "Фраз для выбранного режима сейчас нет. Урок продолжится доступными словами.";
  }
  if (composition.fallback === "phrases_only") {
    return "Слов для выбранного режима сейчас нет. Урок продолжится доступными фразами.";
  }
  if (composition.fallback === "empty") {
    return "Для выбранного режима пока нет доступных элементов.";
  }
  return "";
}
''',
)
write(
    "frontend/lib/lesson-composition.test.ts",
    '''import { describe, expect, it } from "vitest";

import {
  lessonCompositionDescription,
  lessonCompositionFallbackMessage,
  lessonPriorityDescription,
  type LessonComposition,
} from "./lesson-composition";

const composition: LessonComposition = {
  total: 15,
  words: 8,
  phrases: 7,
  due: 6,
  new: 7,
  scheduled: 2,
  availableWords: 100,
  availablePhrases: 50,
};

describe("lesson composition copy", () => {
  it("describes the expected mixed lesson", () => {
    expect(lessonCompositionDescription(composition)).toBe("15 элементов · 8 слов · 7 фраз");
    expect(lessonPriorityDescription(composition)).toBe("6 due · 7 новых · 2 запланированных");
  });

  it("explains one-kind fallback and empty queues", () => {
    expect(lessonCompositionFallbackMessage({ ...composition, fallback: "words_only" })).toContain("доступными словами");
    expect(lessonCompositionFallbackMessage({ ...composition, fallback: "phrases_only" })).toContain("доступными фразами");
    expect(lessonCompositionFallbackMessage({ ...composition, fallback: "empty" })).toContain("нет доступных элементов");
  });
});
''',
)


# Frontend app: preview, server composition and neutral fallback notice.
path = "frontend/components/lexigo-premium-app.tsx"
content = read(path)
content = replace_once(
    content,
    'import { decideLessonAdvance, resolveActiveLessonIndex, summarizePersistedLesson } from "../lib/lesson-flow";\n',
    'import {\n  lessonCompositionDescription,\n  lessonCompositionFallbackMessage,\n  lessonPriorityDescription,\n  type LessonComposition,\n} from "../lib/lesson-composition";\nimport { decideLessonAdvance, resolveActiveLessonIndex, summarizePersistedLesson } from "../lib/lesson-flow";\n',
    path,
)
content = replace_once(
    content,
    '''type LessonReviewResponse = {
  lessonId: string;
  lessonCurrentIndex: number;
  lessonVersion: number;
  lastReviewedAt: string;
  lessonCompleted: boolean;
  lessonReviewedItems: number;
  lessonSkippedItems: number;
  lessonTotalItems: number;
};
''',
    '''type LessonReviewResponse = {
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
  composition: LessonComposition;
};
''',
    path,
)
content = replace_once(
    content,
    '  { value: "mixed", label: "Все слова", hint: "Смешанный порядок и разные темы", icon: "shuffle", count: WORD_CATALOG_COUNT },\n',
    '  { value: "mixed", label: "Смешанная практика", hint: "Слова и фразы в детерминированном чередовании", icon: "shuffle", count: WORD_CATALOG_COUNT + DEFAULT_PHRASE_CATALOG.length },\n',
    path,
)
content = replace_once(
    content,
    'export function LexigoPremiumApp({ initialSession }: { initialSession: Session | null }) {\n',
    '''function mixedLessonFallbackMessage(lesson: LessonSessionResponse): string {
  if (lesson.source !== "mixed" || lesson.items.length === 0) return "";
  const words = lesson.items.filter((item) => item.kind !== "phrase").length;
  const phrases = lesson.items.length - words;
  if (words === 0) return "Слова для этого режима закончились. Смешанная практика продолжится доступными фразами.";
  if (phrases === 0) return "Фразы для этого режима закончились. Смешанная практика продолжится доступными словами.";
  return "";
}

export function LexigoPremiumApp({ initialSession }: { initialSession: Session | null }) {
''',
    path,
)
content = replace_once(
    content,
    '  const [error, setError] = useState("");\n',
    '  const [error, setError] = useState("");\n  const [lessonQueueNotice, setLessonQueueNotice] = useState("");\n  const [lessonPreview, setLessonPreview] = useState<LessonPreviewResponse | null>(null);\n  const [previewingLesson, setPreviewingLesson] = useState(false);\n',
    path,
)
content = replace_once(
    content,
    '    setError("");\n    window.scrollTo({ top: 0, behavior: "smooth" });\n',
    '    setError("");\n    if (target.view !== "lesson") setLessonQueueNotice("");\n    window.scrollTo({ top: 0, behavior: "smooth" });\n',
    path,
)
preview_effect = '''  useEffect(() => {
    if (!session || navigation.view !== "learn" || studyMode === "all") {
      setLessonPreview(null);
      setPreviewingLesson(false);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(() => {
      setPreviewingLesson(true);
      void authorizedRequest<LessonPreviewResponse>(session, "/api/v1/lessons/preview", {
        method: "POST",
        body: JSON.stringify({ source, studyMode, lessonSize: String(lessonSize) }),
      }).then((result) => {
        if (cancelled) return;
        setSession(result.activeSession);
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
  }, [navigation.view, session, source, studyMode, lessonSize]);

'''
content = replace_once(content, '  async function refreshProgress(activeSession: Session): Promise<Session> {\n', preview_effect + '  async function refreshProgress(activeSession: Session): Promise<Session> {\n', path)
content = replace_between(
    content,
    '  async function startLesson(activeSession = session, overrides: StartOverrides = {}) {\n',
    '  async function submitAuth',
    '''  async function startLesson(activeSession = session, overrides: StartOverrides = {}) {
    const resolvedSource = overrides.source ?? source;
    const resolvedSize = overrides.size ?? lessonSize;
    const resolvedMode = overrides.mode ?? studyMode;
    setSource(resolvedSource);
    setLessonSize(resolvedSize);
    setStudyMode(resolvedMode);

    if (resolvedMode !== "all" && !activeSession) {
      requestAuthentication(resolvedSource === "phrases" ? "phrases" : "learn");
      return;
    }
    if (resolvedSource !== "phrases" && !activeSession) {
      requestAuthentication("learn");
      return;
    }

    setBusy(true);
    setError("");
    setLessonQueueNotice("");
    try {
      let currentSession = activeSession;
      if (resolvedMode !== "all") {
        const explicitItems = overrides.items?.filter((item) => typeof item.wordId === "number") ?? [];
        if (overrides.items && explicitItems.length !== overrides.items.length) {
          throw new Error("Выбранные элементы ещё не синхронизированы с сервером");
        }
        const result = await authorizedRequest<LessonSessionResponse>(
          currentSession as Session,
          "/api/v1/lessons",
          {
            method: "POST",
            body: JSON.stringify({
              source: resolvedSource,
              studyMode: resolvedMode,
              lessonSize: String(resolvedSize),
              ...(overrides.items ? { wordIds: explicitItems.map((item) => item.wordId) } : {}),
            }),
          },
        );
        setSession(result.activeSession);
        if (applyLesson(result.data)) {
          setLessonQueueNotice(mixedLessonFallbackMessage(result.data));
          navigate({ view: "lesson", source: resolvedSource });
        }
        return;
      }

      let available: LearningItem[];
      if (resolvedSource === "phrases") {
        available = overrides.items ?? phraseCatalog;
      } else if (resolvedSource === "mixed") {
        const wordsResult = await loadItems(currentSession as Session, "word", false);
        currentSession = wordsResult.activeSession;
        const phrasesResult = await loadItems(currentSession, "phrase", false);
        currentSession = phrasesResult.activeSession;
        available = [...prepareWordItems(wordsResult.items, "mixed"), ...phrasesResult.items];
      } else {
        const result = await loadItems(currentSession as Session, "word", false);
        currentSession = result.activeSession;
        available = prepareWordItems(result.items, resolvedSource);
      }

      const lessonItems = takeLessonBlock(available, resolvedSize);
      setSession(currentSession as Session);
      setActiveLesson(null);
      setItems(lessonItems);
      setCurrentIndex(0);
      setRatings({});
      resetCardState(resolvedMode);
      setLessonStarted(true);
      setLessonComplete(lessonItems.length === 0);
      setServerLessonCompleted(false);
      setServerNextIndex(null);
      setServerSkippedItems(0);
      navigate({ view: "lesson", source: resolvedSource });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Не удалось сформировать учебный блок");
    } finally {
      setBusy(false);
    }
  }
''',
    path,
)
content = replace_once(
    content,
    '    setError("");\n  }\n\n  function saveAndExitLesson()',
    '    setError("");\n    setLessonQueueNotice("");\n  }\n\n  function saveAndExitLesson()',
    path,
)
old_footer = '''            <div><p>{studyMode === "study" ? "Слово, перевод и пример будут видны сразу." : studyMode === "all" ? "Откроется справочный список без оценок." : "Ответы будут сохранены в интервальную очередь."}</p><button className="lx-button primary large" type="button" disabled={busy} onClick={() => startLesson()}><Icon name="play"/>{busy ? "Формируем…" : studyMode === "all" ? "Открыть список" : "Начать урок"}</button></div>
'''
new_footer = '''            <div className="lx-setup-actions">
              {studyMode === "all" ? (
                <div className="lx-lesson-preview"><span>Состав списка</span><strong>Все доступные элементы раздела</strong><small>Справочный режим не создаёт server lesson session.</small></div>
              ) : !session ? (
                <div className="lx-lesson-preview"><span>Состав урока</span><strong>Войдите для расчёта</strong><small>Composer учитывает вашу due-очередь и доступные фразы.</small></div>
              ) : previewingLesson ? (
                <div className="lx-lesson-preview" aria-live="polite"><span>Состав урока</span><strong>Рассчитываем…</strong><small>Проверяем due, new и доступность обоих типов.</small></div>
              ) : lessonPreview ? (
                <div className="lx-lesson-preview" aria-live="polite"><span>Состав урока</span><strong>{lessonCompositionDescription(lessonPreview.composition)}</strong><small>{lessonPriorityDescription(lessonPreview.composition)}</small>{lessonCompositionFallbackMessage(lessonPreview.composition) ? <em>{lessonCompositionFallbackMessage(lessonPreview.composition)}</em> : null}</div>
              ) : (
                <div className="lx-lesson-preview"><span>Состав урока</span><strong>Будет рассчитан сервером</strong><small>Локальный random selection не используется.</small></div>
              )}
              <div className="lx-setup-submit"><p>{studyMode === "study" ? "Слово, перевод и пример будут видны сразу." : studyMode === "all" ? "Откроется справочный список без оценок." : "Ответы будут сохранены в интервальную очередь."}</p><button className="lx-button primary large" type="button" disabled={busy || previewingLesson || Boolean(session && studyMode !== "all" && lessonPreview?.composition.total === 0)} onClick={() => startLesson()}><Icon name="play"/>{busy ? "Формируем…" : studyMode === "all" ? "Открыть список" : "Начать урок"}</button></div>
            </div>
'''
content = replace_once(content, old_footer, new_footer, path)
content = replace_once(
    content,
    '      {error ? <p className="lx-error" role="alert">{error}</p> : null}\n',
    '      {error ? <p className="lx-error" role="alert">{error}</p> : null}\n      {lessonQueueNotice ? <p className="lx-queue-notice" role="status">{lessonQueueNotice}</p> : null}\n',
    path,
)
write(path, content)


# CSS for composition preview and fallback status.
path = "frontend/app/premium-ui.css"
content = read(path)
content = replace_once(
    content,
    '.lx-setup-footer > div { display: flex; align-items: center; justify-content: flex-end; gap: 20px; }\n.lx-setup-footer p { margin: 0; color: #7f8ca3; line-height: 1.5; }\n',
    '''.lx-setup-footer > .lx-setup-actions { display: grid; gap: 14px; }
.lx-setup-submit { display: flex; align-items: center; justify-content: flex-end; gap: 20px; }
.lx-setup-footer p { margin: 0; color: #7f8ca3; line-height: 1.5; }
.lx-lesson-preview { display: grid; gap: 4px; border: 1px solid rgba(112, 91, 220, .28); border-radius: 15px; padding: 13px 15px; background: rgba(91, 65, 188, .08); }
.lx-lesson-preview span { color: #8f9bb1; font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.lx-lesson-preview strong { color: #eef1f8; font-size: 15px; }
.lx-lesson-preview small { color: #7f8ca3; line-height: 1.45; }
.lx-lesson-preview em { color: #d9b77d; font-size: 12px; font-style: normal; line-height: 1.45; }
.lx-queue-notice { max-width: var(--lx-content); margin: 10px auto 0; border: 1px solid rgba(72, 178, 141, .35); border-radius: 13px; padding: 11px 14px; color: #b8ead8; background: rgba(31, 124, 94, .13); }
''',
    path,
)
write(path, content)


# Browser mocks must understand the new preview endpoint.
def add_preview_mock(file_path: str) -> None:
    source = read(file_path)
    handler = '''    if (path === "/api/v1/lessons/preview") {
      const input = request.postDataJSON() as { source?: string; studyMode?: string; lessonSize?: string };
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({
        source: input.source ?? "mixed", studyMode: input.studyMode ?? "study", lessonSize: input.lessonSize ?? "30",
        composition: { total: 2, words: 1, phrases: 1, due: 2, new: 0, scheduled: 0, availableWords: 1, availablePhrases: 1 },
      }) });
    }
'''
    marker = '    if (path === "/api/v1/lessons/active")'
    if marker in source:
        source = source.replace(marker, handler + marker)
    else:
        marker = '    if (pathname === "/api/v1/lessons/active")'
        handler_pathname = handler.replace('path ===', 'pathname ===')
        if marker not in source:
            raise RuntimeError(f"{file_path}: active lesson mock marker missing")
        source = source.replace(marker, handler_pathname + marker)
    write(file_path, source)


for mock_path in [
    "frontend/e2e/lesson-flow.spec.ts",
    "frontend/e2e/ui-ownership.spec.ts",
    "frontend/e2e/dictionary-pwa.spec.ts",
]:
    add_preview_mock(mock_path)

# Upgrade lesson-flow mock to support a real mixed session and assert no client-selected IDs.
path = "frontend/e2e/lesson-flow.spec.ts"
content = read(path)
content = replace_once(
    content,
    'const WORDS = [\n',
    'const PHRASE = { id: 201, kind: "phrase" as const, slug: "roll-back", lemma: "roll back", translation: "откатить", phonetic: "", partOfSpeech: "phrase", topic: "Release", examples: ["Roll back the release."], note: "", cloze: "roll ____", clozeAnswer: "back", status: "new" };\n\nconst WORDS = [\n',
    path,
)
content = replace_once(
    content,
    'async function installLessonAPI(page: Page, itemCount: number, reviewDelayMs = 0): Promise<MockLesson> {\n',
    'async function installLessonAPI(page: Page, itemCount: number, reviewDelayMs = 0, itemOverride?: ReturnType<typeof lessonItems>): Promise<MockLesson> {\n',
    path,
)
content = replace_once(
    content,
    '  const selectedItems = lessonItems(itemCount);\n',
    '  const selectedItems = itemOverride ?? lessonItems(itemCount);\n',
    path,
)
content = replace_once(
    content,
    '    if (path === "/api/v1/lessons/preview") {\n      const input = request.postDataJSON() as { source?: string; studyMode?: string; lessonSize?: string };\n      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({\n        source: input.source ?? "mixed", studyMode: input.studyMode ?? "study", lessonSize: input.lessonSize ?? "30",\n        composition: { total: 2, words: 1, phrases: 1, due: 2, new: 0, scheduled: 0, availableWords: 1, availablePhrases: 1 },\n      }) });\n    }\n',
    '    if (path === "/api/v1/lessons/preview") {\n      const input = request.postDataJSON() as { source?: string; studyMode?: string; lessonSize?: string };\n      const phraseCount = selectedItems.filter((item) => item.kind === "phrase").length;\n      const wordCount = selectedItems.length - phraseCount;\n      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({\n        source: input.source ?? "mixed", studyMode: input.studyMode ?? "study", lessonSize: input.lessonSize ?? "30",\n        composition: { total: selectedItems.length, words: wordCount, phrases: phraseCount, due: selectedItems.length, new: 0, scheduled: 0, availableWords: wordCount, availablePhrases: phraseCount, ...(phraseCount === 0 ? { fallback: "words_only" } : {}) },\n      }) });\n    }\n',
    path,
)
content = replace_once(
    content,
    '  expect(api.lessonRequests()[0]).toMatchObject({ studyMode: "study" });\n',
    '  expect(api.lessonRequests()[0]).toMatchObject({ studyMode: "study", source: "mixed" });\n  expect(api.lessonRequests()[0]).not.toHaveProperty("wordIds");\n',
    path,
)
content += '''

test("mixed practice previews and opens both words and phrases", async ({ page }) => {
  const mixedItems = [
    lessonItems(1)[0],
    { ...PHRASE, position: 1 },
  ];
  const api = await installLessonAPI(page, 2, 0, mixedItems);
  await page.goto("/?view=learn");
  await expect(page.getByText("2 элемента · 1 слово · 1 фраза")).toBeVisible();
  await page.getByRole("button", { name: /Вспомнить самому/ }).click();
  await page.getByRole("button", { name: "Начать урок", exact: true }).click();
  expect(api.lessonRequests()[0]).not.toHaveProperty("wordIds");
  await expect(page.getByText("ПЕРЕВЕДИТЕ СЛОВО")).toBeVisible();
  await page.locator("#premium-answer").fill("абсолютный");
  await page.getByRole("button", { name: "Сверить ответ", exact: true }).click();
  await page.getByRole("button", { name: "Знал", exact: true }).click();
  await page.getByRole("button", { name: "Дальше", exact: true }).click();
  await expect(page.getByText("Техническая фраза", { exact: true })).toBeVisible();
});
'''
write(path, content)


# OpenAPI 0.6: preview and optional explicit IDs.
path = "api/openapi.yaml"
content = read(path)
content = replace_once(content, '  version: 0.5.0\n', '  version: 0.6.0\n', path)
preview_path = '''  /api/v1/lessons/preview:
    post:
      operationId: previewLesson
      tags: [learning]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/LessonPreviewRequest"
      responses:
        "200":
          description: Детерминированный состав будущего урока без создания session.
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/LessonPreview"
        "422":
          $ref: "#/components/responses/ValidationError"
'''
content = replace_once(content, '  /api/v1/lessons:\n', preview_path + '  /api/v1/lessons:\n', path)
content = replace_once(
    content,
    '      required: [source, studyMode, lessonSize, wordIds]\n',
    '      required: [source, studyMode, lessonSize]\n',
    path,
)
content = replace_once(
    content,
    '        wordIds:\n          type: array\n',
    '        wordIds:\n          description: Optional explicit selection for manual phrase/topic lessons. Omit to use the server composer.\n          type: array\n',
    path,
)
preview_schemas = '''    LessonPreviewRequest:
      type: object
      required: [source, studyMode, lessonSize]
      properties:
        source: { type: string }
        studyMode:
          type: string
          enum: [study, recall, choice]
        lessonSize:
          type: string
          enum: ["15", "30", "60", all]
    LessonComposition:
      type: object
      required: [total, words, phrases, due, new, scheduled, availableWords, availablePhrases]
      properties:
        total: { type: integer, minimum: 0 }
        words: { type: integer, minimum: 0 }
        phrases: { type: integer, minimum: 0 }
        due: { type: integer, minimum: 0 }
        new: { type: integer, minimum: 0 }
        scheduled: { type: integer, minimum: 0 }
        availableWords: { type: integer, minimum: 0 }
        availablePhrases: { type: integer, minimum: 0 }
        fallback:
          type: string
          enum: [words_only, phrases_only, empty]
    LessonPreview:
      type: object
      required: [source, studyMode, lessonSize, composition]
      properties:
        source: { type: string }
        studyMode:
          type: string
          enum: [study, recall, choice]
        lessonSize: { type: string }
        composition:
          $ref: "#/components/schemas/LessonComposition"
'''
content = replace_once(content, '    LessonItem:\n', preview_schemas + '    LessonItem:\n', path)
write(path, content)


# Final architecture documentation, remove temporary scope note.
Path("docs/issue-40-design.md").unlink(missing_ok=True)
write(
    "docs/lesson-composer.md",
    '''# Lesson composer

## Contract

Persisted lessons are composed on the server when `wordIds` is omitted from `POST /api/v1/lessons`. Explicit IDs remain supported for manual phrase/topic selections. `POST /api/v1/lessons/preview` invokes the same candidate query and composition algorithm without creating or discarding a lesson session.

## Deterministic mixed queue

Candidates are split into word and phrase queues. Each queue is ordered by:

1. due items;
2. new items;
3. already scheduled, not-yet-due items;
4. `due_at` and item ID as deterministic tie-breakers.

The composer alternates word and phrase queues one-for-one. The kind with more due items starts; ties start with a word. This prevents a large backlog of one kind from starving the other while still guaranteeing that due items are selected before new items of the same kind. If one kind is unavailable, the lesson continues with the other and preview returns a machine-readable fallback code.

Recall and choice modes query only due candidates. Study mode can fill remaining capacity with new and scheduled candidates. Lesson sizes remain capped at 1000 for `all`.

## Compatibility with adaptive queue work

The composer is intentionally independent of onboarding and personalization from Issue #18. Future ranking reasons such as weak topic or recent failure can be inserted into the per-kind priority comparator without changing the lesson session, review, optimistic-concurrency or frontend navigation contracts.

## Performance

Preview and create each use one indexed `user_words`/`words` join and in-memory ordering over the selected source. Preview uses a repeatable-read read-only snapshot. Creation composes and inserts items in the existing lesson transaction; no polling, extra tables or per-item round trips are introduced.
''',
)

print("Issue 40 patch applied")
