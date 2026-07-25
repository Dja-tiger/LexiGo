# Current Task

## Identity

- Issue: #196 `Реализовать технические Scenario Lessons`; prerequisite contract correction for #24
- Branch: `fix/issue-196-scenario-review-contract`
- Base SHA: `3aa4b7e16a852ddd635ec0bcc2b2b56323e60f2b`
- Head SHA: resolve from the live branch ref
- PR: not created yet

## Objective

Make Scenario step evidence implementable by the frontend without a client-selected arbitrary learning item or client-authored correctness. Each step must expose its server-owned review target, and step submission must derive the ordinary schema-v2 Recall review from the persisted scenario response and that target.

## Confirmed blocker

The merged Scenario API requires `review.wordId`, rating and submitted answer, while `ScenarioStep` publishes only vocabulary strings. The integration fixture currently selects an unrelated first catalog item. A production client therefore cannot create semantically linked, objective evidence from the approved API without inventing a word mapping or correctness claim.

## Scope

- add one forward-only migration that links every seeded scenario step to an explicit scenario vocabulary learning item;
- enroll existing and future users through the existing words/user_words model;
- expose a typed review target in Scenario detail and attempt payloads;
- make the server derive the review word, submitted answer and effective rating from the response;
- preserve the canonical learning scheduler and ordinary schema-v2 Recall review event;
- update Scenario HTTP/OpenAPI contracts and integration/unit coverage;
- update repository task memory.

## Non-goals

- no Scenario React route or Figma implementation;
- no Progress, Lesson Composer, Lesson Result or global scheduler redesign;
- no generative language evaluation or LLM scoring;
- no broad catalog redesign;
- no dependency, deployment or visual baseline changes.

## Allowed paths

- `.agents/PROJECT_STATE.md`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `.agents/AGENTS.base.md` or `.agents/lessons/backend.md` only if a new confirmed failure category appears
- `backend/internal/platform/migrate/migrations/000014_scenario_review_targets.up.sql`
- `backend/internal/scenarios/model.go`
- `backend/internal/scenarios/repository.go`
- `backend/internal/scenarios/http.go`
- `backend/internal/scenarios/*_test.go`
- `backend/integration/scenario_lessons_test.go`
- `backend/openapi.yaml`

## Prohibited paths

Frontend runtime/CSS/tests, existing migration bodies, Progress and lesson scheduler implementation, dependencies, workflows, deployment configuration and unrelated documentation.

## Owners and boundaries

- Scenario content/order/attempt ownership: `backend/internal/scenarios` and migrations.
- Learning schedule/review-event ownership: canonical `learning.Repository.ReviewWordTx`; it must not be duplicated.
- Correctness derivation: Scenario repository, from the persisted response and the linked target; the client must not choose `wordId` or `correct`.
- API schema owner: `backend/openapi.yaml`.

## Contract matrix

- Catalog/detail/start/resume payloads expose the same linked review target for each current step.
- Active, paused and completed attempt state remains server-owned with optimistic versioning.
- Submission idempotency continues to use submission ID plus full request hash.
- Fact/hypothesis validation remains unchanged.
- A response containing the complete normalized target term produces server judgement through the canonical Recall evaluator.
- A response without the target produces an incorrect ordinary Recall event and cannot advance the scheduler as successful.
- The client may provide response timing and timezone only; it cannot select the review item or assert correctness.
- Existing users and newly registered users own the linked scenario vocabulary items.

## Acceptance criteria

- No public Scenario submit contract requires client-supplied `wordId`, rating, submitted answer, correctness or answer-revealed flags.
- Every seeded step has a non-null deterministic review target.
- Review events remain schema v2, `answer_mode=recall`, linked atomically to accepted scenario steps.
- Server judgement is reproducible from persisted response text and target.
- Pause/resume/order/version/idempotency/completion contracts remain green.
- OpenAPI matches runtime payloads.
- Backend unit, race, integration, migration and security gates pass.

## Risks

Token-boundary false positives, migration ordering, enrollment drift, request-hash compatibility, exposing duplicate catalog items and accidentally bypassing the canonical learning evaluator.

## Rollback

Revert the code and migration before production deployment. After migration deployment, use a forward corrective migration; never rewrite an applied migration.
