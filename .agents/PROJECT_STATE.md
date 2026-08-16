# LexiGo Project State

## Verification

- Last verified: 2026-08-16 Europe/Moscow.
- Repository: `Dja-tiger/LexiGo`.
- Latest runtime-bearing `main`: `50f7256c8ce6a11a772030c2d2d170e6edf82a2a` from runtime PR #558.
- Latest deployed runtime/Stage SHA: `50f7256c8ce6a11a772030c2d2d170e6edf82a2a`.
- PR #558 final developer-authored head `a2c841b7765a17f6e93eb0cf3f385db9223fd888` passed full CI #3667, including frontend core, Accessibility, UI shards 1/2 and 2/2, Visual regression, Controlled service worker, performance, backend and container builds.
- PR #558 squash merge: `50f7256c8ce6a11a772030c2d2d170e6edf82a2a`.
- Exact-main runtime CI #3668 on `50f7256c8ce6a11a772030c2d2d170e6edf82a2a` passed.
- Deploy Stage #3519 on the same exact runtime SHA passed.
- PR #558 has no unresolved review threads; live PR review-thread inventory is empty.
- Issue #201 was closed as `completed` on 2026-08-16 after the runtime PR, exact-main CI and exact-SHA Stage gates passed.
- Post-merge reconciliation PR #559 merged as `b33eb3697527276ad2a3aa4b3ac52d47f71b0bab`.
- Exact-main reconciliation CI #3671 on `b33eb3697527276ad2a3aa4b3ac52d47f71b0bab` passed after a controlled same-head rerun classified the initial UI shard 1 failure as the known unrelated Chromium native middle-click/new-tab Playwright flake; no product code changed for that retry.
- Live GitHub and live source are authoritative for the latest branch head, open work, ownership, review state and CI. This file intentionally records immutable delivery SHAs instead of a self-referential `current main` value.

## Delivery contract

- One PR contains one atomic product/tooling/reconciliation slice.
- Product changes require repository-owned frontend/backend/browser/accessibility/performance/container gates selected by scope.
- Product delivery requires immutable-head PR CI, clean review audit, expected-head squash merge, exact-main validation and Stage/public validation when runtime changed.
- Pure Agent Docs changes use the fail-closed lightweight classifier; public README/architecture synchronization is not classified as pure Agent Docs and receives the normal documentation CI path selected by the repository.
- Design-source/tooling changes require deterministic source identities, immutable-head design acceptance, clean review audit and exact-main design validation.
- A controlled same-head CI retry may classify an unrelated pre-existing browser flake, but product code must not be changed without a reproduced product defect.
- Linux visual hashes are approval records: inspect the exact artifact first, then commit the reviewed fingerprints.

## Production ownership foundations

- `LexigoBootstrappedApp` owns session restoration, refresh coordination, account runtime and dynamic route-entry selection.
- Guest `/` is owned by `LexigoGuestHomeApp`; it does not request or fabricate authenticated progress/account/scheduler state.
- Authenticated `/` is owned by `LexigoHomeApp`.
- Authenticated `/onboarding` is owned by `LexigoOnboardingApp` and the canonical App Router route is established by `frontend/app/onboarding/page.tsx`.
- `LexigoLearnApp` owns `/learn`; `LexigoActiveLessonApp` owns `/lesson/active`.
- `LexigoDictionaryApp` owns `/dictionary` and `/words/[id]`; `LexigoPhrasesApp` owns `/phrases` and `/phrases/[slug]`.
- `LexigoProgressApp` owns `/progress`; authenticated `LexigoProfileApp` owns the Profile summary/preferences surface.
- `LexigoScenarioCatalogApp` and `LexigoScenarioApp` own `/scenarios` and `/scenarios/[slug]`.
- `RouteChrome` remains the sole owner of ordinary primary route navigation outside focused routes; Guest Home and onboarding suppress ordinary route chrome through their scoped First Use presentation contract.
- `ReviewOutboxRuntime` owns the durable review queue and global connectivity actions.
- `LexigoPremiumApp` remains a narrow compatibility fallback; it does not own the extracted Guest Home, Onboarding, Phrases or Active Lesson routes.
- Guest catalog content and authenticated scheduler/progress state remain separate security boundaries.

## First Use / Issue #201 runtime delivered by PR #558

- Guest Home is truthful and independent of authenticated progress/account APIs.
- `Настроить первый урок` uses the existing authentication flow with strict internal `return_to=/onboarding`; arbitrary external/unknown return targets remain rejected.
- `/onboarding` is a real App Router route and no longer mounts the client island over the Next not-found subtree.
- Existing backend #18 onboarding contract remains unchanged: `status/start/mark/complete/skip`.
- Onboarding uses authoritative server states `not_started / in_progress / completed / skipped`.
- Diagnostic marks are `known / unsure / new`; answer/reveal data becomes visible only after successful mark mutation.
- `in_progress` resumes after reload/direct entry from server status; no new localStorage/sessionStorage onboarding source of truth was introduced.
- Skip and complete remain distinct transitions and return safely into the learning flow.
- Loading, API error, retry and recovery states are covered.
- First Use routes run as focused route owners without ordinary route chrome.
- Accessibility root causes fixed at source: Light contrast, real progressbar semantics and the competing server 404 DOM subtree. Axe rules/severity were not disabled or weakened.
- Browser-history regression protection waits for the destination semantic owner before Back/Forward instead of treating URL change alone as transition completion.

## First Use visual evidence

- Exact reviewed pre-baseline head: `a730ca706a2a3c3ebc676e3a67349ce62ab6a537`.
- Reviewed Linux artifact: `frontend-playwright-report-visual`, artifact id `9264591775`, digest `sha256:075d709bce980fc01f6caeba2d1d7990392b9e8f458ce29db58031b8dc384d3b`.
- Eight reviewed canonical PNGs cover Guest Home compact/desktop Light/Dark, onboarding role compact Light/Dark and diagnostic resume desktop Light/Dark.
- Manual review found no Next 404 overlay, ordinary route chrome, horizontal overflow, clipped controls or Light/Dark structural mismatch.
- Approved SHA-256 fingerprints are committed in `frontend/e2e/first-use-visual.spec.ts`; final CI #3667 passed Visual regression without update mode.

## Confirmed First Use delivery lessons

- A persistent client route predicate does not create a valid Next App Router route. A focused client island needs its canonical `app/**/page.tsx`; otherwise client content can render over a not-found subtree, producing duplicate landmarks and pointer interception.
- Global role assertions must be scoped to the owning product surface when the framework legitimately owns route-announcer semantics.
- Browser history tests must wait for the destination semantic owner, not only the pathname.
- Infrastructure/MCR failure during isolated workspace preparation is classified separately from product defects; no product workaround was made for the historical Controlled Service Worker transient.
- The reusable route-island lessons are promoted in `.agents/lessons/frontend.md`.

## AI-native design source-of-truth status

- ZSeven OpenPencil v0.8.2 remains the day-to-day AI-first design editor; native Figma is retained as archived provenance/reference.
- Active design path: `design/openpencil/LexiGo Design System.op`.
- Reviewed active SHA-256: `6d73b785aaeb7dda35a53c9c5f16edfc9cbef1092dbce992183538f16505520e`; reviewed size `6,937,300` bytes.
- Active token/provenance path: `design/openpencil/LexiGo Design Tokens.json`, SHA-256 `e603d86f3d4ef470c39fd72c31433e6a124bb9371da6f333567cd3aa796ae05c`.
- Canonical imported/OpenPencil-native production mapping: `docs/figma/openpencil-screen-map.json`.
- PR #556 delivered the approved 40-state First Use design matrix before runtime implementation.
- Runtime PR #558 did not modify backend schema, OpenPencil/Figma sources or deploy topology.

## Completed executable route/design milestones

- Home parity: Issue #522 / PR #523.
- Learn Composer parity: Issue #525 / PR #526.
- Active Lesson parity: Issue #528 / PR #529.
- Progress parity: Issue #515 / PR #517.
- Dictionary parity: Issue #531 / PR #532.
- Word Detail parity: Issue #533 / PR #535.
- Phrases catalog/detail parity: Issues #536/#540 / PRs #538/#541.
- Profile parity: Issue #542 / PR #543.
- System State Dictionary Empty renderer-equivalent: Issue #545 / PR #546.
- Native Figma archive: Issue #487 / PR #547.
- Deterministic ZSeven import: Issue #550 / PR #551.
- OpenPencil active source promotion: Issue #552 / PR #553.
- Optional standalone OpenPencil fallback: Issue #554 / PR #555.
- First Use design gate: Issue #201 / PR #556.
- First Use runtime: Issue #201 / PR #558 / merge `50f7256c8ce6a11a772030c2d2d170e6edf82a2a` / exact-main CI #3668 / Stage #3519 / Issue closed completed 2026-08-16.
- First Use post-merge reconciliation: PR #559 / merge `b33eb3697527276ad2a3aa4b3ac52d47f71b0bab` / exact-main reconciliation CI #3671.

Canonical appearance invariants remain Light `#f4f7f5` and Dark `#10211d`.

## Current state

- Issue #201 is closed as completed; its runtime is deployed to Stage on exact runtime merge SHA `50f7256c8ce6a11a772030c2d2d170e6edf82a2a`.
- Reconciliation PR #559 synchronized README/architecture ownership, promoted the new frontend route lesson, recorded the verified closed state and reset `.agents/current/**` from templates.
- Exact-main reconciliation CI #3671 is green on reconciliation merge SHA `b33eb3697527276ad2a3aa4b3ac52d47f71b0bab`.
- No runtime/backend/API/design/deploy change was part of the reconciliation slice.
- The next product task must be selected from live GitHub rather than inferred from this file.

## Remaining roadmap

- #203: optional historical live-Figma Screen Map/archive synchronization when access is available.
- #508: physical iOS/iPadOS, Android and desktop PWA install/icon/splash/cold-start sign-off.
- #25: continue user-facing pronunciation/custom-vocabulary presentation only from verified design evidence.
- #78: complete remaining CSP/security-header enforcement through authorized staged rollout.
- #65/#461: reduced-motion and physical-device accessibility sign-off remain separate.
- #133: moderated usability validation after core routes and final visual parity are ready.
- #70: continue compatibility cleanup only with route reachability, bundle, browser and Linux visual evidence.

## Evidence corrections retained

- Issue #485 / PR #486 delivered authenticated backend custom vocabulary, not browser-local vocabulary. Merge: `53e16a00e2bbe70921c1c5220923faee1f63bc37`.
- Issue #489 / PR #494 delivered authenticated backend glossary portability, not browser-local codecs. Merge: `0d536a79a216043acb37e1f628c081cab16d24d9`.
- Issue #497 / PR #498 delivered the local recorder platform. Merge: `810fa59a748477f8723a19dee03e61517282df30`.
