from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(path: str, old: str, new: str) -> None:
    target = ROOT / path
    source = target.read_text(encoding="utf-8")
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one match, found {count}")
    target.write_text(source.replace(old, new), encoding="utf-8")


replace_once(
    "backend/internal/learning/scheduler.go",
    '''type ReviewState struct {
\tStatus       string
\tEasiness     float64
\tIntervalDays int
\tRepetitions  int
}''',
    '''type ReviewState struct {
\tStatus       string
\tEasiness     float64
\tIntervalDays int
\tRepetitions  int
\tDueAt        time.Time
}''',
)
replace_once(
    "backend/internal/learning/scheduler.go",
    '''type Schedule struct {
\tGrade        int
\tStatus       string
\tEasiness     float64
\tIntervalDays int
\tRepetitions  int
\tDueAfter     time.Duration
}''',
    '''type Schedule struct {
\tGrade        int
\tStatus       string
\tEasiness     float64
\tIntervalDays int
\tRepetitions  int
\tDueAfter     time.Duration
\tPreserveDue  bool
}''',
)
replace_once(
    "backend/internal/learning/scheduler.go",
    '''\tstatus := state.Status
\tif status == "" || status == "new" {
\t\tstatus = "learning"
\t}

\tgrade := 0''',
    '''\tstatus := state.Status
\tpreserveDue := status != "" && status != "new"
\tif !preserveDue {
\t\tstatus = "learning"
\t}

\tgrade := 0''',
)
replace_once(
    "backend/internal/learning/scheduler.go",
    '''\t\tRepetitions:  state.Repetitions,
\t\tDueAfter:     dueAfter,
\t}, nil
}''',
    '''\t\tRepetitions:  state.Repetitions,
\t\tDueAfter:     dueAfter,
\t\tPreserveDue:  preserveDue,
\t}, nil
}''',
)

for repository in [
    "backend/internal/learning/repository.go",
    "backend/internal/learning/lesson_repository.go",
]:
    replace_once(
        repository,
        '''select status, easiness::float8, interval_days, repetitions
\t\tfrom user_words''',
        '''select status, easiness::float8, interval_days, repetitions, due_at
\t\tfrom user_words''',
    )
    replace_once(
        repository,
        '''.Scan(&state.Status, &state.Easiness, &state.IntervalDays, &state.Repetitions); err != nil {''',
        '''.Scan(&state.Status, &state.Easiness, &state.IntervalDays, &state.Repetitions, &state.DueAt); err != nil {''',
    )
    replace_once(
        repository,
        '''\tnow := time.Now().UTC()
\tdueAt := now.Add(schedule.DueAfter)''',
        '''\tnow := time.Now().UTC()
\tdueAt := state.DueAt
\tif !schedule.PreserveDue {
\t\tdueAt = now.Add(schedule.DueAfter)
\t}''',
    )

replace_once(
    "backend/internal/learning/scheduler_test.go",
    '''func TestScheduleStudyDoesNotAdvanceRecallState(t *testing.T) {
\tstate := ReviewState{Status: "review", Easiness: 2.7, IntervalDays: 14, Repetitions: 4}
\tschedule, err := ScheduleAttempt(state, RatingKnown, AnswerModeStudy)''',
    '''func TestScheduleStudyDoesNotAdvanceRecallState(t *testing.T) {
\tstate := ReviewState{Status: "review", Easiness: 2.7, IntervalDays: 14, Repetitions: 4, DueAt: time.Now().UTC().Add(-time.Hour)}
\tschedule, err := ScheduleAttempt(state, RatingKnown, AnswerModeStudy)''',
)
replace_once(
    "backend/internal/learning/scheduler_test.go",
    '''\tif schedule.Status != state.Status || schedule.Easiness != state.Easiness || schedule.IntervalDays != state.IntervalDays || schedule.Repetitions != state.Repetitions {
\t\tt.Fatalf("study mutated recall state: state=%+v schedule=%+v", state, schedule)
\t}
\tif schedule.DueAfter != 24*time.Hour || schedule.Grade != 5 {''',
    '''\tif schedule.Status != state.Status || schedule.Easiness != state.Easiness || schedule.IntervalDays != state.IntervalDays || schedule.Repetitions != state.Repetitions {
\t\tt.Fatalf("study mutated recall state: state=%+v schedule=%+v", state, schedule)
\t}
\tif !schedule.PreserveDue {
\t\tt.Fatalf("study of an existing item must preserve due schedule: %+v", schedule)
\t}
\tif schedule.DueAfter != 24*time.Hour || schedule.Grade != 5 {''',
)
replace_once(
    "backend/internal/learning/scheduler_test.go",
    '''\tif schedule.Status != "learning" || schedule.Repetitions != 0 || schedule.IntervalDays != 0 {
\t\tt.Fatalf("new study schedule = %+v", schedule)
\t}
}''',
    '''\tif schedule.Status != "learning" || schedule.Repetitions != 0 || schedule.IntervalDays != 0 || schedule.PreserveDue {
\t\tt.Fatalf("new study schedule = %+v", schedule)
\t}
}''',
)

integration = "backend/integration/review_modes_test.go"
replace_once(
    integration,
    '''\tpostAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/words/%d/review", testServer.URL, words.Items[2].ID), registered.Tokens.AccessToken, map[string]any{
\t\t"rating": "known", "responseMs": 800, "answerMode": "choice", "answerRevealed": false, "correct": true, "timezoneOffsetMinutes": 0,
\t}, http.StatusOK, &reviewResult{})

\tvar mode string''',
    '''\tpostAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/words/%d/review", testServer.URL, words.Items[2].ID), registered.Tokens.AccessToken, map[string]any{
\t\t"rating": "known", "responseMs": 800, "answerMode": "choice", "answerRevealed": false, "correct": true, "timezoneOffsetMinutes": 0,
\t}, http.StatusOK, &reviewResult{})

\tvar recallDueAt time.Time
\tvar recallRepetitions int
\tif err := pg.QueryRow(ctx, `
\t\tselect due_at, repetitions
\t\tfrom user_words
\t\twhere user_id = $1::uuid and word_id = $2
\t`, registered.User.ID, words.Items[1].ID).Scan(&recallDueAt, &recallRepetitions); err != nil {
\t\tt.Fatalf("query recall state before study: %v", err)
\t}
\tpostAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/words/%d/review", testServer.URL, words.Items[1].ID), registered.Tokens.AccessToken, map[string]any{
\t\t"rating": "known", "responseMs": 500, "answerMode": "study", "answerRevealed": true, "timezoneOffsetMinutes": 0,
\t}, http.StatusOK, &reviewResult{})
\tvar recallDueAtAfterStudy time.Time
\tvar recallRepetitionsAfterStudy int
\tif err := pg.QueryRow(ctx, `
\t\tselect due_at, repetitions
\t\tfrom user_words
\t\twhere user_id = $1::uuid and word_id = $2
\t`, registered.User.ID, words.Items[1].ID).Scan(&recallDueAtAfterStudy, &recallRepetitionsAfterStudy); err != nil {
\t\tt.Fatalf("query recall state after study: %v", err)
\t}
\tif !recallDueAtAfterStudy.Equal(recallDueAt) || recallRepetitionsAfterStudy != recallRepetitions {
\t\tt.Fatalf("study changed existing recall schedule: before due=%s reps=%d, after due=%s reps=%d", recallDueAt, recallRepetitions, recallDueAtAfterStudy, recallRepetitionsAfterStudy)
\t}

\tvar mode string''',
)
replace_once(
    integration,
    '''\tif progress.ReviewsToday != 4 || progress.ObjectiveReviewsToday != 2 || progress.ObjectiveSuccessfulToday != 2 || progress.SuccessfulToday != 3 {''',
    '''\tif progress.ReviewsToday != 5 || progress.ObjectiveReviewsToday != 2 || progress.ObjectiveSuccessfulToday != 2 || progress.SuccessfulToday != 3 {''',
)
replace_once(
    integration,
    '''\tif progress.Modes.Study.AttemptsToday != 1 || progress.Modes.Recall.AttemptsToday != 1''',
    '''\tif progress.Modes.Study.AttemptsToday != 2 || progress.Modes.Recall.AttemptsToday != 1''',
)

replace_once(
    "docs/learning-event-schema.md",
    '''`recall` and `choice` use the spaced-repetition transition. `study` is an exposure/self-assessment event: it may move a new item into `learning` and schedule a near-term objective attempt, but it never increases repetitions, easiness, review status, or mastery.''',
    '''`recall` and `choice` use the spaced-repetition transition. `study` is an exposure/self-assessment event: it may move a new item into `learning` and schedule its first near-term objective attempt, but it never increases repetitions, easiness, review status, or mastery. For an existing learning/review/mastered item, study preserves the current `due_at` exactly, so passive viewing cannot postpone an objective review.''',
)

print("Issue 38 due-schedule fix applied")
