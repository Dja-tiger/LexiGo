# Current Task

## Identity

- Issue: #590
- Branch: `fix/issue-590-phrase-detail-min-width`
- Base SHA: `7482d0ed52f9f5835b6a94fc4a7818ee1936d4aa`
- Head SHA: resolve from live branch ref
- PR: pending

## Objective

Restore Phrase Detail readable width at the minimum supported mobile width without changing the approved 390px, tablet or desktop composition.

## Scope

- add a dedicated Phrase Detail minimum-width CSS owner, following the repository's existing focused-fix layer pattern;
- reset the unintended shared `.lx-detail-card` 30px inset only at `max-width: 359px`;
- make the route-specific minimum-width owner more specific than the legacy shared fallback so stylesheet order cannot reintroduce the defect;
- extend existing Phrases source/cascade contracts to prove the 320px detail layout consumes the available route content width without horizontal overflow;
- keep canonical 390px visual fingerprints unchanged.

## Non-goals

- no API/state/session/history/navigation changes;
- no Phrases catalog redesign;
- no Figma/OpenPencil writes;
- no Learn or calendar/WebKit changes;
- no visual baseline update unless exact Linux evidence proves an independent required correction;
- no edits to Draft PR #588 until this runtime repair is delivered;
- no rewrite of the large canonical `phrases.css` when an isolated fix layer is sufficient.

## Allowed paths

- `frontend/app/phrase-detail-min-width.css`
- `frontend/app/layout.tsx`
- `frontend/components/phrases-css-ownership.test.ts`
- `frontend/e2e/phrases-grid-cascade.spec.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- backend/API/migrations;
- Figma/OpenPencil/design source;
- route/session/history owners;
- `frontend/app/phrases.css` and `frontend/app/premium-ui.css` runtime definitions;
- `frontend/e2e/phrases-visual.spec.ts` unless exact Linux review proves canonical 390px drift;
- workflows/dependencies;
- unrelated feature CSS/tests.

## Runtime owners

- `frontend/app/premium-ui.css` owns the legacy `.lx-detail-card { ... padding: 30px; }` fallback and is read-only in this slice.
- `frontend/app/phrases.css` owns canonical Phrase Detail responsive layout and existing 16px outer minimum-width route padding; it is read-only in this slice.
- `frontend/app/phrase-detail-min-width.css` owns only the `<=359px` route-scoped neutralization of the leaked legacy inset.
- `frontend/app/layout.tsx` registers that focused CSS owner after the existing Phrases/detail layers.
- `LexigoPhrasesApp` remains the route owner for `/phrases/[slug]`.

## Documentation owners

Task-local `.agents/current/**` only. Post-merge delivery reconciliation remains a separate Agent Docs slice.

## Invariants

- 320px outer route padding remains 16px per side, yielding a 288px Phrase Detail content box;
- the Phrase Detail layout adds no extra legacy outer inset at `<=359px`;
- 390px keeps the existing approved shared 30px detail-card inset/composition and content-addressed fingerprints;
- tablet/desktop grid and side-panel behavior remain unchanged;
- no horizontal overflow or clipped interactive target is introduced;
- CSS ownership remains deterministic across stylesheet load order.

## Acceptance criteria

- at `320x700`, Phrase Detail layout padding computes to `0px` and its main surface uses the available route content width;
- at `390px`, the existing shared 30px detail-card padding remains unchanged;
- three tested stylesheet orders produce identical 320px/390px detail geometry;
- no document horizontal overflow occurs;
- source contract proves the minimum-width route selector outranks `.lx-detail-card` and is loaded exactly once;
- canonical 390px Phrase Detail Light/Dark visual fingerprints reproduce unchanged;
- full immutable-head CI passes, then clean review/main-drift audit, expected-head squash merge, exact-main CI and Stage/public validation pass.

## Required checks

- Phrases CSS ownership unit contract;
- focused Chromium computed-cascade browser contract at 320px and 390px;
- frontend lint/typecheck/unit/build through full CI;
- authoritative Phrases Visual regression proving 390px fingerprints unchanged;
- accessibility/responsive/performance/security/container gates selected by full CI;
- post-merge exact-main CI and Stage/public runtime checks.

## Risks

- an under-scoped selector can lose to `.lx-detail-card` when CSS order changes;
- an over-broad reset can alter the approved 390px/mobile composition;
- changing inner card paddings instead of the legacy outer inset would redesign content density rather than fix ownership;
- a new focused layer must be registered once and remain narrow enough not to create another global CSS owner.

## Rollback

Remove `phrase-detail-min-width.css`, its `layout.tsx` import and matching source/browser contracts. No backend/data rollback is involved.
