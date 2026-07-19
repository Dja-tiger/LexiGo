package learning

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrIdempotencyKeyReused = errors.New("idempotency key was reused with a different request")

type lessonReviewFingerprint struct {
	LessonID              string     `json:"lessonId"`
	WordID                int64      `json:"wordId"`
	LessonVersion         int64      `json:"lessonVersion"`
	Rating                Rating     `json:"rating"`
	ResponseMS            *int       `json:"responseMs,omitempty"`
	AnswerMode            AnswerMode `json:"answerMode"`
	Correct               *bool      `json:"correct,omitempty"`
	AnswerRevealed        *bool      `json:"answerRevealed,omitempty"`
	TimezoneOffsetMinutes int        `json:"timezoneOffsetMinutes"`
}

// ReviewLessonWordIdempotent serializes retries for one client operation and
// returns the first committed response for every identical replay. The durable
// response record is intentionally stored separately from the learning
// transaction: if the process stops after the review commit but before the
// response record is inserted, recoverCommittedLessonReview verifies the exact
// persisted event and reconstructs the same response without a duplicate event.
func (r *Repository) ReviewLessonWordIdempotent(
	ctx context.Context,
	userID string,
	lessonID string,
	wordID int64,
	request LessonReviewRequest,
	idempotencyKey string,
) (LessonReviewResult, error) {
	if idempotencyKey == "" {
		return r.ReviewLessonWord(ctx, userID, lessonID, wordID, request)
	}

	requestHash, err := lessonReviewRequestHash(lessonID, wordID, request)
	if err != nil {
		return LessonReviewResult{}, err
	}
	connection, err := r.pool.Acquire(ctx)
	if err != nil {
		return LessonReviewResult{}, fmt.Errorf("acquire idempotency connection: %w", err)
	}
	defer connection.Release()

	lockName := userID + ":" + idempotencyKey
	if _, err := connection.Exec(ctx, "select pg_advisory_lock(hashtextextended($1, 0))", lockName); err != nil {
		return LessonReviewResult{}, fmt.Errorf("lock idempotent lesson review: %w", err)
	}
	defer func() {
		unlockContext, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		_, _ = connection.Exec(unlockContext, "select pg_advisory_unlock(hashtextextended($1, 0))", lockName)
	}()

	stored, found, err := loadIdempotentLessonReview(ctx, connection, userID, idempotencyKey, requestHash)
	if err != nil {
		return LessonReviewResult{}, err
	}
	if found {
		return stored, nil
	}

	result, reviewErr := r.ReviewLessonWord(ctx, userID, lessonID, wordID, request)
	if reviewErr != nil && recoverableIdempotencyConflict(reviewErr) {
		recovered, recoveredOK, recoverErr := recoverCommittedLessonReview(
			ctx,
			connection,
			userID,
			lessonID,
			wordID,
			request,
		)
		if recoverErr != nil {
			return LessonReviewResult{}, recoverErr
		}
		if recoveredOK {
			result = recovered
			reviewErr = nil
		}
	}
	if reviewErr != nil {
		return LessonReviewResult{}, reviewErr
	}

	if err := storeIdempotentLessonReview(
		ctx,
		connection,
		userID,
		idempotencyKey,
		requestHash,
		lessonID,
		wordID,
		result,
	); err != nil {
		return LessonReviewResult{}, err
	}
	return result, nil
}

func lessonReviewRequestHash(
	lessonID string,
	wordID int64,
	request LessonReviewRequest,
) ([]byte, error) {
	payload, err := json.Marshal(lessonReviewFingerprint{
		LessonID:              lessonID,
		WordID:                wordID,
		LessonVersion:         request.LessonVersion,
		Rating:                request.Rating,
		ResponseMS:            request.ResponseMS,
		AnswerMode:            request.AnswerMode,
		Correct:               request.Correct,
		AnswerRevealed:        request.AnswerRevealed,
		TimezoneOffsetMinutes: request.TimezoneOffsetMinutes,
	})
	if err != nil {
		return nil, fmt.Errorf("encode lesson review fingerprint: %w", err)
	}
	digest := sha256.Sum256(payload)
	return digest[:], nil
}

func loadIdempotentLessonReview(
	ctx context.Context,
	connection *pgxpool.Conn,
	userID string,
	idempotencyKey string,
	requestHash []byte,
) (LessonReviewResult, bool, error) {
	var storedHash []byte
	var response []byte
	err := connection.QueryRow(ctx, `
		select request_hash, response
		from lesson_review_idempotency
		where user_id = $1::uuid and idempotency_key = $2::uuid
	`, userID, idempotencyKey).Scan(&storedHash, &response)
	if errors.Is(err, pgx.ErrNoRows) {
		return LessonReviewResult{}, false, nil
	}
	if err != nil {
		return LessonReviewResult{}, false, fmt.Errorf("load idempotent lesson review: %w", err)
	}
	if !bytes.Equal(storedHash, requestHash) {
		return LessonReviewResult{}, false, ErrIdempotencyKeyReused
	}
	var result LessonReviewResult
	if err := json.Unmarshal(response, &result); err != nil {
		return LessonReviewResult{}, false, fmt.Errorf("decode idempotent lesson review response: %w", err)
	}
	return result, true, nil
}

func storeIdempotentLessonReview(
	ctx context.Context,
	connection *pgxpool.Conn,
	userID string,
	idempotencyKey string,
	requestHash []byte,
	lessonID string,
	wordID int64,
	result LessonReviewResult,
) error {
	response, err := json.Marshal(result)
	if err != nil {
		return fmt.Errorf("encode idempotent lesson review response: %w", err)
	}
	command, err := connection.Exec(ctx, `
		insert into lesson_review_idempotency(
			user_id, idempotency_key, request_hash, lesson_id, word_id, response
		) values ($1::uuid, $2::uuid, $3, $4::uuid, $5, $6::jsonb)
		on conflict (user_id, idempotency_key) do nothing
	`, userID, idempotencyKey, requestHash, lessonID, wordID, response)
	if err != nil {
		return fmt.Errorf("store idempotent lesson review: %w", err)
	}
	if command.RowsAffected() == 1 {
		return nil
	}
	stored, found, err := loadIdempotentLessonReview(ctx, connection, userID, idempotencyKey, requestHash)
	if err != nil {
		return err
	}
	if !found || stored.LessonID != result.LessonID || stored.LessonVersion != result.LessonVersion {
		return ErrIdempotencyKeyReused
	}
	return nil
}

func recoverableIdempotencyConflict(err error) bool {
	return errors.Is(err, ErrLessonVersionConflict)
		|| errors.Is(err, ErrLessonItemAlreadyReviewed)
		|| errors.Is(err, ErrLessonItemOutOfOrder)
		|| errors.Is(err, ErrLessonItemNotFound)
		|| errors.Is(err, ErrNoActiveLesson)
}

func recoverCommittedLessonReview(
	ctx context.Context,
	connection *pgxpool.Conn,
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
	var eventMatches bool

	err := connection.QueryRow(ctx, `
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
		       count(*) over ()::int,
		       count(item.rating) over ()::int,
		       exists (
		           select 1
		           from review_events event
		           where event.user_id = $1::uuid
		             and event.word_id = $3
		             and event.reviewed_at = item.reviewed_at
		             and event.rating = $5
		             and event.answer_mode = $6
		             and event.response_ms is not distinct from $7
		             and event.correct is not distinct from $8
		             and event.answer_revealed is not distinct from $9
		       )
		from lesson_sessions lesson
		join lesson_session_items item on item.session_id = lesson.id
		join user_words user_word
		  on user_word.user_id = lesson.user_id and user_word.word_id = item.word_id
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
		&eventMatches,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return LessonReviewResult{}, false, nil
	}
	if err != nil {
		return LessonReviewResult{}, false, fmt.Errorf("recover committed lesson review: %w", err)
	}
	if itemRating != string(request.Rating) || !eventMatches || result.LessonCurrentIndex <= itemPosition {
		return LessonReviewResult{}, false, nil
	}
	result.WordID = wordID
	result.LastReviewedAt = reviewedAt
	result.LessonCompleted = lessonStatus == "completed"
	result.LessonSkippedItems = 0
	return result, true, nil
}
