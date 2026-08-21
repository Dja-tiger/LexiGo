package words

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
)

var (
	ErrCustomPhraseDuplicate = errors.New("custom phrase already exists")
	ErrCustomPhraseNotFound  = errors.New("custom phrase not found")
	errCustomPhraseSlugTaken = errors.New("generated custom phrase slug already exists")
)

const maxCustomPhraseSlugAttempts = 4

// CreateCustomPhrase persists private phrase content and its existing
// user_words scheduler enrollment atomically. Generated slug collisions are
// retried inside the transaction; content duplicates remain stable 409s.
func (r *Repository) CreateCustomPhrase(
	ctx context.Context,
	userID string,
	request CreateCustomPhraseRequest,
) (UserWord, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return UserWord{}, fmt.Errorf("begin custom phrase transaction: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var item UserWord
	for attempt := 0; attempt < maxCustomPhraseSlugAttempts; attempt++ {
		slug, err := newCustomPhraseSlug()
		if err != nil {
			return UserWord{}, err
		}
		item, err = insertCustomPhraseTx(ctx, tx, userID, request, slug)
		if errors.Is(err, errCustomPhraseSlugTaken) {
			continue
		}
		if err != nil {
			return UserWord{}, err
		}
		if err := tx.Commit(ctx); err != nil {
			return UserWord{}, fmt.Errorf("commit custom phrase transaction: %w", err)
		}
		return item, nil
	}

	return UserWord{}, fmt.Errorf("generate unique custom phrase slug after %d attempts", maxCustomPhraseSlugAttempts)
}

func insertCustomPhraseTx(
	ctx context.Context,
	tx pgx.Tx,
	userID string,
	request CreateCustomPhraseRequest,
	slug string,
) (UserWord, error) {
	var phraseID int64
	err := tx.QueryRow(ctx, `
		insert into words (
			lemma,
			translation,
			phonetic,
			part_of_speech,
			topic,
			source,
			note,
			kind,
			slug,
			cloze,
			cloze_answer,
			owner_user_id
		) values ($1, $2, $3, $4, $5, $6, $7, 'phrase', $8, $9, $10, $11::uuid)
		on conflict do nothing
		returning id
	`,
		request.Lemma,
		request.Translation,
		request.Phonetic,
		customPhrasePartOfSpeech,
		request.Topic,
		customWordSource,
		request.Note,
		slug,
		request.Cloze,
		request.ClozeAnswer,
		userID,
	).Scan(&phraseID)
	if errors.Is(err, pgx.ErrNoRows) {
		var duplicate bool
		if err := tx.QueryRow(ctx, `
			select exists (
				select 1
				from words
				where owner_user_id = $1::uuid
				  and lower(lemma) = lower($2)
				  and lower(translation) = lower($3)
			)
		`, userID, request.Lemma, request.Translation).Scan(&duplicate); err != nil {
			return UserWord{}, fmt.Errorf("classify custom phrase conflict: %w", err)
		}
		if duplicate {
			return UserWord{}, ErrCustomPhraseDuplicate
		}
		return UserWord{}, errCustomPhraseSlugTaken
	}
	if err != nil {
		return UserWord{}, fmt.Errorf("insert custom phrase: %w", err)
	}

	if _, err := tx.Exec(ctx, `
		insert into user_words (user_id, word_id)
		values ($1::uuid, $2)
	`, userID, phraseID); err != nil {
		return UserWord{}, fmt.Errorf("enroll custom phrase: %w", err)
	}

	item, err := scanUserWord(tx.QueryRow(ctx, `
		select `+catalogSelectFields+`
		from user_words uw
		join words w on w.id = uw.word_id
		where uw.user_id = $1::uuid
		  and w.id = $2
		  and w.owner_user_id = uw.user_id
		  and w.kind = 'phrase'
		  and w.source = $3
	`, userID, phraseID, customWordSource))
	if err != nil {
		return UserWord{}, fmt.Errorf("read created custom phrase: %w", err)
	}
	return item, nil
}

// DeleteCustomPhrase mirrors the proven custom-word deletion boundary while
// narrowing every destructive predicate by owner, kind and private source.
func (r *Repository) DeleteCustomPhrase(ctx context.Context, userID string, phraseID int64) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin custom phrase delete transaction: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if _, err := tx.Exec(ctx, `
		update lesson_sessions as lesson
		set status = 'discarded',
		    version = version + 1,
		    updated_at = now()
		where lesson.user_id = $1::uuid
		  and lesson.status = 'active'
		  and exists (
		      select 1
		      from lesson_session_items as item
		      where item.session_id = lesson.id
		        and item.word_id = $2
		  )
	`, userID, phraseID); err != nil {
		return fmt.Errorf("discard active lesson for custom phrase: %w", err)
	}

	result, err := tx.Exec(ctx, `
		delete from words
		where id = $1
		  and owner_user_id = $2::uuid
		  and kind = 'phrase'
		  and source = $3
	`, phraseID, userID, customWordSource)
	if err != nil {
		return fmt.Errorf("delete custom phrase: %w", err)
	}
	if result.RowsAffected() == 0 {
		return ErrCustomPhraseNotFound
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit custom phrase delete transaction: %w", err)
	}
	return nil
}
