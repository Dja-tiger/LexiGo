# Current Task Execution

## Task

- Issue: #485 (`#25` Phase 2)
- Branch: `feat/issue-25-custom-vocabulary-foundation`
- Base SHA: `03b50fe78fb0f2280e8fe630931b6136df7d2717`
- Head SHA: resolve from live branch after this harness write; all final evidence must match that exact SHA.
- PR: #486 — `feat(words): add private custom vocabulary foundation`

## Skills used

### GitHub repository workflow

Purpose:

- inspect live repository state, Issues/PRs, source files, migrations and CI;
- perform isolated branch writes and maintain exact repository evidence;
- inspect per-file PR patches after full-file documentation replacements.

Instruction source:

- installed GitHub plugin skill `skills://plugins/github/github/skill.md`;
- repository `AGENTS.md`, `.agents/AGENTS.md`, `.agents/AGENTS.base.md`, `.agents/SKILLS.md`, `.agents/current/**`, `docs/agent-harness.md`.

Version or verification date:

- live repository instructions read on 2026-08-13 before product writes.

Inputs:

- `main` SHA `03b50fe78fb0f2280e8fe630931b6136df7d2717`;
- parent Issue #25 and Phase 1 delivery state;
- current migrations, `words`, catalog seed, lesson/review and server route owners.

Files inspected:

- `AGENTS.md`, `.agents/**`, `docs/agent-harness.md`;
- `backend/internal/platform/migrate/migrations/000001_init.up.sql`, `000002_catalog.up.sql`, `000004_resumable_lessons.up.sql`, `000010_lesson_review_idempotency.up.sql`, `000013_answer_judgement.up.sql`, `000019_diagnostic_onboarding.up.sql`, `000021_listening_answer_mode.*.sql`;
- `backend/internal/words/**`, `backend/internal/catalog/catalog.go`, `backend/internal/learning/**`, `backend/internal/auth/postgres_repository.go`, `backend/internal/server/server.go`;
- representative backend integration tests and `api/openapi.yaml`;
- `docs/architecture.md`.

Actions performed:

- created child Issue #485 and isolated branch from exact base;
- created Draft PR #486;
- implemented private ownership migration, create/delete API, catalog/public metadata guards and integration/unit/source contracts;
- audited FK cascades, registration enrollment trigger, public metadata and active-lesson deletion semantics;
- documented OpenAPI and architecture ownership;
- inspected high-risk full-file documentation changes with per-file PR patches.

Artifacts produced:

- migration `000022_custom_words.up.sql`;
- custom-word domain/repository/HTTP code and tests;
- PostgreSQL integration coverage;
- OpenAPI 0.16.0 contract;
- architecture and Agent Harness evidence.

Result:

- implementation is functionally complete for the Issue #485 scope and is entering immutable-head validation.

Failures:

- first CI implementation head failed backend formatting before static/unit execution;
- local `git clone` was unavailable because the execution container could not resolve github.com.

Root cause:

- formatting: one integration-test map literal was not canonical `gofmt` output;
- clone: external DNS/network limitation of the container, unrelated to repository source.

Fallback:

- canonicalized Go formatting locally with `gofmt` and verified the next CI head passed formatting/static analysis;
- used GitHub connector for repository operations and GitHub Actions for authoritative execution.

Limitations:

- no frontend/Figma work is included; no custom phrase/import/export/microphone flow is claimed;
- superseded CI runs are diagnostic only and cannot satisfy the final immutable-head gate.

Reusable lesson:

- when replacing a global unique expression index with partial indexes, every `on conflict` consumer must be audited because PostgreSQL conflict inference requires a matching partial-index predicate;
- introducing private rows into a historically public table requires auditing aggregate/metadata projections, not only list/detail endpoints;
- FK cascades guarantee referential cleanup but do not by themselves preserve higher-level state-machine invariants such as an active lesson's item count/version.

## Validation matrix

### Source and ownership

- `main`/branch base comparison: required before merge.
- changed-path audit: only task-allowed paths.
- public list/detail/metadata: owner-scoped rows excluded.
- authenticated catalog: shared or current-owner rows only.
- new-user registration: private source not auto-enrolled.

### Persistence and scheduler

- create custom word: one transaction creates `words` + exactly one `user_words` row.
- duplicate same owner: 409 after case/whitespace normalization boundary.
- duplicate different owner: allowed and independently owned.
- due queue: owner custom row appears through existing scheduler state.
- lesson/review: explicit normal lesson accepts the custom `word_id`; review writes the existing `review_events` contract.
- delete after review: dependent scheduler/review/lesson references cascade away.
- delete during active lesson: lesson is discarded/versioned before item cascade.

### Public/API contract

- public detail by private ID: 404.
- public query by private lemma: zero private matches.
- public catalog metadata/version: unchanged by private row creation.
- OpenAPI parses as YAML and source-contract tests require the two custom endpoints, bearer auth, bounded schema and owner-field non-exposure.

### CI evidence

- Run `31695812568`: backend integration + race passed on an earlier implementation head; backend unit stopped at formatting.
- Run `31696477317`: formatting and static analysis passed after remediation; longer jobs were superseded by later commits.
- Final: require a full green CI run attached to the live frozen head after this document write.

### Review and delivery

- inspect PR reviews/comments/unresolved threads on the final head;
- Ready transition only after final CI is green;
- squash merge;
- exact merge-SHA CI;
- exact-SHA Stage deploy and public browser validation;
- durable Agent Harness reconciliation after delivery.
