package learning

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

const diagnosticOnboardingItemLimit = 12

var (
	ErrOnboardingNoCandidates   = errors.New("onboarding diagnostic has no candidates")
	ErrOnboardingNotInProgress  = errors.New("onboarding is not in progress")
	ErrOnboardingIncomplete     = errors.New("onboarding diagnostic is incomplete")
	ErrOnboardingItemOutOfOrder = errors.New("onboarding item is not the current item")
)

type OnboardingState string

const (
	OnboardingStateNotStarted OnboardingState = "not_started"
	OnboardingStateInProgress OnboardingState = "in_progress"
	OnboardingStateCompleted  OnboardingState = "completed"
	OnboardingStateSkipped    OnboardingState = "skipped"
)

type DiagnosticSelfMark string

const (
	DiagnosticSelfMarkKnown  DiagnosticSelfMark = "known"
	DiagnosticSelfMarkUnsure DiagnosticSelfMark = "unsure"
	DiagnosticSelfMarkNew    DiagnosticSelfMark = "new"
)

type DiagnosticPrompt struct {
	Position     int    `json:"position"`
	WordID       int64  `json:"id"`
	Kind         string `json:"kind"`
	Lemma        string `json:"lemma"`
	Phonetic     string `json:"phonetic"`
	PartOfSpeech string `json:"partOfSpeech"`
	Topic        string `json:"topic"`
}

type DiagnosticReveal struct {
	WordID      int64  `json:"id"`
	Translation string `json:"translation"`
}

type OnboardingSnapshot struct {
	State   OnboardingState   `json:"state"`
	Total   int               `json:"total"`
	Marked  int               `json:"marked"`
	Current *DiagnosticPrompt `json:"current,omitempty"`
}

type DiagnosticMarkRequest struct {
	Mark DiagnosticSelfMark `json:"mark"`
}

type DiagnosticMarkResult struct {
	Marked        int              `json:"marked"`
	Total         int              `json:"total"`
	CompleteReady bool             `json:"completeReady"`
	Reveal        DiagnosticReveal `json:"reveal"`
}

type diagnosticCandidate struct {
	WordID       int64
	Kind         string
	Lemma        string
	Phonetic     string
	PartOfSpeech string
	Topic        string
}

type diagnosticInitialization struct {
	Status       string
	Easiness     float64
	IntervalDays int
	Repetitions  int
	DueAfter     time.Duration
	Apply        bool
}

func (r *Repository) OnboardingStatus(ctx context.Context, userID string) (OnboardingSnapshot, error) {
	state := OnboardingStateNotStarted
	if err := r.pool.QueryRow(ctx, `
		select onboarding_state
		from user_learning_preferences
		where user_id = $1::uuid
	`, userID).Scan(&state); err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return OnboardingSnapshot{}, fmt.Errorf("query onboarding state: %w", err)
	}

	snapshot := OnboardingSnapshot{State: state}
	if err := r.pool.QueryRow(ctx, `
		select count(*)::int,
		       count(*) filter (where self_mark is not null)::int
		from onboarding_diagnostic_items
		where user_id = $1::uuid
	`, userID).Scan(&snapshot.Total, &snapshot.Marked); err != nil {
		return OnboardingSnapshot{}, fmt.Errorf("query onboarding progress: %w", err)
	}
	if state != OnboardingStateInProgress {
		return snapshot, nil
	}

	var prompt DiagnosticPrompt
	err := r.pool.QueryRow(ctx, `
		select item.position,
		       word.id,
		       word.kind,
		       word.lemma,
		       word.phonetic,
		       word.part_of_speech,
		       word.topic
		from onboarding_diagnostic_items item
		join words word on word.id = item.word_id
		where item.user_id = $1::uuid and item.self_mark is null
		order by item.position
		limit 1
	`, userID).Scan(
		&prompt.Position,
		&prompt.WordID,
		&prompt.Kind,
		&prompt.Lemma,
		&prompt.Phonetic,
		&prompt.PartOfSpeech,
		&prompt.Topic,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return snapshot, nil
	}
	if err != nil {
		return OnboardingSnapshot{}, fmt.Errorf("query current onboarding item: %w", err)
	}
	snapshot.Current = &prompt
	return snapshot, nil
}

func (r *Repository) StartOnboarding(ctx context.Context, userID string) (OnboardingSnapshot, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return OnboardingSnapshot{}, fmt.Errorf("begin onboarding start: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if _, err := tx.Exec(ctx, `select pg_advisory_xact_lock(hashtextextended('onboarding:' || $1, 0))`, userID); err != nil {
		return OnboardingSnapshot{}, fmt.Errorf("lock onboarding start: %w", err)
	}

	state := OnboardingStateNotStarted
	err = tx.QueryRow(ctx, `
		select onboarding_state
		from user_learning_preferences
		where user_id = $1::uuid
		for update
	`, userID).Scan(&state)
	if errors.Is(err, pgx.ErrNoRows) {
		if _, err := tx.Exec(ctx, `
			insert into user_learning_preferences(user_id)
			values ($1::uuid)
		`, userID); err != nil {
			return OnboardingSnapshot{}, fmt.Errorf("create onboarding preferences: %w", err)
		}
		state = OnboardingStateNotStarted
	} else if err != nil {
		return OnboardingSnapshot{}, fmt.Errorf("lock onboarding preferences: %w", err)
	}

	if state == OnboardingStateInProgress || state == OnboardingStateCompleted {
		if err := tx.Commit(ctx); err != nil {
			return OnboardingSnapshot{}, fmt.Errorf("commit idempotent onboarding start: %w", err)
		}
		return r.OnboardingStatus(ctx, userID)
	}

	candidates, err := queryDiagnosticCandidates(ctx, tx, userID)
	if err != nil {
		return OnboardingSnapshot{}, err
	}
	selected := selectDiagnosticCandidates(candidates, diagnosticOnboardingItemLimit)
	if len(selected) == 0 {
		return OnboardingSnapshot{}, ErrOnboardingNoCandidates
	}

	if _, err := tx.Exec(ctx, `delete from onboarding_diagnostic_items where user_id = $1::uuid`, userID); err != nil {
		return OnboardingSnapshot{}, fmt.Errorf("reset onboarding diagnostic: %w", err)
	}
	for position, candidate := range selected {
		if _, err := tx.Exec(ctx, `
			insert into onboarding_diagnostic_items(user_id, position, word_id)
			values ($1::uuid, $2, $3)
		`, userID, position, candidate.WordID); err != nil {
			return OnboardingSnapshot{}, fmt.Errorf("insert onboarding diagnostic item: %w", err)
		}
	}
	if _, err := tx.Exec(ctx, `
		update user_learning_preferences
		set onboarding_state = 'in_progress',
		    onboarding_started_at = now(),
		    onboarding_completed_at = null,
		    onboarding_skipped_at = null,
		    updated_at = now()
		where user_id = $1::uuid
	`, userID); err != nil {
		return OnboardingSnapshot{}, fmt.Errorf("start onboarding diagnostic: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return OnboardingSnapshot{}, fmt.Errorf("commit onboarding start: %w", err)
	}
	return r.OnboardingStatus(ctx, userID)
}

func queryDiagnosticCandidates(ctx context.Context, tx pgx.Tx, userID string) ([]diagnosticCandidate, error) {
	rows, err := tx.Query(ctx, `
		select word.id,
		       word.kind,
		       word.lemma,
		       word.phonetic,
		       word.part_of_speech,
		       word.topic
		from user_words user_word
		join words word on word.id = user_word.word_id
		where user_word.user_id = $1::uuid
		order by md5($1::text || ':' || word.id::text), word.id
		limit 120
	`, userID)
	if err != nil {
		return nil, fmt.Errorf("query onboarding diagnostic candidates: %w", err)
	}
	defer rows.Close()

	candidates := make([]diagnosticCandidate, 0, 120)
	for rows.Next() {
		var candidate diagnosticCandidate
		if err := rows.Scan(
			&candidate.WordID,
			&candidate.Kind,
			&candidate.Lemma,
			&candidate.Phonetic,
			&candidate.PartOfSpeech,
			&candidate.Topic,
		); err != nil {
			return nil, fmt.Errorf("scan onboarding diagnostic candidate: %w", err)
		}
		candidates = append(candidates, candidate)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate onboarding diagnostic candidates: %w", err)
	}
	return candidates, nil
}

func selectDiagnosticCandidates(candidates []diagnosticCandidate, limit int) []diagnosticCandidate {
	if limit <= 0 || len(candidates) == 0 {
		return nil
	}
	if limit > len(candidates) {
		limit = len(candidates)
	}

	selected := make([]diagnosticCandidate, 0, limit)
	seen := make(map[int64]struct{}, limit)
	take := func(max int, match func(diagnosticCandidate) bool) {
		for _, candidate := range candidates {
			if len(selected) >= limit || max == 0 {
				return
			}
			if _, exists := seen[candidate.WordID]; exists || !match(candidate) {
				continue
			}
			selected = append(selected, candidate)
			seen[candidate.WordID] = struct{}{}
			max--
		}
	}

	take(2, func(candidate diagnosticCandidate) bool { return candidate.Kind == "phrase" })
	take(2, func(candidate diagnosticCandidate) bool { return isTechnicalDiagnosticTopic(candidate.Topic) })
	take(2, func(candidate diagnosticCandidate) bool { return strings.EqualFold(candidate.PartOfSpeech, "noun") })
	take(2, func(candidate diagnosticCandidate) bool { return strings.EqualFold(candidate.PartOfSpeech, "verb") })
	take(2, func(candidate diagnosticCandidate) bool { return strings.EqualFold(candidate.PartOfSpeech, "adjective") })
	take(limit-len(selected), func(diagnosticCandidate) bool { return true })
	return selected
}

func isTechnicalDiagnosticTopic(topic string) bool {
	normalized := strings.ToLower(strings.TrimSpace(topic))
	return normalized == "data engineering" ||
		normalized == "backend development" ||
		strings.Contains(normalized, "technical")
}

func (r *Repository) MarkOnboardingItem(
	ctx context.Context,
	userID string,
	wordID int64,
	mark DiagnosticSelfMark,
) (DiagnosticMarkResult, error) {
	if !validDiagnosticSelfMark(mark) {
		return DiagnosticMarkResult{}, fmt.Errorf("invalid diagnostic self mark %q", mark)
	}

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return DiagnosticMarkResult{}, fmt.Errorf("begin onboarding mark: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()
	if _, err := tx.Exec(ctx, `select pg_advisory_xact_lock(hashtextextended('onboarding:' || $1, 0))`, userID); err != nil {
		return DiagnosticMarkResult{}, fmt.Errorf("lock onboarding mark: %w", err)
	}

	var state OnboardingState
	if err := tx.QueryRow(ctx, `
		select onboarding_state
		from user_learning_preferences
		where user_id = $1::uuid
		for update
	`, userID).Scan(&state); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return DiagnosticMarkResult{}, ErrOnboardingNotInProgress
		}
		return DiagnosticMarkResult{}, fmt.Errorf("lock onboarding state for mark: %w", err)
	}
	if state != OnboardingStateInProgress {
		return DiagnosticMarkResult{}, ErrOnboardingNotInProgress
	}

	var currentWordID int64
	var translation string
	err = tx.QueryRow(ctx, `
		select item.word_id, word.translation
		from onboarding_diagnostic_items item
		join words word on word.id = item.word_id
		where item.user_id = $1::uuid and item.self_mark is null
		order by item.position
		limit 1
		for update of item
	`, userID).Scan(&currentWordID, &translation)
	if errors.Is(err, pgx.ErrNoRows) {
		return DiagnosticMarkResult{}, ErrOnboardingIncomplete
	}
	if err != nil {
		return DiagnosticMarkResult{}, fmt.Errorf("lock current onboarding item: %w", err)
	}
	if currentWordID != wordID {
		return DiagnosticMarkResult{}, ErrOnboardingItemOutOfOrder
	}

	if _, err := tx.Exec(ctx, `
		update onboarding_diagnostic_items
		set self_mark = $3, marked_at = now()
		where user_id = $1::uuid and word_id = $2
	`, userID, wordID, mark); err != nil {
		return DiagnosticMarkResult{}, fmt.Errorf("mark onboarding diagnostic item: %w", err)
	}

	result := DiagnosticMarkResult{Reveal: DiagnosticReveal{WordID: wordID, Translation: translation}}
	if err := tx.QueryRow(ctx, `
		select count(*)::int,
		       count(*) filter (where self_mark is not null)::int
		from onboarding_diagnostic_items
		where user_id = $1::uuid
	`, userID).Scan(&result.Total, &result.Marked); err != nil {
		return DiagnosticMarkResult{}, fmt.Errorf("query onboarding mark progress: %w", err)
	}
	result.CompleteReady = result.Total > 0 && result.Marked == result.Total

	if err := tx.Commit(ctx); err != nil {
		return DiagnosticMarkResult{}, fmt.Errorf("commit onboarding mark: %w", err)
	}
	return result, nil
}

func (r *Repository) CompleteOnboarding(ctx context.Context, userID string) (OnboardingSnapshot, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return OnboardingSnapshot{}, fmt.Errorf("begin onboarding completion: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()
	if _, err := tx.Exec(ctx, `select pg_advisory_xact_lock(hashtextextended('onboarding:' || $1, 0))`, userID); err != nil {
		return OnboardingSnapshot{}, fmt.Errorf("lock onboarding completion: %w", err)
	}

	var state OnboardingState
	if err := tx.QueryRow(ctx, `
		select onboarding_state
		from user_learning_preferences
		where user_id = $1::uuid
		for update
	`, userID).Scan(&state); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return OnboardingSnapshot{}, ErrOnboardingNotInProgress
		}
		return OnboardingSnapshot{}, fmt.Errorf("lock onboarding state for completion: %w", err)
	}
	if state == OnboardingStateCompleted {
		if err := tx.Commit(ctx); err != nil {
			return OnboardingSnapshot{}, fmt.Errorf("commit idempotent onboarding completion: %w", err)
		}
		return r.OnboardingStatus(ctx, userID)
	}
	if state != OnboardingStateInProgress {
		return OnboardingSnapshot{}, ErrOnboardingNotInProgress
	}

	rows, err := tx.Query(ctx, `
		select word_id, self_mark
		from onboarding_diagnostic_items
		where user_id = $1::uuid
		order by position
		for update
	`, userID)
	if err != nil {
		return OnboardingSnapshot{}, fmt.Errorf("lock onboarding diagnostic for completion: %w", err)
	}
	type markedItem struct {
		wordID int64
		mark   *DiagnosticSelfMark
	}
	items := make([]markedItem, 0, diagnosticOnboardingItemLimit)
	for rows.Next() {
		var item markedItem
		if err := rows.Scan(&item.wordID, &item.mark); err != nil {
			rows.Close()
			return OnboardingSnapshot{}, fmt.Errorf("scan onboarding completion item: %w", err)
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		return OnboardingSnapshot{}, fmt.Errorf("iterate onboarding completion items: %w", err)
	}
	rows.Close()
	if len(items) == 0 {
		return OnboardingSnapshot{}, ErrOnboardingIncomplete
	}
	for _, item := range items {
		if item.mark == nil || !validDiagnosticSelfMark(*item.mark) {
			return OnboardingSnapshot{}, ErrOnboardingIncomplete
		}
	}

	now := time.Now().UTC()
	for _, item := range items {
		policy := diagnosticInitializationForMark(*item.mark)
		if !policy.Apply {
			continue
		}
		if _, err := tx.Exec(ctx, `
			update user_words
			set status = $3,
			    easiness = $4,
			    interval_days = $5,
			    repetitions = $6,
			    due_at = $7,
			    updated_at = $8
			where user_id = $1::uuid
			  and word_id = $2
			  and status = 'new'
		`,
			userID,
			item.wordID,
			policy.Status,
			policy.Easiness,
			policy.IntervalDays,
			policy.Repetitions,
			now.Add(policy.DueAfter),
			now,
		); err != nil {
			return OnboardingSnapshot{}, fmt.Errorf("initialize diagnostic learning state: %w", err)
		}
	}

	if _, err := tx.Exec(ctx, `
		update user_learning_preferences
		set onboarding_state = 'completed',
		    onboarding_completed_at = $2,
		    onboarding_skipped_at = null,
		    updated_at = $2
		where user_id = $1::uuid
	`, userID, now); err != nil {
		return OnboardingSnapshot{}, fmt.Errorf("complete onboarding state: %w", err)
	}
	if err := tx.Commit(ctx); err != nil {
		return OnboardingSnapshot{}, fmt.Errorf("commit onboarding completion: %w", err)
	}
	return r.OnboardingStatus(ctx, userID)
}

func (r *Repository) SkipOnboarding(ctx context.Context, userID string) (OnboardingSnapshot, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return OnboardingSnapshot{}, fmt.Errorf("begin onboarding skip: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()
	if _, err := tx.Exec(ctx, `select pg_advisory_xact_lock(hashtextextended('onboarding:' || $1, 0))`, userID); err != nil {
		return OnboardingSnapshot{}, fmt.Errorf("lock onboarding skip: %w", err)
	}

	state := OnboardingStateNotStarted
	err = tx.QueryRow(ctx, `
		select onboarding_state
		from user_learning_preferences
		where user_id = $1::uuid
		for update
	`, userID).Scan(&state)
	if errors.Is(err, pgx.ErrNoRows) {
		if _, err := tx.Exec(ctx, `
			insert into user_learning_preferences(user_id, onboarding_state, onboarding_skipped_at)
			values ($1::uuid, 'skipped', now())
		`, userID); err != nil {
			return OnboardingSnapshot{}, fmt.Errorf("create skipped onboarding state: %w", err)
		}
	} else if err != nil {
		return OnboardingSnapshot{}, fmt.Errorf("lock onboarding state for skip: %w", err)
	} else if state != OnboardingStateCompleted {
		if _, err := tx.Exec(ctx, `
			update user_learning_preferences
			set onboarding_state = 'skipped',
			    onboarding_skipped_at = now(),
			    updated_at = now()
			where user_id = $1::uuid
		`, userID); err != nil {
			return OnboardingSnapshot{}, fmt.Errorf("skip onboarding: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return OnboardingSnapshot{}, fmt.Errorf("commit onboarding skip: %w", err)
	}
	return r.OnboardingStatus(ctx, userID)
}

func validDiagnosticSelfMark(mark DiagnosticSelfMark) bool {
	return mark == DiagnosticSelfMarkKnown || mark == DiagnosticSelfMarkUnsure || mark == DiagnosticSelfMarkNew
}

func diagnosticInitializationForMark(mark DiagnosticSelfMark) diagnosticInitialization {
	switch mark {
	case DiagnosticSelfMarkKnown:
		return diagnosticInitialization{
			Status:       "review",
			Easiness:     2.60,
			IntervalDays: 7,
			Repetitions:  1,
			DueAfter:     7 * 24 * time.Hour,
			Apply:        true,
		}
	case DiagnosticSelfMarkUnsure:
		return diagnosticInitialization{
			Status:       "learning",
			Easiness:     2.40,
			IntervalDays: 1,
			Repetitions:  0,
			DueAfter:     24 * time.Hour,
			Apply:        true,
		}
	default:
		return diagnosticInitialization{}
	}
}
