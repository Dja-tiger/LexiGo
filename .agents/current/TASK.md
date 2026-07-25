# Current Task

## Identity

- Issue: #196 `Реализовать технические Scenario Lessons`; prerequisite contract correction for #24
- Branch: `fix/issue-196-scenario-review-contract`
- Base SHA: `3aa4b7e16a852ddd635ec0bcc2b2b56323e60f2b`
- Head SHA: resolve from the live branch ref
- PR: not created yet

## Objective

Make Scenario step evidence implementable by the frontend without a client-selected arbitrary learning item or client-authored correctness. Each step must expose its server-owned review target, and step submission must derive an ordinary schema-v2 Recall review from the persisted scenario response and that target.

## Confirmed blocker

The merged Scenario API requires `review.wordId`, rating and submitted answer, while `ScenarioStep` publishes only vocabulary strings. The integration fixture currently selects an unrelated first catalog item. A production client therefore cannot create semantically linked, objective evidence from the approved API without inventing a word mapping or correctness claim.

## Scope

- add one forward-only migration that links every seeded scenario step to an explicit technical-vocabulary learning item;
- lazily enroll the linked item for any existing or future user inside the atomic step submission transaction;
- expose a typed review target in Scenario detail and attempt payloads;
- make the server derive target presence, requested/effective rating and judgement from the persisted scenario response;
- reuse the canonical learning scheduler/event writer through a narrow trusted-assessment transaction API;
- update Scenario HTTP/OpenAPI contracts and integration/unit coverage;
- update repository task memory.

## Non-goals

- no Scenario React route or Figma implementation;
- no Progress, Lesson Composer, Lesson Result or global scheduler-policy redesign;
- no generative language evaluation or LLM scoring;
- no broad catalog redesign or automatic enrollment of all Scenario vocabulary;
- no dependency, deployment or visual baseline changes.

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
- `backend/internal/scenarios/*_test.go`
- `backend/internal/learning/review_transaction.go`
- `backend/internal/learning/review_transaction_test.go`
- `backend/integration/scenario_lessons_test.go`
- `api/openapi.yaml`

## Prohibited paths

Frontend runtime/CSS/tests, existing migration bodies, Progress and lesson scheduler policy, dependencies, workflows, deployment configuration and unrelated documentation.

## Owners and boundaries

- Scenario content/order/attempt ownership: `backend/internal/scenarios` and migrations.
- Learning schedule/review-event ownership: canonical learning transaction writer; Scenario code must not copy scheduler or event SQL.
- Scenario correctness derivation: deterministic normalized whole-term matching in the Scenario domain.
- Client input ownership: response, optional facts/hypotheses, response timing and timezone only.
- API schema owner: `api/openapi.yaml`.

## Contract matrix

- Catalog/detail/start/resume payloads expose the same linked review target for each current step.
- Active, paused and completed attempt state remains server-owned with optimistic versioning.
- Submission idempotency continues to use submission ID plus full normalized request hash.
- Fact/hypothesis validation remains unchanged.
- A response containing the complete normalized target term produces a trusted server judgement and successful ordinary Recall transition.
- A response without the target produces an incorrect ordinary Recall event and cannot advance the target's scheduler as successful.
- The client cannot select `wordId`, rating, submitted answer, correctness or answer-revealed state.
- The current target is inserted into `user_words` atomically on first accepted submission, so both existing and future accounts work without global catalog pollution.

## Acceptance criteria

- No public Scenario submit contract requires client-supplied `wordId`, rating, submitted answer, correctness or answer-revealed flags.
- Every seeded step has a non-null deterministic review target.
- Review events remain schema v2, `answer_mode=recall`, linked atomically to accepted Scenario steps.
- Server judgement is reproducible from persisted response text and target with whole-term normalization.
- Shared scheduler/event persistence has one implementation path.
- Pause/resume/order/version/idempotency/completion contracts remain green.
- OpenAPI matches runtime payloads.
- Backend unit, race, integration, migration and security gates pass.

## Risks

Token-boundary false positives, migration ordering, request-hash compatibility, duplicate vocabulary rows, accidental scheduler duplication and allowing a cross-domain trusted assessment without strict validation.

## Rollback

Revert the code and migration before production deployment. After migration deployment, use a forward corrective migration; never rewrite an applied migration.
