# Current Task Progress

## 2026-07-25 17:12 Europe/Berlin

### Verified

- `main` remains `3aa4b7e16a852ddd635ec0bcc2b2b56323e60f2b`; all writes are isolated on `fix/issue-196-scenario-review-contract`.
- Draft PR #218 is open, mergeable and based on the verified `main`.
- Exact Scenario Figma nodes `76:100`, `76:127` and `76:219`, Issue #196, Issue #24, runtime routes and the merged Scenario persistence contract were inspected.
- CI #1760 (`30162517241`) completed successfully on head `35cdfdf7c031541f737dd43f7fd807370ed22bab`: backend formatting, static analysis, unit/race, vulnerability, integration and the full frontend/browser matrix passed.
- Current branch head after bounded OpenAPI and task-memory reconciliation is `ca7c031c50f7407a1db8b2243b1124449e61ef8d`; CI #1767 is pending on that head.

### Confirmed defect

The previous Scenario submit contract delegated `wordId`, rating and submitted-answer evidence to the client even though a step exposed only vocabulary strings and the approved UI has no owner for those fields. The prior integration fixture selected an unrelated first catalog word, proving persistence but not semantically linked durable evidence.

### Root cause

The backend/content slice established atomic review-event persistence before defining the Scenario-step-to-learning-item ownership boundary. The API therefore exposed internal review-target selection and evidence claims as client input.

### Implemented correction

- Migration `000015` stores an immutable review target definition (`term`, translation, part of speech) on all 18 seeded steps and verifies that each term belongs to its step vocabulary.
- Public Scenario payloads expose only `reviewTarget.term`; no seed-dependent or client-selectable word ID is published.
- Accepted submission resolves/creates the concrete catalog item, enrolls it for the user, applies the canonical scheduler, writes the schema-v2 Recall event, links Scenario evidence and advances the attempt in one transaction.
- Normalized whole-term presence produces `known`/correct/server judgement; absence produces `again`/incorrect/server judgement.
- A narrow trusted-assessment transaction entrypoint centralizes scheduler/event SQL and rejects passive, client-sourced, inconsistent or unbounded assessments.
- Strict JSON decoding rejects the historical client-authored `wordId`, rating, submitted answer, correctness and answer-revealed fields.
- `api/openapi-scenarios.json` now documents all seven authenticated Scenario routes and exact request ownership; `openapi_contract_test.go` parses and guards the document without adding dependencies.

### Validation evidence

- Integration proves catalog/detail target order, start/pause/resume/reload, fact/hypothesis rules, out-of-order rejection, old-payload rejection, objective correct and incorrect events, exact idempotent replay, mutated replay conflict, target enrollment, three-step completion and a new attempt after completion.
- Backend integration passed before and after the server-owned target redesign.
- Initial CI #1759 found only two `gofmt` differences in new tests; both were reproduced, corrected and recorded as a formatting failure rather than a behavior defect.
- CI #1760 subsequently passed all required groups on the corrected runtime head.
- The bounded OpenAPI source contract and its unit guard were added after #1760, so final-head CI is still required.

### Reusable failures recorded

- A transient undefined model alias was introduced and immediately removed before PR validation; `.agents/lessons/backend.md` now requires preserving canonical cross-package types and compiling the owning package after model-shape changes.
- A persisted FK to seed-dependent `words.id` was rejected during integration reconciliation because catalog truncation/reseed would invalidate the Scenario target. Immutable target definitions plus transactional lazy resolution are now the contract.
- The monolithic historical `api/openapi.yaml` cannot be safely patched line-wise through the contents-only connector. A bounded, independently parseable Scenario OpenAPI document avoids an unsafe full-file rewrite and is guarded in Go.

### Current branch head

`ca7c031c50f7407a1db8b2243b1124449e61ef8d` at this progress update. Resolve again before final validation because this memory write creates a new commit.

### Next action

Wait for the newest CI, fix any OpenAPI/source-contract failure, reconcile execution/project state and PR body, then run one final immutable-head CI. Keep PR #218 Draft until all checks pass and review threads are empty.
