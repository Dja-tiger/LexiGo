# Current Task

## Identity

- Issue: #254 — Extract Learn route island and lock bundle budget.
- Parent Issue: #115.
- Branch: `agent/issue-254-learn-route-island`.
- Base SHA: `eeab812c6785ae9a92aee948ecb63729ab850932`.
- Head SHA: resolve from live branch ref.
- PR: Draft PR #255.

## Objective

Extract the canonical `/learn` Lesson Composer from `LexigoPremiumApp` into an independent client entry while preserving the existing UI, API payloads, session ownership, history semantics and Active Lesson handoff. Measure the exact cold-route transfer and enforce a route-specific JavaScript/request budget below the original monolithic release boundary.

## Scope

- add `LexigoLearnApp` as a dynamic entry owned by `LexigoBootstrappedApp`;
- isolate Learn-owned catalog metadata, progress summary, active-lesson summary, preview, create, resume and discard flows;
- preserve source/topic URL state, direct entry, reload, Back/Forward, scroll, focus and route announcements;
- hand off create/resume to the existing `/lesson/active` product graph with canonical history state;
- retain one session bootstrap, refresh coordinator, review outbox and PWA lifecycle owner;
- add source contracts, focused unit/E2E coverage, exact measurement and permanent bundle budgets;
- update architecture, PROJECT_STATE after completion, and current execution evidence.

## Non-goals

- no visual redesign, copy rewrite or CSS cleanup;
- no backend, database, OpenAPI or lesson algorithm change;
- no Phrases or Active Lesson island extraction;
- no legacy application removal under #70;
- no production deployment outside the standard post-merge process.

## Allowed paths

- `frontend/components/lexigo-bootstrapped-app.tsx`;
- `frontend/components/lexigo-learn-app.tsx` and focused Learn helpers/source-contract tests;
- narrowly required shared frontend libraries for typed request/history handoff;
- `frontend/components/lexigo-premium-app.tsx` only to remove Learn ownership and preserve compatibility transitions;
- focused `frontend/e2e/**`, bundle/performance tests and approved test fixtures;
- `README.md`, `docs/architecture.md` and `.agents/**` task/state evidence.

## Prohibited paths

- `backend/**`, `api/openapi.yaml`, database migrations and deploy runtime configuration;
- unrelated UI routes, visual baselines or design tokens unless a verified regression requires a separate decision;
- workflow weakening, skipped required browsers, timeout inflation or blind snapshot updates;
- secrets, generated artifacts and temporary workflows in the final diff.

## Runtime owners

- `LexigoBootstrappedApp`: sole session restoration, refresh coordination and route-entry selection owner.
- `ReviewOutboxRuntime`: sole connectivity/review outbox owner.
- `RoutedLexigoApp` and root layout: persistent navigation, PWA and Service Worker lifecycle owners.
- `LexigoLearnApp`: only Learn route data/controller/presentation owner.
- `LexigoPremiumApp`: compatibility owner for Phrases and Active Lesson after this slice.
- Backend lesson endpoints remain authoritative for preview, active session, create, optimistic discard and current position.

## Documentation owners

- Issue #254 and Draft PR: task-specific acceptance and evidence.
- `.agents/current/**`: live task scope, progress and reproducible execution.
- `docs/architecture.md` and README: durable route-entry ownership.
- `.agents/PROJECT_STATE.md`: final verified merge/stage/budget outcome only.

## Invariants

- no route island imports `LexigoPremiumApp`;
- session bootstrap and `/api/v1/auth/refresh` are not duplicated by direct entry or route transitions;
- auth/session tokens are not persisted in local/session storage;
- create/resume uses canonical `/lesson/active` URL and a history state matching the product route graph;
- preview and create preserve exact `source`, `studyMode`, `lessonSize` and optional `topic` semantics;
- discard retains optimistic `If-Match` version protection;
- current accessible names, progressive disclosure and responsive behavior remain unchanged;
- final CI runs on a developer-authored immutable head with no temporary workflow or measurement probe.

## Acceptance criteria

- independent `/learn` client entry with source-level ownership protection;
- guest/authenticated direct entry, reload, Home ↔ Learn and Back/Forward journeys pass;
- active lesson resume/discard and new lesson creation hand off correctly to `/lesson/active`;
- one network session bootstrap across repeated cross-island navigation;
- Chromium, WebKit, Android Chromium, iOS WebKit, keyboard, axe, reduced motion, PWA, CSP, service-worker and performance gates pass;
- exact initial JavaScript bytes and requests are recorded; permanent limits are tighter than the original monolithic release boundary;
- architecture and repository memory are reconciled after merge/stage validation.

## Required checks

- source contracts, formatting, lint, typecheck, unit and production build;
- focused App Router, Lesson Composer, history/focus, auth-refresh and lesson-flow E2E;
- full required browser matrix and container/security gates;
- controlled exact bundle/request measurement followed by removal of any probe;
- final immutable-head full CI, review-thread audit, expected-head squash merge and exact-SHA stage/public validation.

## Risks

- duplicated request/session helper logic could create a second refresh owner;
- stale `lexigoRouteGraph` state could hydrate the compatibility graph after create/resume;
- route-island remount could lose topic, scroll, focus or progressive disclosure state;
- moving Learn state could accidentally load Active Lesson presentation code into the Learn chunk;
- stale E2E mocks may omit active-detail or mutation requests after remount.

## Rollback

Revert the isolated Learn route-entry changes so `/learn` again falls through to `LexigoPremiumApp`; preserve backend data and stage image rollback through the existing immutable SHA deployment process.
