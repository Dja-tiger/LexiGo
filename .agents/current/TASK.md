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

- reset the unintended shared `.lx-detail-card` 30px inset only for Phrase Detail at `max-width: 359px`;
- make the route-specific minimum-width owner more specific than the legacy shared fallback so stylesheet order cannot reintroduce the defect;
- extend existing Phrases source/cascade contracts to prove the 320px detail layout consumes the available route content width without horizontal overflow;
- keep canonical 390px visual fingerprints unchanged.

## Non-goals

- no API/state/session/history/navigation changes;
- no Phrases catalog redesign;
- no Figma/OpenPencil writes;
- no Learn or calendar/WebKit changes;
- no visual baseline update unless exact Linux evidence proves an independent required correction;
- no edits to Draft PR #588 until this runtime repair is delivered.

## Allowed paths

- `frontend/app/phrases.css`
- `frontend/components/phrases-css-ownership.test.ts`
- `frontend/e2e/phrases-grid-cascade.spec.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- backend/API/migrations;
- Figma/OpenPencil/design source;
- route/session/history owners;
- `frontend/e2e/phrases-visual.spec.ts` unless exact Linux review proves canonical 390px drift;
- workflows/dependencies;
- unrelated feature CSS/tests.

## Runtime owners

- `frontend/app/premium-ui.css` owns the legacy `.lx-detail-card { ... padding: 30px; }` fallback and is read-only in this slice.
- `frontend/app/phrases.css` owns Phrase Detail responsive layout and the minimum-width route-specific reset.
- `LexigoPhrasesApp` remains the route owner for `/phrases/[slug]`.

## Documentation owners

Task-local `.agents/current/**` only. Post-merge delivery reconciliation remains a separate Agent Docs slice.

## Invariants

- 320px outer route padding remains 16px per side, yielding a 288px Phrase Detail content box;
- the Phrase Detail layout adds no extra legacy outer inset at `<=359px`;
- 390px keeps the existing approved detail-card inset/composition and content-addressed fingerprints;
- tablet/desktop grid and side-panel behavior remain unchanged;
- no horizontal overflow or clipped interactive target is introduced;
- CSS ownership remains deterministic across stylesheet load order.

## Acceptance criteria

- at `320x700`, Phrase Detail layout padding computes to `0px` and uses the available route content width;
- at `390px`, the existing shared 30px detail-card padding remains unchanged;
- three tested stylesheet orders produce identical 320px/390px detail geometry;
- no document horizontal overflow occurs;
- source contract proves the minimum-width route selector outranks `.lx-detail-card`;
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
- changing inner card paddings instead of the legacy outer inset would redesign content density rather than fix ownership.

## Rollback

Revert the `<=359px` Phrase Detail layout padding reset and its source/browser contracts. No backend/data rollback is involved.
