# Current Task

## Identity

- Issue: #196 `Реализовать технические Scenario Lessons`; prerequisite contract correction for #24
- Branch: `fix/issue-196-scenario-review-contract`
- Base SHA: `3aa4b7e16a852ddd635ec0bcc2b2b56323e60f2b`
- Head SHA: resolve from the live branch ref
- PR: #218 (Draft)

## Objective

Make Scenario step evidence implementable by the frontend without a client-selected arbitrary learning item or client-authored correctness. Each step exposes a server-owned review target, and step submission derives an ordinary schema-v2 Recall review from the persisted Scenario response and that target.

## Confirmed blocker

The merged Scenario API required `review.wordId`, rating and submitted answer, while `ScenarioStep` published only vocabulary strings. The integration fixture selected an unrelated first catalog item. A production client therefore could not create semantically linked, objective evidence from the approved API without inventing a word mapping or correctness claim.

## Scope

- add one forward-only migration that stores an immutable technical-vocabulary target definition on every seeded Scenario step;
- resolve/create and enroll the concrete learning item lazily inside the atomic accepted-submission transaction;
- expose the typed target term in Scenario detail and attempt payloads without exposing a client-selectable word ID;
- derive target presence, requested/effective rating and judgement from the persisted Scenario response;
- reuse the canonical learning scheduler/event writer through a narrow trusted-assessment transaction API;
- provide a bounded OpenAPI 3.1 contract for all authenticated Scenario routes and protect request ownership with a Go source-contract test;
- preserve ordering, optimistic versioning, pause/resume/reload, completion and submission idempotency;
- update repository task memory.

## Non-goals

- no Scenario React route or Figma implementation;
- no Progress, Lesson Composer, Lesson Result or global scheduler-policy redesign;
- no generative language evaluation or LLM scoring;
- no broad catalog redesign or automatic enrollment of all Scenario vocabulary;
- no dependency, workflow, deployment or visual baseline changes;
- no unsafe full rewrite of the historical monolithic `api/openapi.yaml` through a contents-only connector.

## Allowed paths

- `.agents/PROJECT_STATE.md`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `.agents/AGENTS.base.md` or `.agents/lessons/backend.md` only if a new confirmed failure category appears
- `backend/internal/platform/migrate/migrations/000015_scenario_review_targets.up.sql`
- `backend/internal/scenarios/model.go`
- `backend/internal/scenarios/repository.go`
- `backend/internal/scenarios/http.go`
- `backend/internal/scenarios/review.go`
- `backend/internal/scenarios/review_target_repository.go`
- `backend/internal/scenarios/*_test.go`
- `backend/internal/learning/review_transaction.go`
- `backend/internal/learning/review_transaction_test.go`
- `backend/integration/scenario_lessons_test.go`
- `api/openapi-scenarios.json`

## Prohibited paths

Frontend runtime/CSS/tests, existing migration bodies, Progress and lesson scheduler policy, dependencies, workflows, deployment configuration and unrelated documentation.

## Owners and boundaries

- Scenario content/order/attempt ownership: `backend/internal/scenarios` and migrations.
- Learning schedule/review-event ownership: canonical learning transaction writer; Scenario code must not copy scheduler or event SQL.
- Scenario correctness derivation: deterministic normalized whole-term matching in the Scenario domain.
- Client input ownership: response, optional facts/hypotheses, optional response timing and timezone only.
- Scenario API schema owner: `api/openapi-scenarios.json`, guarded by `openapi_contract_test.go`.
- Historical aggregate API document: `api/openapi.yaml`; unchanged in this atomic backend contract slice.

## Contract matrix

- Catalog/detail/start/resume payloads expose the same server-owned target term for each current step.
- Active, paused and completed attempt state remains server-owned with optimistic versioning.
- Submission idempotency continues to use submission ID plus full normalized request hash.
- Fact/hypothesis validation remains unchanged.
- A response containing the complete normalized target term produces a trusted server judgement and successful ordinary Recall transition.
- A response without the target produces an incorrect ordinary Recall event and cannot advance the target scheduler as successful.
- The client cannot select `wordId`, rating, submitted answer, correctness, answer-revealed state or judgement metadata.
- The concrete target is resolved/created and inserted into `user_words` atomically on first accepted submission, so existing and future accounts work without seed-dependent identifiers or global enrollment.

## Acceptance criteria

- No public Scenario submit contract requires client-supplied `wordId`, rating, submitted answer, correctness or answer-revealed flags.
- Every seeded step has a non-null deterministic target definition whose term belongs to its vocabulary.
- Review events remain schema v2, `answer_mode=recall`, linked atomically to accepted Scenario steps.
- Server judgement is reproducible from persisted response text and target with normalized whole-term matching.
- Shared scheduler/event persistence has one implementation path.
- Pause/resume/order/version/idempotency/completion contracts remain green.
- The bounded Scenario OpenAPI contract matches runtime routes, authentication and request ownership.
- Backend formatting, static analysis, unit/race, integration, migration and vulnerability gates pass.
- Full required PR CI passes on the final immutable head with no unresolved review threads.

## Risks

Token-boundary false positives, migration ordering, request-hash compatibility, duplicate vocabulary rows, accidental scheduler duplication, cross-domain trusted-assessment misuse and drift between the bounded Scenario spec and the historical aggregate API document.

## Rollback

Revert the code and migration before production deployment. After migration deployment, use a forward corrective migration; never rewrite applied migration `000015`.
