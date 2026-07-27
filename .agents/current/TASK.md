# Current Task

## Identity

- Issue: #247
- Parent issue: #115
- Branch: `perf/issue-247-progress-island-budget`
- Base SHA: `a0b6ce2bfa359ec232ad3c8df79f0bdfa624db1c`
- Head SHA: resolve from live branch ref
- PR: #248

## Objective

Close the Progress portion of the route-level client-islands roadmap with explicit ownership, single-bootstrap navigation evidence and a route-specific cold-browser JavaScript budget derived from exact CI evidence.

## Scope

- Preserve the existing `LexigoProgressApp` UI and API behavior.
- Enforce that only `LexigoBootstrappedApp` loads the Progress client entry.
- Prove repeated Home/Learn/Dictionary ↔ Progress navigation reuses the bootstrapped session without another network refresh.
- Emit deterministic per-route bundle measurements while preserving the JSON report.
- Lock `/progress` to the measured 207,502-byte baseline, 240,000-byte JavaScript ceiling and 21-request ceiling.
- Document Progress island ownership and before/after budget evidence.
- Maintain repository state and reusable fixture lessons.

## Non-goals

- No Progress redesign or copy change.
- No Home, Learn, Phrases or Lesson extraction.
- No relocation or duplication of session restoration, refresh coordination, `ReviewOutboxRuntime`, account controls or PWA lifecycle.
- No backend/API changes.
- No increase to any existing route budget.

## Allowed paths

- `frontend/components/progress-route-island-source.test.ts`
- `frontend/e2e/progress-route-island.spec.ts`
- `frontend/e2e/performance-global-teardown.ts`
- `frontend/e2e/system-states.spec.ts` only for the confirmed request-scoping fixture race found by CI #2068
- `frontend/lib/bundle-budgets.test.ts`
- `frontend/bundle-budgets.json`
- `docs/frontend-bundle-budgets.md`
- `.agents/PROJECT_STATE.md`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `.agents/AGENTS.md`
- `.agents/AGENTS.issue-247-request-scoped-fixtures.md`

## Prohibited paths

- `backend/**`
- Progress presentation/runtime components
- `frontend/components/lexigo-premium-app.tsx`
- `frontend/components/lexigo-progress-app.tsx`
- session/auth/outbox/PWA runtime owners
- `frontend/e2e/route-bundle-budget.spec.ts` on the final head; the temporary probe was removed byte-for-byte
- visual baselines and approved Figma UI
- deployment workflows or scripts

## Runtime owners

- `frontend/components/lexigo-bootstrapped-app.tsx` remains the sole session bootstrap and route-entry loader.
- `frontend/components/review-outbox-runtime.tsx` remains the sole review outbox/connectivity owner.
- `frontend/components/lexigo-progress-app.tsx` owns only Progress API reads/actions and evidence presentation.
- `frontend/components/routed-lexigo-app.tsx` remains the App Router shell and route-boundary focus/scroll owner.
- `frontend/bundle-budgets.json` owns release ceilings and evidence.

## Documentation owners

- `docs/frontend-bundle-budgets.md`
- `.agents/PROJECT_STATE.md`
- `.agents/current/**`
- `.agents/AGENTS.issue-247-request-scoped-fixtures.md`

## Invariants

- A direct `/progress` entry restores the session once through the persistent bootstrap layer.
- Repeated in-app route transitions do not issue another `/api/v1/auth/refresh` network request after the initial bootstrap.
- Progress never imports the monolithic `LexigoPremiumApp` and never owns session restoration, the outbox or PWA lifecycle.
- The route budget is based on exact CI report evidence, not an estimate.
- The `/progress` baseline and both ceilings remain below the original 238,257-byte / 275,000-byte / 24-request monolithic contract.
- No temporary measurement probe exists in the final diff or final CI head.
- Existing browser, PWA, accessibility, visual, security and product behavior remain unchanged.

## Acceptance criteria

- Source contract names the Progress dynamic entry and its exclusive bootstrap consumer.
- Browser contract counts refresh requests and proves one bootstrap across repeated route-island transitions.
- Performance teardown emits deterministic route summaries.
- `/progress` uses baseline 207,502 bytes, max 240,000 bytes and max 21 initial requests with exact baseline evidence.
- Budget tests require Progress to remain strictly below the monolithic graph.
- Request-scoped failure fixture guidance is mandatory and the corrected iOS WebKit scenario passes.
- Final diff contains only permanent allowed paths.

## Required checks

- frontend lint, typecheck, unit and production build
- backend unit/race/security and integration gates
- full Chromium/WebKit/Android/iOS/PWA matrix
- accessibility, Content Security, controlled service worker and Linux visual regression
- route bundle/performance gate with permanent budget
- complete repository CI on the final immutable head
- no unresolved comments, reviews or threads
- expected-head squash merge
- exact-SHA post-merge stage/public validation

## Risks

- Measurement variance must remain inside bounded headroom; unexplained regression cannot be solved by raising the ceiling.
- Route-boundary session cache behavior must remain consistent across all browser engines.
- Any reintroduction of the measurement probe invalidates merge readiness.

## Rollback

Revert the test, budget and documentation commits. Runtime behavior is unchanged; the previous shared `/progress` ceiling is restored.
