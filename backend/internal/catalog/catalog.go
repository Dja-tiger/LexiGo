package catalog

import (
	"bytes"
	"compress/gzip"
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/csv"
	"errors"
	"fmt"
	"io"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

const (
	Source        = "hakui-technical-english-2020"
	Topic         = "academic-technical-english"
	ExpectedCount = 579
)

type Entry struct {
	Lemma        string
	PartOfSpeech string
	Translation  string
	Note         string
	SourceSheet  string
	SourceRow    int
}

func Entries() ([]Entry, error) {
	data, err := catalogCSV()
	if err != nil {
		return nil, err
	}

	reader := csv.NewReader(bytes.NewReader(data))
	header, err := reader.Read()
	if err != nil {
		return nil, fmt.Errorf("read catalog header: %w", err)
	}
	expectedHeader := []string{"lemma", "part_of_speech", "translation", "note", "source_sheet", "source_row"}
	if len(header) != len(expectedHeader) {
		return nil, fmt.Errorf("catalog header contains %d columns, expected %d", len(header), len(expectedHeader))
	}
	for index := range expectedHeader {
		if header[index] != expectedHeader[index] {
			return nil, fmt.Errorf("catalog header column %d is %q, expected %q", index+1, header[index], expectedHeader[index])
		}
	}

	allowedPartsOfSpeech := map[string]struct{}{
		"adjective":   {},
		"adverb":      {},
		"noun":        {},
		"preposition": {},
		"verb":        {},
	}
	seen := make(map[string]struct{}, ExpectedCount)
	entries := make([]Entry, 0, ExpectedCount)

	for line := 2; ; line++ {
		record, readErr := reader.Read()
		if errors.Is(readErr, io.EOF) {
			break
		}
		if readErr != nil {
			return nil, fmt.Errorf("read catalog line %d: %w", line, readErr)
		}
		if len(record) != len(expectedHeader) {
			return nil, fmt.Errorf("catalog line %d contains %d columns, expected %d", line, len(record), len(expectedHeader))
		}

		sourceRow, conversionErr := strconv.Atoi(record[5])
		if conversionErr != nil || sourceRow <= 0 {
			return nil, fmt.Errorf("catalog line %d contains invalid source row %q", line, record[5])
		}
		entry := Entry{
			Lemma:        strings.TrimSpace(record[0]),
			PartOfSpeech: strings.TrimSpace(record[1]),
			Translation:  strings.TrimSpace(record[2]),
			Note:         strings.TrimSpace(record[3]),
			SourceSheet:  strings.TrimSpace(record[4]),
			SourceRow:    sourceRow,
		}
		if entry.Lemma == "" || entry.Translation == "" {
			return nil, fmt.Errorf("catalog line %d contains an empty lemma or translation", line)
		}
		if _, ok := allowedPartsOfSpeech[entry.PartOfSpeech]; !ok {
			return nil, fmt.Errorf("catalog line %d contains unsupported part of speech %q", line, entry.PartOfSpeech)
		}
		key := strings.ToLower(entry.Lemma) + "\x00" + strings.ToLower(entry.Translation)
		if _, exists := seen[key]; exists {
			return nil, fmt.Errorf("catalog line %d duplicates lemma and translation %q", line, entry.Lemma)
		}
		seen[key] = struct{}{}
		entries = append(entries, entry)
	}

	if len(entries) != ExpectedCount {
		return nil, fmt.Errorf("catalog contains %d entries, expected %d", len(entries), ExpectedCount)
	}
	return entries, nil
}

func catalogCSV() ([]byte, error) {
	compressed, err := base64.StdEncoding.DecodeString(catalogDataGzipBase64)
	if err != nil {
		return nil, fmt.Errorf("decode embedded catalog: %w", err)
	}
	reader, err := gzip.NewReader(bytes.NewReader(compressed))
	if err != nil {
		return nil, fmt.Errorf("open embedded catalog: %w", err)
	}
	data, readErr := io.ReadAll(reader)
	closeErr := reader.Close()
	if readErr != nil {
		return nil, fmt.Errorf("read embedded catalog: %w", readErr)
	}
	if closeErr != nil {
		return nil, fmt.Errorf("close embedded catalog: %w", closeErr)
	}

	actualHash := fmt.Sprintf("%x", sha256.Sum256(data))
	if actualHash != catalogDataSHA256 {
		return nil, fmt.Errorf("embedded catalog checksum is %s, expected %s", actualHash, catalogDataSHA256)
	}
	return data, nil
}

func Seed(ctx context.Context, pool *pgxpool.Pool) (int, error) {
	entries, err := Entries()
	if err != nil {
		return 0, err
	}

	tx, err := pool.Begin(ctx)
	if err != nil {
		return 0, fmt.Errorf("begin catalog transaction: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if _, err := tx.Exec(ctx, "select pg_advisory_xact_lock(hashtext($1))", "lexigo:catalog:"+Source); err != nil {
		return 0, fmt.Errorf("lock catalog seeding: %w", err)
	}

	for _, entry := range entries {
		if _, err := tx.Exec(ctx, `
			insert into words (
				lemma,
				translation,
				part_of_speech,
				topic,
				examples,
				note,
				source
			)
			values ($1, $2, $3, $4, '[]'::jsonb, $5, $6)
			on conflict (lower(lemma), lower(translation))
			do update set
				part_of_speech = excluded.part_of_speech,
				topic = excluded.topic,
				note = excluded.note,
				source = excluded.source,
				updated_at = now()
			where (words.part_of_speech, words.topic, words.note, words.source)
				is distinct from (excluded.part_of_speech, excluded.topic, excluded.note, excluded.source)
		`, entry.Lemma, entry.Translation, entry.PartOfSpeech, Topic, entry.Note, Source); err != nil {
			return 0, fmt.Errorf("upsert catalog word %q: %w", entry.Lemma, err)
		}
	}

	if _, err := tx.Exec(ctx, `
		insert into user_words (user_id, word_id)
		select users.id, words.id
		from users
		cross join words
		where words.source = $1
		on conflict (user_id, word_id) do nothing
	`, Source); err != nil {
		return 0, fmt.Errorf("enroll existing users into catalog: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, fmt.Errorf("commit catalog transaction: %w", err)
	}
	return len(entries), nil
}
