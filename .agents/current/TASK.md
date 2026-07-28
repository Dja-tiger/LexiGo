# Current Task

## Identity

- Issue: #132 — administrative moderation of answer suggestions.
- Branch: `agent/issue-132-answer-suggestion-moderation`.
- Base SHA: `65c233601b684b8b9ac2873290dd2718a83b39a9`.
- Head SHA: resolve from live branch ref.
- PR: pending.

## Objective

Deliver a fail-closed backend moderation workflow for `answer_suggestions`: authorized queue inspection, contextual decisions, normalized accepted-answer deduplication, immutable audit, observability and bounded raw-answer retention.

## Scope

- additive moderation schema and audit/version fields;
- content-admin allowlist resolved against the current authenticated account email;
- keyset-paginated queue with bounded filters and full learning-item/review context;
- atomic accept/reject decision with optimistic locking;
- normalized no-duplicate update of `words.accepted_answers`;
- queue metrics, structured operational logs and bounded retention cleanup;
- OpenAPI, integration, authorization, concurrency and retention contracts;
- operational/privacy documentation and environment examples.

## Non-goals

- no LLM or automatic acceptance;
- no retroactive review result or scheduler mutation;
- no public moderator frontend, Figma or visual baseline;
- no unrelated auth role system or account redesign.

## Allowed paths

- `backend/internal/moderation/**`;
- focused `backend/internal/config/**`, `backend/internal/server/**`, `backend/cmd/api/**`;
- `backend/internal/platform/migrate/migrations/000017_answer_suggestion_moderation.up.sql`;
- focused backend integration tests;
- `api/openapi.yaml`;
- `.env.example`, stage/prod env examples and compose wiring only for moderation configuration;
- focused moderation/architecture/privacy documentation;
- `.agents/AGENTS.md` and the focused OpenAPI structural lesson for a confirmed failure category;
- `.agents/current/**`.

## Prohibited paths

- frontend runtime and visual baselines;
- existing learning judgement/scheduler semantics except reuse of deterministic normalization;
- unrelated migrations, workflows, dependencies or deployment scripts;
- secrets or real admin identities.

## Runtime owners

- existing `learning` package: suggestion submission, deterministic answer normalization and scheduler.
- new `moderation` package: admin authorization, queue/context, decisions, audit, metrics and retention.
- `httpx.Authenticate`: credential epoch validation and authenticated user context.
- PostgreSQL transaction: row locks and atomic suggestion/word/audit mutation.

## Documentation owners

- Issue #132 and Draft PR: acceptance and validation evidence.
- `api/openapi.yaml`: external HTTP contract.
- moderation operational document: RBAC, decision reasons, retention and incident procedure.
- `.agents/current/**`: active pre-flight and reproducible execution.

## Invariants

- non-admin users cannot infer queue contents or mutate suggestions;
- empty/malformed allowlist denies all moderation access;
- a decision never changes the referenced review event or historical scheduler state;
- accepted answers contain no normalized duplicates;
- one expected version produces at most one terminal decision;
- raw submitted answers and audit data follow documented bounded retention;
- final CI runs on a developer-authored immutable head.

## Acceptance criteria

- all Issue #132 criteria are backed by unit/integration/OpenAPI evidence;
- list requests are bounded and keyset-paginated;
- accept/reject decisions are transactional, audited and conflict-safe;
- queue metrics expose pending count, oldest age and terminal rates to admins only;
- retention cleanup is bounded, replica-safe and documented;
- full required CI, review audit, expected-head squash merge and exact-SHA stage validation pass.

## Required checks

- formatting, `go vet`, unit and race tests;
- migration and PostgreSQL/Redis integration;
- authorization, pagination, decision, normalized dedupe and concurrent conflict tests;
- retention worker bounds/advisory-lock behavior;
- OpenAPI source contract;
- complete GitHub CI, container builds and stage/public validation.

## Risks

- allowlist drift could deny legitimate admins or expose data if matching is weak;
- concurrent decisions could append duplicates without word-level locking;
- retention could delete active work or unbounded rows;
- list filters could leak learner raw answers or permit unbounded scans.

## Rollback

Remove the new routes/worker/package and stop writing the additive moderation fields. Existing pending suggestions, review events and scheduler state remain readable and unchanged.
