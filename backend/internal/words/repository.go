package words

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct{ pool *pgxpool.Pool }

func NewRepository(pool *pgxpool.Pool) *Repository { return &Repository{pool: pool} }

func (r *Repository) ListDue(ctx context.Context, userID string, limit int) ([]UserWord, error) {
	if limit <= 0 || limit > 100 {
		limit = 20
	}
	rows, err := r.pool.Query(ctx, `
		select w.id, w.lemma, w.translation, w.phonetic, w.part_of_speech, w.topic, w.examples, w.note,
		       uw.status, uw.easiness::float8, uw.interval_days, uw.repetitions, uw.due_at, uw.last_reviewed_at
		from user_words uw
		join words w on w.id = uw.word_id
		where uw.user_id = $1::uuid and uw.due_at <= now()
		order by uw.due_at, w.id
		limit $2
	`, userID, limit)
	if err != nil {
		return nil, fmt.Errorf("query due words: %w", err)
	}
	defer rows.Close()

	result := make([]UserWord, 0, limit)
	for rows.Next() {
		var item UserWord
		var examples []byte
		if err := rows.Scan(
			&item.ID, &item.Lemma, &item.Translation, &item.Phonetic, &item.PartOfSpeech, &item.Topic, &examples, &item.Note,
			&item.Status, &item.Easiness, &item.IntervalDays, &item.Repetitions, &item.DueAt, &item.LastReviewedAt,
		); err != nil {
			return nil, fmt.Errorf("scan due word: %w", err)
		}
		if err := json.Unmarshal(examples, &item.Examples); err != nil {
			return nil, fmt.Errorf("decode examples: %w", err)
		}
		result = append(result, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate due words: %w", err)
	}
	return result, nil
}
