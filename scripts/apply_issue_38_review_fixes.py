from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def replace_once(path: str, old: str, new: str) -> None:
    target = ROOT / path
    source = target.read_text(encoding="utf-8")
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one match, found {count}")
    target.write_text(source.replace(old, new), encoding="utf-8")


progress = r'''func (r *Repository) Progress(ctx context.Context, userID string, timezoneOffsetMinutes int) (ProgressSummary, error) {
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
\t\t       count(*) filter (where is_today and event_schema_version = 2 and answer_mode in ('recall', 'choice'))::int,
\t\t       count(*) filter (where is_today and event_schema_version = 2 and answer_mode in ('recall', 'choice') and correct is true)::int,
\t\t       count(*) filter (where is_today and (
\t\t           (event_schema_version = 2 and answer_mode in ('recall', 'choice') and correct is true)
\t\t           or (event_schema_version = 1 and grade >= 4)
\t\t       ))::int,
\t\t       count(*)::int,
\t\t       count(*) filter (where is_today and event_schema_version = 2 and answer_mode = 'study')::int,
\t\t       0::int,
\t\t       count(*) filter (where event_schema_version = 2 and answer_mode = 'study')::int,
\t\t       0::int,
\t\t       count(*) filter (where is_today and event_schema_version = 2 and answer_mode = 'recall')::int,
\t\t       count(*) filter (where is_today and event_schema_version = 2 and answer_mode = 'recall' and correct is true)::int,
\t\t       count(*) filter (where event_schema_version = 2 and answer_mode = 'recall')::int,
\t\t       count(*) filter (where event_schema_version = 2 and answer_mode = 'recall' and correct is true)::int,
\t\t       count(*) filter (where is_today and event_schema_version = 2 and answer_mode = 'choice')::int,
\t\t       count(*) filter (where is_today and event_schema_version = 2 and answer_mode = 'choice' and correct is true)::int,
\t\t       count(*) filter (where event_schema_version = 2 and answer_mode = 'choice')::int,
\t\t       count(*) filter (where event_schema_version = 2 and answer_mode = 'choice' and correct is true)::int,
\t\t       count(*) filter (where is_today and event_schema_version = 1)::int,
\t\t       count(*) filter (where is_today and event_schema_version = 1 and grade >= 4)::int,
\t\t       count(*) filter (where event_schema_version = 1)::int,
\t\t       count(*) filter (where event_schema_version = 1 and grade >= 4)::int
\t\tfrom events
\t`, userID, timezoneOffsetMinutes).Scan(
\t\t&result.ReviewsToday,
\t\t&result.ObjectiveReviewsToday,
\t\t&result.ObjectiveSuccessfulToday,
\t\t&result.SuccessfulToday,
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
\t\t  and current_review.event_schema_version = 2
\t\t  and current_review.answer_mode in ('recall', 'choice')
\t\t  and current_review.correct is true
\t\t  and current_review.grade = 5
\t\t  and current_review.reviewed_at >= bounds.week_start
\t\t  and exists (
\t\t\tselect 1
\t\t\tfrom review_events previous_review
\t\t\twhere previous_review.user_id = current_review.user_id
\t\t\t  and previous_review.word_id = current_review.word_id
\t\t\t  and previous_review.event_schema_version = 2
\t\t\t  and previous_review.answer_mode in ('recall', 'choice')
\t\t\t  and previous_review.correct is true
\t\t\t  and previous_review.grade = 5
\t\t\t  and previous_review.reviewed_at < bounds.week_start
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

repository = ROOT / "backend/internal/learning/repository.go"
source = repository.read_text(encoding="utf-8")
updated, count = re.subn(
    r"func \(r \*Repository\) Progress\([\s\S]*?\n}\n\nfunc \(r \*Repository\) SetDailyGoal",
    progress + "\n\nfunc (r *Repository) SetDailyGoal",
    source,
    count=1,
)
if count != 1:
    raise RuntimeError(f"repository Progress function matches={count}")
repository.write_text(updated, encoding="utf-8")

replace_once(
    "backend/internal/platform/migrate/migrations/000007_learning_event_modes.up.sql",
    '''alter table lesson_sessions
    drop constraint lesson_sessions_study_mode_chk;''',
    '''alter table review_events
    add constraint review_events_v2_semantics_chk
        check (
            event_schema_version = 1
            or (
                answer_mode is not null
                and (
                    answer_mode <> 'study'
                    or (correct is null and answer_revealed is true)
                )
            )
        );

alter table lesson_sessions
    drop constraint lesson_sessions_study_mode_chk;''',
)

replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '''        if (result.data.lessonCompleted) {
              setActiveLesson(null);''',
    '''        if (result.data.lessonCompleted) {
          setActiveLesson(null);''',
)

integration_path = "backend/integration/review_modes_test.go"
replace_once(
    integration_path,
    '''\tfor index, attemptMode := range []string{"study", "recall", "choice"} {''',
    '''\tif _, err := pg.Exec(ctx, `
\t\tinsert into review_events(
\t\t\tuser_id, word_id, grade, response_ms, reviewed_at, rating, answer_mode, correct,
\t\t\tanswer_revealed, event_schema_version
\t\t) values ($1::uuid, $2, 5, 1000, now(), 'known', 'recall', null, true, 1)
\t`, registered.User.ID, words.Items[3].ID); err != nil {
\t\tt.Fatalf("insert ambiguous schema-v1 event: %v", err)
\t}

\tfor index, attemptMode := range []string{"study", "recall", "choice"} {''',
)
replace_once(
    integration_path,
    '''\t\tModes                    struct {
\t\t\tStudy struct {''',
    '''\t\tModes                    struct {
\t\t\tStudy struct {''',
)
replace_once(
    integration_path,
    '''\t\t\tChoice struct {
\t\t\t\tAttemptsToday   int `json:"attemptsToday"`
\t\t\t\tSuccessfulToday int `json:"successfulToday"`
\t\t\t} `json:"choice"`
\t\t} `json:"modes"`''',
    '''\t\t\tChoice struct {
\t\t\t\tAttemptsToday   int `json:"attemptsToday"`
\t\t\t\tSuccessfulToday int `json:"successfulToday"`
\t\t\t} `json:"choice"`
\t\t\tLegacy struct {
\t\t\t\tAttemptsToday   int `json:"attemptsToday"`
\t\t\t\tSuccessfulToday int `json:"successfulToday"`
\t\t\t} `json:"legacy"`
\t\t} `json:"modes"`''',
)
replace_once(
    integration_path,
    '''\tif progress.ReviewsToday != 3 || progress.ObjectiveReviewsToday != 2 || progress.ObjectiveSuccessfulToday != 2 || progress.SuccessfulToday != 2 {''',
    '''\tif progress.ReviewsToday != 4 || progress.ObjectiveReviewsToday != 2 || progress.ObjectiveSuccessfulToday != 2 || progress.SuccessfulToday != 3 {''',
)
replace_once(
    integration_path,
    '''\tif progress.Modes.Study.AttemptsToday != 1 || progress.Modes.Recall.AttemptsToday != 1 || progress.Modes.Recall.SuccessfulToday != 1 || progress.Modes.Choice.AttemptsToday != 1 || progress.Modes.Choice.SuccessfulToday != 1 {''',
    '''\tif progress.Modes.Study.AttemptsToday != 1 || progress.Modes.Recall.AttemptsToday != 1 || progress.Modes.Recall.SuccessfulToday != 1 || progress.Modes.Choice.AttemptsToday != 1 || progress.Modes.Choice.SuccessfulToday != 1 || progress.Modes.Legacy.AttemptsToday != 1 || progress.Modes.Legacy.SuccessfulToday != 1 {''',
)

(ROOT / "docs/learning-event-schema.md").write_text('''# Learning event schema v2

## Purpose

A learning event separates four facts that were previously conflated:

1. `answer_mode` — `study`, `recall`, or `choice`;
2. `rating` — the learner's self-assessment (`again`, `almost`, `known`);
3. `correct` — objective correctness for recall/choice, never for study;
4. `answer_revealed` — whether the answer was visible before persistence.

New events are stored with `event_schema_version = 2`.

## Scheduling

`recall` and `choice` use the spaced-repetition transition. `study` is an exposure/self-assessment event: it may move a new item into `learning` and schedule a near-term objective attempt, but it never increases repetitions, easiness, review status, or mastery. Database and HTTP constraints reject schema-v2 study events that claim objective correctness or omit `answer_revealed=true`.

## Analytics

- `reviewsToday` and `reviewsTotal` are activity counters and include all modes.
- `successfulToday` is a rolling-deployment compatibility aggregate: verified schema-v2 objective successes plus historical schema-v1 grade-based successes.
- `objectiveReviewsToday` and `objectiveSuccessfulToday` contain only schema-v2 recall/choice data.
- `modes.study`, `modes.recall`, and `modes.choice` contain only schema-v2 events.
- `modes.legacy` contains every schema-v1 event, regardless of its historical `answer_mode` value.
- Study success is always zero because passive exposure has no objective correctness.
- Retained items require two successful schema-v2 objective attempts: one before the current week and one during it. Study and schema-v1 events are excluded.

## Why all schema-v1 events are legacy

Before schema v2 the frontend stored the presentation mode `study` only in browser storage and sent it to the backend as `recall`. Consequently, even a schema-v1 row containing `answer_mode='recall'` cannot be trusted as objective recall. Migration `000007` preserves the row but marks it `event_schema_version=1`; analytics deliberately avoid retroactive guessing.

## Backward compatibility

- Existing rows remain readable and continue contributing to activity, streak and the compatibility field `successfulToday`.
- Existing rows are visible under `modes.legacy` instead of being falsely attributed to recall or choice.
- Old rows do not establish retained knowledge because answer visibility and objective correctness cannot be reconstructed reliably.
- Omitting `answerMode` in a request remains accepted for pre-v2 clients and is normalized to `recall`; accurate mode analytics require a schema-v2 client.
- Existing response fields remain present. New clients should use `objectiveReviewsToday`, `objectiveSuccessfulToday`, and `modes` for accurate analytics.
''', encoding="utf-8")

replace_once(
    "api/openapi.yaml",
    '''        successfulToday:
          type: integer
          description: Compatibility alias for objectiveSuccessfulToday.''',
    '''        successfulToday:
          type: integer
          description: Rolling-deployment compatibility aggregate; use objectiveSuccessfulToday for accurate recall analytics.''',
)

print("Issue 38 review fixes applied")
