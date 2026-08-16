# Current Task

## Identity

- Issue: #201
- Branch: `feat/issue-201-first-use-runtime`
- Base SHA: `c29e4aa4ef4f299be36a3fd82800bb05cc723581`
- Head SHA: resolve from live branch ref
- PR: #558 (Draft until functional, accessibility, visual and immutable-head gates complete)

## Objective

Implement the approved First Use production flow against the already-delivered server-side onboarding contract: truthful Guest Home, authenticated onboarding/diagnostic, reveal-after-mark semantics, skip/complete, reload resume, loading/error/retry, and safe transition back into Home/Learn.

## Scope

- Guest Home value proposition and CTA without fake progress or inaccessible actions.
- Dedicated authenticated `/onboarding` route owner.
- Server-backed onboarding state: `not_started`, `in_progress`, `completed`, `skipped`.
- Diagnostic self-mark `known / unsure / new` before reveal.
- Reveal only after successful mark request.
- Resume `in_progress` from server status after reload/direct entry.
- Skip and completion transitions.
- Loading/error/retry/recovery states.
- Mobile/desktop and Light/Dark presentation matching the reviewed OpenPencil First Use matrix.
- Keyboard, screen-reader, browser history and visual regression coverage.

## Non-goals

- Do not change backend #18 semantics, migrations or API schema.
- Do not change OpenPencil/Figma design sources in this runtime slice.
- Do not refactor unrelated route islands or compatibility cleanup.
- Do not modify deployment topology or security headers.
- Do not perform unrelated CSS cleanup.

## Allowed paths

- `.agents/current/**`
- `frontend/components/lexigo-bootstrapped-app.tsx`
- `frontend/components/lexigo-guest-home-app.tsx`
- `frontend/components/lexigo-onboarding-app.tsx`
- `frontend/lib/**` only for narrowly scoped First Use route/API validators/navigation/auth-return helpers when necessary
- `frontend/app/**` only the existing CSS/root import owner actually required by the implementation
- `frontend/e2e/**` First Use/browser/accessibility/visual coverage and reviewed Linux evidence
- `frontend/components/**/*test.ts*` narrowly scoped source/unit contracts
- `frontend/package.json` only to route First Use tests into existing UI/axe CI commands; dependency versions are out of scope
- `frontend/playwright.visual.config.ts` only to register the First Use visual owner in the existing visual gate
- `frontend/docs/adaptive-knowledge-coach.md` only if route ownership documentation must be synchronized

## Prohibited paths

- `backend/**`
- `api/**`
- `design/**`
- `deploy/**`
- production deploy workflows
- `frontend/components/lexigo-home-app.tsx` (authenticated Home remains unchanged)
- `frontend/components/routed-lexigo-app.tsx`
- `frontend/components/route-primary-navigation.tsx`
- dependency/version changes
- unrelated frontend routes/components/tests/snapshots

## Runtime owners

- Session/route entry: `LexigoBootstrappedApp`.
- Authenticated Home route: existing `LexigoHomeApp`, unchanged.
- Guest `/`: dedicated `LexigoGuestHomeApp`; it does not load account progress or scheduler state.
- First Use `/onboarding`: dedicated `LexigoOnboardingApp`.
- Route chrome suppression for Guest Home and First Use: scoped CSS `:has([data-route-client-island=...])`; no navigation-owner refactor.
- Server state: existing `GET /api/v1/onboarding`, `POST /api/v1/onboarding/start`, `POST /api/v1/onboarding/items/{wordID}/mark`, `POST /api/v1/onboarding/complete`, `POST /api/v1/onboarding/skip` from backend #18.
- Appearance: existing application appearance runtime and CSS tokens.
- CI routing: existing UI, axe and visual jobs; First Use is added to those owners rather than creating another workflow.

## Documentation owners

- `.agents/current/**` for this atomic slice.
- Existing route/design docs only when executable ownership changes require synchronization.

## Invariants

- Guest state never requests or displays authenticated scheduler/progress data as if it belonged to the guest.
- Diagnostic answer/translation is not visible before a successful self-mark mutation.
- A failed mark does not advance the item or show the answer.
- Reload/direct entry resumes authoritative server state rather than local synthetic progress.
- Skip never blocks later learning and does not claim diagnostic scheduler initialization.
- Session bootstrap/refresh remains single-owned by `LexigoBootstrappedApp`.
- Role selection is transient presentation state only; no backend/local-storage persistence is invented because #18 has no role field.
- No new localStorage/sessionStorage source of truth for onboarding.
- Existing authenticated Home/Learn/Active Lesson route/history contracts remain intact.
- Light/Dark appearance tokens and horizontal containment remain intact.

## Acceptance criteria

- Guest sees approved First Use Home content without fake progress cards or unavailable controls.
- `Настроить первый урок` sends the guest through authentication with a safe same-origin return to `/onboarding`; `Посмотреть демо` uses the existing guest-compatible Learn route.
- Authenticated first-use user can enter `/onboarding`, start diagnostic, mark items, see answer only after mark, finish or skip.
- `in_progress` resumes after reload and direct entry.
- Loading, API error and retry are accessible and deterministic.
- Completed/skipped flow returns safely to Learn.
- Keyboard and screen reader semantics pass.
- Mobile/desktop Light/Dark visual evidence matches the reviewed OpenPencil production states.
- Full required PR CI passes on one immutable developer-authored head.
- Runtime-changing merge receives exact-main CI plus Stage/public validation before Issue #201 closes.

## Required checks

1. Repository-wide source/consumer search and route/API contract verification.
2. Targeted source/unit tests for routing, validators and reveal sequencing.
3. Frontend lint/typecheck/build.
4. Targeted Chromium/WebKit browser tests including reload/resume, skip, error/retry and Back/Forward.
5. Android Chromium + iOS WebKit coverage where the repository matrix selects it.
6. Keyboard/axe and reduced-motion compatibility.
7. Linux visual regression for canonical First Use states; inspect actual PNG evidence before recording approved hashes.
8. Bundle/performance budgets.
9. Full repository CI on final developer-authored head.
10. Clean changed-path/review/thread audit, expected-head squash merge, exact-main CI and Stage/public validation.

## Risks

- Existing frontend did not route `/onboarding` to a dedicated owner before this slice.
- Auth return historically permitted only catalog/phrases destinations; onboarding must stay on the same strict canonical-route allowlist.
- Diagnostic reveal sequencing can regress if optimistic UI reveals before mutation success.
- `onboarding_no_candidates` must remain truthful and recoverable rather than fabricating diagnostic content.
- Visual matrix is large; executable baselines must remain scoped to canonical states rather than duplicating every intermediate state.

## Rollback

Revert the First Use runtime PR. Existing backend onboarding state remains compatible and the prior authenticated Home/session route owners continue operating; design sources and server schema are unchanged.
