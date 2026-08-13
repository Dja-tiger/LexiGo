package words

import (
	"context"
	"errors"
	"fmt"
)

// ExportCustomGlossary returns only portable content owned by the authenticated
// account. Ordering is deterministic so exports are stable inputs for review,
// backup and round-trip tests.
func (r *Repository) ExportCustomGlossary(
	ctx context.Context,
	userID string,
) ([]CreateCustomWordRequest, error) {
	rows, err := r.pool.Query(ctx, `
		select
			lemma,
			translation,
			phonetic,
			part_of_speech,
			topic,
			note
		from words
		where owner_user_id = $1::uuid
		  and source = $2
		  and kind = 'word'
		order by lower(lemma), lower(translation), id
	`, userID, customWordSource)
	if err != nil {
		return nil, fmt.Errorf("query custom glossary export: %w", err)
	}
	defer rows.Close()

	items := make([]CreateCustomWordRequest, 0)
	for rows.Next() {
		var item CreateCustomWordRequest
		if err := rows.Scan(
			&item.Lemma,
			&item.Translation,
			&item.Phonetic,
			&item.PartOfSpeech,
			&item.Topic,
			&item.Note,
		); err != nil {
			return nil, fmt.Errorf("scan custom glossary export: %w", err)
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate custom glossary export: %w", err)
	}
	return items, nil
}

// ImportCustomGlossary creates the complete normalized batch in one database
// transaction. Any duplicate or storage failure returns before commit, so no
// partial word rows or scheduler enrollments can survive.
func (r *Repository) ImportCustomGlossary(
	ctx context.Context,
	userID string,
	items []CreateCustomWordRequest,
) (int, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return 0, fmt.Errorf("begin custom glossary import transaction: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	for _, item := range items {
		if _, err := insertCustomWordTx(ctx, tx, userID, item); err != nil {
			if errors.Is(err, ErrCustomWordDuplicate) {
				return 0, ErrCustomWordDuplicate
			}
			return 0, fmt.Errorf("import custom glossary item: %w", err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, fmt.Errorf("commit custom glossary import transaction: %w", err)
	}
	return len(items), nil
}
