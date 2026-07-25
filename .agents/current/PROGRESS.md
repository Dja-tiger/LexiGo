# Current Task Progress

## 2026-07-25 16:02 Europe/Berlin

### Verified

- `main` SHA is `3aa4b7e16a852ddd635ec0bcc2b2b56323e60f2b` after squash merge of PR #217.
- PR #217 passed full CI #1756 on immutable head `d9bfc899abaecb94aa32d0d3b30db9231f13da77` and was merged with no unresolved review threads.
- No open PRs were found after the merge.
- Issue #196 is the next product slice; exact Figma nodes `76:100`, `76:127` and `76:219` and the merged Scenario API were inspected.
- Branch `fix/issue-196-scenario-review-contract` was created from the verified `main`.

### Finding

The Scenario frontend cannot safely use the merged submit contract. `ScenarioStep` exposes vocabulary strings but no linked learning item, while submit requires client-supplied `review.wordId`, rating and submitted answer. The integration test proves persistence with an unrelated first catalog word, not with the scenario step vocabulary.

### Root cause

The backend/content slice established atomic review-event persistence before defining the downstream frontend-to-learning-item mapping. The API therefore delegates review target selection and evidence claims to the client even though the product contract requires ordinary objective durable evidence.

### Decision

Implement a prerequisite server-owned Scenario review-target contract in a separate atomic PR before the Figma UI. The server will own the linked learning item and derive canonical Recall review input from the persisted scenario response.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md` pending
- `.agents/PROJECT_STATE.md` pending

### Checks passed

- live repository, PR, Issue and branch pre-flight;
- exact backend model, repository, HTTP and integration contract inspection;
- exact Scenario Figma inspection for the downstream UI;
- explicit allowed/prohibited path record;
- branch write read-back and `main` immutability check.

### Checks failed

None yet. No production code has been changed.

### Current branch head

Resolve from the live branch ref; the first task-memory commit is `02f9bbbd3c6583f97c0e135204816b2020e68dde`.

### Next action

Update execution/state memory, implement the forward migration and typed server-owned review target, then run targeted backend and integration validation before opening a Draft PR.
