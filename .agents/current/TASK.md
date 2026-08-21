# Current Task

## Identity

- Issue: #638 — `[Medium][Learning][#25 Phase 5] Add private custom-phrase ownership and scheduler enrollment`
- Branch: `feat/issue-638-custom-phrases`
- Base SHA: `cb7559cca2160c4c1cd2e9e9fcd90770e13f7e49`
- Head SHA: resolve from live branch ref
- PR: not opened yet

## Objective

Add an authenticated private custom-phrase backend/API foundation on the existing `words(kind='phrase')` + `user_words` scheduler path without creating a second SRS or inventing UI that has no canonical OpenPencil source.

## Scope

- widen private vocabulary persistence from owner-scoped custom words to owner-scoped custom words/phrases;
- add bounded `CreateCustomPhraseRequest` normalization/validation;
- generate a canonical globally unique private phrase slug server-side using Go standard-library cryptographic randomness;
- atomically create the phrase and exactly one `user_words` enrollment;
- add owner-safe custom phrase deletion with active-lesson discard before existing cascade cleanup;
- expose authenticated create/delete HTTP routes;
- document the additive API in OpenAPI;
- add unit/source and PostgreSQL integration coverage for validation, ownership, scheduler participation, phrase detail, duplicate handling and deletion.

## Non-goals

- frontend/UI/CSS/OpenPencil/Figma changes;
- listening-first or pronunciation-recorder UI;
- scoring/STT/audio upload or persistence;
- custom glossary v1 schema changes or phrase import/export;
- scheduler formula/ranking changes;
- public exposure of owner content;
- shared phrase mutation;
- route-island or visual baseline changes.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `backend/internal/platform/migrate/migrations/000023_custom_phrases.up.sql`
- `backend/internal/words/custom_phrase.go`
- `backend/internal/words/custom_phrase_test.go`
- `backend/internal/words/custom_phrase_repository.go`
- `backend/internal/words/custom_phrase_http.go`
- `backend/internal/words/custom_phrase_openapi_contract_test.go`
- `backend/internal/words/custom_glossary_openapi_contract_test.go` — proven shared OpenAPI parse/version/error-field consumer only; glossary runtime/schema behavior remains unchanged
- `backend/internal/server/server.go`
- `backend/integration/custom_phrases_test.go`
- `api/openapi.yaml`
- `docs/architecture.md` only if executable/public API ownership documentation must be synchronized by the final contract audit

## Prohibited paths

- `frontend/**`
- `design/**`
- `docs/figma/**`
- `.github/workflows/**`
- dependency manifests/locks unless a proven defect makes them unavoidable; current design requires no new dependency
- existing custom-word/glossary runtime files unless a failing contract proves a shared primitive must be changed; compatibility is an invariant
- unrelated migrations, scheduler algorithms, auth/session runtime and deployment configuration

## Runtime owners

- PostgreSQL `words`, `user_words`, lesson/review FK graph;
- `backend/internal/words` repository and HTTP package;
- `backend/internal/server/server.go` authenticated route registration;
- existing `Repository.GetPhraseBySlug`, authenticated `kind=phrase` catalog and learning scheduler consumers.

## Documentation owners

- `api/openapi.yaml` for public API contract;
- `docs/architecture.md` only when needed to keep the backend boundary truthful.

## Invariants

- private content remains owner-only; public projections require `owner_user_id is null`;
- phrases remain the existing `words.kind='phrase'` entity and existing scheduler owner;
- `words_phrase_shape_chk` remains enforced;
- a private slug cannot shadow shared or another private phrase under `/api/v1/phrases/{slug}`;
- existing custom-word create/delete and `lexigo-custom-glossary-v1` import/export remain compatible and unchanged in behavior;
- phrase creation + enrollment is atomic;
- deletion does not leave an active lesson referencing removed content;
- no browser/UI storage or alternate scheduler is introduced.

## Acceptance criteria

- every Issue #638 acceptance criterion is covered by implementation plus deterministic tests;
- create/delete endpoints are authenticated and owner-safe;
- server-generated slug passes `ValidPhraseSlug` and global uniqueness semantics;
- same-owner normalized content duplicates fail while cross-account equivalent content remains legal;
- owner phrase is reachable through authenticated phrase catalog/detail and scheduler paths but absent from public catalog;
- deletion cleans scheduler/lesson dependencies safely;
- OpenAPI is structurally valid and synchronized.

## Required checks

- source/unit tests for normalization and slug generation;
- `gofmt` / Go static/unit/security gates;
- real PostgreSQL integration for ownership, duplicate, scheduler, detail and deletion;
- migration application through integration environment;
- complete OpenAPI YAML parse plus feature contract test;
- full immutable-head repository CI because backend/API/migration runtime changes;
- clean review/thread audit;
- expected-head squash merge;
- exact-main CI and exact-SHA Stage/public validation before closing #638.

## Risks

- ambiguous slug lookup if private content can shadow an existing slug;
- accidentally weakening public/owner filters;
- changing custom-word/glossary-v1 semantics through over-generalization;
- partial persistence if phrase and scheduler enrollment do not share one transaction;
- deletion of shared/another-owner content if kind/source/owner predicates are incomplete;
- OpenAPI text-fragment edits that leave invalid YAML structure.

## Rollback

Revert the single product merge before dependent UI/API adoption. The migration only widens an existing check constraint and does not rewrite catalog data; no existing shared/custom-word rows need transformation.
