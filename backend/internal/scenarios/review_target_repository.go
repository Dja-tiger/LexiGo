package scenarios

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
)

const scenarioVocabularySource = "lexigo-scenario-vocabulary-v1"

type scenarioReviewTargetDefinition struct {
	ScenarioReviewTarget
	Translation  string
	PartOfSpeech string
}

func resolveScenarioReviewWord(
	ctx context.Context,
	tx pgx.Tx,
	userID string,
	target scenarioReviewTargetDefinition,
) (int64, error) {
	if _, err := tx.Exec(ctx, `
		insert into words(
			lemma,
			translation,
			phonetic,
			part_of_speech,
			topic,
			examples,
			source,
			note,
			kind,
			accepted_answers
		) values (
			$1,
			$2,
			'',
			$3,
			'Technical Scenarios',
			'[]'::jsonb,
			$4,
			'Целевая лексика для технических Scenario Lessons.',
			'word',
			array[$2]
		)
		on conflict do nothing
	`, target.Term, target.Translation, target.PartOfSpeech, scenarioVocabularySource); err != nil {
		return 0, fmt.Errorf("ensure scenario review word: %w", err)
	}

	var wordID int64
	if err := tx.QueryRow(ctx, `
		select id
		from words
		where lower(lemma) = lower($1)
		  and lower(translation) = lower($2)
	`, target.Term, target.Translation).Scan(&wordID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return 0, fmt.Errorf("scenario review word was not resolved")
		}
		return 0, fmt.Errorf("resolve scenario review word: %w", err)
	}

	if _, err := tx.Exec(ctx, `
		insert into user_words(user_id, word_id)
		values ($1::uuid, $2)
		on conflict (user_id, word_id) do nothing
	`, userID, wordID); err != nil {
		return 0, fmt.Errorf("enroll scenario review target: %w", err)
	}
	return wordID, nil
}
