package performance

import (
	"context"
	"errors"
	"io"
	"log/slog"
	"testing"
	"time"
)

type fakeRetentionStore struct {
	cutoff      time.Time
	batchSize   int
	maxBatches  int
	result      RetentionCleanupResult
	err         error
	invocations int
}

func (store *fakeRetentionStore) CleanupExpired(
	_ context.Context,
	cutoff time.Time,
	batchSize int,
	maxBatches int,
) (RetentionCleanupResult, error) {
	store.cutoff = cutoff
	store.batchSize = batchSize
	store.maxBatches = maxBatches
	store.invocations++
	return store.result, store.err
}

func TestRetentionWorkerCleanupUsesPolicyAndUTCClock(t *testing.T) {
	store := &fakeRetentionStore{
		result: RetentionCleanupResult{DeletedRows: 125, Batches: 2},
	}
	policy := RetentionPolicy{
		TTL:             30 * 24 * time.Hour,
		CleanupInterval: time.Hour,
		BatchSize:       100,
		MaxBatches:      3,
	}
	worker := NewRetentionWorker(store, slog.New(slog.NewTextHandler(io.Discard, nil)), policy)
	worker.now = func() time.Time {
		return time.Date(2026, time.July, 23, 12, 30, 0, 0, time.FixedZone("test", 3*60*60))
	}

	result, err := worker.Cleanup(context.Background())
	if err != nil {
		t.Fatalf("Cleanup() error = %v", err)
	}
	if result.DeletedRows != 125 || result.Batches != 2 {
		t.Fatalf("Cleanup() result = %+v", result)
	}
	if store.invocations != 1 {
		t.Fatalf("CleanupExpired() invocations = %d, want 1", store.invocations)
	}
	if store.batchSize != 100 || store.maxBatches != 3 {
		t.Fatalf("cleanup bounds = batch %d max %d", store.batchSize, store.maxBatches)
	}

	wantCutoff := time.Date(2026, time.June, 23, 9, 30, 0, 0, time.UTC)
	if !store.cutoff.Equal(wantCutoff) || store.cutoff.Location() != time.UTC {
		t.Fatalf("cutoff = %s (%s), want %s UTC", store.cutoff, store.cutoff.Location(), wantCutoff)
	}
}

func TestRetentionWorkerCleanupPropagatesStoreError(t *testing.T) {
	store := &fakeRetentionStore{err: errors.New("database unavailable")}
	worker := NewRetentionWorker(store, nil, RetentionPolicy{
		TTL:             24 * time.Hour,
		CleanupInterval: time.Hour,
		BatchSize:       100,
		MaxBatches:      1,
	})

	if _, err := worker.Cleanup(context.Background()); err == nil {
		t.Fatal("Cleanup() error = nil, want store error")
	}
}
