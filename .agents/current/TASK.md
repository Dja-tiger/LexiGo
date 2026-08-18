# Current Task

## Identity

- Issue: #583
- Branch: fix/issue-583-compact-reminder-library-geometry
- Base SHA: 0ff82f22404f94ed8f3fe568af0924fe65fc5f68
- Head SHA: resolve from live branch ref
- PR:

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
- `frontend/components/calendar-reminder-route-entry.tsx` and `catalog-kind-navigation.tsx` remain semantic owners unless evidence proves markup changes are required.

## Documentation owners

- `docs/figma/openpencil-screen-map.json` — active screen mapping/provenance; read-only for this runtime slice unless a mapping defect is proven.
- `.agents/current/**` — active execution memory.

## Invariants

- Existing reviewed transition fingerprints are not updated before exact Linux evidence is manually reviewed.
- Calendar settings/storage/export behavior is unchanged.
- Materials switch stays one shared component and remains one-line/no-clipping.
- Mobile navigation and safe-area behavior remain intact.
- Existing route history semantics remain real browser history, not synthetic navigation.
- Learn mode/source controls remain on their existing semantic current-design token owners; no speculative recoloring is allowed.

## Acceptance criteria

- 430px Dictionary and Phrases use the same shared outer/content inline geometry.
- Switching words ↔ phrases does not move/resize Materials shell or page shell.
- Materials buttons have matching width distribution, height, padding, radius and typography.
- 390px and 430px have no clipping, overlap or horizontal overflow.
- Reminder uses one compact current-design geometry on Learn/Dictionary/Phrases and does not overlap Materials/header/content.
- Reminder/calendar preview/dialog remain usable and accessible.
- Learn compact mode/source controls resolve from semantic current-design tokens and do not regress to legacy blue/green literal paint.
- Light/Dark do not mix legacy/current palette ownership.
- Direct entry, client navigation, reload and Back/Forward preserve geometry.
- Blocking WebKit/iOS 430px regression and exact Linux visual evidence exist and are reviewed before fingerprint approval.
- Full immutable-head CI succeeds.
- Runtime merge passes exact-main CI and exact-SHA Stage/public validation.

## Required checks

- Source/readback ownership checks.
- Frontend lint/typecheck/unit/build/dependency audit.
- Existing 390×844 route-transition visual contract.
- 430px iOS WebKit geometry/navigation/reminder regression.
- Accessibility audit and no-X-overflow checks.
- Exact Linux visual artifact manual review before fingerprint approval.
- Immutable-head full CI, review/drift gate, squash merge with expected head, exact-main CI, Stage/public browser matrix.

## Risks

- Changing shared Reminder breakpoint can affect all routed mobile screens.
- Moving padding ownership intentionally changes compact Phrases geometry and therefore may require reviewed 390 visual fingerprint updates.
- Fixed-position Reminder must keep safe-area and header/profile touch-target separation.

## Rollback

Revert the Issue #583 runtime squash merge; preserve the prior reviewed #577/#593 fingerprints and Stage image until a corrected owner-scoped patch is ready.
