# Current Task

## Identity

- Issue: #247
- Parent issue: #115
- Branch: `perf/issue-247-progress-island-budget`
- Base SHA: `a0b6ce2bfa359ec232ad3c8df79f0bdfa624db1c`
- Head SHA: resolve from live branch ref
- PR: #248

## Objective

Close the Progress portion of the route-level client-islands roadmap with explicit ownership, single-bootstrap navigation evidence and a route-specific cold-browser JavaScript budget derived from successful immutable-head CI.

## Scope

- Preserve the existing `LexigoProgressApp` UI and API behavior.
- Strengthen source contracts proving that only `LexigoBootstrappedApp` loads the Progress client entry.
- Prove repeated Home/Learn/Dictionary ↔ Progress navigation reuses the bootstrapped session without an additional network refresh.
- Emit deterministic per-route bundle measurements in CI logs while preserving the JSON report.
- Use one branch-local measurement probe only while `/progress` still carries the shared monolithic baseline; remove it before the final developer-authored head.
- After exact measurement evidence is available, lock `/progress` baseline, request ceiling and JavaScript ceiling to that immutable head.
- Document Progress island ownership and before/after budget evidence.
- Maintain current repository task/progress/execution memory.

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
- `frontend/e2e/route-bundle-budget.spec.ts` only for the removable exact-measurement probe and final stable budget assertions
- `frontend/e2e/system-states.spec.ts` only for the confirmed initial-load/search-request fixture race found by CI #2068
- `frontend/lib/bundle-budgets.test.ts`
- `frontend/bundle-budgets.json`
- `docs/frontend-bundle-budgets.md`
- `.agents/PROJECT_STATE.md`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `.agents/SKILLS.md` only if a stable reusable procedure must be promoted
- `.agents/AGENTS*.md` only if a new confirmed failure category is discovered

## Prohibited paths

- `backend/**`
- Progress presentation/runtime components unless a test proves an implementation defect
- `frontend/components/lexigo-premium-app.tsx`
- `frontend/components/lexigo-progress-app.tsx`
- session/auth/outbox/PWA runtime owners
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

## Invariants

- A direct `/progress` entry restores the session once through the persistent bootstrap layer.
- Repeated in-app route transitions do not issue another `/api/v1/auth/refresh` network request after the initial bootstrap/login state is adopted.
- Progress never imports the monolithic `LexigoPremiumApp` and never owns session restoration.
- The route budget is based on exact immutable-head CI measurement, not an estimate.
- The `/progress` baseline and ceilings must be below the original 238,257-byte / 275,000-byte monolithic values.
- The measurement probe must not exist in the final diff or final CI head.
- Existing browser, PWA, accessibility, visual, security and product behavior remain unchanged.

## Acceptance criteria

- Issue #247 acceptance criteria are implemented.
- Source contract names the Progress dynamic entry and its exclusive bootstrap consumer.
- Browser contract records network refresh attempts and proves no repeated bootstrap across route-island transitions.
- Performance teardown logs deterministic JSON measurement lines for every canonical route.
- `/progress` receives exact baseline evidence from successful immutable-head measurement execution.
- Budget configuration tests require Progress to remain below the monolithic graph.
- Final diff contains only allowed paths and no temporary probe.

## Required checks

- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`
- full Chromium/WebKit/mobile/PWA browser matrix
- route bundle performance gate and exact measurement artifact/log
- complete repository CI on the final immutable head
- no unresolved comments, reviews or threads
- expected-head squash merge
- exact-SHA post-merge stage/public validation

## Risks

- The existing session cache may still cause a hidden refresh on one route boundary or browser engine.
- Measurement variance may require bounded ceiling headroom without weakening the monolithic reduction invariant.
- Logging the full asset inventory could create excessive CI output; only one compact route summary line is allowed.
- A measurement probe accidentally retained on final head would invalidate merge readiness.

## Rollback

Revert the test, budget and documentation commit. Runtime behavior is unchanged; the previous shared monolithic `/progress` ceiling is restored.
