# Non-null PostgreSQL array boundaries

## Scope

This rule applies when pgx scans PostgreSQL arrays that are later persisted into non-null audit/history/outbox columns or serialized through an API contract that requires an array.

## Confirmed failure

On 2026-07-28, the first real Issue #132 accept integration returned HTTP 500. PostgreSQL rejected `answer_suggestion_audit.previous_accepted_answers` as null even though the source `words.accepted_answers` value was an empty `text[]`.

## Root cause

pgx represented the empty source array as a nil Go slice. Copying it with a nil destination preserved nil, which pgx encoded as SQL `NULL` instead of an empty PostgreSQL array.

## Why it escaped

Unit contracts used in-memory non-nil slices. Compilation and migration creation could not exercise the driver encoding boundary; only the real PostgreSQL decision transaction exposed it.

## Mandatory prevention

1. When a database target is `NOT NULL`, normalize scanned nil slices before writing a snapshot.
2. Allocate immutable before/after snapshots with `make` and `copy`; do not rely on nil-preserving append copies.
3. Normalize nil read-model slices to an allocated empty slice before JSON encoding when the API schema requires an array.
4. Exercise empty-array and populated-array paths against the real database driver.
5. Preserve database and API constraints; do not weaken invariants to accommodate driver representation.

## Regression gate

- `backend/integration/answer_suggestion_moderation_test.go` accepts the first suggestion for a catalog item whose `accepted_answers` is empty and requires the audit row to commit.
- The same queue response requires empty `acceptedAnswers` to serialize as `[]`, never `null`.
- The same integration verifies normalized deduplication after the first accepted answer is present.

## Reusable lesson

An empty PostgreSQL array and SQL/JSON `NULL` are distinct even when a Go driver represents both with a nil slice. Normalize at every persistence and serialization boundary.
