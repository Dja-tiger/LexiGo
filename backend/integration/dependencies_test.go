//go:build integration

package integration

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/Dja-tiger/New-project/backend/internal/catalog"
	"github.com/Dja-tiger/New-project/backend/internal/config"
	"github.com/Dja-tiger/New-project/backend/internal/platform/migrate"
	postgresplatform "github.com/Dja-tiger/New-project/backend/internal/platform/postgres"
	redisplatform "github.com/Dja-tiger/New-project/backend/internal/platform/redis"
)

func TestPostgresRedisMigrationsAndCatalog(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	pg, err := postgresplatform.Open(ctx, requiredEnv(t, "TEST_POSTGRES_DSN"))
	if err != nil {
		t.Fatal(err)
	}
	defer pg.Close()
	if err := migrate.Up(ctx, pg); err != nil {
		t.Fatalf("migrate.Up() error = %v", err)
	}
	if _, err := pg.Exec(ctx, "truncate table review_events, user_words, refresh_tokens, words, users restart identity cascade"); err != nil {
		t.Fatalf("truncate test data: %v", err)
	}

	for attempt := 1; attempt <= 2; attempt++ {
		count, seedErr := catalog.Seed(ctx, pg)
		if seedErr != nil {
			t.Fatalf("catalog.Seed() attempt %d error = %v", attempt, seedErr)
		}
		if count != catalog.ExpectedCount {
			t.Fatalf("catalog.Seed() count = %d, want %d", count, catalog.ExpectedCount)
		}
	}

	var storedWords int
	if err := pg.QueryRow(ctx, "select count(*) from words where source = $1", catalog.Source).Scan(&storedWords); err != nil {
		t.Fatalf("count seeded words: %v", err)
	}
	if storedWords != catalog.ExpectedCount {
		t.Fatalf("stored catalog words = %d, want %d", storedWords, catalog.ExpectedCount)
	}

	rdb, err := redisplatform.Open(ctx, config.Redis{Addr: requiredEnv(t, "TEST_REDIS_ADDR")})
	if err != nil {
		t.Fatal(err)
	}
	defer rdb.Close()

	var exists bool
	if err := pg.QueryRow(ctx, "select to_regclass('public.users') is not null").Scan(&exists); err != nil || !exists {
		t.Fatalf("users table check: exists=%v err=%v", exists, err)
	}
}

func requiredEnv(t *testing.T, key string) string {
	t.Helper()
	value := os.Getenv(key)
	if value == "" {
		t.Fatalf("%s is required", key)
	}
	return value
}
