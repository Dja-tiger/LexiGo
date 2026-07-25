package learning

import (
	"context"
	"fmt"
	"time"
)

// populateWeakPartOfSpeechEvidence enriches the server-owned weekly report with
// objective Recall evidence grouped by a lesson-composer-compatible part of
// speech. Only noun, verb and adjective are emitted because each value must be
// directly actionable through the existing due queue source filter.
func (r *Repository) populateWeakPartOfSpeechEvidence(
	ctx context.Context,
	userID string,
	timezoneOffsetMinutes int,
	result *ProgressSummary,
) error {
	timezoneOffsetMinutes = clampOffset(timezoneOffsetMinutes)
	localNow := time.Now().UTC().Add(-time.Duration(timezoneOffsetMinutes) * time.Minute)
	weekStartLocal := startOfWeek(dateOnly(localNow))
	weekStartUTC := weekStartLocal.Add(time.Duration(timezoneOffsetMinutes) * time.Minute)
	nextWeekUTC := weekStartUTC.AddDate(0, 0, 7)

	rows, err := r.pool.Query(ctx, `
		with recall_by_part_of_speech as (
			select case lower(btrim(word.part_of_speech))
			           when 'n' then 'noun'
			           when 'noun' then 'noun'
			           when 'v' then 'verb'
			           when 'verb' then 'verb'
			           when 'adj' then 'adjective'
			           when 'adjective' then 'adjective'
			       end as part_of_speech,
			       review_event.correct
			from review_events review_event
			join words word on word.id = review_event.word_id
			where review_event.user_id = $1::uuid
			  and review_event.reviewed_at >= $2
			  and review_event.reviewed_at < $3
			  and review_event.event_schema_version = 2
			  and review_event.answer_mode = 'recall'
			  and word.kind = 'word'
			  and lower(btrim(word.part_of_speech)) in (
			      'n', 'noun', 'v', 'verb', 'adj', 'adjective'
			  )
		)
		select part_of_speech,
		       count(*)::int,
		       count(*) filter (where correct is true)::int,
		       count(*) filter (where correct is not true)::int
		from recall_by_part_of_speech
		group by part_of_speech
		having count(*) filter (where correct is not true) > 0
		order by count(*) filter (where correct is not true) desc,
		         count(*) filter (where correct is true)::float / count(*) asc,
		         count(*) desc,
		         part_of_speech
		limit 3
	`, userID, weekStartUTC, nextWeekUTC)
	if err != nil {
		return fmt.Errorf("query weak recall parts of speech: %w", err)
	}
	defer rows.Close()

	result.Weekly.WeakPartsOfSpeech = make([]PartOfSpeechEvidence, 0, 3)
	for rows.Next() {
		var evidence PartOfSpeechEvidence
		if err := rows.Scan(
			&evidence.PartOfSpeech,
			&evidence.Attempts,
			&evidence.Successful,
			&evidence.Errors,
		); err != nil {
			return fmt.Errorf("scan weak recall part of speech: %w", err)
		}
		evidence.Rate = percentage(evidence.Successful, evidence.Attempts)
		result.Weekly.WeakPartsOfSpeech = append(result.Weekly.WeakPartsOfSpeech, evidence)
	}
	if err := rows.Err(); err != nil {
		return fmt.Errorf("iterate weak recall parts of speech: %w", err)
	}
	return nil
}
