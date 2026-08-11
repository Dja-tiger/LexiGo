# Current Task

## Identity

- Issue: #73 — [Medium][Retention] Улучшить завершение урока и рекомендовать следующий шаг
- Branch: `feat/issue-73-lesson-result-retention`
- Base SHA: `e6b2d74891fb4e52f23152758812551361717857`
- Head SHA: resolve from live branch ref
- PR: #475 (Draft)

## Objective

Make Lesson Result a truthful retention surface: summarize only persisted review evidence, keep objective correctness separate from self-rating, show the authoritative next review timing, expose exactly one personalized next action, and measure completion-to-next-action plus return-to-next-session without collecting identity/content data.

## Scope

- Lesson Result snapshot/continuation policy and presentation.
- Active Lesson completion/continuation wiring.
- Authoritative `ProgressSummary.nextDueAt` propagation.
- Privacy-preserving retention analytics in the existing `performance` bounded context.
- API/OpenAPI + migration + unit/integration/browser/source tests required by the new retention event contract.

## Non-goals

- No speculative Figma redesign; preserve the canonical Lesson Result matrix from `frontend/docs/lesson-result-figma.md`, Figma nodes `217:5` through `217:14`.
- No change to scheduler ranking, review grading semantics or onboarding.
- No user/session/lesson/word IDs, free-form content, raw URL/query/referrer or authentication data in retention telemetry.
- No production deployment dispatch or physical-device-only acceptance.

## Allowed paths

- `frontend/lib/lesson-result*`
- `frontend/components/lesson-result-presentation*`
- `frontend/components/lexigo-active-lesson-app.tsx`
- new focused frontend retention telemetry helper/tests
- existing Lesson Result E2E/source tests
- `backend/internal/performance/*`
- `backend/internal/server/server.go` only for the focused anonymous retention endpoint registration
- next migration pair under `backend/internal/platform/migrate/migrations/*`
- `backend/integration/*` focused retention analytics tests
- `api/openapi.yaml`
- focused docs/Agent Harness evidence

## Prohibited paths

- unrelated route islands, auth, scheduler ranking, dictionary/phrases/profile code
- canonical Figma layout changes without approved design evidence
- production workflow changes

## Runtime owners

- `frontend/lib/lesson-result.ts`: persisted completion snapshot and continuation policy.
- `frontend/components/lesson-result-presentation.tsx`: Lesson Result evidence and primary CTA presentation.
- `frontend/components/lexigo-active-lesson-app.tsx`: completion boundary and action execution.
- `backend/internal/performance`: anonymous bounded operational/product telemetry owner.

## Documentation owners

- `.agents/current/*` during execution.
- `.agents/PROJECT_STATE.md` only after delivery in a separate reconciliation PR.

## Invariants

- Result evidence derives from actually saved review ratings; unsynced completion is not persisted as authoritative.
- Objective correctness and confidence/self-rating remain separate concepts.
- Daily goal/streak claims come only from authoritative progress responses.
- Exactly one primary CTA is rendered.
- Empty/partial/skipped states remain explicit and honest.
- Retention telemetry is bounded enums/timing buckets only and cannot identify learner/content.
- Existing product-journey navigation semantics remain unchanged.

## Acceptance criteria

- Persisted Lesson Result exposes objective outcomes and self-rating separately.
- Result tells the learner what to do next and, when available, the authoritative next review time.
- Primary CTA is selected from weak/due review, continuing the daily goal, starting the next available material, or returning later/home based on authoritative state.
- Daily goal/streak is never inferred from client-only counters.
- Empty/partial/skipped completion does not overstate learning success.
- Anonymous analytics can measure `completion-to-next-action` and `return-to-next-session` using fixed event/action values and delay buckets without identifiers.
- Existing route/history/back-forward and Lesson Result persistence contracts remain green.

## Required checks

- backend format/vet/unit/race/integration/security and migration round-trip
- frontend lint/typecheck/unit/build/dependency audit
- Lesson Result source/unit/E2E in Chromium/WebKit
- blocking UI shards, accessibility, visual and performance gates selected by CI
- immutable-head CI before Ready/merge
- exact-SHA main CI and exact-image Stage/public validation after merge

## Risks

- analytics accidentally becoming identifying/correlatable;
- mixing scheduler due timing with client clock/inferred timing;
- changing CTA priority in a way that contradicts the actual queue API;
- breaking persisted v1 Lesson Result snapshots during schema evolution.

## Rollback

Squash revert the atomic Issue #73 product commit. Migration down must remove only the new anonymous retention analytics objects; existing product navigation/performance data remains untouched.
