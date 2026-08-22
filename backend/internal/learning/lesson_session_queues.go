package learning

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/Dja-tiger/LexiGo/backend/internal/catalog"
	"github.com/jackc/pgx/v5"
)

const (
	lessonOverdueWindow          = 24 * time.Hour
	repeatedAgainMinimumAttempts = 2
	repeatedAlmostMinimumAttempts = 3
)

// queryLessonCandidatesForSession keeps omitted session intent on the legacy
// composer while explicit intent opts into the independent Study/Review/
// Remediation queues introduced by Issue #651.
func queryLessonCandidatesForSession(
	ctx context.Context,
	tx pgx.Tx,
	userID string,
	source string,
	studyMode AnswerMode,
	topic string,
	sessionKind LessonSessionKind,
) ([]lessonCandidate, error) {
	if sessionKind == "" {
		return queryLessonCandidates(ctx, tx, userID, source, studyMode, topic)
	}

	candidates, err := queryExplicitLessonCandidates(ctx, tx, userID, source, studyMode, topic, sessionKind)
	if err != nil {
		return nil, err
	}
	return filterLessonCandidatesForSession(candidates, sessionKind), nil
}

func queryExplicitLessonCandidates(
	ctx context.Context,
	tx pgx.Tx,
	userID string,
	source string,
	studyMode AnswerMode,
	topic string,
	sessionKind LessonSessionKind,
) ([]lessonCandidate, error) {
	excludedWordIDs, err := recentCompletedLessonWordIDsForSession(ctx, tx, userID, source, studyMode, sessionKind)
	if err != nil {
		return nil, err
	}

	rows, err := tx.Query(ctx, `
		with latest_review as (
			select distinct on (review_event.word_id)
			       review_event.word_id,
			       review_event.effective_rating,
			       review_event.correct,
			       review_event.reviewed_at
			from review_events review_event
			where review_event.user_id = $1::uuid
			order by review_event.word_id, review_event.reviewed_at desc, review_event.id desc
		),
		recent_signal as (
			select review_event.word_id,
			       count(*) filter (where review_event.effective_rating = 'again')::int as again_count,
			       count(*) filter (where review_event.effective_rating = 'almost')::int as almost_count
			from review_events review_event
			where review_event.user_id = $1::uuid
			  and review_event.reviewed_at >= now() - ($5::bigint * interval '1 second')
			group by review_event.word_id
		),
		topic_signal as (
			select word.topic,
			       count(*) filter (where user_word.status <> 'new')::int as reviewed_count,
			       avg(user_word.easiness::float8) filter (where user_word.status <> 'new') as avg_easiness
			from user_words user_word
			join words word on word.id = user_word.word_id
			where user_word.user_id = $1::uuid
			group by word.topic
		)
		select word.id,
		       word.kind,
		       user_word.status,
		       user_word.due_at,
		       user_word.status <> 'new' and user_word.due_at <= now(),
		       word.topic,
		       coalesce(word.part_of_speech, ''),
		       coalesce(
		           latest_review.reviewed_at >= now() - ($5::bigint * interval '1 second')
		           and (
		               latest_review.effective_rating = 'again'
		               or latest_review.correct is false
		           ),
		           false
		       ),
		       coalesce(
		           topic_signal.reviewed_count >= $7
		           and topic_signal.avg_easiness < $6,
		           false
		       ),
		       user_word.easiness::float8,
		       coalesce(recent_signal.again_count >= $8, false),
		       coalesce(recent_signal.almost_count >= $9, false),
		       user_word.status <> 'new'
		           and user_word.due_at <= now() - ($10::bigint * interval '1 second')
		from user_words user_word
		join words word on word.id = user_word.word_id
		left join latest_review on latest_review.word_id = user_word.word_id
		left join recent_signal on recent_signal.word_id = user_word.word_id
		left join topic_signal on topic_signal.topic = word.topic
		where user_word.user_id = $1::uuid
		  and (
		      $2 = 'mixed'
		      or ($2 = 'phrases' and word.kind = 'phrase')
		      or ($2 = 'noun' and word.kind = 'word' and lower(word.part_of_speech) = 'noun')
		      or ($2 = 'verb' and word.kind = 'word' and lower(word.part_of_speech) = 'verb')
		      or ($2 = 'adjective' and word.kind = 'word' and lower(word.part_of_speech) = 'adjective')
		      or ($2 = 'daily-life' and word.kind = 'word' and word.topic = 'Daily Life')
		      or ($2 = 'travel' and word.kind = 'word' and word.topic = 'Travel')
		      or ($2 = 'data-engineering' and word.kind = 'word' and word.topic = 'Data Engineering')
		      or ($2 = 'backend' and word.kind = 'word' and word.topic = 'Backend Development')
		      or ($2 = 'academic-technical-english' and word.kind = 'word' and word.source = $4)
		  )
		  and ($3 = '' or word.topic = $3)
		order by user_word.due_at, user_word.easiness, word.id
	`,
		userID,
		source,
		strings.TrimSpace(topic),
		catalog.Source,
		int64(recentLessonFailureWindow/time.Second),
		weakLessonTopicMaxEasiness,
		weakLessonTopicMinReviewed,
		repeatedAgainMinimumAttempts,
		repeatedAlmostMinimumAttempts,
		int64(lessonOverdueWindow/time.Second),
	)
	if err != nil {
		return nil, fmt.Errorf("query explicit lesson candidates: %w", err)
	}
	defer rows.Close()

	candidates := make([]lessonCandidate, 0)
	for rows.Next() {
		var candidate lessonCandidate
		if err := rows.Scan(
			&candidate.WordID,
			&candidate.Kind,
			&candidate.Status,
			&candidate.DueAt,
			&candidate.Due,
			&candidate.Topic,
			&candidate.PartOfSpeech,
			&candidate.RecentFailure,
			&candidate.WeakTopic,
			&candidate.Easiness,
			&candidate.RepeatedAgain,
			&candidate.RepeatedAlmost,
			&candidate.Overdue,
		); err != nil {
			return nil, fmt.Errorf("scan explicit lesson candidate: %w", err)
		}
		candidates = append(candidates, candidate)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate explicit lesson candidates: %w", err)
	}
	return excludeLessonCandidates(candidates, excludedWordIDs), nil
}

func filterLessonCandidatesForSession(candidates []lessonCandidate, sessionKind LessonSessionKind) []lessonCandidate {
	filtered := make([]lessonCandidate, 0, len(candidates))
	for _, candidate := range candidates {
		reason, include := explicitLessonSelectionReason(candidate, sessionKind)
		if !include {
			continue
		}
		candidate.ReasonOverride = reason
		filtered = append(filtered, candidate)
	}
	return filtered
}

func explicitLessonSelectionReason(candidate lessonCandidate, sessionKind LessonSessionKind) (LessonSelectionReason, bool) {
	switch sessionKind {
	case LessonSessionKindStudy:
		if candidate.Status != "new" {
			return "", false
		}
		return LessonReasonNew, true
	case LessonSessionKindReview:
		if candidate.Status == "new" || !candidate.Due {
			return "", false
		}
		switch {
		case candidate.Status == "learning":
			return LessonReasonRelearningDue, true
		case candidate.RepeatedAgain:
			return LessonReasonRepeatedAgain, true
		case candidate.RecentFailure:
			return LessonReasonRecentFailure, true
		case candidate.Overdue:
			return LessonReasonOverdue, true
		default:
			return LessonReasonDue, true
		}
	case LessonSessionKindRemediation:
		if candidate.Status == "new" {
			return "", false
		}
		switch {
		case candidate.RepeatedAgain:
			return LessonReasonRepeatedAgain, true
		case candidate.RecentFailure:
			return LessonReasonRecentFailure, true
		case candidate.RepeatedAlmost:
			return LessonReasonRepeatedAlmost, true
		case candidate.WeakTopic:
			return LessonReasonWeakTopic, true
		default:
			return "", false
		}
	default:
		return "", false
	}
}

func recentCompletedLessonWordIDsForSession(
	ctx context.Context,
	tx pgx.Tx,
	userID string,
	source string,
	studyMode AnswerMode,
	sessionKind LessonSessionKind,
) (map[int64]struct{}, error) {
	rows, err := tx.Query(ctx, `
		with latest_completed as (
			select id
			from lesson_sessions
			where user_id = $1::uuid
			  and status = 'completed'
			  and source = $2
			  and study_mode = $3
			  and session_kind = $4
			  and completed_at >= now() - ($5::bigint * interval '1 second')
			order by completed_at desc, id desc
			limit 1
		)
		select item.word_id
		from latest_completed completed
		join lesson_session_items item on item.session_id = completed.id
	`, userID, source, studyMode, string(sessionKind), int64(immediateLessonContinuationWindow/time.Second))
	if err != nil {
		return nil, fmt.Errorf("query recent completed explicit lesson items: %w", err)
	}
	defer rows.Close()

	excluded := make(map[int64]struct{})
	for rows.Next() {
		var wordID int64
		if err := rows.Scan(&wordID); err != nil {
			return nil, fmt.Errorf("scan recent completed explicit lesson item: %w", err)
		}
		excluded[wordID] = struct{}{}
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate recent completed explicit lesson item: %w", err)
	}
	return excluded, nil
}
