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
    if source.count(old) != 1:
        raise RuntimeError(f"{path}: expected one exact match, found {source.count(old)}")
    target.write_text(source.replace(old, new), encoding="utf-8")


def regex_once(path: str, pattern: str, replacement: str) -> None:
    target = ROOT / path
    source = target.read_text(encoding="utf-8")
    updated, count = re.subn(pattern, replacement, source, count=1, flags=re.S)
    if count != 1:
        raise RuntimeError(f"{path}: expected one regex match, found {count}: {pattern}")
    target.write_text(updated, encoding="utf-8")


write("backend/internal/learning/model.go", '''package learning

import "time"

type Rating string

const (
\tRatingAgain  Rating = "again"
\tRatingAlmost Rating = "almost"
\tRatingKnown  Rating = "known"
)

type AnswerMode string

const (
\tAnswerModeStudy  AnswerMode = "study"
\tAnswerModeRecall AnswerMode = "recall"
\tAnswerModeChoice AnswerMode = "choice"
)

func (mode AnswerMode) Objective() bool {
\treturn mode == AnswerModeRecall || mode == AnswerModeChoice
}

type ReviewRequest struct {
\tRating                Rating     `json:"rating"`
\tResponseMS            *int       `json:"responseMs,omitempty"`
\tAnswerMode            AnswerMode `json:"answerMode,omitempty"`
\tCorrect               *bool      `json:"correct,omitempty"`
\tAnswerRevealed        *bool      `json:"answerRevealed,omitempty"`
\tTimezoneOffsetMinutes int        `json:"timezoneOffsetMinutes"`
}

type ReviewResult struct {
\tWordID         int64     `json:"wordId"`
\tStatus         string    `json:"status"`
\tEasiness       float64   `json:"easiness"`
\tIntervalDays   int       `json:"intervalDays"`
\tRepetitions    int       `json:"repetitions"`
\tDueAt          time.Time `json:"dueAt"`
\tLastReviewedAt time.Time `json:"lastReviewedAt"`
}

type ModeProgress struct {
\tAttemptsToday  int `json:"attemptsToday"`
\tSuccessfulToday int `json:"successfulToday"`
\tAttemptsTotal  int `json:"attemptsTotal"`
\tSuccessfulTotal int `json:"successfulTotal"`
}

type ProgressModes struct {
\tStudy  ModeProgress `json:"study"`
\tRecall ModeProgress `json:"recall"`
\tChoice ModeProgress `json:"choice"`
\tLegacy ModeProgress `json:"legacy"`
}

type ProgressSummary struct {
\tDueNow                   int           `json:"dueNow"`
\tDueWords                 int           `json:"dueWords"`
\tDuePhrases               int           `json:"duePhrases"`
\tTotalWords               int           `json:"totalWords"`
\tTotalPhrases             int           `json:"totalPhrases"`
\tNewWords                 int           `json:"newWords"`
\tLearningWords            int           `json:"learningWords"`
\tReviewWords              int           `json:"reviewWords"`
\tMasteredWords            int           `json:"masteredWords"`
\tMasteredPhrases          int           `json:"masteredPhrases"`
\tReviewsToday             int           `json:"reviewsToday"`
\tSuccessfulToday          int           `json:"successfulToday"`
\tObjectiveReviewsToday    int           `json:"objectiveReviewsToday"`
\tObjectiveSuccessfulToday int           `json:"objectiveSuccessfulToday"`
\tReviewsTotal             int           `json:"reviewsTotal"`
\tDailyGoal                int           `json:"dailyGoal"`
\tCurrentStreak            int           `json:"currentStreak"`
\tLongestStreak            int           `json:"longestStreak"`
\tRetainedItemsWeek        int           `json:"retainedItemsWeek"`
\tRetainedWordsWeek        int           `json:"retainedWordsWeek"`
\tRetainedPhrasesWeek      int           `json:"retainedPhrasesWeek"`
\tEventSchemaVersion       int           `json:"eventSchemaVersion"`
\tModes                    ProgressModes `json:"modes"`
\tNextDueAt                *time.Time    `json:"nextDueAt,omitempty"`
}

type GoalRequest struct {
\tDailyGoal int `json:"dailyGoal"`
}
''')

replace_once(
    "backend/internal/learning/lesson.go",
    '\tStudyMode  string  `json:"studyMode"`',
    '\tStudyMode  AnswerMode `json:"studyMode"`',
)

write("backend/internal/learning/http.go", '''package learning

import (
\t"errors"
\t"net/http"
\t"strconv"

\t"github.com/Dja-tiger/New-project/backend/internal/httpx"
)

type Handler struct{ repository *Repository }

func NewHandler(repository *Repository) *Handler { return &Handler{repository: repository} }

func (h *Handler) ReviewWord(w http.ResponseWriter, r *http.Request) {
\tuserID, ok := httpx.UserID(r.Context())
\tif !ok {
\t\thttpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
\t\treturn
\t}
\twordID, err := strconv.ParseInt(r.PathValue("wordID"), 10, 64)
\tif err != nil || wordID <= 0 {
\t\thttpx.WriteError(w, http.StatusBadRequest, "invalid_word_id", "word id must be a positive integer")
\t\treturn
\t}

\tvar request ReviewRequest
\tif err := httpx.DecodeJSON(w, r, &request); err != nil {
\t\thttpx.WriteError(w, http.StatusBadRequest, "invalid_json", "invalid JSON request")
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
\tif code, message := normalizeAndValidateReviewRequest(&request); code != "" {
\t\thttpx.WriteError(w, http.StatusUnprocessableEntity, code, message)
\t\treturn
\t}

\tresult, err := h.repository.ReviewWord(r.Context(), userID, wordID, request)
\tif err != nil {
\t\tswitch {
\t\tcase errors.Is(err, ErrWordNotFound):
\t\t\thttpx.WriteError(w, http.StatusNotFound, "word_not_found", "word is not assigned to the current user")
\t\tcase errors.Is(err, ErrInvalidRating):
\t\t\thttpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_rating", "rating must be again, almost or known")
\t\tcase errors.Is(err, ErrInvalidAnswerMode):
\t\t\thttpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_answer_mode", "answerMode must be study, recall or choice")
\t\tdefault:
\t\t\thttpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
\t\t}
\t\treturn
\t}

\thttpx.WriteJSON(w, http.StatusOK, result)
}

func (h *Handler) Progress(w http.ResponseWriter, r *http.Request) {
\tuserID, ok := httpx.UserID(r.Context())
\tif !ok {
\t\thttpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
\t\treturn
\t}
\toffset, _ := strconv.Atoi(r.URL.Query().Get("timezoneOffsetMinutes"))
\tresult, err := h.repository.Progress(r.Context(), userID, offset)
\tif err != nil {
\t\thttpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
\t\treturn
\t}
\thttpx.WriteJSON(w, http.StatusOK, result)
}

func (h *Handler) SetDailyGoal(w http.ResponseWriter, r *http.Request) {
\tuserID, ok := httpx.UserID(r.Context())
\tif !ok {
\t\thttpx.WriteError(w, http.StatusUnauthorized, "unauthorized", "authorization context is missing")
\t\treturn
\t}
\tvar request GoalRequest
\tif err := httpx.DecodeJSON(w, r, &request); err != nil {
\t\thttpx.WriteError(w, http.StatusBadRequest, "invalid_json", "invalid JSON request")
\t\treturn
\t}
\tif request.DailyGoal < 5 || request.DailyGoal > 200 {
\t\thttpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_daily_goal", "dailyGoal must be between 5 and 200")
\t\treturn
\t}
\tif err := h.repository.SetDailyGoal(r.Context(), userID, request.DailyGoal); err != nil {
\t\thttpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
\t\treturn
\t}
\toffset, _ := strconv.Atoi(r.URL.Query().Get("timezoneOffsetMinutes"))
\tresult, err := h.repository.Progress(r.Context(), userID, offset)
\tif err != nil {
\t\thttpx.WriteError(w, http.StatusInternalServerError, "internal_error", "internal server error")
\t\treturn
\t}
\thttpx.WriteJSON(w, http.StatusOK, result)
}

func normalizeAndValidateReviewRequest(request *ReviewRequest) (code, message string) {
\t// Pre-v2 clients were allowed to omit answerMode. Preserve that contract as recall.
\tif request.AnswerMode == "" {
\t\trequest.AnswerMode = AnswerModeRecall
\t}
\tif !validAnswerMode(request.AnswerMode) {
\t\treturn "invalid_answer_mode", "answerMode must be study, recall or choice"
\t}
\tif request.AnswerMode == AnswerModeStudy {
\t\tif request.Correct != nil {
\t\t\treturn "invalid_study_correctness", "study attempts cannot report objective correctness"
\t\t}
\t\tif request.AnswerRevealed == nil || !*request.AnswerRevealed {
\t\t\treturn "invalid_answer_revealed", "study attempts must report answerRevealed=true"
\t\t}
\t}
\treturn "", ""
}

func validAnswerMode(mode AnswerMode) bool {
\treturn mode == AnswerModeStudy || mode == AnswerModeRecall || mode == AnswerModeChoice
}

func validRating(rating Rating) bool {
\treturn rating == RatingAgain || rating == RatingAlmost || rating == RatingKnown
}
''')

replace_once(
    "backend/internal/learning/lesson_http.go",
    '''\tif request.StudyMode != "recall" && request.StudyMode != "choice" {
\t\thttpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_study_mode", "studyMode must be recall or choice")
\t\treturn
\t}''',
    '''\tif !validAnswerMode(request.StudyMode) {
\t\thttpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_study_mode", "studyMode must be study, recall or choice")
\t\treturn
\t}''',
)
replace_once(
    "backend/internal/learning/lesson_http.go",
    '''\tif request.AnswerMode != "recall" && request.AnswerMode != "choice" {
\t\thttpx.WriteError(w, http.StatusUnprocessableEntity, "invalid_answer_mode", "answerMode must be recall or choice")
\t\treturn
\t}''',
    '''\tif code, message := normalizeAndValidateReviewRequest(&request); code != "" {
\t\thttpx.WriteError(w, http.StatusUnprocessableEntity, code, message)
\t\treturn
\t}''',
)
replace_once(
    "backend/internal/learning/lesson_http.go",
    '''\t\tcase errors.Is(err, ErrLessonItemOutOfOrder):
\t\t\thttpx.WriteError(w, http.StatusConflict, "lesson_item_out_of_order", "review the current lesson item before moving forward")''',
    '''\t\tcase errors.Is(err, ErrLessonItemOutOfOrder):
\t\t\thttpx.WriteError(w, http.StatusConflict, "lesson_item_out_of_order", "review the current lesson item before moving forward")
\t\tcase errors.Is(err, ErrLessonModeMismatch):
\t\t\thttpx.WriteError(w, http.StatusConflict, "lesson_mode_mismatch", "answerMode must match the active lesson studyMode")''',
)

write("backend/internal/learning/scheduler.go", '''package learning

import (
\t"errors"
\t"math"
\t"time"
)

var (
\tErrInvalidRating     = errors.New("invalid rating")
\tErrInvalidAnswerMode = errors.New("invalid answer mode")
)

type ReviewState struct {
\tStatus       string
\tEasiness     float64
\tIntervalDays int
\tRepetitions  int
}

type Schedule struct {
\tGrade        int
\tStatus       string
\tEasiness     float64
\tIntervalDays int
\tRepetitions  int
\tDueAfter     time.Duration
}

func ScheduleAttempt(state ReviewState, rating Rating, mode AnswerMode) (Schedule, error) {
\tswitch mode {
\tcase AnswerModeStudy:
\t\treturn scheduleStudy(state, rating)
\tcase AnswerModeRecall, AnswerModeChoice:
\t\treturn ScheduleReview(state, rating)
\tdefault:
\t\treturn Schedule{}, ErrInvalidAnswerMode
\t}
}

func scheduleStudy(state ReviewState, rating Rating) (Schedule, error) {
\teasiness := state.Easiness
\tif easiness < 1.3 {
\t\teasiness = 2.5
\t}
\tstatus := state.Status
\tif status == "" || status == "new" {
\t\tstatus = "learning"
\t}

\tgrade := 0
\tdueAfter := time.Duration(0)
\tswitch rating {
\tcase RatingAgain:
\t\tgrade = 1
\t\tdueAfter = 10 * time.Minute
\tcase RatingAlmost:
\t\tgrade = 3
\t\tdueAfter = 12 * time.Hour
\tcase RatingKnown:
\t\tgrade = 5
\t\tdueAfter = 24 * time.Hour
\tdefault:
\t\treturn Schedule{}, ErrInvalidRating
\t}

\treturn Schedule{
\t\tGrade:        grade,
\t\tStatus:       status,
\t\tEasiness:     round2(easiness),
\t\tIntervalDays: state.IntervalDays,
\t\tRepetitions:  state.Repetitions,
\t\tDueAfter:     dueAfter,
\t}, nil
}

func ScheduleReview(state ReviewState, rating Rating) (Schedule, error) {
\teasiness := state.Easiness
\tif easiness < 1.3 {
\t\teasiness = 2.5
\t}

\tswitch rating {
\tcase RatingAgain:
\t\teasiness = math.Max(1.3, easiness-0.2)
\t\treturn Schedule{
\t\t\tGrade:        1,
\t\t\tStatus:       "learning",
\t\t\tEasiness:     round2(easiness),
\t\t\tIntervalDays: 0,
\t\t\tRepetitions:  0,
\t\t\tDueAfter:     10 * time.Minute,
\t\t}, nil
\tcase RatingAlmost:
\t\trepetitions := state.Repetitions + 1
\t\tinterval := 1
\t\tif state.Repetitions > 0 {
\t\t\tinterval = maxInt(1, int(math.Round(float64(maxInt(1, state.IntervalDays))*1.5)))
\t\t}
\t\teasiness = math.Max(1.3, easiness-0.05)
\t\tstatus := "learning"
\t\tif repetitions >= 2 {
\t\t\tstatus = "review"
\t\t}
\t\treturn Schedule{
\t\t\tGrade:        3,
\t\t\tStatus:       status,
\t\t\tEasiness:     round2(easiness),
\t\t\tIntervalDays: interval,
\t\t\tRepetitions:  repetitions,
\t\t\tDueAfter:     time.Duration(interval) * 24 * time.Hour,
\t\t}, nil
\tcase RatingKnown:
\t\trepetitions := state.Repetitions + 1
\t\teasiness = math.Min(3.0, easiness+0.1)
\t\tinterval := 2
\t\tswitch state.Repetitions {
\t\tcase 0:
\t\t\tinterval = 2
\t\tcase 1:
\t\t\tinterval = 6
\t\tdefault:
\t\t\tinterval = maxInt(state.IntervalDays+1, int(math.Round(float64(maxInt(1, state.IntervalDays))*easiness)))
\t\t}
\t\tstatus := "review"
\t\tif repetitions >= 5 && interval >= 30 {
\t\t\tstatus = "mastered"
\t\t}
\t\treturn Schedule{
\t\t\tGrade:        5,
\t\t\tStatus:       status,
\t\t\tEasiness:     round2(easiness),
\t\t\tIntervalDays: interval,
\t\t\tRepetitions:  repetitions,
\t\t\tDueAfter:     time.Duration(interval) * 24 * time.Hour,
\t\t}, nil
\tdefault:
\t\treturn Schedule{}, ErrInvalidRating
\t}
}

func round2(value float64) float64 { return math.Round(value*100) / 100 }

func maxInt(left, right int) int {
\tif left > right {
\t\treturn left
\t}
\treturn right
}
''')

review_word = r'''func (r *Repository) ReviewWord(
\tctx context.Context,
\tuserID string,
\twordID int64,
\trequest ReviewRequest,
) (ReviewResult, error) {
\ttx, err := r.pool.Begin(ctx)
\tif err != nil {
\t\treturn ReviewResult{}, fmt.Errorf("begin review transaction: %w", err)
\t}
\tdefer func() { _ = tx.Rollback(ctx) }()

\tvar state ReviewState
\tif err := tx.QueryRow(ctx, `
\t\tselect status, easiness::float8, interval_days, repetitions
\t\tfrom user_words
\t\twhere user_id = $1::uuid and word_id = $2
\t\tfor update
\t`, userID, wordID).Scan(&state.Status, &state.Easiness, &state.IntervalDays, &state.Repetitions); err != nil {
\t\tif errors.Is(err, pgx.ErrNoRows) {
\t\t\treturn ReviewResult{}, ErrWordNotFound
\t\t}
\t\treturn ReviewResult{}, fmt.Errorf("lock user learning item: %w", err)
\t}

\tschedule, err := ScheduleAttempt(state, request.Rating, request.AnswerMode)
\tif err != nil {
\t\treturn ReviewResult{}, err
\t}
\tnow := time.Now().UTC()
\tdueAt := now.Add(schedule.DueAfter)

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
\t\treturn ReviewResult{}, fmt.Errorf("update user learning item: %w", err)
\t}

\tif _, err := tx.Exec(ctx, `
\t\tinsert into review_events(
\t\t\tuser_id, word_id, grade, response_ms, reviewed_at, rating, answer_mode, correct,
\t\t\tanswer_revealed, event_schema_version
\t\t) values ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, 2)
\t`, userID, wordID, schedule.Grade, request.ResponseMS, now, request.Rating, request.AnswerMode, request.Correct, request.AnswerRevealed); err != nil {
\t\treturn ReviewResult{}, fmt.Errorf("insert review event: %w", err)
\t}

\tif err := tx.Commit(ctx); err != nil {
\t\treturn ReviewResult{}, fmt.Errorf("commit review transaction: %w", err)
\t}

\treturn ReviewResult{
\t\tWordID:         wordID,
\t\tStatus:         schedule.Status,
\t\tEasiness:       schedule.Easiness,
\t\tIntervalDays:   schedule.IntervalDays,
\t\tRepetitions:    schedule.Repetitions,
\t\tDueAt:          dueAt,
\t\tLastReviewedAt: now,
\t}, nil
}'''

progress_fn = r'''func (r *Repository) Progress(ctx context.Context, userID string, timezoneOffsetMinutes int) (ProgressSummary, error) {
\ttimezoneOffsetMinutes = clampOffset(timezoneOffsetMinutes)
\tresult := ProgressSummary{EventSchemaVersion: 2}

\tif err := r.pool.QueryRow(ctx, `
\t\tselect count(*) filter (where word.kind = 'word')::int,
\t\t       count(*) filter (where word.kind = 'phrase')::int,
\t\t       count(*) filter (where user_word.due_at <= now())::int,
\t\t       count(*) filter (where word.kind = 'word' and user_word.due_at <= now())::int,
\t\t       count(*) filter (where word.kind = 'phrase' and user_word.due_at <= now())::int,
\t\t       count(*) filter (where word.kind = 'word' and user_word.status = 'new')::int,
\t\t       count(*) filter (where word.kind = 'word' and user_word.status = 'learning')::int,
\t\t       count(*) filter (where word.kind = 'word' and user_word.status = 'review')::int,
\t\t       count(*) filter (where word.kind = 'word' and user_word.status = 'mastered')::int,
\t\t       count(*) filter (where word.kind = 'phrase' and user_word.status = 'mastered')::int,
\t\t       min(user_word.due_at) filter (where user_word.due_at > now())
\t\tfrom user_words user_word
\t\tjoin words word on word.id = user_word.word_id
\t\twhere user_word.user_id = $1::uuid
\t`, userID).Scan(
\t\t&result.TotalWords,
\t\t&result.TotalPhrases,
\t\t&result.DueNow,
\t\t&result.DueWords,
\t\t&result.DuePhrases,
\t\t&result.NewWords,
\t\t&result.LearningWords,
\t\t&result.ReviewWords,
\t\t&result.MasteredWords,
\t\t&result.MasteredPhrases,
\t\t&result.NextDueAt,
\t); err != nil {
\t\treturn ProgressSummary{}, fmt.Errorf("query learning progress: %w", err)
\t}

\tif err := r.pool.QueryRow(ctx, `
\t\twith events as (
\t\t\tselect answer_mode, correct, grade, event_schema_version,
\t\t\t       (reviewed_at - make_interval(mins => $2))::date =
\t\t\t       (now() - make_interval(mins => $2))::date as is_today
\t\t\tfrom review_events
\t\t\twhere user_id = $1::uuid
\t\t)
\t\tselect count(*) filter (where is_today)::int,
\t\t       count(*) filter (where is_today and (answer_mode is null or answer_mode in ('recall', 'choice')))::int,
\t\t       count(*) filter (where is_today and (
\t\t           (answer_mode in ('recall', 'choice') and (correct is true or (event_schema_version = 1 and correct is null and grade >= 4)))
\t\t           or (answer_mode is null and grade >= 4)
\t\t       ))::int,
\t\t       count(*)::int,
\t\t       count(*) filter (where is_today and answer_mode = 'study')::int,
\t\t       0::int,
\t\t       count(*) filter (where answer_mode = 'study')::int,
\t\t       0::int,
\t\t       count(*) filter (where is_today and answer_mode = 'recall')::int,
\t\t       count(*) filter (where is_today and answer_mode = 'recall' and (correct is true or (event_schema_version = 1 and correct is null and grade >= 4)))::int,
\t\t       count(*) filter (where answer_mode = 'recall')::int,
\t\t       count(*) filter (where answer_mode = 'recall' and (correct is true or (event_schema_version = 1 and correct is null and grade >= 4)))::int,
\t\t       count(*) filter (where is_today and answer_mode = 'choice')::int,
\t\t       count(*) filter (where is_today and answer_mode = 'choice' and (correct is true or (event_schema_version = 1 and correct is null and grade >= 4)))::int,
\t\t       count(*) filter (where answer_mode = 'choice')::int,
\t\t       count(*) filter (where answer_mode = 'choice' and (correct is true or (event_schema_version = 1 and correct is null and grade >= 4)))::int,
\t\t       count(*) filter (where is_today and answer_mode is null)::int,
\t\t       count(*) filter (where is_today and answer_mode is null and grade >= 4)::int,
\t\t       count(*) filter (where answer_mode is null)::int,
\t\t       count(*) filter (where answer_mode is null and grade >= 4)::int
\t\tfrom events
\t`, userID, timezoneOffsetMinutes).Scan(
\t\t&result.ReviewsToday,
\t\t&result.ObjectiveReviewsToday,
\t\t&result.ObjectiveSuccessfulToday,
\t\t&result.ReviewsTotal,
\t\t&result.Modes.Study.AttemptsToday,
\t\t&result.Modes.Study.SuccessfulToday,
\t\t&result.Modes.Study.AttemptsTotal,
\t\t&result.Modes.Study.SuccessfulTotal,
\t\t&result.Modes.Recall.AttemptsToday,
\t\t&result.Modes.Recall.SuccessfulToday,
\t\t&result.Modes.Recall.AttemptsTotal,
\t\t&result.Modes.Recall.SuccessfulTotal,
\t\t&result.Modes.Choice.AttemptsToday,
\t\t&result.Modes.Choice.SuccessfulToday,
\t\t&result.Modes.Choice.AttemptsTotal,
\t\t&result.Modes.Choice.SuccessfulTotal,
\t\t&result.Modes.Legacy.AttemptsToday,
\t\t&result.Modes.Legacy.SuccessfulToday,
\t\t&result.Modes.Legacy.AttemptsTotal,
\t\t&result.Modes.Legacy.SuccessfulTotal,
\t); err != nil {
\t\treturn ProgressSummary{}, fmt.Errorf("query review progress: %w", err)
\t}
\tresult.SuccessfulToday = result.ObjectiveSuccessfulToday

\tif err := r.pool.QueryRow(ctx, `
\t\twith bounds as (
\t\t\tselect date_trunc('week', now() - make_interval(mins => $2)) +
\t\t\t       make_interval(mins => $2) as week_start
\t\t)
\t\tselect count(distinct current_review.word_id)::int,
\t\t       count(distinct current_review.word_id) filter (where word.kind = 'word')::int,
\t\t       count(distinct current_review.word_id) filter (where word.kind = 'phrase')::int
\t\tfrom review_events current_review
\t\tjoin words word on word.id = current_review.word_id
\t\tcross join bounds
\t\twhere current_review.user_id = $1::uuid
\t\t  and current_review.grade = 5
\t\t  and current_review.reviewed_at >= bounds.week_start
\t\t  and (
\t\t      current_review.answer_mode is null
\t\t      or (current_review.answer_mode in ('recall', 'choice') and (
\t\t          current_review.correct is true
\t\t          or (current_review.event_schema_version = 1 and current_review.correct is null)
\t\t      ))
\t\t  )
\t\t  and exists (
\t\t\tselect 1
\t\t\tfrom review_events previous_review
\t\t\twhere previous_review.user_id = current_review.user_id
\t\t\t  and previous_review.word_id = current_review.word_id
\t\t\t  and previous_review.grade = 5
\t\t\t  and previous_review.reviewed_at < bounds.week_start
\t\t\t  and (
\t\t\t      previous_review.answer_mode is null
\t\t\t      or (previous_review.answer_mode in ('recall', 'choice') and (
\t\t\t          previous_review.correct is true
\t\t\t          or (previous_review.event_schema_version = 1 and previous_review.correct is null)
\t\t\t      ))
\t\t\t  )
\t\t  )
\t`, userID, timezoneOffsetMinutes).Scan(
\t\t&result.RetainedItemsWeek,
\t\t&result.RetainedWordsWeek,
\t\t&result.RetainedPhrasesWeek,
\t); err != nil {
\t\treturn ProgressSummary{}, fmt.Errorf("query retained learning progress: %w", err)
\t}

\tif err := r.pool.QueryRow(ctx, `
\t\tselect coalesce(
\t\t\t(select daily_goal from user_learning_preferences where user_id = $1::uuid),
\t\t\t30
\t\t)
\t`, userID).Scan(&result.DailyGoal); err != nil {
\t\treturn ProgressSummary{}, fmt.Errorf("query daily goal: %w", err)
\t}

\trows, err := r.pool.Query(ctx, `
\t\tselect distinct (reviewed_at - make_interval(mins => $2))::date as review_day
\t\tfrom review_events
\t\twhere user_id = $1::uuid
\t\torder by review_day desc
\t\tlimit 730
\t`, userID, timezoneOffsetMinutes)
\tif err != nil {
\t\treturn ProgressSummary{}, fmt.Errorf("query review days: %w", err)
\t}
\tdefer rows.Close()

\tdays := make([]time.Time, 0, 32)
\tfor rows.Next() {
\t\tvar day time.Time
\t\tif err := rows.Scan(&day); err != nil {
\t\t\treturn ProgressSummary{}, fmt.Errorf("scan review day: %w", err)
\t\t}
\t\tdays = append(days, dateOnly(day))
\t}
\tif err := rows.Err(); err != nil {
\t\treturn ProgressSummary{}, fmt.Errorf("iterate review days: %w", err)
\t}

\tlocalNow := time.Now().UTC().Add(-time.Duration(timezoneOffsetMinutes) * time.Minute)
\tresult.CurrentStreak, result.LongestStreak = calculateStreaks(days, dateOnly(localNow))
\treturn result, nil
}'''

regex_once(
    "backend/internal/learning/repository.go",
    r"func \(r \*Repository\) ReviewWord\([\s\S]*?\n}\n\nfunc \(r \*Repository\) Progress",
    review_word + "\n\nfunc (r *Repository) Progress",
)
regex_once(
    "backend/internal/learning/repository.go",
    r"func \(r \*Repository\) Progress\([\s\S]*?\n}\n\nfunc \(r \*Repository\) SetDailyGoal",
    progress_fn + "\n\nfunc (r *Repository) SetDailyGoal",
)

replace_once(
    "backend/internal/learning/lesson_repository.go",
    '\tErrLessonItemOutOfOrder      = errors.New("lesson item is not the current item")',
    '\tErrLessonItemOutOfOrder      = errors.New("lesson item is not the current item")\n\tErrLessonModeMismatch        = errors.New("lesson answer mode does not match session")',
)
lesson_review = r'''func (r *Repository) ReviewLessonWord(
\tctx context.Context,
\tuserID string,
\tlessonID string,
\twordID int64,
\trequest ReviewRequest,
) (LessonReviewResult, error) {
\ttx, err := r.pool.Begin(ctx)
\tif err != nil {
\t\treturn LessonReviewResult{}, fmt.Errorf("begin lesson review transaction: %w", err)
\t}
\tdefer func() { _ = tx.Rollback(ctx) }()

\tvar lockedLessonID string
\tvar currentIndex int
\tvar lessonMode AnswerMode
\tif err := tx.QueryRow(ctx, `
\t\tselect id::text, current_index, study_mode
\t\tfrom lesson_sessions
\t\twhere id = $1::uuid and user_id = $2::uuid and status = 'active'
\t\tfor update
\t`, lessonID, userID).Scan(&lockedLessonID, &currentIndex, &lessonMode); err != nil {
\t\tif errors.Is(err, pgx.ErrNoRows) {
\t\t\treturn LessonReviewResult{}, ErrLessonItemNotFound
\t\t}
\t\treturn LessonReviewResult{}, fmt.Errorf("lock lesson: %w", err)
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
\t\tselect status, easiness::float8, interval_days, repetitions
\t\tfrom user_words
\t\twhere user_id = $1::uuid and word_id = $2
\t\tfor update
\t`, userID, wordID).Scan(&state.Status, &state.Easiness, &state.IntervalDays, &state.Repetitions); err != nil {
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
\tdueAt := now.Add(schedule.DueAfter)

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

\tif _, err := tx.Exec(ctx, `
\t\tupdate lesson_sessions
\t\tset current_index = $3,
\t\t    status = case when $4 then 'completed' else 'active' end,
\t\t    completed_at = case when $4 then $5::timestamptz else null::timestamptz end,
\t\t    updated_at = $5::timestamptz
\t\twhere id = $1::uuid and user_id = $2::uuid
\t`, lessonID, userID, nextIndex, completed, now); err != nil {
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
\t\tLessonCompleted:     completed,
\t\tLessonReviewedItems: reviewedItems,
\t\tLessonSkippedItems:  0,
\t\tLessonTotalItems:    totalItems,
\t}, nil
}'''
regex_once(
    "backend/internal/learning/lesson_repository.go",
    r"func \(r \*Repository\) ReviewLessonWord\([\s\S]*?\n}\n\nfunc \(r \*Repository\) lessonByID",
    lesson_review + "\n\nfunc (r *Repository) lessonByID",
)

write("backend/internal/platform/migrate/migrations/000007_learning_event_modes.up.sql", '''alter table review_events
    drop constraint review_events_answer_mode_chk;

alter table review_events
    add constraint review_events_answer_mode_chk
        check (answer_mode is null or answer_mode in ('study', 'recall', 'choice')),
    add column answer_revealed boolean,
    add column event_schema_version smallint;

update review_events
set event_schema_version = 1
where event_schema_version is null;

alter table review_events
    alter column event_schema_version set not null,
    alter column event_schema_version set default 2,
    add constraint review_events_event_schema_version_chk
        check (event_schema_version in (1, 2));

alter table lesson_sessions
    drop constraint lesson_sessions_study_mode_chk;

alter table lesson_sessions
    add constraint lesson_sessions_study_mode_chk
        check (study_mode in ('study', 'recall', 'choice'));

create index review_events_user_mode_time_idx
    on review_events (user_id, answer_mode, reviewed_at desc);

comment on column review_events.rating is
    'User self-assessment: again, almost or known.';
comment on column review_events.answer_mode is
    'Exercise mode. NULL identifies pre-mode legacy events.';
comment on column review_events.correct is
    'Objective correctness. Must remain NULL for study mode.';
comment on column review_events.answer_revealed is
    'Whether the answer was visible before the attempt was persisted; unknown for schema v1.';
comment on column review_events.event_schema_version is
    'Version 1 is historical data; version 2 stores mode, self-assessment, answer visibility and objective correctness separately.';
''')

write("docs/learning-event-schema.md", '''# Learning event schema v2

## Purpose

A learning event separates four facts that were previously conflated:

1. `answer_mode` — `study`, `recall`, or `choice`;
2. `rating` — the learner's self-assessment (`again`, `almost`, `known`);
3. `correct` — objective correctness for recall/choice, never for study;
4. `answer_revealed` — whether the answer was visible before persistence.

New events are stored with `event_schema_version = 2`.

## Scheduling

`recall` and `choice` use the existing spaced-repetition transition. `study` is an exposure/self-assessment event: it can move a new item into `learning` and schedule a near-term objective attempt, but it does not increase repetitions, easiness, review status, or mastery.

## Analytics

- `reviewsToday` and `reviewsTotal` remain activity counters and include all modes.
- `successfulToday` is retained as a compatibility alias for `objectiveSuccessfulToday`.
- `objectiveReviewsToday` includes recall, choice, and legacy attempts, but excludes study.
- `modes` returns separate today/total attempt and success counts for study, recall, choice, and legacy data.
- Study success is always zero because passive exposure has no objective correctness.
- Retained items require a successful objective current attempt and a successful objective attempt before the current week. Study events are excluded.

## Backward compatibility

Rows written before migration `000007` receive `event_schema_version = 1`.

- `answer_mode IS NULL` is reported as `legacy` because the original mode cannot be reconstructed.
- Schema-v1 recall/choice rows with `correct IS NULL` retain their historical grade-based success semantics.
- Omitting `answerMode` in an API request remains accepted for pre-v2 clients and is normalized to `recall`.
- Existing response fields remain present; new clients should use `objectiveReviewsToday`, `objectiveSuccessfulToday`, and `modes` for accuracy.
''')

write("backend/internal/learning/scheduler_test.go", '''package learning

import (
\t"testing"
\t"time"
)

func TestScheduleReviewAgainReturnsSoon(t *testing.T) {
\tschedule, err := ScheduleReview(ReviewState{Status: "review", Easiness: 2.5, IntervalDays: 6, Repetitions: 2}, RatingAgain)
\tif err != nil {
\t\tt.Fatal(err)
\t}
\tif schedule.Grade != 1 || schedule.Status != "learning" || schedule.Repetitions != 0 || schedule.IntervalDays != 0 {
\t\tt.Fatalf("unexpected schedule: %+v", schedule)
\t}
\tif schedule.DueAfter != 10*time.Minute {
\t\tt.Fatalf("DueAfter = %s, want 10m", schedule.DueAfter)
\t}
}

func TestScheduleReviewKnownExpandsInterval(t *testing.T) {
\tfirst, err := ScheduleReview(ReviewState{Status: "new", Easiness: 2.5}, RatingKnown)
\tif err != nil {
\t\tt.Fatal(err)
\t}
\tif first.IntervalDays != 2 || first.Repetitions != 1 {
\t\tt.Fatalf("first known schedule = %+v", first)
\t}

\tsecond, err := ScheduleReview(ReviewState{
\t\tStatus: "review", Easiness: first.Easiness, IntervalDays: first.IntervalDays, Repetitions: first.Repetitions,
\t}, RatingKnown)
\tif err != nil {
\t\tt.Fatal(err)
\t}
\tif second.IntervalDays != 6 || second.Repetitions != 2 || second.Status != "review" {
\t\tt.Fatalf("second known schedule = %+v", second)
\t}
}

func TestScheduleReviewAlmostUsesModerateInterval(t *testing.T) {
\tschedule, err := ScheduleReview(ReviewState{Status: "review", Easiness: 2.5, IntervalDays: 6, Repetitions: 2}, RatingAlmost)
\tif err != nil {
\t\tt.Fatal(err)
\t}
\tif schedule.Grade != 3 || schedule.IntervalDays != 9 || schedule.Status != "review" {
\t\tt.Fatalf("unexpected schedule: %+v", schedule)
\t}
}

func TestScheduleStudyDoesNotAdvanceRecallState(t *testing.T) {
\tstate := ReviewState{Status: "review", Easiness: 2.7, IntervalDays: 14, Repetitions: 4}
\tschedule, err := ScheduleAttempt(state, RatingKnown, AnswerModeStudy)
\tif err != nil {
\t\tt.Fatal(err)
\t}
\tif schedule.Status != state.Status || schedule.Easiness != state.Easiness || schedule.IntervalDays != state.IntervalDays || schedule.Repetitions != state.Repetitions {
\t\tt.Fatalf("study mutated recall state: state=%+v schedule=%+v", state, schedule)
\t}
\tif schedule.DueAfter != 24*time.Hour || schedule.Grade != 5 {
\t\tt.Fatalf("unexpected study schedule: %+v", schedule)
\t}
}

func TestScheduleStudyIntroducesNewItemWithoutMastering(t *testing.T) {
\tschedule, err := ScheduleAttempt(ReviewState{Status: "new", Easiness: 2.5}, RatingKnown, AnswerModeStudy)
\tif err != nil {
\t\tt.Fatal(err)
\t}
\tif schedule.Status != "learning" || schedule.Repetitions != 0 || schedule.IntervalDays != 0 {
\t\tt.Fatalf("new study schedule = %+v", schedule)
\t}
}

func TestScheduleAttemptRejectsUnknownMode(t *testing.T) {
\tif _, err := ScheduleAttempt(ReviewState{}, RatingKnown, AnswerMode("video")); err != ErrInvalidAnswerMode {
\t\tt.Fatalf("error = %v, want ErrInvalidAnswerMode", err)
\t}
}

func TestScheduleReviewRejectsUnknownRating(t *testing.T) {
\tif _, err := ScheduleReview(ReviewState{}, Rating("easy")); err == nil {
\t\tt.Fatal("expected invalid rating error")
\t}
}
''')

write("backend/integration/review_modes_test.go", '''//go:build integration

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

func TestLearningReviewModesAndAnalytics(t *testing.T) {
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
\tif _, err := pg.Exec(ctx, "truncate table lesson_session_items, lesson_sessions, user_learning_preferences, review_events, user_words, refresh_tokens, words, users restart identity cascade"); err != nil {
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
\t\tAppEnv:            "test",
\t\tHTTPAddr:          ":0",
\t\tLogLevel:          "error",
\t\tCORSAllowedOrigin: "http://test.local",
\t\tPostgresDSN:       requiredEnv(t, "TEST_POSTGRES_DSN"),
\t\tRedis:             config.Redis{Addr: requiredEnv(t, "TEST_REDIS_ADDR")},
\t\tJWTSecret:         "integration-test-secret-with-at-least-32-bytes",
\t\tAccessTokenTTL:    15 * time.Minute,
\t\tRefreshTokenTTL:   24 * time.Hour,
\t}
\tapp, err := server.New(cfg, slog.New(slog.NewTextHandler(io.Discard, nil)), pg, rdb)
\tif err != nil {
\t\tt.Fatalf("server.New() error = %v", err)
\t}
\ttestServer := httptest.NewServer(app.Handler())
\tdefer testServer.Close()

\tregistered := postJSON[integrationAuthResponse](t, testServer.URL+"/api/v1/auth/register", map[string]string{
\t\t"email": fmt.Sprintf("review-modes-%d@example.com", time.Now().UnixNano()),
\t\t"password": "strong-password",
\t\t"displayName": "Mode Learner",
\t}, http.StatusCreated)

\tvar words struct {
\t\tItems []struct {
\t\t\tID int64 `json:"id"`
\t\t} `json:"items"`
\t}
\tgetAuthenticatedJSON(t, testServer.URL+"/api/v1/words/due?limit=5", registered.Tokens.AccessToken, http.StatusOK, &words)
\tif len(words.Items) < 4 {
\t\tt.Fatalf("due items = %d, want at least 4", len(words.Items))
\t}

\ttype reviewResult struct {
\t\tStatus       string `json:"status"`
\t\tIntervalDays int    `json:"intervalDays"`
\t\tRepetitions  int    `json:"repetitions"`
\t}
\tvar study reviewResult
\tpostAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/words/%d/review", testServer.URL, words.Items[0].ID), registered.Tokens.AccessToken, map[string]any{
\t\t"rating": "known", "responseMs": 900, "answerMode": "study", "answerRevealed": true, "timezoneOffsetMinutes": 0,
\t}, http.StatusOK, &study)
\tif study.Status != "learning" || study.Repetitions != 0 || study.IntervalDays != 0 {
\t\tt.Fatalf("study result = %+v", study)
\t}

\tpostAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/words/%d/review", testServer.URL, words.Items[0].ID), registered.Tokens.AccessToken, map[string]any{
\t\t"rating": "known", "answerMode": "study", "answerRevealed": true, "correct": true, "timezoneOffsetMinutes": 0,
\t}, http.StatusUnprocessableEntity, nil)

\tpostAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/words/%d/review", testServer.URL, words.Items[1].ID), registered.Tokens.AccessToken, map[string]any{
\t\t"rating": "known", "responseMs": 1100, "answerMode": "recall", "answerRevealed": true, "correct": true, "timezoneOffsetMinutes": 0,
\t}, http.StatusOK, &reviewResult{})
\tpostAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/words/%d/review", testServer.URL, words.Items[2].ID), registered.Tokens.AccessToken, map[string]any{
\t\t"rating": "known", "responseMs": 800, "answerMode": "choice", "answerRevealed": false, "correct": true, "timezoneOffsetMinutes": 0,
\t}, http.StatusOK, &reviewResult{})

\tvar mode string
\tvar correct *bool
\tvar answerRevealed *bool
\tvar schemaVersion int
\tif err := pg.QueryRow(ctx, `
\t\tselect answer_mode, correct, answer_revealed, event_schema_version
\t\tfrom review_events
\t\twhere user_id = $1::uuid and word_id = $2
\t\torder by id desc
\t\tlimit 1
\t`, registered.User.ID, words.Items[0].ID).Scan(&mode, &correct, &answerRevealed, &schemaVersion); err != nil {
\t\tt.Fatalf("query study event: %v", err)
\t}
\tif mode != "study" || correct != nil || answerRevealed == nil || !*answerRevealed || schemaVersion != 2 {
\t\tt.Fatalf("study event mode=%q correct=%v answerRevealed=%v schema=%d", mode, correct, answerRevealed, schemaVersion)
\t}

\tfor index, attemptMode := range []string{"study", "recall", "choice"} {
\t\twordID := words.Items[index].ID
\t\tvar objectiveCorrect any
\t\tif attemptMode != "study" {
\t\t\tobjectiveCorrect = true
\t\t}
\t\tif _, err := pg.Exec(ctx, `
\t\t\tinsert into review_events(
\t\t\t\tuser_id, word_id, grade, response_ms, reviewed_at, rating, answer_mode, correct,
\t\t\t\tanswer_revealed, event_schema_version
\t\t\t) values ($1::uuid, $2, 5, 1000, now() - interval '8 days', 'known', $3, $4, true, 2)
\t\t`, registered.User.ID, wordID, attemptMode, objectiveCorrect); err != nil {
\t\t\tt.Fatalf("insert previous %s event: %v", attemptMode, err)
\t\t}
\t}

\tvar progress struct {
\t\tReviewsToday             int `json:"reviewsToday"`
\t\tSuccessfulToday          int `json:"successfulToday"`
\t\tObjectiveReviewsToday    int `json:"objectiveReviewsToday"`
\t\tObjectiveSuccessfulToday int `json:"objectiveSuccessfulToday"`
\t\tRetainedItemsWeek        int `json:"retainedItemsWeek"`
\t\tEventSchemaVersion       int `json:"eventSchemaVersion"`
\t\tModes                    struct {
\t\t\tStudy struct {
\t\t\t\tAttemptsToday int `json:"attemptsToday"`
\t\t\t} `json:"study"`
\t\t\tRecall struct {
\t\t\t\tAttemptsToday   int `json:"attemptsToday"`
\t\t\t\tSuccessfulToday int `json:"successfulToday"`
\t\t\t} `json:"recall"`
\t\t\tChoice struct {
\t\t\t\tAttemptsToday   int `json:"attemptsToday"`
\t\t\t\tSuccessfulToday int `json:"successfulToday"`
\t\t\t} `json:"choice"`
\t\t} `json:"modes"`
\t}
\tgetAuthenticatedJSON(t, testServer.URL+"/api/v1/progress?timezoneOffsetMinutes=0", registered.Tokens.AccessToken, http.StatusOK, &progress)
\tif progress.ReviewsToday != 3 || progress.ObjectiveReviewsToday != 2 || progress.ObjectiveSuccessfulToday != 2 || progress.SuccessfulToday != 2 {
\t\tt.Fatalf("objective progress = %+v", progress)
\t}
\tif progress.Modes.Study.AttemptsToday != 1 || progress.Modes.Recall.AttemptsToday != 1 || progress.Modes.Recall.SuccessfulToday != 1 || progress.Modes.Choice.AttemptsToday != 1 || progress.Modes.Choice.SuccessfulToday != 1 {
\t\tt.Fatalf("mode progress = %+v", progress.Modes)
\t}
\tif progress.RetainedItemsWeek != 2 || progress.EventSchemaVersion != 2 {
\t\tt.Fatalf("retained/schema progress = %+v", progress)
\t}

\tvar lesson struct {
\t\tID        string `json:"id"`
\t\tStudyMode string `json:"studyMode"`
\t}
\tpostAuthenticatedJSON(t, testServer.URL+"/api/v1/lessons", registered.Tokens.AccessToken, map[string]any{
\t\t"source": "mixed", "studyMode": "study", "lessonSize": "15", "wordIds": []int64{words.Items[3].ID},
\t}, http.StatusCreated, &lesson)
\tif lesson.StudyMode != "study" {
\t\tt.Fatalf("lesson studyMode = %q, want study", lesson.StudyMode)
\t}

\tlessonReviewURL := fmt.Sprintf("%s/api/v1/lessons/%s/words/%d/review", testServer.URL, lesson.ID, words.Items[3].ID)
\tpostAuthenticatedJSON(t, lessonReviewURL, registered.Tokens.AccessToken, map[string]any{
\t\t"rating": "known", "answerMode": "recall", "answerRevealed": true, "correct": true, "timezoneOffsetMinutes": 0,
\t}, http.StatusConflict, nil)
\tpostAuthenticatedJSON(t, lessonReviewURL, registered.Tokens.AccessToken, map[string]any{
\t\t"rating": "known", "answerMode": "study", "answerRevealed": true, "timezoneOffsetMinutes": 0,
\t}, http.StatusOK, &struct{}{})
}
''')

write("frontend/lib/progress.ts", '''export type ModeProgress = {
  attemptsToday: number;
  successfulToday: number;
  attemptsTotal: number;
  successfulTotal: number;
};

export type ProgressModes = {
  study: ModeProgress;
  recall: ModeProgress;
  choice: ModeProgress;
  legacy: ModeProgress;
};

export type ProgressSummary = {
  dueNow: number;
  dueWords: number;
  duePhrases: number;
  totalWords: number;
  totalPhrases: number;
  newWords: number;
  learningWords: number;
  reviewWords: number;
  masteredWords: number;
  masteredPhrases: number;
  reviewsToday: number;
  successfulToday: number;
  objectiveReviewsToday?: number;
  objectiveSuccessfulToday?: number;
  reviewsTotal: number;
  dailyGoal: number;
  currentStreak: number;
  longestStreak: number;
  retainedItemsWeek: number;
  retainedWordsWeek: number;
  retainedPhrasesWeek: number;
  eventSchemaVersion?: number;
  modes?: ProgressModes;
  nextDueAt?: string;
};

export type ReviewRating = "again" | "almost" | "known";
export type AnswerMode = "study" | "recall" | "choice";

export type ReviewResult = {
  wordId: number;
  status: string;
  easiness: number;
  intervalDays: number;
  repetitions: number;
  dueAt: string;
  lastReviewedAt: string;
};

const EMPTY_MODE: ModeProgress = {
  attemptsToday: 0,
  successfulToday: 0,
  attemptsTotal: 0,
  successfulTotal: 0,
};

export function normalizedProgressModes(progress: ProgressSummary | null): ProgressModes {
  return progress?.modes ?? {
    study: { ...EMPTY_MODE },
    recall: { ...EMPTY_MODE },
    choice: { ...EMPTY_MODE },
    legacy: { ...EMPTY_MODE },
  };
}

export function objectiveSuccessRate(progress: ProgressSummary | null): number {
  if (!progress) return 0;
  const attempts = progress.objectiveReviewsToday ?? progress.reviewsToday;
  const successful = progress.objectiveSuccessfulToday ?? progress.successfulToday;
  return attempts > 0 ? Math.round((successful / attempts) * 100) : 0;
}

export function goalPercent(progress: ProgressSummary | null): number {
  if (!progress || progress.dailyGoal <= 0) return 0;
  return Math.min(100, Math.round((progress.reviewsToday / progress.dailyGoal) * 100));
}

export function ratingLabel(rating: ReviewRating): string {
  if (rating === "known") return "Знал";
  if (rating === "almost") return "Почти";
  return "Не знал";
}
''')

write("frontend/lib/progress.test.ts", '''import { describe, expect, it } from "vitest";

import {
  goalPercent,
  normalizedProgressModes,
  objectiveSuccessRate,
  ratingLabel,
  type ProgressSummary,
} from "./progress";

function progress(reviewsToday: number, dailyGoal: number): ProgressSummary {
  return {
    dueNow: 0,
    dueWords: 0,
    duePhrases: 0,
    totalWords: 579,
    totalPhrases: 24,
    newWords: 0,
    learningWords: 0,
    reviewWords: 0,
    masteredWords: 0,
    masteredPhrases: 0,
    reviewsToday,
    successfulToday: 0,
    reviewsTotal: 0,
    dailyGoal,
    currentStreak: 0,
    longestStreak: 0,
    retainedItemsWeek: 0,
    retainedWordsWeek: 0,
    retainedPhrasesWeek: 0,
  };
}

describe("progress helpers", () => {
  it("caps completed goals at one hundred percent", () => {
    expect(goalPercent(progress(45, 30))).toBe(100);
  });

  it("calculates partial daily progress", () => {
    expect(goalPercent(progress(9, 30))).toBe(30);
  });

  it("uses objective attempts instead of passive study in success rate", () => {
    expect(objectiveSuccessRate({
      ...progress(5, 30),
      successfulToday: 2,
      objectiveReviewsToday: 2,
      objectiveSuccessfulToday: 2,
    })).toBe(100);
  });

  it("falls back to v1 progress fields during rolling deployments", () => {
    expect(objectiveSuccessRate({ ...progress(4, 30), successfulToday: 3 })).toBe(75);
    expect(normalizedProgressModes(progress(1, 30)).study.attemptsToday).toBe(0);
  });

  it("uses user-facing rating labels", () => {
    expect(ratingLabel("again")).toBe("Не знал");
    expect(ratingLabel("almost")).toBe("Почти");
    expect(ratingLabel("known")).toBe("Знал");
  });
});
''')

premium = "frontend/components/lexigo-premium-app.tsx"
replace_once(premium, '  goalPercent,\n  ratingLabel,', '  goalPercent,\n  normalizedProgressModes,\n  objectiveSuccessRate,\n  ratingLabel,')
replace_once(premium, 'type StudyMode = AnswerMode | "study" | "all";', 'type StudyMode = AnswerMode | "all";')
replace_once(premium, 'const PRESENTATION_PREFIX = "lexigo.lesson.presentation.";\n', '')
regex_once(premium, r"function presentationKey\([\s\S]*?function clearPresentationMode\(lessonID: string\) \{\n  window\.localStorage\.removeItem\(presentationKey\(lessonID\)\);\n}\n\n", '')
replace_once(premium, '    const presentationMode = readPresentationMode(lesson.id, lesson.studyMode);', '    const presentationMode = lesson.studyMode;')
source = (ROOT / premium).read_text(encoding="utf-8")
source = source.replace('      clearPresentationMode(activeLesson.id);\n', '')
source = source.replace('        storePresentationMode(result.data.id, resolvedMode);\n', '')
if 'clearPresentationMode' in source or 'storePresentationMode' in source or 'readPresentationMode' in source or 'PRESENTATION_PREFIX' in source:
    raise RuntimeError("presentation-mode compatibility layer was not fully removed")
(ROOT / premium).write_text(source, encoding="utf-8")
replace_once(
    premium,
    '''        const backendMode: AnswerMode = resolvedMode === "choice" ? "choice" : "recall";
        const result = await authorizedRequest<LessonSessionResponse>(''',
    '''        const backendMode: AnswerMode = resolvedMode;
        const result = await authorizedRequest<LessonSessionResponse>(''',
)
replace_once(
    premium,
    '''      const path = activeLesson
        ? `/api/v1/lessons/${activeLesson.id}/words/${currentItem.wordId}/review`
        : `/api/v1/words/${currentItem.wordId}/review`;''',
    '''      const reviewMode: AnswerMode = studyMode === "all" ? "study" : studyMode;
      const path = activeLesson
        ? `/api/v1/lessons/${activeLesson.id}/words/${currentItem.wordId}/review`
        : `/api/v1/words/${currentItem.wordId}/review`;''',
)
replace_once(
    premium,
    '''          answerMode: studyMode === "choice" ? "choice" : "recall",
          correct,''',
    '''          answerMode: reviewMode,
          answerRevealed: revealed || reviewMode === "study",
          ...(reviewMode === "study" ? {} : { correct }),''',
)
replace_once(
    premium,
    '''  const successRate = progress && progress.reviewsToday > 0
    ? Math.round((progress.successfulToday / progress.reviewsToday) * 100)
    : 0;''',
    '''  const successRate = objectiveSuccessRate(progress);''',
)
replace_once(
    premium,
    '''    const cards = [
      { label: "Сегодня", value: `${progress.reviewsToday} / ${progress.dailyGoal}`, hint: `${goalPercent(progress)}% цели`, color: "purple" },
      { label: "Успешность", value: `${successRate}%`, hint: `${progress.successfulToday} успешных ответов`, color: "green" },
      { label: "Retained items", value: String(progress.retainedItemsWeek), hint: `${progress.retainedWordsWeek} слов · ${progress.retainedPhrasesWeek} фраз`, color: "blue" },
      { label: "Текущая серия", value: `${progress.currentStreak} дн.`, hint: `рекорд ${progress.longestStreak}`, color: "orange" },
    ];''',
    '''    const modes = normalizedProgressModes(progress);
    const cards = [
      { label: "Сегодня", value: `${progress.reviewsToday} / ${progress.dailyGoal}`, hint: `${goalPercent(progress)}% цели`, color: "purple" },
      { label: "Объективная успешность", value: `${successRate}%`, hint: `${progress.objectiveSuccessfulToday ?? progress.successfulToday} из ${progress.objectiveReviewsToday ?? progress.reviewsToday} попыток`, color: "green" },
      { label: "Retained items", value: String(progress.retainedItemsWeek), hint: `${progress.retainedWordsWeek} слов · ${progress.retainedPhrasesWeek} фраз`, color: "blue" },
      { label: "Текущая серия", value: `${progress.currentStreak} дн.`, hint: `рекорд ${progress.longestStreak}`, color: "orange" },
    ];''',
)
replace_once(
    premium,
    '''        <section className="lx-stat-grid">{cards.map((card) => <article key={card.label}><span>{card.label}</span><strong className={card.color}>{card.value}</strong><small>{card.hint}</small></article>)}</section>
        <section className="lx-progress-detail">''',
    '''        <section className="lx-stat-grid">{cards.map((card) => <article key={card.label}><span>{card.label}</span><strong className={card.color}>{card.value}</strong><small>{card.hint}</small></article>)}</section>
        <section className="lx-summary-panel" aria-label="Попытки по режимам">
          <div><span>Изучение</span><strong>{modes.study.attemptsToday}</strong><small>показ ответа · не active recall</small></div>
          <div><span>Recall</span><strong>{modes.recall.successfulToday} / {modes.recall.attemptsToday}</strong><small>объективно верные сегодня</small></div>
          <div><span>Выбор варианта</span><strong>{modes.choice.successfulToday} / {modes.choice.attemptsToday}</strong><small>объективно верные сегодня</small></div>
          <div><span>Legacy</span><strong>{modes.legacy.attemptsTotal}</strong><small>исторические события без точного режима</small></div>
        </section>
        <section className="lx-progress-detail">''',
)

write("frontend/e2e/lesson-flow.spec.ts", '''import { expect, test, type Page } from "@playwright/test";

type LessonMode = "study" | "recall" | "choice";

type MockLesson = {
  reviewCalls: () => number;
  lessonRequests: () => Array<Record<string, unknown>>;
  reviewRequests: () => Array<Record<string, unknown>>;
};

const SESSION = {
  user: {
    id: "00000000-0000-0000-0000-000000000035",
    email: "lesson@example.com",
    displayName: "Lesson Tester",
    createdAt: "2026-01-01T00:00:00Z",
  },
  tokens: { accessToken: "e2e-access-token", tokenType: "Bearer", expiresIn: 900 },
};

const EMPTY_MODE = { attemptsToday: 0, successfulToday: 0, attemptsTotal: 0, successfulTotal: 0 };
const WORDS = [
  { id: 101, lemma: "absolute", translation: "абсолютный", phonetic: "/ˈæbsəluːt/", partOfSpeech: "adjective", topic: "General", examples: ["The value is absolute."], note: "", status: "new" },
  { id: 102, lemma: "build", translation: "собирать", phonetic: "/bɪld/", partOfSpeech: "verb", topic: "Development", examples: ["Build the service."], note: "", status: "new" },
  { id: 103, lemma: "cache", translation: "кэш", phonetic: "/kæʃ/", partOfSpeech: "noun", topic: "Backend", examples: ["Clear the cache."], note: "", status: "new" },
  { id: 104, lemma: "durable", translation: "надёжный", phonetic: "/ˈdjʊərəbl/", partOfSpeech: "adjective", topic: "Data", examples: ["Use durable storage."], note: "", status: "new" },
];

const PROGRESS = {
  dueNow: 0,
  dueWords: 0,
  duePhrases: 0,
  totalWords: 4,
  totalPhrases: 0,
  newWords: 4,
  learningWords: 0,
  reviewWords: 0,
  masteredWords: 0,
  masteredPhrases: 0,
  reviewsToday: 0,
  successfulToday: 0,
  objectiveReviewsToday: 0,
  objectiveSuccessfulToday: 0,
  reviewsTotal: 0,
  dailyGoal: 30,
  currentStreak: 0,
  longestStreak: 0,
  retainedItemsWeek: 0,
  retainedWordsWeek: 0,
  retainedPhrasesWeek: 0,
  eventSchemaVersion: 2,
  modes: { study: EMPTY_MODE, recall: EMPTY_MODE, choice: EMPTY_MODE, legacy: EMPTY_MODE },
};

function lessonItems(count: number) {
  return WORDS.slice(0, count).map((item, position) => ({ ...item, kind: "word", position }));
}

async function installLessonAPI(page: Page, itemCount: number, reviewDelayMs = 0): Promise<MockLesson> {
  let reviewCalls = 0;
  let reviewedItems = 0;
  const selectedItems = lessonItems(itemCount);
  const lessonRequests: Array<Record<string, unknown>> = [];
  const reviewRequests: Array<Record<string, unknown>> = [];

  await page.context().addCookies([{
    name: "lexigo_csrf",
    value: "e2e-csrf-token",
    url: "http://127.0.0.1:3000",
    sameSite: "Lax",
  }]);

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (path === "/api/v1/auth/refresh") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(SESSION) });
      return;
    }
    if (path === "/api/v1/progress") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PROGRESS) });
      return;
    }
    if ((path === "/api/v1/words" || path === "/api/v1/words/due") && url.searchParams.get("kind") === "phrase") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [], count: 0 }) });
      return;
    }
    if (path === "/api/v1/words" || path === "/api/v1/words/due") {
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: WORDS, count: WORDS.length }) });
      return;
    }
    if (path === "/api/v1/lessons/active") {
      await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: { code: "not_found", message: "active lesson was not found" } }) });
      return;
    }
    if (path === "/api/v1/lessons" && request.method() === "POST") {
      const payload = request.postDataJSON() as Record<string, unknown>;
      lessonRequests.push(payload);
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          id: "00000000-0000-0000-0000-000000000350",
          source: "mixed",
          studyMode: payload.studyMode,
          lessonSize: String(itemCount),
          currentIndex: 0,
          status: "active",
          items: selectedItems,
          createdAt: "2026-07-17T00:00:00Z",
          updatedAt: "2026-07-17T00:00:00Z",
        }),
      });
      return;
    }
    if (path.endsWith("/review") && request.method() === "POST") {
      reviewCalls += 1;
      reviewRequests.push(request.postDataJSON() as Record<string, unknown>);
      if (reviewDelayMs > 0) await new Promise((resolve) => setTimeout(resolve, reviewDelayMs));
      reviewedItems += 1;
      const completed = reviewedItems === itemCount;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          wordId: selectedItems[Math.min(reviewedItems - 1, selectedItems.length - 1)].id,
          status: "learning",
          easiness: 2.5,
          intervalDays: 1,
          repetitions: reviewedItems,
          dueAt: "2026-07-18T00:00:00Z",
          lastReviewedAt: "2026-07-17T00:00:00Z",
          lessonId: "00000000-0000-0000-0000-000000000350",
          lessonCurrentIndex: reviewedItems,
          lessonCompleted: completed,
          lessonReviewedItems: reviewedItems,
          lessonSkippedItems: 0,
          lessonTotalItems: itemCount,
        }),
      });
      return;
    }

    await route.fulfill({ status: 404, contentType: "application/json", body: JSON.stringify({ error: { code: "not_mocked", message: path } }) });
  });

  return {
    reviewCalls: () => reviewCalls,
    lessonRequests: () => lessonRequests,
    reviewRequests: () => reviewRequests,
  };
}

async function openLesson(page: Page, mode: LessonMode) {
  await page.goto("/?view=learn");
  await expect(page.getByText("0 элементов готовы")).toBeVisible();

  const modeLabel = mode === "study" ? "Простое изучение слов" : mode === "recall" ? "Вспомнить самому" : "Выбрать вариант";
  await page.getByRole("button", { name: new RegExp(modeLabel) }).click();
  await page.getByRole("button", { name: "Начать урок", exact: true }).click();
  await expect(page).toHaveURL(/view=lesson/);
}

test("study: persists exposure without masquerading as recall", async ({ page }) => {
  const api = await installLessonAPI(page, 2, 350);
  await openLesson(page, "study");
  expect(api.lessonRequests()[0]).toMatchObject({ studyMode: "study" });

  await expect(page.getByText("Слово 1 из 2")).toBeVisible();
  await expect(page.getByRole("button", { name: "Сначала сохраните оценку", exact: true })).toBeDisabled();

  const known = page.getByRole("button", { name: "Знал", exact: true });
  await known.evaluate((element) => {
    const button = element as HTMLButtonElement;
    button.click();
    button.click();
  });
  await expect(page.getByRole("button", { name: "Сохраняем оценку…", exact: true })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Дальше", exact: true })).toBeEnabled();
  expect(api.reviewCalls()).toBe(1);
  expect(api.reviewRequests()[0]).toMatchObject({ answerMode: "study", answerRevealed: true });
  expect(api.reviewRequests()[0]).not.toHaveProperty("correct");

  await page.getByRole("button", { name: "Дальше", exact: true }).click();
  await page.getByRole("button", { name: "Не знал", exact: true }).click();
  await expect(page.getByRole("button", { name: "К результатам", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "К результатам", exact: true }).click();
  await expect(page.getByText("СЕССИЯ ЗАВЕРШЕНА")).toBeVisible();
  await expect(page.getByText(/Знал: 1\. Почти: 0\. Не знал: 1\. Пропущено: 0\./)).toBeVisible();
});

test("recall: sends objective recall data after answer comparison", async ({ page }) => {
  const api = await installLessonAPI(page, 1);
  await openLesson(page, "recall");
  expect(api.lessonRequests()[0]).toMatchObject({ studyMode: "recall" });

  await page.locator("#premium-answer").fill("абсолютный");
  await page.getByRole("button", { name: "Сверить ответ", exact: true }).click();
  await expect(page.getByText("Ответ совпал.")).toBeVisible();
  await page.getByRole("button", { name: "Почти", exact: true }).click();
  expect(api.reviewRequests()[0]).toMatchObject({ answerMode: "recall", correct: true });
  await expect(page.getByRole("button", { name: "К результатам", exact: true })).toBeEnabled();
});

test("choice: keeps choice analytics separate from recall", async ({ page }) => {
  const api = await installLessonAPI(page, 1);
  await openLesson(page, "choice");
  expect(api.lessonRequests()[0]).toMatchObject({ studyMode: "choice" });

  await page.locator(".lx-answer-grid").getByRole("button", { name: "абсолютный", exact: true }).click();
  await expect(page.getByText("Верный вариант.")).toBeVisible();
  await page.getByRole("button", { name: "Знал", exact: true }).click();
  expect(api.reviewRequests()[0]).toMatchObject({ answerMode: "choice", correct: true });
  await expect(page.getByRole("button", { name: "К результатам", exact: true })).toBeEnabled();
});
''')

openapi = ROOT / "api/openapi.yaml"
api = openapi.read_text(encoding="utf-8")
api = api.replace("  version: 0.3.0", "  version: 0.4.0")
api = api.replace("          enum: [recall, choice]", "          enum: [study, recall, choice]", 1)
api = api.replace(
    '''        correct:
          type: [boolean, "null"]
        timezoneOffsetMinutes:''',
    '''        correct:
          type: [boolean, "null"]
          description: Objective correctness for recall/choice. Must be null or omitted for study.
        answerRevealed:
          type: [boolean, "null"]
          description: Whether the answer was visible before persistence. Required as true for study.
        timezoneOffsetMinutes:''',
)
progress_schema = '''    ProgressSummary:
      type: object
      required:
        - dueNow
        - dueWords
        - duePhrases
        - totalWords
        - totalPhrases
        - newWords
        - learningWords
        - reviewWords
        - masteredWords
        - masteredPhrases
        - reviewsToday
        - successfulToday
        - objectiveReviewsToday
        - objectiveSuccessfulToday
        - reviewsTotal
        - dailyGoal
        - currentStreak
        - longestStreak
        - retainedItemsWeek
        - retainedWordsWeek
        - retainedPhrasesWeek
        - eventSchemaVersion
        - modes
      properties:
        dueNow: { type: integer }
        dueWords: { type: integer }
        duePhrases: { type: integer }
        totalWords: { type: integer }
        totalPhrases: { type: integer }
        newWords: { type: integer }
        learningWords: { type: integer }
        reviewWords: { type: integer }
        masteredWords: { type: integer }
        masteredPhrases: { type: integer }
        reviewsToday:
          type: integer
          description: All persisted learning activity, including study exposure.
        successfulToday:
          type: integer
          description: Compatibility alias for objectiveSuccessfulToday.
        objectiveReviewsToday:
          type: integer
          description: Recall, choice and legacy attempts; study is excluded.
        objectiveSuccessfulToday:
          type: integer
        reviewsTotal: { type: integer }
        dailyGoal: { type: integer }
        currentStreak: { type: integer }
        longestStreak: { type: integer }
        retainedItemsWeek: { type: integer }
        retainedWordsWeek: { type: integer }
        retainedPhrasesWeek: { type: integer }
        eventSchemaVersion:
          type: integer
          const: 2
        modes:
          $ref: "#/components/schemas/ProgressModes"
        nextDueAt:
          type: [string, "null"]
          format: date-time
    ModeProgress:
      type: object
      required: [attemptsToday, successfulToday, attemptsTotal, successfulTotal]
      properties:
        attemptsToday: { type: integer }
        successfulToday: { type: integer }
        attemptsTotal: { type: integer }
        successfulTotal: { type: integer }
    ProgressModes:
      type: object
      required: [study, recall, choice, legacy]
      properties:
        study:
          $ref: "#/components/schemas/ModeProgress"
        recall:
          $ref: "#/components/schemas/ModeProgress"
        choice:
          $ref: "#/components/schemas/ModeProgress"
        legacy:
          $ref: "#/components/schemas/ModeProgress"
'''
api, count = re.subn(r"    ProgressSummary:\n[\s\S]*?    Error:\n", progress_schema + "    Error:\n", api, count=1)
if count != 1:
    raise RuntimeError("api/openapi.yaml: ProgressSummary schema not found")
openapi.write_text(api, encoding="utf-8")

# Final source invariants before committing.
for path, forbidden in {
    premium: ['resolvedMode === "choice" ? "choice" : "recall"', 'answerMode: studyMode === "choice" ? "choice" : "recall"'],
    "backend/internal/learning/repository.go": ["ScheduleReview(state, request.Rating)"],
    "backend/internal/learning/lesson_repository.go": ["ScheduleReview(state, request.Rating)"],
}.items():
    text = (ROOT / path).read_text(encoding="utf-8")
    for fragment in forbidden:
        if fragment in text:
            raise RuntimeError(f"{path}: forbidden legacy fragment remains: {fragment}")

print("Issue 38 codemod applied successfully")
