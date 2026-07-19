package words

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

const catalogListFilter = `
		from user_words uw
		join words w on w.id = uw.word_id
		where uw.user_id = $1::uuid
		  and ($2 = '' or w.kind = $2)
		  and (not $3 or uw.due_at <= now())
		  and (
		      $4 = ''
		      or $4 = 'mixed'
		      or ($4 = 'phrases' and w.kind = 'phrase')
		      or ($4 = 'noun' and w.kind = 'word' and lower(w.part_of_speech) = 'noun')
		      or ($4 = 'verb' and w.kind = 'word' and lower(w.part_of_speech) = 'verb')
		      or ($4 = 'adjective' and w.kind = 'word' and lower(w.part_of_speech) = 'adjective')
		      or ($4 = 'daily-life' and w.kind = 'word' and w.topic = 'Daily Life')
		      or ($4 = 'travel' and w.kind = 'word' and w.topic = 'Travel')
		      or ($4 = 'data-engineering' and w.kind = 'word' and w.topic = 'Data Engineering')
		      or ($4 = 'backend' and w.kind = 'word' and w.topic = 'Backend Development')
		  )
		  and ($5 = '' or w.topic = $5)
		  and (
		      $6 = ''
		      or lower(w.lemma) like ('%' || lower($6) || '%')
		      or lower(w.translation) like ('%' || lower($6) || '%')
		      or lower(w.topic) like ('%' || lower($6) || '%')
		  )
`

type Repository struct{ pool *pgxpool.Pool }

func NewRepository(pool *pgxpool.Pool) *Repository { return &Repository{pool: pool} }

type ListOptions struct {
	Page   int
	Limit  int
	Kind   string
	Source string
	Topic  string
	Query  string
	Sort   string
}

type Page struct {
	Items       []UserWord `json:"items"`
	Count       int        `json:"count"`
	Total       int        `json:"total"`
	Page        int        `json:"page"`
	PageSize    int        `json:"pageSize"`
	TotalPages  int        `json:"totalPages"`
	HasPrevious bool       `json:"hasPrevious"`
	HasNext     bool       `json:"hasNext"`
}

func (r *Repository) ListPage(ctx context.Context, userID string, options ListOptions) (Page, error) {
	return r.listPage(ctx, userID, options, false)
}

func (r *Repository) ListDuePage(ctx context.Context, userID string, options ListOptions) (Page, error) {
	return r.listPage(ctx, userID, options, true)
}

func (r *Repository) listPage(ctx context.Context, userID string, options ListOptions, dueOnly bool) (Page, error) {
	if options.Page <= 0 {
		options.Page = 1
	}
	if options.Limit <= 0 {
		options.Limit = 30
	}
	if options.Limit > 100 {
		options.Limit = 100
	}
	if options.Sort == "" {
		options.Sort = "default"
	}

	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.RepeatableRead, AccessMode: pgx.ReadOnly})
	if err != nil {
		return Page{}, fmt.Errorf("begin catalog page snapshot: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	args := []any{userID, options.Kind, dueOnly, options.Source, options.Topic, options.Query}
	var total int
	if err := tx.QueryRow(ctx, "select count(*)::int "+catalogListFilter, args...).Scan(&total); err != nil {
		return Page{}, fmt.Errorf("count learning items: %w", err)
	}

	totalPages := 0
	if total > 0 {
		totalPages = (total + options.Limit - 1) / options.Limit
		if options.Page > totalPages {
			options.Page = totalPages
		}
	} else {
		options.Page = 1
	}
	offset := (options.Page - 1) * options.Limit

	rows, err := tx.Query(ctx, `
		select w.id, w.kind, coalesce(w.slug, ''), w.lemma, w.translation, w.phonetic,
		       w.part_of_speech, w.topic, w.examples, w.note, w.cloze, w.cloze_answer,
		       uw.status, uw.easiness::float8, uw.interval_days, uw.repetitions,
		       uw.due_at, uw.last_reviewed_at
	`+catalogListFilter+`
		order by
		  case when $7 = 'az' then lower(w.lemma) end asc,
		  case when $7 = 'za' then lower(w.lemma) end desc,
		  case when $7 = 'default' and $3 then uw.due_at end asc,
		  case when $7 = 'default' then w.topic end asc,
		  w.id asc
		limit $8 offset $9
	`, userID, options.Kind, dueOnly, options.Source, options.Topic, options.Query, options.Sort, options.Limit, offset)
	if err != nil {
		return Page{}, fmt.Errorf("query learning items page: %w", err)
	}
	defer rows.Close()

	items := make([]UserWord, 0, options.Limit)
	for rows.Next() {
		var item UserWord
		var examples []byte
		if err := rows.Scan(
			&item.ID, &item.Kind, &item.Slug, &item.Lemma, &item.Translation, &item.Phonetic,
			&item.PartOfSpeech, &item.Topic, &examples, &item.Note, &item.Cloze, &item.ClozeAnswer,
			&item.Status, &item.Easiness, &item.IntervalDays, &item.Repetitions,
			&item.DueAt, &item.LastReviewedAt,
		); err != nil {
			return Page{}, fmt.Errorf("scan learning item: %w", err)
		}
		if err := json.Unmarshal(examples, &item.Examples); err != nil {
			return Page{}, fmt.Errorf("decode examples: %w", err)
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return Page{}, fmt.Errorf("iterate learning items: %w", err)
	}
	if err := tx.Commit(ctx); err != nil {
		return Page{}, fmt.Errorf("commit catalog page snapshot: %w", err)
	}

	return Page{
		Items:       items,
		Count:       len(items),
		Total:       total,
		Page:        options.Page,
		PageSize:    options.Limit,
		TotalPages:  totalPages,
		HasPrevious: options.Page > 1,
		HasNext:     totalPages > 0 && options.Page < totalPages,
	}, nil
}
