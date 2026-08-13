package words

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
)

var (
	ErrCustomWordDuplicate = errors.New("custom word already exists")
	ErrCustomWordNotFound  = errors.New("custom word not found")
)

// CreateCustomWord persists content identity and scheduler enrollment in one
// transaction. The existing user_words defaults intentionally initialize the
// item as due/new, so all lesson, due-queue and review behavior remains owned
// by the established scheduler rather than a custom-vocabulary side channel.
func (r *Repository) CreateCustomWord(
	ctx context.Context,
	userID string,
	request CreateCustomWordRequest,
) (UserWord, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return UserWord{}, fmt.Errorf("begin custom word transaction: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var wordID int64
	err = tx.QueryRow(ctx, `
		insert into words (
			lemma,
			translation,
			phonetic,
			part_of_speech,
			topic,
			source,
			note,
			kind,
			owner_user_id
		) values ($1, $2, $3, $4, $5, $6, $7, 'word', $8::uuid)
		on conflict do nothing
		returning id
	`,
		request.Lemma,
		request.Translation,
		request.Phonetic,
		request.PartOfSpeech,
		request.Topic,
		customWordSource,
		request.Note,
		userID,
	).Scan(&wordID)
	if errors.Is(err, pgx.ErrNoRows) {
		return UserWord{}, ErrCustomWordDuplicate
	}
	if err != nil {
		return UserWord{}, fmt.Errorf("insert custom word: %w", err)
	}

	if _, err := tx.Exec(ctx, `
		insert into user_words (user_id, word_id)
		values ($1::uuid, $2)
	`, userID, wordID); err != nil {
		return UserWord{}, fmt.Errorf("enroll custom word: %w", err)
	}

	item, err := scanUserWord(tx.QueryRow(ctx, `
		select `+catalogSelectFields+`
		from user_words uw
		join words w on w.id = uw.word_id
		where uw.user_id = $1::uuid
		  and w.id = $2
		  and w.owner_user_id = uw.user_id
		  and w.source = $3
	`, userID, wordID, customWordSource))
	if err != nil {
		return UserWord{}, fmt.Errorf("read created custom word: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return UserWord{}, fmt.Errorf("commit custom word transaction: %w", err)
	}
	return item, nil
}

// DeleteCustomWord deletes only private content owned by the authenticated
// account. Foreign keys from user_words, review_events, lesson_session_items,
// idempotency, onboarding and answer suggestions use on-delete cascade, so the
// word and its dependent learning footprint are removed atomically by
// PostgreSQL while shared catalog rows remain unreachable from this mutation.
func (r *Repository) DeleteCustomWord(ctx context.Context, userID string, wordID int64) error {
	result, err := r.pool.Exec(ctx, `
		delete from words
		where id = $1
		  and owner_user_id = $2::uuid
		  and kind = 'word'
		  and source = $3
	`, wordID, userID, customWordSource)
	if err != nil {
		return fmt.Errorf("delete custom word: %w", err)
	}
	if result.RowsAffected() == 0 {
		return ErrCustomWordNotFound
	}
	return nil
}
