package words

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct{ pool *pgxpool.Pool }

func NewRepository(pool *pgxpool.Pool) *Repository { return &Repository{pool: pool} }

func (r *Repository) ListDue(ctx context.Context, userID string, limit int, kind string) ([]UserWord, error) {
	return r.list(ctx, userID, limit, kind, true)
}

func (r *Repository) List(ctx context.Context, userID string, limit int, kind string) ([]UserWord, error) {
	return r.list(ctx, userID, limit, kind, false)
}

func (r *Repository) list(ctx context.Context, userID string, limit int, kind string, dueOnly bool) ([]UserWord, error) {
	if limit <= 0 {
		limit = 30
	}
	if limit > 1000 {
		limit = 1000
	}
	rows, err := r.pool.Query(ctx, `
		select w.id, w.kind, coalesce(w.slug, ''), w.lemma, w.translation, w.phonetic,
		       w.part_of_speech, w.topic, w.examples, w.note, w.cloze, w.cloze_answer,
		       uw.status, uw.easiness::float8, uw.interval_days, uw.repetitions,
		       uw.due_at, uw.last_reviewed_at
		from user_words uw
		join words w on w.id = uw.word_id
		where uw.user_id = $1::uuid
		  and ($3 = '' or w.kind = $3)
		  and (not $4 or uw.due_at <= now())
		order by case when $4 then uw.due_at end, w.topic, w.id
		limit $2
	`, userID, limit, kind, dueOnly)
	if err != nil {
		return nil, fmt.Errorf("query learning items: %w", err)
	}
	defer rows.Close()

	result := make([]UserWord, 0, limit)
	for rows.Next() {
		var item UserWord
		var examples []byte
		if err := rows.Scan(
			&item.ID, &item.Kind, &item.Slug, &item.Lemma, &item.Translation, &item.Phonetic,
			&item.PartOfSpeech, &item.Topic, &examples, &item.Note, &item.Cloze, &item.ClozeAnswer,
			&item.Status, &item.Easiness, &item.IntervalDays, &item.Repetitions,
			&item.DueAt, &item.LastReviewedAt,
		); err != nil {
			return nil, fmt.Errorf("scan learning item: %w", err)
		}
		if err := json.Unmarshal(examples, &item.Examples); err != nil {
			return nil, fmt.Errorf("decode examples: %w", err)
		}
		result = append(result, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate learning items: %w", err)
	}
	return result, nil
}
