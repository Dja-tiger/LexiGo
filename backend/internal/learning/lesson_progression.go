package learning

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

const duplicateLessonCreationWindow = 10 * time.Second

// CreateProgressiveLesson makes lesson creation safe for double taps and
// transport retries. Candidate selection separately excludes the most
// recently completed block during the immediate continuation window.
func (r *Repository) CreateProgressiveLesson(
	ctx context.Context,
	userID string,
	request LessonCreateRequest,
) (LessonSession, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return LessonSession{}, fmt.Errorf("begin progressive lesson transaction: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if _, err := tx.Exec(ctx, `
		select pg_advisory_xact_lock(hashtextextended('lesson-create:' || $1, 0))
	`, userID); err != nil {
		return LessonSession{}, fmt.Errorf("lock lesson creation: %w", err)
	}

	activeLessonID, err := matchingRecentActiveLessonID(ctx, tx, userID, request)
	if err != nil {
		return LessonSession{}, err
	}
	if activeLessonID != "" {
		if err := tx.Commit(ctx); err != nil {
			return LessonSession{}, fmt.Errorf("commit duplicate lesson lookup: %w", err)
		}
		return r.lessonByIDWithReasons(ctx, userID, activeLessonID, "active")
	}

	reviewRatio := resolveLessonReviewRatio(request.ReviewRatio)
	wordIDs := request.WordIDs
	selectionReasons := make([]string, 0)
	if wordIDs == nil {
		candidates, candidateErr := queryLessonCandidatesForSession(
			ctx,
			tx,
			userID,
			request.Source,
			request.StudyMode,
			request.Topic,
			request.SessionKind,
		)
		if candidateErr != nil {
			return LessonSession{}, candidateErr
		}
		selected, _ := composeLessonCandidates(candidates, request.Source, lessonSizeLimit(request.LessonSize), reviewRatio)
		if len(selected) == 0 {
			return LessonSession{}, ErrLessonQueueEmpty
		}
		wordIDs = make([]int64, 0, len(selected))
		selectionReasons = make([]string, 0, len(selected))
		for _, candidate := range selected {
			wordIDs = append(wordIDs, candidate.WordID)
			selectionReasons = append(selectionReasons, string(lessonCandidateReason(candidate)))
		}
	} else {
		var assigned int
		if err := tx.QueryRow(ctx, `
			select count(*)::int
			from user_words
			where user_id = $1::uuid and word_id = any($2::bigint[])
		`, userID, wordIDs).Scan(&assigned); err != nil {
			return LessonSession{}, fmt.Errorf("validate lesson words: %w", err)
		}
		if assigned != len(wordIDs) {
			return LessonSession{}, ErrInvalidLessonWords
		}
		selectionReasons = make([]string, len(wordIDs))
		for index := range selectionReasons {
			selectionReasons[index] = string(LessonReasonManual)
		}
	}

	if _, err := tx.Exec(ctx, `
		update lesson_sessions
		set status = 'discarded', version = version + 1, updated_at = now()
		where user_id = $1::uuid and status = 'active'
	`, userID); err != nil {
		return LessonSession{}, fmt.Errorf("discard previous lesson: %w", err)
	}

	var lessonID string
	if err := tx.QueryRow(ctx, `
		insert into lesson_sessions(user_id, source, study_mode, lesson_size, review_ratio, session_kind)
		values ($1::uuid, $2, $3, $4, $5, nullif($6::text, ''))
		returning id::text
	`, userID, request.Source, request.StudyMode, request.LessonSize, reviewRatio, string(request.SessionKind)).Scan(&lessonID); err != nil {
		return LessonSession{}, fmt.Errorf("insert progressive lesson: %w", err)
	}

	if _, err := tx.Exec(ctx, `
		insert into lesson_session_items(session_id, position, word_id, selection_reason)
		select $1::uuid, (ordinality - 1)::int, word_id, selection_reason
		from unnest($2::bigint[], $3::text[]) with ordinality
		     as selected(word_id, selection_reason, ordinality)
	`, lessonID, wordIDs, selectionReasons); err != nil {
		return LessonSession{}, fmt.Errorf("insert progressive lesson items: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return LessonSession{}, fmt.Errorf("commit progressive lesson transaction: %w", err)
	}
	return r.lessonByIDWithReasons(ctx, userID, lessonID, "active")
}

func matchingRecentActiveLessonID(
	ctx context.Context,
	tx pgx.Tx,
	userID string,
	request LessonCreateRequest,
) (string, error) {
	var lessonID string
	err := tx.QueryRow(ctx, `
		select lesson.id::text
		from lesson_sessions lesson
		where lesson.user_id = $1::uuid
		  and lesson.status = 'active'
		  and lesson.source = $2
		  and lesson.study_mode = $3
		  and lesson.lesson_size = $4
		  and lesson.created_at >= now() - ($5::bigint * interval '1 second')
		  and (
		      $6 = ''
		      or not exists (
		          select 1
		          from lesson_session_items item
		          join words word on word.id = item.word_id
		          where item.session_id = lesson.id and word.topic <> $6
		      )
		  )
		  and lesson.review_ratio = $7
		  and (
		      $8::bigint[] is null
		      or coalesce((
		          select array_agg(item.word_id order by item.position)
		          from lesson_session_items item
		          where item.session_id = lesson.id
		      ), '{}'::bigint[]) = $8::bigint[]
		  )
		  and lesson.session_kind is not distinct from nullif($9::text, '')
		order by lesson.updated_at desc
		limit 1
		for update
	`,
		userID,
		request.Source,
		request.StudyMode,
		request.LessonSize,
		int64(duplicateLessonCreationWindow/time.Second),
		strings.TrimSpace(request.Topic),
		resolveLessonReviewRatio(request.ReviewRatio),
		request.WordIDs,
		string(request.SessionKind),
	).Scan(&lessonID)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", nil
	}
	if err != nil {
		return "", fmt.Errorf("query recent matching active lesson: %w", err)
	}
	return lessonID, nil
}
