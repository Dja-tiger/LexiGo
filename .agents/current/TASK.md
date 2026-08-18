# Current Task

## Identity

- Issue: #583
- Branch: fix/issue-583-compact-reminder-library-geometry
- Base SHA: 0ff82f22404f94ed8f3fe568af0924fe65fc5f68
- Verified implementation SHA: 3f3c66275cf8ca0e2309ca3ce55c4a781d52dc33
- PR: #599

## Objective

Remove the remaining compact legacy presentation on Learn/Dictionary/Phrases at the real 430px iPhone-class viewport, unify Dictionary/Phrases shared Materials geometry, and make the shared Reminder/calendar entry use one compact current-design owner without route-dependent overlap.

## Scope

- Prove the 390→430 breakpoint/cascade root cause for Dictionary/Phrases shell width and Reminder geometry.
- Keep the active repo-owned OpenPencil 390×844 screens as the responsive design anchor; 430px is a responsive continuation, not a new redesign.
- Unify compact Dictionary/Phrases inline/container geometry and Materials segmented-control geometry.
- Make Reminder compact and route-independent across Learn/Dictionary/Phrases while preserving its existing calendar interaction and accessibility semantics.
- Preserve the existing 390×844 transition contract and add blocking 430px WebKit regression/evidence.
- Verify direct entry, client navigation, reload, Back/Forward, Light/Dark and no horizontal overflow.

## Non-goals

- Backend/API/schema/scheduler changes.
- Content changes.
- New Dictionary/Phrases/Learn product redesign.
- Figma Cloud as an execution blocker.
- Blind visual-baseline updates.
- Broad `!important`, synthetic remount or magic-width fixes without owner evidence.

## Allowed paths

- frontend/app/calendar-reminder-entry.css
- frontend/app/dictionary-catalog.css
- frontend/app/phrases.css
- frontend/app/information-architecture.css only if shared Materials ownership requires it
- frontend/app/issue-583-compact-library.css
- frontend/app/layout.tsx
- frontend/e2e/route-transition-runtime-visual.spec.ts
- frontend/e2e/*issue-583* or compact-library geometry regression spec if a dedicated blocking proof is cleaner
- frontend/components/*issue-583* source-contract test if needed
- frontend/package.json only if test routing must be made explicit
- .agents/current/**

## Prohibited paths

- backend/**
- deploy/**
- database/schema/migrations
- design/figma/**
- unrelated route CSS or visual baselines
- direct writes to main

## Runtime owners

- `frontend/app/issue-583-compact-library.css` — late owner for the narrow, proven compact overrides only.
- `frontend/app/calendar-reminder-entry.css` — shared Reminder trigger/preview geometry baseline.
- `frontend/app/dictionary-catalog.css` — Dictionary compact catalog container baseline.
- `frontend/app/phrases.css` — Phrases compact catalog container baseline.
- `frontend/app/information-architecture.css` — shared Materials segmented control.
- `frontend/components/calendar-reminder-route-entry.tsx` and `catalog-kind-navigation.tsx` remain semantic owners; no markup change was required.

## Documentation owners

- `docs/figma/openpencil-screen-map.json` — active screen mapping/provenance; read-only for this runtime slice.
- `.agents/current/**` — active execution memory until runtime merge and Stage reconciliation complete.

## Invariants

- Existing reviewed 390×844 transition fingerprints remain unchanged.
- Calendar settings/storage/export behavior is unchanged.
- Materials switch stays one shared component and remains one-line/no-clipping.
- Mobile navigation and safe-area behavior remain intact.
- Existing route history semantics remain real browser history, not synthetic navigation.
- Learn mode/source controls remain on semantic current-design token owners.
- Phrase Detail geometry remains outside this slice.

## Acceptance criteria

- 430px Dictionary and Phrases use the same shared outer/content inline geometry. — verified.
- Switching words ↔ phrases does not move/resize Materials shell or page shell. — verified.
- Materials buttons have matching width distribution, height, padding, radius and typography. — verified.
- 390px and 430px have no clipping, overlap or horizontal overflow. — verified in blocking browser/visual suites.
- Reminder uses one compact current-design geometry on Learn/Dictionary/Phrases and does not overlap Materials/header/content. — verified.
- Reminder/calendar preview/dialog remain usable and accessible. — verified.
- Learn compact mode/source controls resolve from semantic current-design tokens and do not regress to legacy blue/green literal paint. — verified.
- Light/Dark do not mix legacy/current palette ownership. — verified.
- Direct entry, client navigation, reload and Back/Forward preserve geometry. — verified.
- Blocking WebKit/iOS 430px regression and exact Linux visual evidence exist and are reviewed before fingerprint approval. — verified from run 32158725407.
- Full immutable-head CI succeeds. — verified on implementation SHA 3f3c66275cf8ca0e2309ca3ce55c4a781d52dc33, run 32160012533.
- Runtime merge passes exact-main CI and exact-SHA Stage/public validation. — pending PR #599 merge and post-merge delivery reconciliation.

## Required checks

- Source/readback ownership checks. — passed.
- Frontend lint/typecheck/unit/build/dependency audit. — passed.
- Existing 390×844 route-transition visual contract. — passed unchanged.
- 430px iOS WebKit geometry/navigation/reminder regression. — passed.
- Accessibility audit and no-X-overflow checks. — passed.
- Exact Linux visual artifact manual review before fingerprint approval. — completed.
- Immutable-head full CI. — passed in run 32160012533.
- Review/drift gate, squash merge with expected head, exact-main CI, Stage/public browser matrix. — next delivery phase.

## Reviewed 430px evidence

Authoritative review source: CI run 32158725407 on head `f483bb61d96e8e010cd7c11ab20cb77f050ded8f`.

- Dictionary Light: 430×1200, `sha256:f08cfb773a0b60f300ed2054f6b5605b84fee8174990c844f1eca4bb889e074f`
- Dictionary Dark: 430×1200, `sha256:2bf51ccafbedac172ba22230c08f5e9fb2e50d21a921714c9c7aa9855038db6c`
- Phrases Light: 430×1505, `sha256:d08d940276584f80f82ac1d3fc46fd5f707041ae8f752d0cfc6db2112f3e9334`
- Phrases Dark: 430×1505, `sha256:ec34bfc76b33bd55e08a9e2af62eeece5c4899ee3b25358bee36bd16007404ed`
- Learn Light: 430×1575, `sha256:84e41f0c3f35a564df1ef9a821aee3ab58b842b62b9438788cff15ef478f510a`
- Learn Dark: 430×1575, `sha256:cfcedd118c241757efc64efdb8e3215f136cad749e99055a79b71f332846bd53`

The fingerprints were approved only after manual inspection. A later full rerun on implementation SHA `3f3c66275cf8ca0e2309ca3ce55c4a781d52dc33` reproduced them and completed successfully.

## Risks

- Changing shared Reminder breakpoint can affect all routed mobile screens; full UI/PWA/accessibility coverage is therefore required and passed on the implementation head.
- Moving padding ownership intentionally changes Phrases at 391–719px; the repair deliberately starts at 391px so the reviewed 390px contract remains immutable.
- Fixed-position Reminder must keep safe-area and header/profile touch-target separation; the 430px geometry proof checks this route-independently.

## Rollback

Revert the Issue #583 runtime squash merge; preserve the prior reviewed #577/#593 fingerprints and Stage image until a corrected owner-scoped patch is ready.
