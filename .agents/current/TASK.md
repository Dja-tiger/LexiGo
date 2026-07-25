# Current Task

## Identity

- Issue: #24 — Final Scenario product reconciliation
- Branch: `feat/issue-24-scenario-progress-recommendation`
- Base SHA: `591322c4a55b362402eab0b4936cd4e4f0347c3a`
- Head SHA: resolve from live branch ref
- PR: not created yet

## Objective

Expose completed and in-progress Scenario activity through the authenticated `/api/v1/progress` contract and provide one deterministic server-owned Scenario recommendation that the existing Progress next-action surface can consume without client-side ranking, judgement or scheduler logic.

## Scope

- Add typed Scenario progress evidence and a reason-coded next Scenario action to the learning progress response.
- Derive the recommendation from authoritative `scenarios` and `scenario_attempts` state.
- Prioritize an open attempt, then a never-completed active Scenario, then the least recently completed active Scenario.
- Extend the bounded Scenario OpenAPI contract and source-contract coverage.
- Verify the contract before, during and after Scenario completion in backend integration coverage.
- Validate and present the server response in the existing Figma-backed Progress next-action block.
- Add a focused completion CTA from Scenario Lessons to `/progress`.
- Cover unit, integration, browser, accessibility, visual and bundle regressions required by the repository harness.

## Non-goals

- Full Scenario catalog or discovery page.
- Closing Issue #24 before the remaining catalog/discovery acceptance surface is complete.
- New scheduling algorithm, review writer or objective judgement path.
- Client-derived Scenario ranking, correctness, rating, readiness or due state.
- Database migration or redesign of the Progress route.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `api/openapi-scenarios.json`
- `backend/internal/learning/**`
- `backend/internal/scenarios/openapi_contract_test.go`
- `backend/integration/scenario_lessons_test.go`
- `frontend/lib/progress.ts`
- `frontend/lib/account-resources.ts`
- `frontend/lib/progress-evidence.test.ts`
- `frontend/components/progress-evidence-dashboard.tsx`
- `frontend/components/lexigo-progress-app.tsx`
- `frontend/components/lexigo-scenario-app.tsx`
- focused Scenario/Progress E2E and CSS/visual files only when required by the final render

## Prohibited paths

- Database migrations
- Learning scheduler and review-assessment semantics except read-only progress composition
- Authentication, account and service-worker ownership
- Unrelated routes, design tokens or broad snapshots
- CI gate weakening, timeout inflation or skipped required checks

## Runtime owners

- `backend/internal/learning`: `/progress` composition and Scenario recommendation ownership
- `backend/internal/scenarios`: durable attempt lifecycle and server-owned review evidence
- `frontend/components/lexigo-progress-app.tsx`: Progress route orchestration and navigation
- `frontend/components/progress-evidence-dashboard.tsx`: presentation of server-owned next action
- `frontend/components/lexigo-scenario-app.tsx`: completion navigation only

## Documentation owners

- `api/openapi-scenarios.json`: bounded machine-readable Scenario and Scenario-progress contract
- `.agents/current/**`: active slice memory; reset after merge
- `.agents/PROJECT_STATE.md`: update only in post-merge repository-memory reconciliation when required by the harness

## Invariants

- `main` remains unchanged until squash merge.
- Every write targets the explicit feature branch and is read back.
- Recommendation selection is fully server-owned and deterministic.
- Scenario completion continues to write ordinary schema-v2 Recall review events through the existing learning transaction writer.
- No client-selected word IDs, ratings, correctness, judgement or scheduler state.
- Existing due Recall behavior remains higher priority in the current Progress next-action surface.
- Rolling frontend fixtures tolerate an absent Scenario block, while the new server always emits it.

## Acceptance criteria

- `/api/v1/progress` returns Scenario completed counts and at most one typed recommendation with stable `reason` and `action` enums.
- An active or paused attempt yields `resume_in_progress` and `resume`.
- A never-completed active Scenario yields `first_uncompleted` and `start`.
- After all active Scenario types have completion history, the least recently completed Scenario yields `least_recently_completed` and `start`.
- Completion is counted for the current local week using the same timezone boundary as weekly progress.
- The Progress validator rejects malformed Scenario evidence and accepts the server contract.
- With no due Recall items, the Figma-backed next-action block opens the exact recommended Scenario route; due Recall behavior is unchanged when due items exist.
- The completed Scenario state links directly to `/progress` without bypassing durable server state.
- Required CI is green on the final immutable head, review threads are resolved, squash merge succeeds and exact-merge stage validation passes.

## Required checks

- Backend format, unit, race, integration and security gates
- Bounded OpenAPI source-contract test
- Frontend lint, typecheck and unit tests
- Focused Scenario/Progress browser tests in desktop Chromium and iOS WebKit
- Keyboard, axe, reduced-motion, 320 px/200% reflow and visual regression where the rendered contract changes
- Bundle/request ceilings for affected cold routes
- Full repository CI on the final developer-authored head
- Post-merge deploy, public smoke and public browser matrix on the exact squash SHA

## Risks

- A recommendation query that accidentally duplicates scheduler semantics or allows nondeterministic ties.
- Timezone boundary disagreement between Scenario completion counts and weekly review evidence.
- Rolling deploy rejection if the frontend makes the new block unconditionally required.
- Progress visual overflow on compact view when Scenario titles are long.
- An open attempt being hidden by a never-completed recommendation.

## Rollback

Revert the single squash merge. The change is additive and requires no migration; old clients ignore the Scenario block, and removing the frontend consumer restores the previous Progress next-action behavior.