//go:build integration

package integration

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
	"time"

	"github.com/Dja-tiger/LexiGo/backend/internal/catalog"
	"github.com/Dja-tiger/LexiGo/backend/internal/config"
	"github.com/Dja-tiger/LexiGo/backend/internal/platform/migrate"
	postgresplatform "github.com/Dja-tiger/LexiGo/backend/internal/platform/postgres"
	redisplatform "github.com/Dja-tiger/LexiGo/backend/internal/platform/redis"
	"github.com/Dja-tiger/LexiGo/backend/internal/server"
)

type catalogPagePayload struct {
	Items []struct {
		ID      int64    `json:"id"`
		Lemma   string   `json:"lemma"`
		Aliases []string `json:"aliases"`
		Status  string   `json:"status"`
	} `json:"items"`
	Count       int  `json:"count"`
	Total       int  `json:"total"`
	Page        int  `json:"page"`
	PageSize    int  `json:"pageSize"`
	TotalPages  int  `json:"totalPages"`
	HasPrevious bool `json:"hasPrevious"`
	HasNext     bool `json:"hasNext"`
}

type catalogItemPayload struct {
	ID          int64    `json:"id"`
	Lemma       string   `json:"lemma"`
	Translation string   `json:"translation"`
	Aliases     []string `json:"aliases"`
	Status      string   `json:"status"`
}

func TestCatalogPaginationFilteringAndServerSorting(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 45*time.Second)
	defer cancel()

	pg, err := postgresplatform.Open(ctx, requiredEnv(t, "TEST_POSTGRES_DSN"))
	if err != nil {
		t.Fatal(err)
	}
	defer pg.Close()
	if err := migrate.Up(ctx, pg); err != nil {
		t.Fatalf("migrate.Up() error = %v", err)
	}
	if _, err := pg.Exec(ctx, "truncate table lesson_review_idempotency, lesson_session_items, lesson_sessions, user_learning_preferences, review_events, user_words, refresh_tokens, words, users restart identity cascade"); err != nil {
		t.Fatalf("truncate test data: %v", err)
	}
	if _, err := catalog.Seed(ctx, pg); err != nil {
		t.Fatalf("catalog.Seed() error = %v", err)
	}
	if _, err := pg.Exec(ctx, `
		insert into words (lemma, translation, part_of_speech, topic, aliases, examples, note, source, kind, slug, cloze, cloze_answer)
		select format('page phrase %s', lpad(series::text, 3, '0')),
		       format('страничная фраза %s', series),
		       'phrase',
		       'Pagination Test',
		       array[format('catalog alias %s', lpad(series::text, 3, '0'))],
		       '[]'::jsonb,
		       '',
		       'integration-pagination',
		       'phrase',
		       format('page-phrase-%s', lpad(series::text, 3, '0')),
		       format('page phrase _____ %s', lpad(series::text, 3, '0')),
		       'test'
		from generate_series(1, 125) as series
	`); err != nil {
		t.Fatalf("insert pagination phrases: %v", err)
	}

	rdb, err := redisplatform.Open(ctx, config.Redis{Addr: requiredEnv(t, "TEST_REDIS_ADDR")})
	if err != nil {
		t.Fatal(err)
	}
	defer rdb.Close()
	if err := rdb.FlushDB(ctx).Err(); err != nil {
		t.Fatalf("flush redis: %v", err)
	}

	cfg := config.Config{
		AppEnv: "test", HTTPAddr: ":0", LogLevel: "error", CORSAllowedOrigin: "http://test.local",
		PostgresDSN:    requiredEnv(t, "TEST_POSTGRES_DSN"),
		Redis:          config.Redis{Addr: requiredEnv(t, "TEST_REDIS_ADDR")},
		JWTSecret:      "integration-test-secret-with-at-least-32-bytes",
		AccessTokenTTL: 15 * time.Minute, RefreshTokenTTL: 24 * time.Hour,
	}
	app, err := server.New(cfg, slog.New(slog.NewTextHandler(io.Discard, nil)), pg, rdb)
	if err != nil {
		t.Fatalf("server.New() error = %v", err)
	}
	testServer := httptest.NewServer(app.Handler())
	defer testServer.Close()

	registered := postJSON[integrationAuthResponse](t, testServer.URL+"/api/v1/auth/register", map[string]string{
		"email":    fmt.Sprintf("pagination-%d@example.com", time.Now().UnixNano()),
		"password": "strong-password", "displayName": "Pagination Learner",
	}, http.StatusCreated)
	if _, err := pg.Exec(ctx, `
		insert into user_words (user_id, word_id)
		select $1::uuid, id
		from words
		where source = 'integration-pagination'
		on conflict (user_id, word_id) do nothing
	`, registered.User.ID); err != nil {
		t.Fatalf("enroll pagination phrases: %v", err)
	}
	if _, err := pg.Exec(ctx, `
		update user_words
		set status = 'mastered'
		where user_id = $1::uuid
		  and word_id = (select id from words where slug = 'page-phrase-007')
	`, registered.User.ID); err != nil {
		t.Fatalf("mark pagination phrase mastered: %v", err)
	}

	readPage := func(rawQuery string, expectedStatus int) catalogPagePayload {
		t.Helper()
		var payload catalogPagePayload
		getAuthenticatedJSON(t, testServer.URL+"/api/v1/words?"+rawQuery, registered.Tokens.AccessToken, expectedStatus, &payload)
		return payload
	}

	filter := "kind=phrase&source=phrases&topic=" + url.QueryEscape("Pagination Test")
	first := readPage(filter+"&sort=az&page=1&limit=48", http.StatusOK)
	if first.Count != 48 || len(first.Items) != 48 || first.Total != 125 || first.Page != 1 || first.PageSize != 48 || first.TotalPages != 3 || first.HasPrevious || !first.HasNext {
		t.Fatalf("unexpected first page: %+v", first)
	}
	if first.Items[0].Lemma != "page phrase 001" || first.Items[47].Lemma != "page phrase 048" {
		t.Fatalf("unexpected first page order: first=%q last=%q", first.Items[0].Lemma, first.Items[47].Lemma)
	}

	last := readPage(filter+"&sort=az&page=3&limit=48", http.StatusOK)
	if last.Count != 29 || len(last.Items) != 29 || last.Page != 3 || !last.HasPrevious || last.HasNext {
		t.Fatalf("unexpected last page: %+v", last)
	}
	if last.Items[0].Lemma != "page phrase 097" || last.Items[28].Lemma != "page phrase 125" {
		t.Fatalf("unexpected last page order: first=%q last=%q", last.Items[0].Lemma, last.Items[28].Lemma)
	}

	descending := readPage(filter+"&sort=za&page=1&limit=48", http.StatusOK)
	if descending.Items[0].Lemma != "page phrase 125" {
		t.Fatalf("descending first item = %q", descending.Items[0].Lemma)
	}
	searched := readPage(filter+"&query="+url.QueryEscape("phrase 007")+"&limit=48", http.StatusOK)
	if searched.Total != 1 || len(searched.Items) != 1 || searched.Items[0].Lemma != "page phrase 007" {
		t.Fatalf("unexpected search page: %+v", searched)
	}
	aliasSearch := readPage(filter+"&query="+url.QueryEscape("catalog alias 007")+"&limit=48", http.StatusOK)
	if aliasSearch.Total != 1 || len(aliasSearch.Items) != 1 || aliasSearch.Items[0].Lemma != "page phrase 007" {
		t.Fatalf("unexpected alias search page: %+v", aliasSearch)
	}
	mastered := readPage(filter+"&status=mastered&limit=48", http.StatusOK)
	if mastered.Total != 1 || len(mastered.Items) != 1 || mastered.Items[0].Status != "mastered" {
		t.Fatalf("unexpected mastered page: %+v", mastered)
	}

	var detail catalogItemPayload
	getAuthenticatedJSON(t, fmt.Sprintf("%s/api/v1/words/%d", testServer.URL, mastered.Items[0].ID), registered.Tokens.AccessToken, http.StatusOK, &detail)
	if detail.Lemma != "page phrase 007" || detail.Status != "mastered" || len(detail.Aliases) != 1 || detail.Aliases[0] != "catalog alias 007" {
		t.Fatalf("unexpected catalog detail: %+v", detail)
	}

	getAuthenticatedJSON(t, testServer.URL+"/api/v1/words?kind=phrase&limit=1000", registered.Tokens.AccessToken, http.StatusUnprocessableEntity, nil)
	getAuthenticatedJSON(t, testServer.URL+"/api/v1/words?kind=phrase&status=unknown", registered.Tokens.AccessToken, http.StatusUnprocessableEntity, nil)
	getAuthenticatedJSON(t, testServer.URL+"/api/v1/words/999999999", registered.Tokens.AccessToken, http.StatusNotFound, nil)
}
