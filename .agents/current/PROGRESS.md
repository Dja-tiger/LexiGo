# Current Task Progress

## Status

- PR #355 is squash-merged as product SHA `f279bc577704f3f68bf587f4c88b474a62929c02`.
- PR #355 final developer-authored head `0ed20b621e7b3805498174c0267371cdca0b39df` passed full CI #2558 / run `30772507155` without retry.
- Exact-SHA main CI run `30772832623` completed the full product matrix successfully.
- Exact-SHA stage run `30773148243` completed deploy, public smoke and all 12 public browser validations successfully.
- No production CSS or runtime changed in PR #355.
- This Agent Docs reconciliation records the delivered proof and the concurrent PR boundary.

## Completed proof

- Added `home-hero-orphan-source.test.ts` as actual-checkout executable evidence.
- Proved zero executable consumers for `lx-hero-copy`, `lx-glow`, `lx-floating-card`, `lx-book-base` and `lx-orbit`.
- Bounded the exact inventory to 19 selector-token occurrences in `premium-ui.css`.
- Protected live canonical Home `lx-hero-card`, `lx-hero-art`, `lx-word-preview`, `lx-home-next-action-copy` and `lx-progress-panel` owners.
- Protected live compatibility `lx-resume-strip` and guest authentication/recovery `lx-auth-card` owners.
- Preserved global stylesheet import order, visual baselines and performance ceilings.

## Concurrent Draft PR #354

- PR #354 was created during execution of PR #355 from base `df3cd097cbd159a4d441aea4ce783043dabe36ec`.
- It is proof-only and intends to complete the compatibility fallback source inventory.
- It is currently Draft and non-mergeable because its `.agents/current/**` files diverged from the product delivery that reached `main`.
- It must not be merged or treated as authoritative on its current head.

## Next action

After this docs-only reconciliation merges:

1. Re-read the exact new `main`, PR #354 and its source-contract patch.
2. Reconstruct PR #354 on the new base while retaining only its bounded `compatibility-fallback-source.test.ts` change and refreshed `.agents/current/**`.
3. Require a new immutable developer-authored head and complete full CI.
4. Audit review surface, expected-head squash merge and exact-SHA main/stage validation.
5. Reconcile repository memory separately before the later Home hero CSS deletion slice.
