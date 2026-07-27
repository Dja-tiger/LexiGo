# Current Task

## Identity

- Issue: #250 — `perf(home): extract Home route island and lock bundle budget`
- Branch: `perf/issue-250-home-island`
- Base SHA: `2d8347d61ffeee173f5eab02b9c2bea29f1fe7b4`
- Head SHA: resolve from live branch ref
- PR: Draft PR #251

## Objective

Extract canonical `/` into a dedicated `LexigoHomeApp` client island, preserve one persistent session/outbox/PWA runtime, keep active-lesson priority and immediate start/resume behavior, then measure and lock a route-specific Home bundle budget below the original monolithic graph.

## Scope

- Add a dedicated dynamic Home entry under `LexigoBootstrappedApp`.
- Keep Home API reads and next-best-action presentation inside the Home island.
- Add Home-aware App Router graph handoff for Home ↔ product/dictionary navigation.
- Add an explicit one-time `resume=1` intent so a Home-created or resumed active lesson opens immediately without a second user click.
- Preserve Figma production nodes `194:249` (desktop) and `196:223` (mobile).
- Add source, unit and browser contracts for ownership, canonical history and single session bootstrap.
- Use the first Draft CI performance artifact to determine the exact Home baseline before tightening `frontend/bundle-budgets.json`.

## Non-goals

- Redesign Home, Learn or Active Lesson.
- Change backend lesson composition, scheduler, review persistence or lesson position ownership.
- Move session restoration, review outbox, Service Worker or appearance bootstrap into a route island.
- Tighten the Home release ceiling before an exact controlled measurement exists.
- Extract Learn, Phrases or Active Lesson from `LexigoPremiumApp` in this slice.

## Allowed paths

- `frontend/components/lexigo-home-app.tsx`
- `frontend/components/lexigo-bootstrapped-app.tsx`
- `frontend/components/route-primary-navigation.tsx`
- `frontend/components/routed-lexigo-app.tsx`
- `frontend/components/async-state.tsx`
- `frontend/components/production-app-entry.test.ts`
- `frontend/components/home-route-island-source.test.ts`
- `frontend/components/word-detail-source.test.ts`
- `frontend/lib/lesson-resume-intent.ts`
- `frontend/lib/lesson-resume-intent.test.ts`
- `frontend/e2e/home-route-island.spec.ts`
- `frontend/bundle-budgets.json` after exact measurement only
- `frontend/lib/bundle-budgets.test.ts` after exact measurement only
- `docs/frontend-bundle-budgets.md` after exact measurement only
- `README.md`
- `docs/architecture.md`
- `frontend/docs/adaptive-knowledge-coach.md`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- Backend API, migrations and scheduler implementation.
- Deployment workflows, production secrets and environment configuration.
- Unrelated route islands, visual baselines or Figma files.
- Direct writes to `main`.

## Runtime owners

- `LexigoBootstrappedApp`: sole session restoration, token adoption and route-entry owner.
- `ReviewOutboxRuntime`: sole connectivity and review-outbox owner.
- Root layout: sole Service Worker, Web Vitals and global runtime owner.
- `LexigoHomeApp`: Home-only progress/active-lesson reads, next-best-action presentation and lesson-create intent.
- `LexigoPremiumApp`: Learn, Phrases and Active Lesson compatibility graph; backend remains authoritative for lesson lifecycle.

## Documentation owners

- `README.md` and `docs/architecture.md`: production application-root and route-island boundaries.
- `frontend/docs/adaptive-knowledge-coach.md`: Figma nodes and Home behavior ownership.
- `docs/frontend-bundle-budgets.md`: exact measured Home baseline and permanent ceiling after CI evidence.
- `.agents/current/*`: live execution state for Issue #250.

## Invariants

- Exactly one `/api/v1/auth/refresh` network bootstrap across direct Home entry and Home ↔ other-route navigation.
- Active lesson remains higher priority than due review, new study and manual configuration.
- A new Home-created lesson uses the existing authenticated lesson API and opens `/lesson/active` immediately.
- `resume=1` is transient, consumed once and removed without losing unrelated query/hash/history state.
- Home island does not import `LexigoPremiumApp`, session restoration, outbox or Service Worker owners.
- Canonical pathname/history settle before another client graph mounts.
- Home Light/Dark, responsive, reduced-motion, keyboard and Figma geometry contracts do not regress.

## Acceptance criteria

- Direct `/` renders `data-route-client-island="home"` without loading the monolithic Home graph.
- Home ↔ Learn/Dictionary/Progress and Back/Forward retain canonical URLs and one session bootstrap.
- Home start/resume reaches visible Active Lesson without the intermediate `Продолжить урок` gate.
- Unit/source/browser checks pass.
- First Draft CI produces an exact `/` JavaScript/request measurement.
- Final Home baseline and ceilings are strictly below the original 238,257-byte monolithic graph and pass immutable-head CI.
- Expected-head squash merge and exact-SHA stage/public validation complete before Issue #250 is closed.

## Required checks

- Agent Harness and source contracts.
- Frontend lint, typecheck, unit tests and production build.
- Browser route, Home, PWA/session, accessibility, visual and performance matrices selected by CI.
- Controlled route-bundle report for `/`.
- Final immutable-head CI and post-merge exact-SHA stage/public smoke/browser validation.

## Risks

- A route graph may mount before pathname/history canonicalization and duplicate state ownership.
- The transient resume intent may fire more than once or be lost during rerender.
- Home may create a new lesson when active-lesson detection failed.
- Shared shell changes may regress Dictionary/Progress/PWA navigation.
- Premature budget tightening may encode an unverified number.

## Rollback

Revert the Issue #250 squash merge. The previous `LexigoPremiumApp` Home renderer, original `/` bundle budget and existing bootstrap route selection remain the rollback reference at base SHA `2d8347d61ffeee173f5eab02b9c2bea29f1fe7b4`.
