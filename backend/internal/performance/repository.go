package performance

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Store interface {
	StoreReport(ctx context.Context, report Report) error
	StoreJourney(ctx context.Context, event JourneyEvent) error
	StoreProductRetention(ctx context.Context, event ProductRetentionEvent) error
}

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (repository *Repository) StoreReport(ctx context.Context, report Report) error {
	rows := make([][]any, 0, len(report.Samples))
	for _, sample := range report.Samples {
		rows = append(rows, []any{
			report.AppVersion,
			report.Route,
			report.DeviceClass,
			report.BrowserFamily,
			report.DisplayMode,
			sample.Name,
			sample.Value,
			sample.Rating,
			sample.NavigationType,
		})
	}

	inserted, err := repository.pool.CopyFrom(
		ctx,
		pgx.Identifier{"performance_samples"},
		[]string{
			"app_version",
			"route",
			"device_class",
			"browser_family",
			"display_mode",
			"metric_name",
			"metric_value",
			"metric_rating",
			"navigation_type",
		},
		pgx.CopyFromRows(rows),
	)
	if err != nil {
		return fmt.Errorf("store performance report: %w", err)
	}
	if inserted != int64(len(rows)) {
		return fmt.Errorf("store performance report: inserted %d of %d samples", inserted, len(rows))
	}
	return nil
}

func (repository *Repository) StoreJourney(ctx context.Context, event JourneyEvent) error {
	command, err := repository.pool.Exec(
		ctx,
		`insert into product_navigation_events (
			app_version,
			from_route,
			to_route,
			intent,
			is_backtrack,
			device_class,
			browser_family,
			display_mode
		) values ($1, $2, $3, $4, $5, $6, $7, $8)`,
		event.AppVersion,
		event.FromRoute,
		event.ToRoute,
		event.Intent,
		event.Backtrack,
		event.DeviceClass,
		event.BrowserFamily,
		event.DisplayMode,
	)
	if err != nil {
		return fmt.Errorf("store product journey: %w", err)
	}
	if command.RowsAffected() != 1 {
		return fmt.Errorf("store product journey: inserted %d rows", command.RowsAffected())
	}
	return nil
}

func (repository *Repository) StoreProductRetention(ctx context.Context, event ProductRetentionEvent) error {
	command, err := repository.pool.Exec(
		ctx,
		`insert into product_retention_events (
			app_version,
			event_name,
			action,
			delay_bucket,
			device_class,
			browser_family,
			display_mode
		) values ($1, $2, $3, $4, $5, $6, $7)`,
		event.AppVersion,
		event.Event,
		event.Action,
		event.DelayBucket,
		event.DeviceClass,
		event.BrowserFamily,
		event.DisplayMode,
	)
	if err != nil {
		return fmt.Errorf("store product retention event: %w", err)
	}
	if command.RowsAffected() != 1 {
		return fmt.Errorf("store product retention event: inserted %d rows", command.RowsAffected())
	}
	return nil
}
