package performance

import (
	"context"
	"fmt"
	"log/slog"
	"time"
)

// rumRetentionAdvisoryLockID is stable across releases. The session-level lock
// guarantees that only one API replica performs RUM cleanup at a time.
const rumRetentionAdvisoryLockID int64 = 7_618_430_912_801

type RetentionPolicy struct {
	TTL             time.Duration
	CleanupInterval time.Duration
	BatchSize       int
	MaxBatches      int
}

type RetentionCleanupResult struct {
	DeletedRows  int64
	Batches      int
	Skipped      bool
	LimitReached bool
}

type RetentionStore interface {
	CleanupExpired(
		ctx context.Context,
		cutoff time.Time,
		batchSize int,
		maxBatches int,
	) (RetentionCleanupResult, error)
}

type RetentionWorker struct {
	store  RetentionStore
	logger *slog.Logger
	policy RetentionPolicy
	now    func() time.Time
}

func NewRetentionWorker(store RetentionStore, logger *slog.Logger, policy RetentionPolicy) *RetentionWorker {
	if logger == nil {
		logger = slog.Default()
	}
	return &RetentionWorker{
		store:  store,
		logger: logger,
		policy: policy,
		now:    time.Now,
	}
}

func (worker *RetentionWorker) Run(ctx context.Context) {
	worker.runCleanup(ctx)

	ticker := time.NewTicker(worker.policy.CleanupInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			worker.runCleanup(ctx)
		}
	}
}

func (worker *RetentionWorker) Cleanup(ctx context.Context) (RetentionCleanupResult, error) {
	cutoff := worker.now().UTC().Add(-worker.policy.TTL)
	return worker.store.CleanupExpired(
		ctx,
		cutoff,
		worker.policy.BatchSize,
		worker.policy.MaxBatches,
	)
}

func (worker *RetentionWorker) runCleanup(ctx context.Context) {
	timeout := worker.policy.CleanupInterval
	if timeout > 5*time.Minute {
		timeout = 5 * time.Minute
	}
	cleanupCtx, cancel := context.WithTimeout(ctx, timeout)
	defer cancel()

	startedAt := time.Now()
	result, err := worker.Cleanup(cleanupCtx)
	if err != nil {
		worker.logger.Error("RUM retention cleanup failed",
			slog.String("error", err.Error()),
			slog.Duration("duration", time.Since(startedAt)),
		)
		return
	}
	if result.Skipped {
		worker.logger.Debug("RUM retention cleanup skipped because another replica holds the lock")
		return
	}

	worker.logger.Info("RUM retention cleanup completed",
		slog.Int64("deleted_rows", result.DeletedRows),
		slog.Int("batches", result.Batches),
		slog.Bool("limit_reached", result.LimitReached),
		slog.Duration("duration", time.Since(startedAt)),
	)
}

func (repository *Repository) CleanupExpired(
	ctx context.Context,
	cutoff time.Time,
	batchSize int,
	maxBatches int,
) (RetentionCleanupResult, error) {
	conn, err := repository.pool.Acquire(ctx)
	if err != nil {
		return RetentionCleanupResult{}, fmt.Errorf("acquire RUM retention connection: %w", err)
	}
	defer conn.Release()

	var locked bool
	if err := conn.QueryRow(ctx, "select pg_try_advisory_lock($1)", rumRetentionAdvisoryLockID).Scan(&locked); err != nil {
		return RetentionCleanupResult{}, fmt.Errorf("acquire RUM retention advisory lock: %w", err)
	}
	if !locked {
		return RetentionCleanupResult{Skipped: true}, nil
	}
	defer func() {
		unlockCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_, _ = conn.Exec(unlockCtx, "select pg_advisory_unlock($1)", rumRetentionAdvisoryLockID)
	}()

	result := RetentionCleanupResult{}
	for batch := 0; batch < maxBatches; batch++ {
		command, err := conn.Exec(ctx, `
			with expired as (
				select id
				from performance_samples
				where sampled_at < $1
				order by sampled_at, id
				limit $2
				for update skip locked
			)
			delete from performance_samples as samples
			using expired
			where samples.id = expired.id
		`, cutoff, batchSize)
		if err != nil {
			return result, fmt.Errorf("delete expired RUM samples: %w", err)
		}

		deleted := command.RowsAffected()
		result.DeletedRows += deleted
		result.Batches++
		if deleted < int64(batchSize) {
			return result, nil
		}
	}

	result.LimitReached = true
	return result, nil
}
