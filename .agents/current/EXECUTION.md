# Current Task Execution

## Task

- Issue: #196 prerequisite contract correction for #24
- Branch: `fix/issue-196-scenario-review-contract`
- Base SHA: `3aa4b7e16a852ddd635ec0bcc2b2b56323e60f2b`
- Head SHA: resolve from live branch ref
- PR: #218 (Draft)

## Skills used

### GitHub repository operations

Purpose:

Protect `main`, verify repository truth, isolate the atomic correction and drive CI/review state.

Instruction source:

`AGENTS.md`, `.agents/AGENTS*.md`, `.agents/SKILLS.md`, GitHub repository skill and CI-fix procedure.

Version or verification date:

2026-07-25.

Inputs:

PR #217, CI #1756, Issues #196/#24, current `main`, PR #218, CI #1759/#1760 and live branch files.

Actions performed:

- verified and squash-merged PR #217 on its immutable green head;
- created `fix/issue-196-scenario-review-contract` from exact `main`;
- opened Draft PR #218;
- read every changed file back from the explicit branch and repeatedly verified `main` unchanged;
- classified initial CI #1759 as a formatting-only failure after backend integration passed;
- reproduced and fixed the two `gofmt` differences;
- verified full CI #1760 success on the corrected runtime head;
- kept PR #218 Draft while the bounded API contract and final memory were added.

Artifacts produced:

PR #218, isolated branch, CI evidence and current repository memory.

Result:

The runtime correction is green on CI #1760. Final-head CI is pending after OpenAPI/memory reconciliation.

Failures:

- GitHub Actions had an earlier platform incident, resolved before this task's canonical runs.
- Local clone/download fallback could not reach GitHub from the execution container; repository connector and CI remained available.

Reusable lesson:

Infrastructure, formatting and behavior failures must be classified separately. A prior green runtime head does not authorize merge after later documentation/source-contract writes; final CI must rerun.

### Figma inspection

Purpose:

Confirm the downstream Scenario UI contract and avoid inventing controls absent from approved design.

Instruction source:

Figma design-to-code skill and Issue #196.

Version or verification date:

2026-07-25.

Inputs:

LexiGo Design System nodes `76:100`, `76:127`, `76:219`.

Actions performed:

Inspected mobile Light, mobile Dark and desktop active states: role, audience, workplace goal, constraints, response editor, criteria, progress and save/pause affordances.

Result:

No arbitrary word picker, self-rating or client correctness control exists. The backend contract had to own review target and judgement before UI implementation.

Limitations:

React route, browser accessibility matrix and Linux visual baselines are deliberately deferred to the next PR.

Reusable lesson:

A required mutation field needs a legitimate UI owner; otherwise ownership belongs in the server contract.

### Backend contract audit and implementation

Purpose:

Map every Scenario producer/consumer and restore objective durable evidence without duplicating the learning scheduler.

Instruction source:

`.agents/AGENTS.base.md`, `.agents/AGENTS.issue-19-completion.md`, backend validation procedure.

Version or verification date:

2026-07-25.

Inputs:

Scenario model/HTTP/repository, migrations `000011`/`000012`, integration fixture, canonical learning review transaction, answer normalization, catalog and registration/enrollment behavior.

Actions performed:

- traced list/detail/start/pause/resume/submit and replay paths;
- rejected the initial persisted `review_word_id` design because test/catalog reseeds make seed IDs unstable;
- added migration `000015` with immutable target term/translation/part-of-speech for all 18 steps;
- exposed only `reviewTarget.term` publicly;
- added normalized whole-term target judgement;
- added transactional word resolution/creation and user enrollment;
- centralized trusted server assessments through `ReviewWordTxWithAssessment` and shared `applyReviewTx`;
- removed client-authored word/rating/answer evidence from submit;
- expanded integration coverage for old-payload rejection, correct/incorrect evidence, assignment, replay and completion.

Artifacts produced:

Migration, Scenario domain code, shared learning transaction guard and unit/integration tests.

Result:

Backend integration and full CI #1760 pass. Evidence remains schema v2 Recall and atomically linked to accepted Scenario steps.

Failures:

- A transient undefined alias was introduced during a model replacement and removed immediately before CI; a reusable backend lesson was added.
- The first CI run found two `gofmt` differences in new test literals; behavior/integration were green, formatting was corrected and #1760 passed.

Reusable lesson:

Persist immutable domain definitions rather than foreign keys to reseeded catalogs. Resolve concrete learning IDs inside the transaction that consumes the definition.

### OpenAPI source contract

Purpose:

Provide a machine-readable Scenario API contract that proves route/auth/request ownership without risking an unsafe wholesale rewrite of the historical monolithic spec through a contents-only connector.

Instruction source:

Task contract, runtime routes and strict JSON decoding behavior.

Version or verification date:

2026-07-25.

Inputs:

Seven authenticated Scenario routes, public models, validation bounds and integration responses.

Actions performed:

- added `api/openapi-scenarios.json` as an OpenAPI 3.1 bounded-context document;
- documented catalog/detail/start/get/pause/resume/submit routes;
- documented server-owned `reviewTarget.term`, optional review timing metadata and response evidence;
- excluded client-owned `wordId`, rating, submitted answer, correctness and judgement fields;
- added a dependency-free Go test that parses the document, verifies exact paths/security/request properties/required fields and rejects forbidden client evidence.

Result:

Scenario clients have an independently parseable contract protected by unit CI. The historical aggregate `api/openapi.yaml` remains unchanged in this atomic runtime correction.

Risks and follow-up:

The bounded document and historical aggregate may drift if future API governance assumes one monolith. The test protects the bounded contract; aggregate consolidation should be done only with a safe file-level editing environment or generation tooling.

## Validation status

1. Migration applies in integration and survives the repository's catalog reset/reseed pattern: passed.
2. Normalized whole-term matching and trusted-assessment validation: passed on CI #1760.
3. Scenario integration lifecycle/evidence/idempotency/completion: passed on CI #1760.
4. Bounded OpenAPI parse/source contract: pending newest final-head CI.
5. Backend formatting/static/unit/race/integration/vulnerability: passed on #1760; rerun pending after later source-contract writes.
6. Full required frontend/browser matrix: passed on #1760; final-head rerun pending.
7. Review threads and final PR metadata: pending final-head CI.
