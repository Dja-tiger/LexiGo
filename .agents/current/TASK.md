# Current Task

## Identity

- Issue: #196 — Scenario Lessons UI; bounded reconciliation with #24
- Branch: `feat/issue-196-scenario-lessons-ui`
- Base SHA: `d7dc76c9139beff75d331c2b904f743f381f243d`
- Head SHA: resolve from live branch ref
- PR: #221 — Draft

## Objective

Implement the production Scenario Lessons route island from approved Figma nodes `76:100`, `76:127` and `76:219` on top of the merged server-owned Scenario contract. The slice must support authenticated direct entry, start/resume/pause/reload, objective step submission, retry-safe drafts, fact/hypothesis evidence, completion, browser history and all required responsive/accessibility/visual/performance gates.

## Scope

- Add canonical `/scenarios/[slug]` routing and a dedicated authenticated client island.
- Consume only the seven authenticated Scenario API routes defined in `api/openapi-scenarios.json`.
- Implement entry, active, paused, accepted-feedback and completed presentation states.
- Preserve local response/fact/hypothesis drafts without storing auth tokens or server-owned judgement.
- Reuse the same submission id for retries of the same normalized response and create a new id when evidence changes.
- Pause active attempts before an explicit close/save-and-exit action.
- Keep task-completion feedback separate from the server-owned language signal and never expose self-rating controls.
- Preserve `return_to` for initial and mid-session authentication loss on focused Scenario routes.
- Add deterministic unit, route, UI, navigation, accessibility, visual-regression and bundle-budget coverage.
- Record execution evidence and reusable lessons in the Agent Harness.

## Non-goals

- No backend, migration, seed-content or OpenAPI changes.
- No client-selected learning item, word id, rating, correctness or scheduling logic.
- No inferred Progress recommendation contract or closure of all Issue #24 acceptance criteria.
- No redesign of Home, Lesson Composer, Dictionary, Progress, Profile or existing Active Lesson.
- No new dependency, Tailwind adoption or global design-token rewrite.
- No production deployment before squash merge and green final-head CI.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `.agents/lessons/**` only when a reusable root-cause lesson is proven
- `frontend/app/layout.tsx`
- `frontend/app/scenarios/[slug]/page.tsx`
- `frontend/app/scenario-lessons.css`
- `frontend/components/lexigo-bootstrapped-app.tsx`
- `frontend/components/lexigo-scenario-app.tsx`
- `frontend/components/route-primary-navigation.tsx`
- `frontend/components/legal-footer.tsx`
- `frontend/lib/auth-session.ts`
- `frontend/lib/auth-session.test.ts`
- `frontend/lib/navigation.ts`
- `frontend/lib/navigation.test.ts`
- `frontend/lib/scenarios.ts`
- `frontend/lib/scenarios.test.ts`
- `frontend/package.json`
- `frontend/bundle-budgets.json`
- `frontend/e2e/support/scenario-fixture.ts`
- `frontend/e2e/scenario-lessons.spec.ts`
- `frontend/e2e/accessibility-audit.spec.ts`
- `frontend/e2e/app-router-routes.spec.ts`
- `frontend/e2e/route-bundle-budget.spec.ts`
- `frontend/e2e/ui-ownership.spec.ts`
- `frontend/e2e/visual-regression.spec.ts`
- `frontend/e2e/visual-regression.spec.ts-snapshots/**`
- narrowly required existing source-contract tests that enumerate layout imports or E2E scripts

## Prohibited paths

- `backend/**`
- `api/**`
- `deploy/**`
- `.github/workflows/**`
- dependency lockfiles unless an existing deterministic command proves they must change without adding a dependency
- existing visual baselines unrelated to Scenario Lessons
- `frontend/components/lexigo-premium-app.tsx` unless a proven route-ownership defect cannot be fixed in the dedicated island boundary
- Figma source nodes or design-system variables

## Runtime owners

- Authentication/session refresh/CSRF: existing `LexigoBootstrappedApp`, `authorizedJSON` and auth-session runtime.
- Scenario catalog, attempt lifecycle, optimistic versioning, judgement, review event and scheduler: Go Scenario/Learning API.
- Canonical path and browser history: Next App Router plus `frontend/lib/navigation.ts`.
- Scenario presentation, draft UI and response timing metadata: dedicated `LexigoScenarioApp` route island.
- Global route chrome/footer suppression for focused work: existing route-aware chrome/footer components.
- Design tokens: `frontend/app/design-tokens.css`; Scenario CSS consumes tokens and owns only local milestone/border aliases.

## Documentation owners

- Live task scope and execution evidence: `.agents/current/**`.
- Durable product state: `.agents/PROJECT_STATE.md` only after merge or material roadmap change, in the required reconciliation step.
- Backend contract: `api/openapi-scenarios.json` remains unchanged and authoritative.
- Design source: Figma file `3xXmBWnf38jbvLjtziwber`, nodes `76:100`, `76:127`, `76:219`.

## Invariants

- The client submits only `submissionId`, `attemptVersion`, `response`, optional `facts`/`hypotheses` and optional timing/timezone metadata.
- The client never submits or derives `wordId`, `rating`, `correct`, `answerRevealed`, `judgementSource` or scheduler state.
- A failed or ambiguous network submission preserves the exact draft and idempotency key.
- A 409 conflict triggers server resynchronization without silently overwriting the user's unsent draft.
- Fact and hypothesis inputs remain separate and are required only when the server step requires them.
- No access/refresh token is written to localStorage or sessionStorage.
- Focused Scenario routes render exactly one runtime owner and no global product chrome/footer.
- Mobile selectors do not depend on hidden desktop controls; all touch targets remain at least 44 CSS pixels.
- Light/Dark, reduced motion and 200% zoom use the same semantic DOM and server contract.

## Acceptance criteria

- Valid authenticated direct links open the server-owned Scenario and invalid slugs fail safely.
- A user can start or resume an attempt, pause/save/close it, reload and continue from the server-owned position.
- Responses, facts and hypotheses survive reload in the same owned attempt and are cleared only after accepted submission or explicit discard of the draft.
- Retry after transport failure sends the same normalized payload and `submissionId`; edited evidence sends a new id.
- Accepted feedback states show server-confirmed production progress and objective target present/missing evidence separately.
- Completion is driven only by `attempt.status === "completed"` and supports a safe return to learning.
- Browser Back/Forward cannot abandon an active attempt without the documented pause/close flow.
- Approved Figma hierarchy, spacing, typography, milestone/retained/weak semantics and responsive column collapse are represented without Tailwind or duplicated global tokens.
- Keyboard operation, focus transitions, live regions, axe, reduced motion, 200% zoom, compact/desktop visual baselines and cold-route bundle budget pass.
- Final immutable head has full required CI, no unresolved review threads, squash merge and post-merge stage validation.

## Required checks

- Frontend lint, TypeScript, unit tests, production build and production dependency audit.
- Scenario unit/source-contract tests.
- Scenario E2E on desktop Chromium, Android Chromium and iOS WebKit where configured.
- Canonical route, direct entry, reload, Back/Forward and route ownership tests.
- Keyboard, focus, axe, reduced-motion and 200% zoom checks.
- Linux compact Light and desktop Dark visual regression baselines.
- Cold-browser JavaScript/request budget for `/scenarios/incident-update`.
- Existing backend unit/race/security/integration and all unchanged frontend regression groups through full CI.
- Final-head review-thread audit, squash merge and stage deploy/public smoke/public browser validation.

## Risks

- A dedicated route island can accidentally coexist with the legacy product graph or global route chrome.
- Optimistic-version conflicts can lose drafts if server resynchronization and local evidence are not separated.
- Recreating submission ids on every click can duplicate review events after ambiguous failures.
- Fixed Figma dimensions can create overflow at 200% zoom or compact WebKit widths.
- Adding a visual baseline without deterministic runtime/state can create flaky Linux diffs.
- Broad edits to the legacy premium app would enlarge regression and bundle risk.

## Rollback

Revert the atomic Scenario UI squash commit. The backend Scenario contract and existing learning runtime remain intact; canonical `/scenarios/[slug]` returns to its pre-slice absence without data migration or scheduler rollback.
