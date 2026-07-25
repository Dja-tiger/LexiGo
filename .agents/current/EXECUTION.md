# Current Task Execution

## Task

- Issue: #196 prerequisite contract correction for #24
- Branch: `fix/issue-196-scenario-review-contract`
- Base SHA: `3aa4b7e16a852ddd635ec0bcc2b2b56323e60f2b`
- Head SHA: resolve from live branch ref
- PR: not created yet

## Skills used

### GitHub repository operations

Purpose:

Validate the post-harness repository, isolate the next atomic slice and protect `main`.

Instruction source:

`AGENTS.md`, `.agents/AGENTS*.md`, `.agents/SKILLS.md`, GitHub repository skill.

Version or verification date:

2026-07-25.

Inputs:

PR #217, CI #1756, Issue #196, Issue #24, current `main`, open PR search and Scenario backend sources.

Actions performed:

- verified CI #1756 success on the final PR #217 head;
- marked PR #217 Ready and squash-merged with expected head SHA;
- verified merge commit `3aa4b7e16a852ddd635ec0bcc2b2b56323e60f2b`;
- verified no open PRs;
- created `fix/issue-196-scenario-review-contract` from exact `main`;
- read branch files back and confirmed `main` remained unchanged after writes.

Artifacts produced:

Isolated branch, pre-flight record and current task memory.

Result:

The Agent Harness is in `main`; the next work is isolated from product history.

Failures:

GitHub Actions had an earlier confirmed infrastructure incident; the canonical recovery run #1756 passed. No repository failure occurred in this task.

Reusable lesson:

A recovery run must use the same immutable head, and infrastructure incidents must not be misclassified as product or billing failures without evidence.

### Figma inspection

Purpose:

Confirm the downstream Scenario UI contract and avoid inventing controls that do not exist in the approved design.

Instruction source:

Figma design-to-code skill and Issue #196.

Version or verification date:

2026-07-25.

Inputs:

LexiGo Design System nodes `76:100`, `76:127`, `76:219`.

Actions performed:

Inspected mobile Light, mobile Dark and desktop Scenario active states, including role, audience, workplace goal, constraints, response editor, feedback criteria, progress and save/pause affordances.

Result:

The approved UI has no arbitrary word picker, self-rating control or client correctness control. The existing submit contract cannot be exposed without a backend correction.

Limitations:

The UI implementation and Linux visual baselines are deliberately deferred to the next PR.

Reusable lesson:

A backend contract is not frontend-ready when a required request field has no approved UI owner.

### Backend contract audit

Purpose:

Map every Scenario producer and consumer before implementing the UI.

Instruction source:

`.agents/AGENTS.base.md`, `.agents/AGENTS.issue-19-completion.md`, backend validation skill.

Version or verification date:

2026-07-25.

Inputs:

- `backend/internal/scenarios/model.go`
- `backend/internal/scenarios/http.go`
- `backend/internal/scenarios/repository.go`
- migrations `000011` and `000012`
- `backend/integration/scenario_lessons_test.go`
- canonical learning review and answer judgement code
- words catalog API.

Actions performed:

- traced list/detail/start/pause/resume/submit transitions;
- verified optimistic versioning, idempotency and atomic review-event storage;
- verified `ScenarioStep` has only vocabulary strings;
- verified submit requires client-supplied `wordId`, rating and submitted answer;
- verified the integration fixture selects the first unrelated word from `/words`;
- verified canonical Recall judgement is exact/normalized and must remain server-owned.

Result:

Confirmed a cross-layer blocker: review target selection and evidence ownership are missing between Scenario content and the canonical scheduler.

Fallback:

Implement one forward migration and a server-owned target/derivation contract before the React route.

Reusable lesson:

For every required mutation field, identify a legitimate UI owner or move ownership to the server before declaring an API ready for a product slice.

## Planned validation

1. Migration applies on clean and upgraded databases.
2. Scenario unit tests cover normalized whole-token target matching and rejection.
3. Integration verifies linked target, existing/new user enrollment, objective correct/incorrect review events, pause/resume, idempotency and completion.
4. OpenAPI source contract matches runtime.
5. Backend formatting, static analysis, unit/race, integration and vulnerability gates pass.
6. Full required PR CI passes on the final developer-authored head.
