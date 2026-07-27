# Current Task

## Identity

- Issue: #257 — Extract Active Lesson route island and lock bundle budget.
- Parent Issue: #115.
- Branch: `agent/issue-257-active-lesson-route-island`.
- Base SHA: `0bc5203da2487e947b860ce67a69cf04121cc3c8`.
- Head SHA: `bafae974213e89ea35774360f013a2e5447d1313` (pre-flight; functional changes are not committed yet).
- PR: #258 (Draft).

## Objective

Extract canonical `/lesson/active` into an independent client entry while preserving the approved Active Lesson and Lesson Result UI, backend-owned session/review state, offline outbox, safe-exit history behavior and persistent bootstrap owners. Measure the exact cold route and lock a permanent JavaScript/request budget below the original monolithic boundary.

## Scope

- add `LexigoActiveLessonApp` as a dynamic entry selected by `LexigoBootstrappedApp`;
- isolate active-session load/resume, review, resynchronization, suggestion, completion, Lesson Result and safe-exit behavior;
- preserve study, recall, choice, queued/offline and completed presentation contracts;
- preserve one session bootstrap, refresh coordinator, review outbox, Service Worker and PWA lifecycle owner;
- add source ownership contracts and focused direct-entry/navigation/browser coverage;
- perform controlled exact cold-route measurement, remove the probe and enforce permanent budgets;
- update durable architecture and repository memory after verified merge/stage.

## Non-goals

- no visual redesign, copy rewrite or inferred Phrases design;
- no backend, database, scheduler, review API or outbox contract change;
- no Phrases island extraction or Issue #199 implementation;
- no legacy application/CSS cleanup under #70;
- no temporary workflow or measurement probe in the final diff.

## Allowed paths

- `frontend/components/lexigo-bootstrapped-app.tsx`;
- `frontend/components/lexigo-active-lesson-app.tsx` and focused source/unit tests;
- narrowly required shared lesson/result/navigation frontend libraries;
- focused `frontend/e2e/**`, fixtures and route bundle/performance contracts;
- `frontend/bundle-budgets.json`, bundle tests and budget documentation;
- `README.md`, `docs/architecture.md` and `.agents/**` task evidence.

## Prohibited paths

- `backend/**`, `api/openapi.yaml`, migrations and deploy runtime configuration;
- Phrases redesign or unapproved Figma interpretation;
- unrelated routes, CSS families or visual baselines without a verified regression;
- required-check weakening, timeout inflation, blind retries or blind snapshot updates;
- secrets and generated artifacts.

## Runtime owners

- `LexigoBootstrappedApp`: sole session restoration, refresh coordination and route-entry selection owner.
- `ReviewOutboxRuntime`: sole durable offline review/outbox owner.
- `RoutedLexigoApp`: persistent shell and safe-exit Browser Back owner.
- `LexigoActiveLessonApp`: only Active Lesson controller/presentation and Lesson Result owner.
- Backend lesson/review endpoints: authoritative active position, optimistic version, judgement and completion owners.
- Service Worker registration: sole PWA update lifecycle owner.

## Documentation owners

- Issue #257 and Draft PR: task-specific acceptance and evidence.
- `.agents/current/**`: live scope, progress and reproducible execution.
- README, `docs/architecture.md` and bundle-budget documentation: durable entry/budget ownership.
- `.agents/PROJECT_STATE.md`: verified final merge/stage outcome only.

## Invariants

- no route island imports `LexigoPremiumApp`;
- session bootstrap and `/api/v1/auth/refresh` are not duplicated;
- review POST preserves exact version/rating/timing/mode/reveal/answer/timezone semantics;
- offline/retry/reload retains one review identity and blocks duplicate advancement;
- completion snapshot, distinct-next and daily-goal celebration contracts remain unchanged;
- safe exit preserves exact URL and Next.js framework history metadata;
- auth/session tokens are never persisted in local/session storage;
- approved Active Lesson/Result accessible and visual contracts remain unchanged;
- final CI runs on an immutable developer-authored head with no measurement probe.

## Acceptance criteria

- `/lesson/active` loads an independent client entry without `LexigoPremiumApp`;
- direct entry, reload, Learn/Home handoff, Back/Forward and confirmed exit preserve canonical behavior;
- study/recall/choice and prompt/revealed/correct/incorrect/queued states remain production-equivalent;
- review, resynchronization, suggestion, completion and Lesson Result flows retain current contracts;
- one network session bootstrap across repeated cross-island navigation;
- Chromium, WebKit, Android, iOS, keyboard, axe, reduced motion, offline/outbox, CSP, Service Worker and Linux visual gates pass;
- exact cold JavaScript bytes and initial requests are recorded with permanent ceilings below the original monolithic transfer;
- final full CI, review audit, expected-head squash merge, exact-SHA stage/public validation and repository reconciliation complete.

## Required checks

- source contracts, formatting, lint, typecheck, unit and production build;
- focused Active Lesson, Lesson Result, offline/outbox, route history/focus and auth bootstrap E2E;
- full browser, accessibility, visual, CSP, PWA, performance and container matrix;
- controlled exact measurement followed by byte-for-byte probe removal;
- final immutable-head CI, unresolved-thread audit, expected-head merge and post-merge validation.

## Risks

- duplicating controller code may drift from the existing compatibility graph before Phrases extraction;
- stale route-graph history could remount `LexigoPremiumApp` after Learn/Home handoff;
- offline queued review ownership could be accidentally duplicated or lose idempotency;
- completion snapshot/reload could repeat submission or reopen the completed block;
- new entry imports could retain the monolithic compatibility graph and fail to reduce transfer.

## Rollback

Revert the Active Lesson route-entry selection so `/lesson/active` again falls through to `LexigoPremiumApp`; preserve backend data and use the existing immutable-image stage rollback process.
