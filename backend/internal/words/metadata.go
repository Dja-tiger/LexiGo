package words

import (
	"context"
	"crypto/sha256"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
)

type CatalogTotals struct {
	Items   int `json:"items"`
	Words   int `json:"words"`
	Phrases int `json:"phrases"`
}

type CatalogSourceTotals struct {
	Mixed           int `json:"mixed"`
	Noun            int `json:"noun"`
	Verb            int `json:"verb"`
	Adjective       int `json:"adjective"`
	Phrases         int `json:"phrases"`
	DailyLife       int `json:"dailyLife"`
	Travel          int `json:"travel"`
	DataEngineering int `json:"dataEngineering"`
	Backend         int `json:"backend"`
}

type CatalogTopicTotal struct {
	Topic string `json:"topic"`
	Count int    `json:"count"`
}

type CatalogMetadata struct {
	CatalogVersion string              `json:"catalogVersion"`
	UpdatedAt      time.Time           `json:"updatedAt"`
	Totals         CatalogTotals       `json:"totals"`
	Sources        CatalogSourceTotals `json:"sources"`
	Topics         []CatalogTopicTotal `json:"topics"`
}

func (r *Repository) Metadata(ctx context.Context) (CatalogMetadata, error) {
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.RepeatableRead, AccessMode: pgx.ReadOnly})
	if err != nil {
		return CatalogMetadata{}, fmt.Errorf("begin catalog metadata snapshot: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var metadata CatalogMetadata
	if err := tx.QueryRow(ctx, `
		select count(*)::int,
		       count(*) filter (where kind = 'word')::int,
		       count(*) filter (where kind = 'phrase')::int,
		       count(*) filter (where kind = 'word' and lower(part_of_speech) = 'noun')::int,
		       count(*) filter (where kind = 'word' and lower(part_of_speech) = 'verb')::int,
		       count(*) filter (where kind = 'word' and lower(part_of_speech) = 'adjective')::int,
		       count(*) filter (where kind = 'word' and topic = 'Daily Life')::int,
		       count(*) filter (where kind = 'word' and topic = 'Travel')::int,
		       count(*) filter (where kind = 'word' and topic = 'Data Engineering')::int,
		       count(*) filter (where kind = 'word' and topic = 'Backend Development')::int,
		       coalesce(max(updated_at), to_timestamp(0))
		from words
	`).Scan(
		&metadata.Totals.Items,
		&metadata.Totals.Words,
		&metadata.Totals.Phrases,
		&metadata.Sources.Noun,
		&metadata.Sources.Verb,
		&metadata.Sources.Adjective,
		&metadata.Sources.DailyLife,
		&metadata.Sources.Travel,
		&metadata.Sources.DataEngineering,
		&metadata.Sources.Backend,
		&metadata.UpdatedAt,
	); err != nil {
		return CatalogMetadata{}, fmt.Errorf("query catalog totals: %w", err)
	}
	metadata.Sources.Mixed = metadata.Totals.Items
	metadata.Sources.Phrases = metadata.Totals.Phrases

	rows, err := tx.Query(ctx, `
		select topic, count(*)::int
		from words
		group by topic
		order by topic
	`)
	if err != nil {
		return CatalogMetadata{}, fmt.Errorf("query catalog topic totals: %w", err)
	}
	metadata.Topics = make([]CatalogTopicTotal, 0)
	for rows.Next() {
		var topic CatalogTopicTotal
		if err := rows.Scan(&topic.Topic, &topic.Count); err != nil {
			rows.Close()
			return CatalogMetadata{}, fmt.Errorf("scan catalog topic total: %w", err)
		}
		metadata.Topics = append(metadata.Topics, topic)
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		return CatalogMetadata{}, fmt.Errorf("iterate catalog topic totals: %w", err)
	}
	rows.Close()

	metadata.CatalogVersion = catalogMetadataVersion(metadata)
	if err := tx.Commit(ctx); err != nil {
		return CatalogMetadata{}, fmt.Errorf("commit catalog metadata snapshot: %w", err)
	}
	return metadata, nil
}

func catalogMetadataVersion(metadata CatalogMetadata) string {
	var value strings.Builder
	_, _ = fmt.Fprintf(
		&value,
		"%s|%d|%d|%d|%d|%d|%d|%d|%d|%d|%d",
		metadata.UpdatedAt.UTC().Format(time.RFC3339Nano),
		metadata.Totals.Items,
		metadata.Totals.Words,
		metadata.Totals.Phrases,
		metadata.Sources.Noun,
		metadata.Sources.Verb,
		metadata.Sources.Adjective,
		metadata.Sources.DailyLife,
		metadata.Sources.Travel,
		metadata.Sources.DataEngineering,
		metadata.Sources.Backend,
	)
	for _, topic := range metadata.Topics {
		_, _ = fmt.Fprintf(&value, "|%s:%d", topic.Topic, topic.Count)
	}
	digest := sha256.Sum256([]byte(value.String()))
	return fmt.Sprintf("sha256:%x", digest)
}
