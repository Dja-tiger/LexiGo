package learning

import (
	"context"
	"fmt"
)

func (r *Repository) ActiveLessonWithReasons(ctx context.Context, userID string) (LessonSession, error) {
	lesson, err := r.ActiveLesson(ctx, userID)
	if err != nil {
		return LessonSession{}, err
	}
	return r.attachLessonSelectionReasons(ctx, lesson)
}

func (r *Repository) lessonByIDWithReasons(
	ctx context.Context,
	userID string,
	lessonID string,
	requiredStatus string,
) (LessonSession, error) {
	lesson, err := r.lessonByID(ctx, userID, lessonID, requiredStatus)
	if err != nil {
		return LessonSession{}, err
	}
	return r.attachLessonSelectionReasons(ctx, lesson)
}

func (r *Repository) attachLessonSelectionReasons(ctx context.Context, lesson LessonSession) (LessonSession, error) {
	var rawSessionKind string
	if err := r.pool.QueryRow(ctx, `
		select coalesce(session_kind, '')
		from lesson_sessions
		where id = $1::uuid
	`, lesson.ID).Scan(&rawSessionKind); err != nil {
		return LessonSession{}, fmt.Errorf("query lesson session kind: %w", err)
	}
	sessionKind := LessonSessionKind(rawSessionKind)
	if !validLessonSessionKind(sessionKind) {
		return LessonSession{}, ErrInvalidLessonState
	}
	lesson.SessionKind = sessionKind

	rows, err := r.pool.Query(ctx, `
		select position, coalesce(selection_reason, '')
		from lesson_session_items
		where session_id = $1::uuid
		order by position
	`, lesson.ID)
	if err != nil {
		return LessonSession{}, fmt.Errorf("query lesson selection reasons: %w", err)
	}
	defer rows.Close()

	seen := 0
	for rows.Next() {
		var position int
		var rawReason string
		if err := rows.Scan(&position, &rawReason); err != nil {
			return LessonSession{}, fmt.Errorf("scan lesson selection reason: %w", err)
		}
		if position < 0 || position >= len(lesson.Items) || lesson.Items[position].Position != position {
			return LessonSession{}, ErrInvalidLessonState
		}
		reason := LessonSelectionReason(rawReason)
		if reason != "" && !validLessonSelectionReason(reason) {
			return LessonSession{}, ErrInvalidLessonState
		}
		lesson.Items[position].Reason = reason
		seen++
	}
	if err := rows.Err(); err != nil {
		return LessonSession{}, fmt.Errorf("iterate lesson selection reasons: %w", err)
	}
	if seen != len(lesson.Items) {
		return LessonSession{}, ErrInvalidLessonState
	}
	return lesson, nil
}

func validLessonSelectionReason(reason LessonSelectionReason) bool {
	switch reason {
	case LessonReasonRecentFailure,
		LessonReasonDue,
		LessonReasonOverdue,
		LessonReasonRelearningDue,
		LessonReasonRepeatedAgain,
		LessonReasonRepeatedAlmost,
		LessonReasonWeakTopic,
		LessonReasonNew,
		LessonReasonScheduled,
		LessonReasonManual:
		return true
	default:
		return false
	}
}
