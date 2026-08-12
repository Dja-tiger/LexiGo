# Current Task

## Identity

- Issue: #72 `[Medium][UX] Унифицировать гостевой доступ к словам и фразам`
- Branch: `feat/issue-72-guest-catalog-parity`
- Base SHA: `e6b2d74891fb4e52f23152758812551361717857`
- Head SHA: resolve from live branch ref
- PR: #476 `feat(catalog): unify guest words and phrases access`

## Objective

Unify guest catalog behavior so words and phrases both support a clear read-only/demo browse path, while account-owned progress, scheduler state and practice remain authenticated. Preserve the exact catalog/detail context through login/registration and make the persistence boundary explicit before the learner invests in practice setup.

## Scope

- Add a public, content-only word catalog projection that never exposes `user_words` scheduler/progress fields.
- Allow guest Dictionary list/search/filter/sort/pagination and Word Detail content browsing from the canonical route island.
- Keep personalized status filters, scheduler panels and practice persistence authenticated-only.
- Gate practice/auth-required actions before lesson creation or long configuration work.
- Explain consistently that guest browsing/demo activity does not persist learning progress.
- Preserve current Dictionary/Phrases route, filters and detail selection through authentication and return to that canonical context after successful login/registration.
- Document the delivered guest catalog capability, public/authenticated data boundary and exact validated authentication return semantics in `docs/architecture.md`.
- Add focused backend/frontend/browser/source-contract coverage for the guest/public boundary and return path.

## Non-goals

- No changes to spaced-repetition algorithms, `user_words` ownership or review persistence semantics.
- No public exposure of authenticated `/api/v1/words`, `/api/v1/words/due`, progress, lessons or scheduler fields.
- No First Use/onboarding implementation blocked by Issue #201 Figma ownership.
- No CSP production-enforcement work from Issue #78.
- No broad compatibility-graph deletion or route-island ownership rewrite.
- No physical-device-only acceptance substitution.

## Allowed paths

- `.agents/current/**`
- `docs/architecture.md` only for the Issue #72 guest catalog access/data-boundary/auth-return policy
- `api/openapi.yaml`
- `backend/go.mod` and `backend/go.sum` only when required by the focused full-document OpenAPI parser contract
- `backend/internal/server/**`
- `backend/internal/words/**`
- `backend/integration/**` only for Issue #72 public/auth boundary coverage
- `frontend/app/information-architecture.css` only for the shared Dictionary/Phrases catalog-kind navigation contrast owner
- `frontend/components/dictionary-catalog.tsx`
- `frontend/components/lexigo-dictionary-app.tsx`
- `frontend/components/lexigo-phrases-app.tsx`
- `frontend/components/lexigo-premium-app.tsx` only for canonical auth return-context consumption
- `frontend/components/word-detail-route.tsx`
- `frontend/components/word-detail-presentation.tsx`
- `frontend/lib/navigation.ts` and focused navigation/auth-return helpers/tests if required
- `frontend/lib/word-detail.ts`
- `frontend/lib/interface-copy.ts` only for shared guest-access copy
- `frontend/scripts/dictionary-navigation-smoke.sh` only for canonical guest/auth Dictionary navigation smoke ownership
- focused `frontend/**/*.test.*`, `frontend/e2e/**`, accessibility/visual/performance ownership files required by the changed behavior

## Prohibited paths

- scheduler/review algorithm implementation outside the public projection boundary
- onboarding/First Use production UI
- deployment secrets, environment credentials or production-only CSP enforcement
- unrelated design-system/layout refactors
- broad `LexigoPremiumApp` compatibility cleanup unrelated to auth return context

## Runtime owners

- `LexigoDictionaryApp` / `DictionaryCatalog`: canonical Dictionary guest/auth browse behavior.
- `WordDetailRoute` / `WordDetailPresentation`: canonical word detail content vs personalized scheduler presentation.
- `LexigoPhrasesApp`: existing guest phrase browse baseline and matching auth/persistence copy.
- `LexigoPremiumApp`: existing guest authentication form and post-auth navigation handoff.
- `backend/internal/words`: authenticated catalog plus new public content-only projection.
- `backend/internal/server`: route-level public/auth boundary.

## Documentation owners

- `docs/architecture.md` for the durable guest catalog capability/data-boundary/auth-return contract.
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `.agents/PROJECT_STATE.md` only after delivered product evidence is complete.

## Invariants

- Public catalog responses must contain content fields only; no `status`, `easiness`, `intervalDays`, `repetitions`, `dueAt` or `lastReviewedAt` derived from `user_words`.
- Authenticated catalog behavior and scheduler values remain unchanged.
- Guest UI must never fabricate a learning status or due date.
- Practice/review/lesson persistence requires a real authenticated session.
- Canonical Dictionary/Phrases URL state remains the source of truth for filters/detail and browser Back/Forward.
- Authentication return targets must be validated as internal canonical product routes; no open redirect.
- Existing `AccessibleDialog`, route shell and session bootstrap ownership remain unchanged.

## Acceptance criteria

- Guest can browse/search/filter/sort/paginate words and open a word detail without authentication.
- Guest can continue browsing phrases under the existing read-only/demo path with matching persistence guidance.
- Guest word detail shows content but not personalized scheduler/status data.
- Attempting practice/auth-required actions presents the login gate before creating a lesson; copy states that guest progress is not saved.
- Successful login or registration returns to the exact originating catalog/detail context, including canonical filters/search/page where applicable.
- Malformed/external `return_to` values are ignored rather than navigated.
- `docs/architecture.md` documents guest Words/Phrases browse, the content-only public Words projection, authenticated-only personalized/persistence state and validated exact `return_to` behavior.
- Authenticated words/phrases, scheduler state, lesson creation and progress behavior remain green.
- Browser E2E covers guest browse -> detail -> auth gate -> login/register return path and Back/Forward URL-state behavior.

## Required checks

- Go format/unit/race/integration/security checks selected by CI for backend/public-route changes.
- OpenAPI structure/contract checks for new public endpoints, including a full YAML-document parse.
- Frontend lint, typecheck, unit/source-contract and production build.
- Blocking Chromium/WebKit browser matrix for changed guest/auth navigation behavior.
- Accessibility/visual/performance/PWA/container gates selected by the repository scope router.
- Architecture/documentation ownership checks selected by the full repository CI after the durable guest-policy update.
- Immutable-head PR CI, review/thread audit, expected-head squash merge.
- Exact-SHA `main` CI and exact-image Stage/public smoke/browser validation after product merge.

## Risks

- Accidentally exposing per-user scheduler state through a public response.
- Divergent guest vs authenticated filter semantics.
- Auth return path becoming an open redirect or losing canonical URL state.
- Word Detail accidentally fabricating scheduler values for guest content.
- Compatibility graph auth handoff diverging from route-island navigation.
- Public architecture documentation describing the historical auth-gated Dictionary after runtime guest access has changed.

## Rollback

Revert the atomic Issue #72 product commit/PR. The authenticated `/api/v1/words` contract remains untouched, so rollback removes only the public projection and guest UI/return-path behavior without data migration or scheduler-state repair.