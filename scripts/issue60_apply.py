#!/usr/bin/env python3
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    (ROOT / path).write_text(content, encoding="utf-8")


def replace_once(path: str, old: str, new: str) -> None:
    content = read(path)
    count = content.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one literal match, found {count}")
    write(path, content.replace(old, new, 1))


def sub_once(path: str, pattern: str, replacement: str) -> None:
    content = read(path)
    updated, count = re.subn(pattern, replacement, content, count=1, flags=re.DOTALL)
    if count != 1:
        raise RuntimeError(f"{path}: expected one regex match, found {count}: {pattern[:80]}")
    write(path, updated)


REVIEW_WORD = r'''func (r *Repository) ReviewWord(
	ctx context.Context,
	userID string,
	wordID int64,
	request ReviewRequest,
) (ReviewResult, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return ReviewResult{}, fmt.Errorf("begin review transaction: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var state ReviewState
	var definition AnswerDefinition
	if err := tx.QueryRow(ctx, `
		select user_word.status,
		       user_word.easiness::float8,
		       user_word.interval_days,
		       user_word.repetitions,
		       user_word.due_at,
		       word.kind,
		       word.translation,
		       word.cloze_answer,
		       coalesce(word.accepted_answers, '{}'::text[])
		from user_words user_word
		join words word on word.id = user_word.word_id
		where user_word.user_id = $1::uuid and user_word.word_id = $2
		for update of user_word
	`, userID, wordID).Scan(
		&state.Status,
		&state.Easiness,
		&state.IntervalDays,
		&state.Repetitions,
		&state.DueAt,
		&definition.Kind,
		&definition.Translation,
		&definition.ClozeAnswer,
		&definition.AcceptedAnswers,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ReviewResult{}, ErrWordNotFound
		}
		return ReviewResult{}, fmt.Errorf("lock user learning item: %w", err)
	}

	assessment := AssessReview(request, definition)
	schedule, err := ScheduleAttempt(state, assessment.EffectiveRating, request.AnswerMode)
	if err != nil {
		return ReviewResult{}, err
	}
	now := time.Now().UTC()
	dueAt := state.DueAt
	if !schedule.PreserveDue {
		dueAt = now.Add(schedule.DueAfter)
	}

	if _, err := tx.Exec(ctx, `
		update user_words
		set status = $3,
		    easiness = $4,
		    interval_days = $5,
		    repetitions = $6,
		    due_at = $7,
		    last_reviewed_at = $8,
		    updated_at = $8
		where user_id = $1::uuid and word_id = $2
	`, userID, wordID, schedule.Status, schedule.Easiness, schedule.IntervalDays, schedule.Repetitions, dueAt, now); err != nil {
		return ReviewResult{}, fmt.Errorf("update user learning item: %w", err)
	}

	var reviewEventID int64
	if err := tx.QueryRow(ctx, `
		insert into review_events(
			user_id, word_id, grade, response_ms, reviewed_at, rating, answer_mode, correct,
			answer_revealed, event_schema_version, submitted_answer, effective_rating,
			judgement_source, judgement_reason, matched_answer
		) values (
			$1::uuid, $2, $3, $4, $5, $6, $7, $8,
			$9, 2, $10, $11, $12, $13, nullif($14, '')
		)
		returning id
	`,
		userID,
		wordID,
		schedule.Grade,
		request.ResponseMS,
		now,
		request.Rating,
		request.AnswerMode,
		assessment.Correct,
		request.AnswerRevealed,
		assessment.SubmittedAnswer,
		assessment.EffectiveRating,
		assessment.JudgementSource,
		assessment.JudgementReason,
		assessment.MatchedAnswer,
	).Scan(&reviewEventID); err != nil {
		return ReviewResult{}, fmt.Errorf("insert review event: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return ReviewResult{}, fmt.Errorf("commit review transaction: %w", err)
	}

	return ReviewResult{
		WordID:              wordID,
		Status:              schedule.Status,
		Easiness:            schedule.Easiness,
		IntervalDays:        schedule.IntervalDays,
		Repetitions:         schedule.Repetitions,
		DueAt:               dueAt,
		LastReviewedAt:      now,
		RequestedRating:     assessment.RequestedRating,
		EffectiveRating:     assessment.EffectiveRating,
		Correct:             assessment.Correct,
		JudgementSource:     assessment.JudgementSource,
		JudgementReason:     assessment.JudgementReason,
		MatchedAnswer:       assessment.MatchedAnswer,
		ReviewEventID:       reviewEventID,
		SuggestionAvailable: assessment.SuggestionAvailable,
	}, nil
}
'''

sub_once(
    "backend/internal/learning/repository.go",
    r"func \(r \*Repository\) ReviewWord\(.*?\n}\n(?=\nfunc \(r \*Repository\) Progress)",
    REVIEW_WORD.rstrip(),
)


REVIEW_LESSON_WORD = r'''func (r *Repository) ReviewLessonWord(
	ctx context.Context,
	userID string,
	lessonID string,
	wordID int64,
	request LessonReviewRequest,
) (LessonReviewResult, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return LessonReviewResult{}, fmt.Errorf("begin lesson review transaction: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var lockedLessonID string
	var currentIndex int
	var lessonMode AnswerMode
	var version int64
	if err := tx.QueryRow(ctx, `
		select id::text, current_index, study_mode, version
		from lesson_sessions
		where id = $1::uuid and user_id = $2::uuid and status = 'active'
		for update
	`, lessonID, userID).Scan(&lockedLessonID, &currentIndex, &lessonMode, &version); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return LessonReviewResult{}, ErrLessonItemNotFound
		}
		return LessonReviewResult{}, fmt.Errorf("lock lesson: %w", err)
	}
	if version != request.LessonVersion {
		return LessonReviewResult{}, ErrLessonVersionConflict
	}
	if lessonMode != request.AnswerMode {
		return LessonReviewResult{}, ErrLessonModeMismatch
	}

	var position int
	var existingRating *string
	if err := tx.QueryRow(ctx, `
		select position, rating
		from lesson_session_items
		where session_id = $1::uuid and word_id = $2
		for update
	`, lessonID, wordID).Scan(&position, &existingRating); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return LessonReviewResult{}, ErrLessonItemNotFound
		}
		return LessonReviewResult{}, fmt.Errorf("lock lesson item: %w", err)
	}
	if existingRating != nil {
		return LessonReviewResult{}, ErrLessonItemAlreadyReviewed
	}
	if position != currentIndex {
		return LessonReviewResult{}, ErrLessonItemOutOfOrder
	}

	var state ReviewState
	var definition AnswerDefinition
	if err := tx.QueryRow(ctx, `
		select user_word.status,
		       user_word.easiness::float8,
		       user_word.interval_days,
		       user_word.repetitions,
		       user_word.due_at,
		       word.kind,
		       word.translation,
		       word.cloze_answer,
		       coalesce(word.accepted_answers, '{}'::text[])
		from user_words user_word
		join words word on word.id = user_word.word_id
		where user_word.user_id = $1::uuid and user_word.word_id = $2
		for update of user_word
	`, userID, wordID).Scan(
		&state.Status,
		&state.Easiness,
		&state.IntervalDays,
		&state.Repetitions,
		&state.DueAt,
		&definition.Kind,
		&definition.Translation,
		&definition.ClozeAnswer,
		&definition.AcceptedAnswers,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return LessonReviewResult{}, ErrWordNotFound
		}
		return LessonReviewResult{}, fmt.Errorf("lock user word: %w", err)
	}

	assessment := AssessReview(request.ReviewRequest, definition)
	schedule, err := ScheduleAttempt(state, assessment.EffectiveRating, request.AnswerMode)
	if err != nil {
		return LessonReviewResult{}, err
	}
	now := time.Now().UTC()
	dueAt := state.DueAt
	if !schedule.PreserveDue {
		dueAt = now.Add(schedule.DueAfter)
	}

	if _, err := tx.Exec(ctx, `
		update user_words
		set status = $3,
		    easiness = $4,
		    interval_days = $5,
		    repetitions = $6,
		    due_at = $7,
		    last_reviewed_at = $8,
		    updated_at = $8
		where user_id = $1::uuid and word_id = $2
	`, userID, wordID, schedule.Status, schedule.Easiness, schedule.IntervalDays, schedule.Repetitions, dueAt, now); err != nil {
		return LessonReviewResult{}, fmt.Errorf("update user word: %w", err)
	}

	var reviewEventID int64
	if err := tx.QueryRow(ctx, `
		insert into review_events(
			user_id, word_id, grade, response_ms, reviewed_at, rating, answer_mode, correct,
			answer_revealed, event_schema_version, submitted_answer, effective_rating,
			judgement_source, judgement_reason, matched_answer
		) values (
			$1::uuid, $2, $3, $4, $5, $6, $7, $8,
			$9, 2, $10, $11, $12, $13, nullif($14, '')
		)
		returning id
	`,
		userID,
		wordID,
		schedule.Grade,
		request.ResponseMS,
		now,
		request.Rating,
		request.AnswerMode,
		assessment.Correct,
		request.AnswerRevealed,
		assessment.SubmittedAnswer,
		assessment.EffectiveRating,
		assessment.JudgementSource,
		assessment.JudgementReason,
		assessment.MatchedAnswer,
	).Scan(&reviewEventID); err != nil {
		return LessonReviewResult{}, fmt.Errorf("insert review event: %w", err)
	}

	if _, err := tx.Exec(ctx, `
		update lesson_session_items
		set rating = $3, reviewed_at = $4
		where session_id = $1::uuid and word_id = $2
	`, lessonID, wordID, request.Rating, now); err != nil {
		return LessonReviewResult{}, fmt.Errorf("update lesson item: %w", err)
	}

	var remaining, nextIndex, totalItems int
	if err := tx.QueryRow(ctx, `
		select count(*) filter (where rating is null)::int,
		       coalesce(min(position) filter (where rating is null), 0)::int,
		       count(*)::int
		from lesson_session_items
		where session_id = $1::uuid
	`, lessonID).Scan(&remaining, &nextIndex, &totalItems); err != nil {
		return LessonReviewResult{}, fmt.Errorf("calculate lesson progress: %w", err)
	}
	completed := remaining == 0
	reviewedItems := totalItems - remaining
	if completed {
		nextIndex = totalItems
	}

	var nextVersion int64
	if err := tx.QueryRow(ctx, `
		update lesson_sessions
		set current_index = $3,
		    version = version + 1,
		    status = case when $4 then 'completed' else 'active' end,
		    completed_at = case when $4 then $5::timestamptz else null::timestamptz end,
		    updated_at = $5::timestamptz
		where id = $1::uuid and user_id = $2::uuid and version = $6
		returning version
	`, lessonID, userID, nextIndex, completed, now, request.LessonVersion).Scan(&nextVersion); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return LessonReviewResult{}, ErrLessonVersionConflict
		}
		return LessonReviewResult{}, fmt.Errorf("update lesson progress: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return LessonReviewResult{}, fmt.Errorf("commit lesson review transaction: %w", err)
	}

	return LessonReviewResult{
		ReviewResult: ReviewResult{
			WordID:              wordID,
			Status:              schedule.Status,
			Easiness:            schedule.Easiness,
			IntervalDays:        schedule.IntervalDays,
			Repetitions:         schedule.Repetitions,
			DueAt:               dueAt,
			LastReviewedAt:      now,
			RequestedRating:     assessment.RequestedRating,
			EffectiveRating:     assessment.EffectiveRating,
			Correct:             assessment.Correct,
			JudgementSource:     assessment.JudgementSource,
			JudgementReason:     assessment.JudgementReason,
			MatchedAnswer:       assessment.MatchedAnswer,
			ReviewEventID:       reviewEventID,
			SuggestionAvailable: assessment.SuggestionAvailable,
		},
		LessonID:            lockedLessonID,
		LessonCurrentIndex:  nextIndex,
		LessonVersion:       nextVersion,
		LessonCompleted:     completed,
		LessonReviewedItems: reviewedItems,
		LessonSkippedItems:  0,
		LessonTotalItems:    totalItems,
	}, nil
}
'''

sub_once(
    "backend/internal/learning/lesson_repository.go",
    r"func \(r \*Repository\) ReviewLessonWord\(.*?\n}\n(?=\nfunc \(r \*Repository\) lessonByID)",
    REVIEW_LESSON_WORD.rstrip(),
)

LESSON_BY_ID = r'''func (r *Repository) lessonByID(
	ctx context.Context,
	userID string,
	lessonID string,
	requiredStatus string,
) (LessonSession, error) {
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.RepeatableRead, AccessMode: pgx.ReadOnly})
	if err != nil {
		return LessonSession{}, fmt.Errorf("begin lesson snapshot: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var lesson LessonSession
	if err := tx.QueryRow(ctx, `
		select id::text, source, study_mode, lesson_size, current_index, version, status, created_at, updated_at
		from lesson_sessions
		where id = $1::uuid
		  and user_id = $2::uuid
		  and ($3 = '' or status = $3)
	`, lessonID, userID, requiredStatus).Scan(
		&lesson.ID,
		&lesson.Source,
		&lesson.StudyMode,
		&lesson.LessonSize,
		&lesson.CurrentIndex,
		&lesson.Version,
		&lesson.Status,
		&lesson.CreatedAt,
		&lesson.UpdatedAt,
	); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return LessonSession{}, ErrNoActiveLesson
		}
		return LessonSession{}, fmt.Errorf("query lesson: %w", err)
	}

	rows, err := tx.Query(ctx, `
		select item.position,
		       word.id,
		       word.kind,
		       coalesce(word.slug, ''),
		       word.lemma,
		       word.translation,
		       word.phonetic,
		       word.part_of_speech,
		       word.topic,
		       coalesce(word.aliases, '{}'::text[]),
		       coalesce(word.accepted_answers, '{}'::text[]),
		       word.examples,
		       word.note,
		       word.cloze,
		       word.cloze_answer,
		       user_word.status,
		       item.rating,
		       item.reviewed_at
		from lesson_session_items item
		join words word on word.id = item.word_id
		join user_words user_word
		  on user_word.word_id = item.word_id and user_word.user_id = $2::uuid
		where item.session_id = $1::uuid
		order by item.position
	`, lessonID, userID)
	if err != nil {
		return LessonSession{}, fmt.Errorf("query lesson items: %w", err)
	}
	defer rows.Close()

	lesson.Items = make([]LessonItem, 0)
	for rows.Next() {
		var item LessonItem
		var examples []byte
		var rating *string
		if err := rows.Scan(
			&item.Position,
			&item.WordID,
			&item.Kind,
			&item.Slug,
			&item.Lemma,
			&item.Translation,
			&item.Phonetic,
			&item.PartOfSpeech,
			&item.Topic,
			&item.Aliases,
			&item.AcceptedAnswers,
			&examples,
			&item.Note,
			&item.Cloze,
			&item.ClozeAnswer,
			&item.Status,
			&rating,
			&item.ReviewedAt,
		); err != nil {
			return LessonSession{}, fmt.Errorf("scan lesson item: %w", err)
		}
		if err := json.Unmarshal(examples, &item.Examples); err != nil {
			return LessonSession{}, fmt.Errorf("decode lesson examples: %w", err)
		}
		if rating != nil {
			parsed := Rating(*rating)
			item.Rating = &parsed
		}
		lesson.Items = append(lesson.Items, item)
	}
	if err := rows.Err(); err != nil {
		return LessonSession{}, fmt.Errorf("iterate lesson items: %w", err)
	}
	rows.Close()

	if !validLessonState(lesson.Status, lesson.CurrentIndex, lesson.Items) {
		return LessonSession{}, ErrInvalidLessonState
	}

	if err := tx.Commit(ctx); err != nil {
		return LessonSession{}, fmt.Errorf("commit lesson snapshot: %w", err)
	}
	return lesson, nil
}
'''

sub_once(
    "backend/internal/learning/lesson_repository.go",
    r"func \(r \*Repository\) lessonByID\(.*\Z",
    LESSON_BY_ID,
)

replace_once(
    "backend/internal/learning/lesson_review_idempotency.go",
    '''\tAnswerMode            AnswerMode `json:"answerMode"`\n\tCorrect               *bool      `json:"correct,omitempty"`''',
    '''\tAnswerMode            AnswerMode `json:"answerMode"`\n\tSubmittedAnswer       *string    `json:"submittedAnswer,omitempty"`\n\tCorrect               *bool      `json:"correct,omitempty"`''',
)
replace_once(
    "backend/internal/learning/lesson_review_idempotency.go",
    '''\t\tAnswerMode:            request.AnswerMode,\n\t\tCorrect:               request.Correct,''',
    '''\t\tAnswerMode:            request.AnswerMode,\n\t\tSubmittedAnswer:       request.SubmittedAnswer,\n\t\tCorrect:               request.Correct,''',
)

RECOVER_REVIEW = r'''func (r *Repository) recoverCommittedLessonReview(
	ctx context.Context,
	userID string,
	lessonID string,
	wordID int64,
	request LessonReviewRequest,
) (LessonReviewResult, bool, error) {
	var result LessonReviewResult
	var lessonStatus string
	var itemPosition int
	var itemRating string
	var reviewedAt time.Time
	var effectiveRating string

	err := r.pool.QueryRow(ctx, `
		select user_word.status,
		       user_word.easiness::float8,
		       user_word.interval_days,
		       user_word.repetitions,
		       user_word.due_at,
		       lesson.id::text,
		       lesson.current_index,
		       lesson.version,
		       lesson.status,
		       item.position,
		       item.rating,
		       item.reviewed_at,
		       (
		           select count(*)::int
		           from lesson_session_items total_item
		           where total_item.session_id = lesson.id
		       ),
		       (
		           select count(reviewed_item.rating)::int
		           from lesson_session_items reviewed_item
		           where reviewed_item.session_id = lesson.id
		       ),
		       event.id,
		       event.correct,
		       event.effective_rating,
		       event.judgement_source,
		       event.judgement_reason,
		       coalesce(event.matched_answer, '')
		from lesson_sessions lesson
		join lesson_session_items item on item.session_id = lesson.id
		join user_words user_word
		  on user_word.user_id = lesson.user_id and user_word.word_id = item.word_id
		join lateral (
			select review_event.id,
			       review_event.correct,
			       review_event.effective_rating,
			       review_event.judgement_source,
			       review_event.judgement_reason,
			       review_event.matched_answer
			from review_events review_event
			where review_event.user_id = $1::uuid
			  and review_event.word_id = $3
			  and review_event.reviewed_at = item.reviewed_at
			  and review_event.rating = $5
			  and review_event.answer_mode = $6
			  and review_event.response_ms is not distinct from $7
			  and review_event.answer_revealed is not distinct from $10
			  and (
			      ($8::text is not null and review_event.submitted_answer is not distinct from $8)
			      or (
			          $8::text is null
			          and review_event.submitted_answer is null
			          and review_event.correct is not distinct from $9
			      )
			  )
			order by review_event.id desc
			limit 1
		) event on true
		where lesson.user_id = $1::uuid
		  and lesson.id = $2::uuid
		  and item.word_id = $3
		  and lesson.version = $4 + 1
	`,
		userID,
		lessonID,
		wordID,
		request.LessonVersion,
		request.Rating,
		request.AnswerMode,
		request.ResponseMS,
		request.SubmittedAnswer,
		request.Correct,
		request.AnswerRevealed,
	).Scan(
		&result.Status,
		&result.Easiness,
		&result.IntervalDays,
		&result.Repetitions,
		&result.DueAt,
		&result.LessonID,
		&result.LessonCurrentIndex,
		&result.LessonVersion,
		&lessonStatus,
		&itemPosition,
		&itemRating,
		&reviewedAt,
		&result.LessonTotalItems,
		&result.LessonReviewedItems,
		&result.ReviewEventID,
		&result.Correct,
		&effectiveRating,
		&result.JudgementSource,
		&result.JudgementReason,
		&result.MatchedAnswer,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return LessonReviewResult{}, false, nil
	}
	if err != nil {
		return LessonReviewResult{}, false, fmt.Errorf("recover committed lesson review: %w", err)
	}
	if itemRating != string(request.Rating) || result.LessonCurrentIndex <= itemPosition {
		return LessonReviewResult{}, false, nil
	}
	result.WordID = wordID
	result.LastReviewedAt = reviewedAt
	result.RequestedRating = request.Rating
	result.EffectiveRating = Rating(effectiveRating)
	result.SuggestionAvailable = result.JudgementSource == JudgementSourceServer &&
		result.Correct != nil && !*result.Correct &&
		request.SubmittedAnswer != nil && NormalizeSubmittedAnswer(*request.SubmittedAnswer) != ""
	result.LessonCompleted = lessonStatus == "completed"
	result.LessonSkippedItems = 0
	return result, true, nil
}
'''

sub_once(
    "backend/internal/learning/lesson_review_idempotency.go",
    r"func \(r \*Repository\) recoverCommittedLessonReview\(.*\Z",
    RECOVER_REVIEW,
)

replace_once(
    "backend/internal/server/server.go",
    '''\tmux.Handle("POST /api/v1/words/{wordID}/review", authenticated(http.HandlerFunc(learningHandler.ReviewWord)))\n''',
    '''\tmux.Handle("POST /api/v1/words/{wordID}/review", authenticated(http.HandlerFunc(learningHandler.ReviewWord)))\n\tmux.Handle("POST /api/v1/words/{wordID}/answer-suggestions", limiter.Middleware(10, authenticated(http.HandlerFunc(learningHandler.SubmitAnswerSuggestion))))\n''',
)

# Frontend contract and server-authoritative feedback.
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '''  exercisePromptLabel,\n  normalizeAnswer,''',
    '''  exercisePromptLabel,\n  judgeLearningAnswer,\n  normalizeAnswer,''',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '''  aliases?: string[];\n  examples: string[];''',
    '''  aliases?: string[];\n  acceptedAnswers?: string[];\n  examples: string[];''',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '''type LessonReviewResponse = {\n  lessonId: string;\n  lessonCurrentIndex: number;\n  lessonVersion: number;\n  lastReviewedAt: string;\n  lessonCompleted: boolean;\n  lessonReviewedItems: number;\n  lessonSkippedItems: number;\n  lessonTotalItems: number;\n};''',
    '''type LessonReviewResponse = {\n  wordId: number;\n  requestedRating: ReviewRating;\n  effectiveRating: ReviewRating;\n  correct?: boolean;\n  judgementSource: "study" | "server" | "legacy_client";\n  judgementReason: string;\n  matchedAnswer?: string;\n  reviewEventId: number;\n  suggestionAvailable: boolean;\n  lessonId: string;\n  lessonCurrentIndex: number;\n  lessonVersion: number;\n  lastReviewedAt: string;\n  lessonCompleted: boolean;\n  lessonReviewedItems: number;\n  lessonSkippedItems: number;\n  lessonTotalItems: number;\n};''',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '''    aliases: item.aliases,\n    examples: item.examples,''',
    '''    aliases: item.aliases,\n    acceptedAnswers: item.acceptedAnswers,\n    examples: item.examples,''',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '''  const [reviewing, setReviewing] = useState(false);\n  const [error, setError] = useState("");''',
    '''  const [reviewing, setReviewing] = useState(false);\n  const [reviewFeedback, setReviewFeedback] = useState<LessonReviewResponse | null>(null);\n  const [suggestionStatus, setSuggestionStatus] = useState<"idle" | "submitting" | "submitted" | "error">("idle");\n  const [suggestionError, setSuggestionError] = useState("");\n  const [error, setError] = useState("");''',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '''  const expectedAnswer = currentItem ? exerciseAnswer(currentItem) : "";\n  const literalMatch = Boolean(\n    currentItem && typedAnswer.trim() && normalizeAnswer(typedAnswer) === normalizeAnswer(expectedAnswer),\n  );''',
    '''  const expectedAnswer = currentItem ? exerciseAnswer(currentItem) : "";\n  const submittedAnswer = selectedAnswer || typedAnswer;\n  const localJudgement = currentItem && submittedAnswer.trim()\n    ? judgeLearningAnswer(currentItem, submittedAnswer)\n    : null;\n  const literalMatch = Boolean(localJudgement?.correct);''',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '''    setSelectedAnswer("");\n    setTypedAnswer("");\n  }''',
    '''    setSelectedAnswer("");\n    setTypedAnswer("");\n    setReviewFeedback(null);\n    setSuggestionStatus("idle");\n    setSuggestionError("");\n  }''',
)
replace_once(
    "frontend/components/lexigo-premium-app.tsx",
    '''    setServerSkippedItems(0);\n    reviewInFlightRef.current = false;''',
    '''    setServerSkippedItems(0);\n    setReviewFeedback(null);\n    setSuggestionStatus("idle");\n    setSuggestionError("");\n    reviewInFlightRef.current = false;''',
)

RATE_CURRENT = r'''  async function rateCurrent(
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
      const path = activeLesson
        ? `/api/v1/lessons/${activeLesson.id}/words/${currentItem.wordId}/review`
        : `/api/v1/words/${currentItem.wordId}/review`;
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
      setSession(result.activeSession);
      setRatings((current) => ({ ...current, [currentItem.id]: rating }));
      setReviewFeedback(result.data);
      reviewPersisted = true;
      setServerLessonCompleted(result.data.lessonCompleted);
      setServerNextIndex(result.data.lessonCompleted ? null : result.data.lessonCurrentIndex);
      setServerSkippedItems(result.data.lessonSkippedItems);
      if (activeLesson) {
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
      }
      try {
        await refreshProgress(result.activeSession);
      } catch {
        setError("Оценка сохранена, но статистика обновится после следующей синхронизации.");
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

  async function submitAnswerSuggestion() {
    if (!session || !currentItem || currentItem.wordId === undefined || !reviewFeedback) return;
    const answer = submittedAnswer.trim();
    if (!answer || !reviewFeedback.suggestionAvailable || reviewFeedback.reviewEventId <= 0) return;

    setSuggestionStatus("submitting");
    setSuggestionError("");
    try {
      const result = await authorizedRequest(session, `/api/v1/words/${currentItem.wordId}/answer-suggestions`, {
        method: "POST",
        body: JSON.stringify({
          reviewEventId: reviewFeedback.reviewEventId,
          exerciseKind: currentItem.kind === "phrase" ? "cloze" : "translation",
          submittedAnswer: answer,
        }),
      });
      setSession(result.activeSession);
      setSuggestionStatus("submitted");
    } catch (requestError) {
      setSuggestionStatus("error");
      setSuggestionError(requestError instanceof Error ? requestError.message : "Не удалось отправить вариант на проверку");
    }
  }
'''

sub_once(
    "frontend/components/lexigo-premium-app.tsx",
    r"  async function rateCurrent\(.*?\n  }\n(?=\n  function renderHeader)",
    RATE_CURRENT.rstrip(),
)

OLD_RATING = '''            {(simpleStudy || revealed) ? currentRating ? <div className="lx-rating-row"><span>Оценка сохранена: {ratingLabel(currentRating)}. Используйте единственную кнопку перехода выше.</span></div> : <div className="lx-rating-row" aria-busy={reviewing}><span>Насколько уверенно вы знаете элемент?</span><div><button className="again" type="button" disabled={reviewing} data-rating="again" onClick={handleRatingClick}>Не знал</button><button className="almost" type="button" disabled={reviewing} data-rating="almost" onClick={handleRatingClick}>Почти</button><button className="known" type="button" disabled={reviewing} data-rating="known" onClick={handleRatingClick}>{reviewing ? "Сохраняем…" : "Знал"}</button></div></div> : null}\n'''
NEW_RATING = '''            {(simpleStudy || revealed) ? currentRating ? <div className="lx-rating-row"><span>Самооценка сохранена: {ratingLabel(currentRating)}. Объективный результат показан ниже.</span></div> : <div className="lx-rating-row" aria-busy={reviewing}><span>Насколько уверенно вы знали ответ? Самооценка хранится отдельно от объективной проверки.</span><div><button className="again" type="button" disabled={reviewing} data-rating="again" onClick={handleRatingClick}>Не знал</button><button className="almost" type="button" disabled={reviewing} data-rating="almost" onClick={handleRatingClick}>Почти</button><button className="known" type="button" disabled={reviewing} data-rating="known" onClick={handleRatingClick}>{reviewing ? "Сохраняем…" : "Знал"}</button></div></div> : null}\n            {currentRating && reviewFeedback ? (\n              <section className={`lx-judgement ${reviewFeedback.correct === false ? "error" : reviewFeedback.correct === true ? "success" : "study"}`} role="status" aria-live="polite" aria-atomic="true">\n                <strong>{reviewFeedback.correct === true ? "Ответ принят" : reviewFeedback.correct === false ? "Ответ не принят" : "Изучение сохранено"}</strong>\n                <p>{reviewFeedback.correct === true\n                  ? reviewFeedback.judgementReason === "accepted_normalized"\n                    ? "Ответ принят после нормализации регистра, пробелов и пунктуации."\n                    : "Ответ совпал с принятой формой."\n                  : reviewFeedback.correct === false\n                    ? reviewFeedback.judgementReason === "rejected_no_answer"\n                      ? "Ответ не был введён. Для расписания применено «Не знал»."\n                      : `Вариант отсутствует в списке принятых ответов. Самооценка «${ratingLabel(reviewFeedback.requestedRating)}» сохранена, для расписания применено «${ratingLabel(reviewFeedback.effectiveRating)}».`\n                    : "Пассивное изучение не считается объективным воспроизведением и не повышает mastery."}</p>\n                {reviewFeedback.matchedAnswer ? <small>Принятая форма: <span lang={phraseCloze ? "en" : "ru"}>{reviewFeedback.matchedAnswer}</span></small> : null}\n                {reviewFeedback.suggestionAvailable && suggestionStatus !== "submitted" ? <button className="lx-button ghost" type="button" disabled={suggestionStatus === "submitting"} onClick={() => void submitAnswerSuggestion()}>{suggestionStatus === "submitting" ? "Отправляем…" : "Мой вариант тоже верный"}</button> : null}\n                {suggestionStatus === "submitted" ? <small className="lx-suggestion-success">Вариант отправлен на проверку. Текущий результат и расписание не изменены.</small> : null}\n                {suggestionStatus === "error" ? <small className="lx-suggestion-error" role="alert">{suggestionError}</small> : null}\n              </section>\n            ) : null}\n'''
replace_once("frontend/components/lexigo-premium-app.tsx", OLD_RATING, NEW_RATING)

replace_once(
    "frontend/app/premium-ui.css",
    '''.lx-rating-row .known { border: 1px solid rgba(59, 219, 147, .28); background: rgba(19, 104, 68, .22); }\n\n.lx-related''',
    '''.lx-rating-row .known { border: 1px solid rgba(59, 219, 147, .28); background: rgba(19, 104, 68, .22); }\n\n.lx-judgement { display: grid; gap: 9px; margin: 0 16px 16px; border: 1px solid var(--lx-border); border-radius: 15px; padding: 15px; background: rgba(255,255,255,.025); }\n.lx-judgement.success { border-color: rgba(59, 219, 147, .3); background: rgba(19, 104, 68, .13); }\n.lx-judgement.error { border-color: rgba(255, 102, 122, .3); background: rgba(126, 30, 47, .14); }\n.lx-judgement.study { border-color: rgba(101, 191, 255, .28); background: rgba(24, 92, 145, .12); }\n.lx-judgement strong { font-size: 15px; }\n.lx-judgement p { margin: 0; color: #aeb8ca; line-height: 1.5; }\n.lx-judgement small { color: #8794aa; line-height: 1.45; }\n.lx-judgement .lx-button { width: fit-content; margin-top: 3px; }\n.lx-suggestion-success { color: #70e7b5 !important; }\n.lx-suggestion-error { color: #ff98a6 !important; }\n\n.lx-related''',
)

# OpenAPI contract.
replace_once("api/openapi.yaml", "  version: 0.9.0", "  version: 0.10.0")
ANSWER_SUGGESTION_PATH = '''  /api/v1/words/{wordID}/answer-suggestions:\n    post:\n      operationId: submitAnswerSuggestion\n      tags: [learning]\n      summary: Submit a server-rejected answer to the moderation queue without changing learning state.\n      security:\n        - bearerAuth: []\n      parameters:\n        - name: wordID\n          in: path\n          required: true\n          schema:\n            type: integer\n            format: int64\n            minimum: 1\n      requestBody:\n        required: true\n        content:\n          application/json:\n            schema:\n              $ref: "#/components/schemas/AnswerSuggestionRequest"\n      responses:\n        "202":\n          description: Suggestion was accepted for moderation.\n          content:\n            application/json:\n              schema:\n                $ref: "#/components/schemas/AnswerSuggestion"\n        "401":\n          $ref: "#/components/responses/Unauthorized"\n        "404":\n          description: Learning item is not assigned to the current user.\n        "409":\n          description: The referenced review was not a server-rejected objective attempt.\n        "422":\n          $ref: "#/components/responses/ValidationError"\n'''
replace_once(
    "api/openapi.yaml",
    "  /api/v1/lessons/preview:\n",
    ANSWER_SUGGESTION_PATH + "  /api/v1/lessons/preview:\n",
)
replace_once(
    "api/openapi.yaml",
    "      required: [id, lemma, translation, status, dueAt]",
    "      required: [id, lemma, translation, acceptedAnswers, status, dueAt]",
)
replace_once(
    "api/openapi.yaml",
    '''        aliases:\n          type: array\n          items:\n            type: string\n        examples:''',
    '''        aliases:\n          type: array\n          items:\n            type: string\n        acceptedAnswers:\n          type: array\n          description: Curated answers accepted by the deterministic objective judge.\n          items:\n            type: string\n        examples:''',
)

REVIEW_SCHEMAS = '''    ReviewRequest:\n      type: object\n      required: [rating, timezoneOffsetMinutes]\n      properties:\n        rating:\n          type: string\n          enum: [again, almost, known]\n          description: Learner confidence. It is stored independently from objective correctness.\n        responseMs:\n          type: integer\n          minimum: 0\n          maximum: 3600000\n        answerMode:\n          type: string\n          enum: [study, recall, choice]\n        submittedAnswer:\n          type: string\n          maxLength: 500\n          description: Raw recall or choice answer judged by the server. Forbidden for study.\n        correct:\n          type: [boolean, "null"]\n          deprecated: true\n          description: Legacy client correctness fallback. Cannot be sent together with submittedAnswer.\n        answerRevealed:\n          type: [boolean, "null"]\n          description: Whether the answer was visible before persistence. Required as true for study.\n        timezoneOffsetMinutes:\n          type: integer\n          minimum: -840\n          maximum: 840\n    ReviewResult:\n      type: object\n      required: [wordId, status, easiness, intervalDays, repetitions, dueAt, lastReviewedAt, requestedRating, effectiveRating, judgementSource, judgementReason, reviewEventId, suggestionAvailable]\n      properties:\n        wordId:\n          type: integer\n          format: int64\n        status:\n          type: string\n          enum: [learning, review, mastered]\n        easiness:\n          type: number\n        intervalDays:\n          type: integer\n        repetitions:\n          type: integer\n        dueAt:\n          type: string\n          format: date-time\n        lastReviewedAt:\n          type: string\n          format: date-time\n        requestedRating:\n          type: string\n          enum: [again, almost, known]\n          description: Learner confidence persisted for analytics.\n        effectiveRating:\n          type: string\n          enum: [again, almost, known]\n          description: Rating applied to the scheduler. Incorrect objective answers are forced to again.\n        correct:\n          type: [boolean, "null"]\n          description: Server objective result for recall/choice; omitted for passive study.\n        judgementSource:\n          type: string\n          enum: [study, server, legacy_client]\n        judgementReason:\n          type: string\n          enum: [passive_exposure, accepted_exact, accepted_normalized, rejected_no_answer, rejected_no_match, legacy_client_correct, legacy_client_incorrect, legacy_client_no_answer]\n        matchedAnswer:\n          type: string\n          description: Curated accepted answer matched after deterministic normalization.\n        reviewEventId:\n          type: integer\n          format: int64\n          minimum: 1\n        suggestionAvailable:\n          type: boolean\n    AnswerSuggestionRequest:\n      type: object\n      required: [reviewEventId, exerciseKind, submittedAnswer]\n      properties:\n        reviewEventId:\n          type: integer\n          format: int64\n          minimum: 1\n        exerciseKind:\n          type: string\n          enum: [translation, cloze]\n        submittedAnswer:\n          type: string\n          minLength: 1\n          maxLength: 500\n    AnswerSuggestion:\n      type: object\n      required: [id, wordId, reviewEventId, exerciseKind, submittedAnswer, status, createdAt]\n      properties:\n        id: { type: integer, format: int64 }\n        wordId: { type: integer, format: int64 }\n        reviewEventId: { type: integer, format: int64 }\n        exerciseKind: { type: string, enum: [translation, cloze] }\n        submittedAnswer: { type: string }\n        status: { type: string, enum: [pending, accepted, rejected] }\n        createdAt: { type: string, format: date-time }\n'''
sub_once(
    "api/openapi.yaml",
    r"    ReviewRequest:\n.*?(?=    LessonCreateRequest:)",
    REVIEW_SCHEMAS,
)
replace_once(
    "api/openapi.yaml",
    "      required: [position, id, kind, lemma, translation, phonetic, partOfSpeech, topic, examples, note, status]",
    "      required: [position, id, kind, lemma, translation, phonetic, partOfSpeech, topic, acceptedAnswers, examples, note, status]",
)
replace_once(
    "api/openapi.yaml",
    '''        aliases:\n          type: array\n          items: { type: string }\n        examples:''',
    '''        aliases:\n          type: array\n          items: { type: string }\n        acceptedAnswers:\n          type: array\n          description: Curated answers accepted by the deterministic objective judge.\n          items: { type: string }\n        examples:''',
)

# Browser regression coverage.
replace_once(
    "frontend/e2e/lesson-flow.spec.ts",
    '''  reviewRequests: () => RequestRecord[];\n};''',
    '''  reviewRequests: () => RequestRecord[];\n  suggestionRequests: () => RequestRecord[];\n};''',
)
replace_once(
    "frontend/e2e/lesson-flow.spec.ts",
    '''  { id: 101, lemma: "absolute", translation: "абсолютный", phonetic: "/ˈæbsəluːt/", partOfSpeech: "adjective", topic: "General", examples: ["The value is absolute."], note: "", status: "new" },''',
    '''  { id: 101, lemma: "absolute", translation: "абсолютный", acceptedAnswers: ["абсолютный", "полный"], phonetic: "/ˈæbsəluːt/", partOfSpeech: "adjective", topic: "General", examples: ["The value is absolute."], note: "", status: "new" },''',
)
replace_once(
    "frontend/e2e/lesson-flow.spec.ts",
    '''  const reviewRequests: RequestRecord[] = [];\n  await installBaseRoutes(page);''',
    '''  const reviewRequests: RequestRecord[] = [];\n  const suggestionRequests: RequestRecord[] = [];\n  await installBaseRoutes(page);''',
)
replace_once(
    "frontend/e2e/lesson-flow.spec.ts",
    '''    if (path.endsWith("/review") && request.method() === "POST") {\n      const payload = request.postDataJSON() as RequestRecord;''',
    '''    if (path.endsWith("/answer-suggestions") && request.method() === "POST") {\n      const payload = request.postDataJSON() as RequestRecord;\n      suggestionRequests.push(payload);\n      return route.fulfill({ status: 202, contentType: "application/json", body: JSON.stringify({\n        id: suggestionRequests.length, wordId: selectedItems[Math.max(0, reviewedItems - 1)].id, reviewEventId: payload.reviewEventId,\n        exerciseKind: payload.exerciseKind, submittedAnswer: payload.submittedAnswer, status: "pending", createdAt: "2026-07-17T00:00:00Z",\n      }) });\n    }\n    if (path.endsWith("/review") && request.method() === "POST") {\n      const payload = request.postDataJSON() as RequestRecord;''',
)
replace_once(
    "frontend/e2e/lesson-flow.spec.ts",
    '''      reviewedItems += 1;\n      version += 1;\n      const completed = reviewedItems === itemCount;\n      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({\n        wordId: selectedItems[Math.min(reviewedItems - 1, selectedItems.length - 1)].id, status: "learning", easiness: 2.5,\n        intervalDays: 1, repetitions: reviewedItems, dueAt: "2026-07-18T00:00:00Z", lastReviewedAt: "2026-07-17T00:00:00Z",\n        lessonId: "00000000-0000-0000-0000-000000000350", lessonCurrentIndex: reviewedItems, lessonVersion: version,\n        lessonCompleted: completed, lessonReviewedItems: reviewedItems, lessonSkippedItems: 0, lessonTotalItems: itemCount,\n      }) });''',
    '''      const reviewedItem = selectedItems[Math.min(reviewedItems, selectedItems.length - 1)];\n      const submittedAnswer = typeof payload.submittedAnswer === "string" ? payload.submittedAnswer.trim().toLocaleLowerCase("ru-RU") : "";\n      const acceptedAnswers = [reviewedItem.translation, ...(reviewedItem.acceptedAnswers ?? [])].map((answer) => answer.toLocaleLowerCase("ru-RU"));\n      const objectiveCorrect = payload.answerMode === "study" ? undefined : acceptedAnswers.includes(submittedAnswer);\n      const effectiveRating = objectiveCorrect === false ? "again" : payload.rating;\n      reviewedItems += 1;\n      version += 1;\n      const completed = reviewedItems === itemCount;\n      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({\n        wordId: reviewedItem.id, status: "learning", easiness: 2.5, intervalDays: objectiveCorrect === false ? 0 : 1,\n        repetitions: objectiveCorrect === false ? 0 : reviewedItems, dueAt: "2026-07-18T00:00:00Z", lastReviewedAt: "2026-07-17T00:00:00Z",\n        requestedRating: payload.rating, effectiveRating, ...(objectiveCorrect === undefined ? {} : { correct: objectiveCorrect }),\n        judgementSource: payload.answerMode === "study" ? "study" : "server",\n        judgementReason: payload.answerMode === "study" ? "passive_exposure" : objectiveCorrect ? "accepted_exact" : submittedAnswer ? "rejected_no_match" : "rejected_no_answer",\n        ...(objectiveCorrect ? { matchedAnswer: submittedAnswer } : {}), reviewEventId: reviewedItems, suggestionAvailable: objectiveCorrect === false && Boolean(submittedAnswer),\n        lessonId: "00000000-0000-0000-0000-000000000350", lessonCurrentIndex: reviewedItems, lessonVersion: version,\n        lessonCompleted: completed, lessonReviewedItems: reviewedItems, lessonSkippedItems: 0, lessonTotalItems: itemCount,\n      }) });''',
)
replace_once(
    "frontend/e2e/lesson-flow.spec.ts",
    '''  return { reviewCalls: () => reviewCalls, lessonRequests: () => lessonRequests, reviewRequests: () => reviewRequests };''',
    '''  return { reviewCalls: () => reviewCalls, lessonRequests: () => lessonRequests, reviewRequests: () => reviewRequests, suggestionRequests: () => suggestionRequests };''',
)
replace_once(
    "frontend/e2e/lesson-flow.spec.ts",
    '''  expect(recall.reviewRequests()[0]).toMatchObject({ lessonVersion: 1, answerMode: "recall", correct: true });\n});''',
    '''  expect(recall.reviewRequests()[0]).toMatchObject({ lessonVersion: 1, answerMode: "recall", submittedAnswer: "абсолютный" });\n  expect(recall.reviewRequests()[0]).not.toHaveProperty("correct");\n});\n\ntest("wrong confidence cannot master an item and supports a safe answer suggestion", async ({ page }) => {\n  const api = await installLessonAPI(page, 1);\n  await openLesson(page, "recall");\n  await page.locator("#premium-answer").fill("непринятый вариант");\n  await page.getByRole("button", { name: "Сверить ответ", exact: true }).click();\n  await page.getByRole("button", { name: "Знал", exact: true }).click();\n\n  await expect(page.getByText("Ответ не принят", { exact: true })).toBeVisible();\n  await expect(page.getByText(/для расписания применено «Не знал»/)).toBeVisible();\n  expect(api.reviewRequests()[0]).toMatchObject({ rating: "known", submittedAnswer: "непринятый вариант" });\n\n  await page.getByRole("button", { name: "Мой вариант тоже верный", exact: true }).click();\n  await expect(page.getByText(/Вариант отправлен на проверку/)).toBeVisible();\n  await expect.poll(() => api.suggestionRequests().length).toBe(1);\n  expect(api.suggestionRequests()[0]).toMatchObject({ exerciseKind: "translation", submittedAnswer: "непринятый вариант" });\n});''',
)

INTEGRATION_TEST = r'''//go:build integration

package integration

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/Dja-tiger/New-project/backend/internal/catalog"
	"github.com/Dja-tiger/New-project/backend/internal/config"
	"github.com/Dja-tiger/New-project/backend/internal/platform/migrate"
	postgresplatform "github.com/Dja-tiger/New-project/backend/internal/platform/postgres"
	redisplatform "github.com/Dja-tiger/New-project/backend/internal/platform/redis"
	"github.com/Dja-tiger/New-project/backend/internal/server"
)

func TestObjectiveAnswerJudgementAndSuggestion(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	pg, err := postgresplatform.Open(ctx, requiredEnv(t, "TEST_POSTGRES_DSN"))
	if err != nil {
		t.Fatal(err)
	}
	defer pg.Close()
	if err := migrate.Up(ctx, pg); err != nil {
		t.Fatalf("migrate.Up() error = %v", err)
	}
	if _, err := pg.Exec(ctx, "truncate table answer_suggestions, lesson_review_idempotency, lesson_session_items, lesson_sessions, user_learning_preferences, review_events, user_words, refresh_tokens, words, users restart identity cascade"); err != nil {
		t.Fatalf("truncate test data: %v", err)
	}
	if _, err := catalog.Seed(ctx, pg); err != nil {
		t.Fatalf("catalog.Seed() error = %v", err)
	}

	rdb, err := redisplatform.Open(ctx, config.Redis{Addr: requiredEnv(t, "TEST_REDIS_ADDR")})
	if err != nil {
		t.Fatal(err)
	}
	defer rdb.Close()
	if err := rdb.FlushDB(ctx).Err(); err != nil {
		t.Fatalf("flush redis: %v", err)
	}

	cfg := config.Config{
		AppEnv:            "test",
		HTTPAddr:          ":0",
		LogLevel:          "error",
		CORSAllowedOrigin: "http://test.local",
		PostgresDSN:       requiredEnv(t, "TEST_POSTGRES_DSN"),
		Redis:             config.Redis{Addr: requiredEnv(t, "TEST_REDIS_ADDR")},
		JWTSecret:         "integration-test-secret-with-at-least-32-bytes",
		AccessTokenTTL:    15 * time.Minute,
		RefreshTokenTTL:   24 * time.Hour,
	}
	app, err := server.New(cfg, slog.New(slog.NewTextHandler(io.Discard, nil)), pg, rdb)
	if err != nil {
		t.Fatalf("server.New() error = %v", err)
	}
	testServer := httptest.NewServer(app.Handler())
	defer testServer.Close()

	registered := postJSON[integrationAuthResponse](t, testServer.URL+"/api/v1/auth/register", map[string]string{
		"email": fmt.Sprintf("judgement-%d@example.com", time.Now().UnixNano()),
		"password": "strong-password",
		"displayName": "Judgement Tester",
	}, http.StatusCreated)

	rows, err := pg.Query(ctx, `
		select word.id
		from words word
		join user_words user_word on user_word.word_id = word.id
		where user_word.user_id = $1::uuid and word.kind = 'word'
		order by word.id
		limit 2
	`, registered.User.ID)
	if err != nil {
		t.Fatalf("query assigned words: %v", err)
	}
	defer rows.Close()
	wordIDs := make([]int64, 0, 2)
	for rows.Next() {
		var wordID int64
		if err := rows.Scan(&wordID); err != nil {
			t.Fatal(err)
		}
		wordIDs = append(wordIDs, wordID)
	}
	if len(wordIDs) != 2 {
		t.Fatalf("assigned word ids = %v, want two", wordIDs)
	}
	if _, err := pg.Exec(ctx, `
		update words
		set translation = 'инцидент, происшествие',
		    accepted_answers = array['инцидент', 'происшествие', 'инцидента']::text[]
		where id = any($1::bigint[])
	`, wordIDs); err != nil {
		t.Fatalf("curate accepted answers: %v", err)
	}

	var rejected struct {
		RequestedRating     string `json:"requestedRating"`
		EffectiveRating     string `json:"effectiveRating"`
		Correct             bool   `json:"correct"`
		JudgementReason     string `json:"judgementReason"`
		ReviewEventID       int64  `json:"reviewEventId"`
		SuggestionAvailable bool   `json:"suggestionAvailable"`
		Status              string `json:"status"`
		IntervalDays        int    `json:"intervalDays"`
		Repetitions         int    `json:"repetitions"`
	}
	postAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/words/%d/review", testServer.URL, wordIDs[0]), registered.Tokens.AccessToken, map[string]any{
		"rating": "known", "answerMode": "recall", "submittedAnswer": "неверный вариант", "answerRevealed": true, "timezoneOffsetMinutes": 0,
	}, http.StatusOK, &rejected)
	if rejected.RequestedRating != "known" || rejected.EffectiveRating != "again" || rejected.Correct || rejected.JudgementReason != "rejected_no_match" || !rejected.SuggestionAvailable {
		t.Fatalf("unexpected rejected assessment: %+v", rejected)
	}
	if rejected.Status != "learning" || rejected.IntervalDays != 0 || rejected.Repetitions != 0 {
		t.Fatalf("incorrect answer advanced scheduler: %+v", rejected)
	}

	var suggestion struct {
		Status          string `json:"status"`
		SubmittedAnswer string `json:"submittedAnswer"`
	}
	postAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/words/%d/answer-suggestions", testServer.URL, wordIDs[0]), registered.Tokens.AccessToken, map[string]any{
		"reviewEventId": rejected.ReviewEventID, "exerciseKind": "translation", "submittedAnswer": "неверный вариант",
	}, http.StatusAccepted, &suggestion)
	if suggestion.Status != "pending" || suggestion.SubmittedAnswer != "неверный вариант" {
		t.Fatalf("unexpected suggestion: %+v", suggestion)
	}

	var accepted struct {
		RequestedRating string `json:"requestedRating"`
		EffectiveRating string `json:"effectiveRating"`
		Correct         bool   `json:"correct"`
		MatchedAnswer   string `json:"matchedAnswer"`
		Repetitions     int    `json:"repetitions"`
	}
	postAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/words/%d/review", testServer.URL, wordIDs[1]), registered.Tokens.AccessToken, map[string]any{
		"rating": "almost", "answerMode": "recall", "submittedAnswer": "Происшествие!", "answerRevealed": true, "timezoneOffsetMinutes": 0,
	}, http.StatusOK, &accepted)
	if !accepted.Correct || accepted.RequestedRating != "almost" || accepted.EffectiveRating != "almost" || accepted.MatchedAnswer != "происшествие" || accepted.Repetitions != 1 {
		t.Fatalf("unexpected accepted assessment: %+v", accepted)
	}

	var storedRating, effectiveRating, judgementSource string
	var storedCorrect bool
	if err := pg.QueryRow(ctx, `
		select rating, effective_rating, correct, judgement_source
		from review_events
		where id = $1
	`, rejected.ReviewEventID).Scan(&storedRating, &effectiveRating, &storedCorrect, &judgementSource); err != nil {
		t.Fatalf("query rejected event: %v", err)
	}
	if storedRating != "known" || effectiveRating != "again" || storedCorrect || judgementSource != "server" {
		t.Fatalf("unexpected stored judgement: rating=%s effective=%s correct=%v source=%s", storedRating, effectiveRating, storedCorrect, judgementSource)
	}
}
'''
write("backend/integration/answer_judgement_test.go", INTEGRATION_TEST)

# Add validation regression coverage to the existing unit suite.
replace_once(
    "backend/internal/learning/answer_judgement_test.go",
    '''func TestAssessReviewPreservesCorrectConfidenceAndStudySemantics(t *testing.T) {''',
    '''func TestNormalizeAndValidateReviewRequestRejectsAmbiguousAndOversizedAnswers(t *testing.T) {\n\tanswer := "accepted"\n\tlegacyCorrect := true\n\trequest := ReviewRequest{AnswerMode: AnswerModeRecall, SubmittedAnswer: &answer, Correct: &legacyCorrect}\n\tif code, _ := normalizeAndValidateReviewRequest(&request); code != "ambiguous_objective_answer" {\n\t\tt.Fatalf("validation code = %q, want ambiguous_objective_answer", code)\n\t}\n\n\toversized := strings.Repeat("я", MaxSubmittedAnswerRunes+1)\n\trequest = ReviewRequest{AnswerMode: AnswerModeRecall, SubmittedAnswer: &oversized}\n\tif code, _ := normalizeAndValidateReviewRequest(&request); code != "invalid_submitted_answer" {\n\t\tt.Fatalf("validation code = %q, want invalid_submitted_answer", code)\n\t}\n}\n\nfunc TestAssessReviewPreservesCorrectConfidenceAndStudySemantics(t *testing.T) {''',
)
replace_once(
    "backend/internal/learning/answer_judgement_test.go",
    'import "testing"',
    'import (\n\t"strings"\n\t"testing"\n)',
)

# Verify no accidental temporary tooling survives the generated commit.
print("Issue #60 patch applied successfully")
