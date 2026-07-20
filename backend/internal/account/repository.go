package account

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var ErrAccountNotFound = errors.New("account not found")

type Repository interface {
	Identity(ctx context.Context, userID string) (Identity, error)
	Export(ctx context.Context, identity Identity, generatedAt time.Time) (ExportData, error)
}

type PostgresRepository struct {
	pool *pgxpool.Pool
}

func NewPostgresRepository(pool *pgxpool.Pool) *PostgresRepository {
	return &PostgresRepository{pool: pool}
}

func (r *PostgresRepository) Identity(ctx context.Context, userID string) (Identity, error) {
	var identity Identity
	err := r.pool.QueryRow(ctx, `
		select id::text, email, display_name, password_hash, created_at, updated_at
		from users
		where id = $1::uuid
	`, userID).Scan(
		&identity.ID,
		&identity.Email,
		&identity.DisplayName,
		&identity.PasswordHash,
		&identity.CreatedAt,
		&identity.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return Identity{}, ErrAccountNotFound
	}
	if err != nil {
		return Identity{}, fmt.Errorf("query export identity: %w", err)
	}
	return identity, nil
}

func (r *PostgresRepository) Export(
	ctx context.Context,
	identity Identity,
	generatedAt time.Time,
) (ExportData, error) {
	export := ExportData{
		SchemaVersion: ExportSchemaVersion,
		GeneratedAt:   generatedAt,
		Account: ExportAccount{
			ID:          identity.ID,
			Email:       identity.Email,
			DisplayName: identity.DisplayName,
			CreatedAt:   identity.CreatedAt,
			UpdatedAt:   identity.UpdatedAt,
		},
		Words:         []ExportWord{},
		ReviewHistory: []ExportReviewEvent{},
		SecurityAudit: []ExportAuditEvent{},
	}

	var preferences ExportLearningPreferences
	err := r.pool.QueryRow(ctx, `
		select daily_goal, updated_at
		from user_learning_preferences
		where user_id = $1::uuid
	`, identity.ID).Scan(&preferences.DailyGoal, &preferences.UpdatedAt)
	if err == nil {
		export.LearningPreferences = &preferences
	} else if !errors.Is(err, pgx.ErrNoRows) {
		return ExportData{}, fmt.Errorf("query export learning preferences: %w", err)
	}

	wordRows, err := r.pool.Query(ctx, `
		select
			user_words.word_id,
			words.lemma,
			words.translation,
			words.part_of_speech,
			words.topic,
			user_words.status,
			user_words.easiness::double precision,
			user_words.interval_days,
			user_words.repetitions,
			user_words.due_at,
			user_words.last_reviewed_at,
			user_words.created_at,
			user_words.updated_at
		from user_words
		join words on words.id = user_words.word_id
		where user_words.user_id = $1::uuid
		order by user_words.word_id
	`, identity.ID)
	if err != nil {
		return ExportData{}, fmt.Errorf("query export words: %w", err)
	}
	for wordRows.Next() {
		var word ExportWord
		if err := wordRows.Scan(
			&word.WordID,
			&word.Lemma,
			&word.Translation,
			&word.PartOfSpeech,
			&word.Topic,
			&word.Status,
			&word.Easiness,
			&word.IntervalDays,
			&word.Repetitions,
			&word.DueAt,
			&word.LastReviewedAt,
			&word.CreatedAt,
			&word.UpdatedAt,
		); err != nil {
			wordRows.Close()
			return ExportData{}, fmt.Errorf("scan export word: %w", err)
		}
		export.Words = append(export.Words, word)
	}
	if err := wordRows.Err(); err != nil {
		wordRows.Close()
		return ExportData{}, fmt.Errorf("iterate export words: %w", err)
	}
	wordRows.Close()

	reviewRows, err := r.pool.Query(ctx, `
		select
			review_events.id,
			review_events.word_id,
			words.lemma,
			words.translation,
			review_events.grade,
			review_events.rating,
			review_events.answer_mode,
			review_events.correct,
			review_events.answer_revealed,
			review_events.event_schema_version,
			review_events.response_ms,
			review_events.reviewed_at
		from review_events
		join words on words.id = review_events.word_id
		where review_events.user_id = $1::uuid
		order by review_events.reviewed_at, review_events.id
	`, identity.ID)
	if err != nil {
		return ExportData{}, fmt.Errorf("query export review history: %w", err)
	}
	for reviewRows.Next() {
		var event ExportReviewEvent
		if err := reviewRows.Scan(
			&event.ID,
			&event.WordID,
			&event.Lemma,
			&event.Translation,
			&event.Grade,
			&event.Rating,
			&event.AnswerMode,
			&event.Correct,
			&event.AnswerRevealed,
			&event.EventSchemaVersion,
			&event.ResponseMS,
			&event.ReviewedAt,
		); err != nil {
			reviewRows.Close()
			return ExportData{}, fmt.Errorf("scan export review event: %w", err)
		}
		export.ReviewHistory = append(export.ReviewHistory, event)
	}
	if err := reviewRows.Err(); err != nil {
		reviewRows.Close()
		return ExportData{}, fmt.Errorf("iterate export review history: %w", err)
	}
	reviewRows.Close()

	auditRows, err := r.pool.Query(ctx, `
		select id, event_type, user_agent, coalesce(ip_address::text, ''), metadata::text, created_at
		from account_audit_events
		where user_id = $1::uuid
		order by created_at, id
	`, identity.ID)
	if err != nil {
		return ExportData{}, fmt.Errorf("query export security audit: %w", err)
	}
	for auditRows.Next() {
		var (
			event       ExportAuditEvent
			metadataRaw string
		)
		if err := auditRows.Scan(
			&event.ID,
			&event.Type,
			&event.UserAgent,
			&event.IPAddress,
			&metadataRaw,
			&event.CreatedAt,
		); err != nil {
			auditRows.Close()
			return ExportData{}, fmt.Errorf("scan export security audit: %w", err)
		}
		event.Metadata = map[string]string{}
		var metadata map[string]any
		if err := json.Unmarshal([]byte(metadataRaw), &metadata); err != nil {
			auditRows.Close()
			return ExportData{}, fmt.Errorf("decode export audit metadata: %w", err)
		}
		for key, value := range metadata {
			event.Metadata[key] = fmt.Sprint(value)
		}
		export.SecurityAudit = append(export.SecurityAudit, event)
	}
	if err := auditRows.Err(); err != nil {
		auditRows.Close()
		return ExportData{}, fmt.Errorf("iterate export security audit: %w", err)
	}
	auditRows.Close()

	return export, nil
}
