# Current Task

## Identity

- Issue: #18
- Branch: `feat/issue-18-diagnostic-onboarding-backend`
- Base SHA: `edcfd3dbee62a4dba253df07d984fa326350c984`
- PR: pending

## Objective

Deliver the next large backend-only production slice of Issue #18: a resumable and skippable diagnostic onboarding contract with representative items, pre-answer learner self-marking and safe scheduler initialization. Do not implement the visual First Use flow until Issue #201's missing canonical Figma nodes are supplied.

## Scope

- Cross-device onboarding state stored in `user_learning_preferences`.
- Bounded 12-item diagnostic sampled from assigned words/phrases with explicit phrase, technical-topic and POS coverage when inventory exists.
- Prompt responses deliberately exclude translations before self-mark.
- Sequential self-mark values `known`, `unsure`, `new`, stored separately from objective review events.
- Mark response reveals the translation only after the self-mark is persisted.
- Completion initializes only still-`new` `user_words`; it never inserts synthetic `review_events` and never rewrites existing learned state.
- `known` initialization schedules at least seven days out; `unsure` schedules one day out; `new` preserves new state.
- Skip is server-owned, cross-device and does not mutate learning state.
- Idempotent start/completion and deterministic candidate selection for the same user/catalog state.
- Authenticated backend endpoints for status/start/mark/complete/skip.

## Non-goals

- Guest Home / onboarding visual implementation governed by #201.
- Any Figma node creation or substitution.
- Objective answer correctness during this self-mark-only backend phase.
- Changes to Phase 1 adaptive ranking semantics.
- Client-side onboarding persistence.

## Allowed paths

- `backend/internal/learning/onboarding.go`
- `backend/internal/learning/onboarding_http.go`
- `backend/internal/learning/onboarding_test.go`
- `backend/internal/server/server.go`
- `backend/internal/platform/migrate/migrations/000019_diagnostic_onboarding.up.sql`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

All paths not listed above in this slice, especially frontend visual owners, Figma-derived styles/components, deployment workflows and unrelated learning/review code.

## Invariants

- Self-mark is not objective correctness and does not create `review_events`.
- Existing non-new scheduler state is never downgraded by onboarding completion.
- Known items do not flood initial due queue.
- A skipped onboarding never blocks normal learning.
- Diagnostic answers are not returned by status/start before the user self-marks the current item.
- User cannot mark future items out of order.
- Backend state is resumable across devices.
- #18 remains open after this slice; #201 remains the visual First Use implementation gate.

## Acceptance criteria

- Onboarding status is available to authenticated users and defaults to `not_started`.
- Start returns an `in_progress` diagnostic with at most 12 items and only the current prompt.
- Representative selection includes phrases, technical topics, nouns, verbs and adjectives when inventory exists.
- `known / unsure / new` is validated and persisted sequentially before reveal.
- Completion is rejected until every diagnostic item is marked.
- Completion applies safe initialization only to items still in `new` state and creates no review event.
- Skip persists `skipped` without scheduler mutation.
- Unit/integration/race gates and immutable-head CI pass before merge.
- Exact-SHA main CI and Stage/public validation pass after merge.

## Rollback

Revert the diagnostic onboarding PR. Migration 000019 is additive; existing learning/review state remains authoritative. Diagnostic rows and preference columns can remain inert if runtime endpoints are reverted.
