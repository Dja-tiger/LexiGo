package moderation

import (
	"context"
	"errors"
	"io"
	"log/slog"
	"testing"
	"time"
)

type fakeRetentionStore struct {
	pendingCutoff time.Time
	decidedCutoff time.Time
	batchSize     int
	maxBatches    int
	result        RetentionCleanupResult
	err           error
}

func (store *fakeRetentionStore) CleanupExpired(
	_ context.Context,
	pendingCutoff time.Time,
	decidedCutoff time.Time,
	batchSize int,
	maxBatches int,
) (RetentionCleanupResult, error) {
	store.pendingCutoff = pendingCutoff
	store.decidedCutoff = decidedCutoff
	store.batchSize = batchSize
	store.maxBatches = maxBatches
	return store.result, store.err
}

func TestRetentionWorkerUsesSeparatePendingAndDecidedPolicies(t *testing.T) {
	now := time.Date(2026, 7, 28, 6, 0, 0, 0, time.UTC)
	store := &fakeRetentionStore{result: RetentionCleanupResult{DeletedRows: 7, Batches: 1}}
	worker := NewRetentionWorker(store, slog.New(slog.NewTextHandler(io.Discard, nil)), RetentionPolicy{
		PendingTTL: 90 * 24 * time.Hour, DecidedTTL: 365 * 24 * time.Hour,
		CleanupInterval: 6 * time.Hour, BatchSize: 1000, MaxBatches: 20,
	})
	worker.now = func() time.Time { return now }

	result, err := worker.Cleanup(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if result.DeletedRows != 7 || !store.pendingCutoff.Equal(now.Add(-90*24*time.Hour)) ||
		!store.decidedCutoff.Equal(now.Add(-365*24*time.Hour)) {
		t.Fatalf("unexpected cleanup: result=%+v pending=%s decided=%s", result, store.pendingCutoff, store.decidedCutoff)
	}
	if store.batchSize != 1000 || store.maxBatches != 20 {
		t.Fatalf("unexpected cleanup bounds: %d/%d", store.batchSize, store.maxBatches)
	}
}

func TestRetentionWorkerPropagatesStoreError(t *testing.T) {
	store := &fakeRetentionStore{err: errors.New("database unavailable")}
	worker := NewRetentionWorker(store, nil, RetentionPolicy{
		PendingTTL: time.Hour, DecidedTTL: time.Hour,
		CleanupInterval: time.Hour, BatchSize: 100, MaxBatches: 1,
	})
	if _, err := worker.Cleanup(context.Background()); err == nil {
		t.Fatal("cleanup error = nil")
	}
}
