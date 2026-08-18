# Current Task Execution

## Task

- Branch: fix/issue-583-compact-reminder-library-geometry
- Base SHA: 0ff82f22404f94ed8f3fe568af0924fe65fc5f68
- Verified implementation SHA: 3f3c66275cf8ca0e2309ca3ce55c4a781d52dc33
- PR: #599

## Skills used

### github

Purpose:

Perform live repository preflight, source inspection, branch-safe writes, PR/CI/review/merge lifecycle and exact-main/Stage verification.

Instruction source:

`skills://plugins/github/github/skill.md` plus repository `AGENTS.md`, `.agents/AGENTS.md`, `.agents/AGENTS.base.md`, `.agents/AGENTS.tool-selection.md`, `.agents/SKILLS.md` and `docs/agent-harness.md`.

Version or verification date:

2026-08-18 live repository state.

Inputs:

- Issue #583 and umbrella #205.
- User screenshots/evidence already encoded in Issue #583.
- Base `main@0ff82f22404f94ed8f3fe568af0924fe65fc5f68`.
- Active OpenPencil mapping in `docs/figma/openpencil-screen-map.json`.

Files inspected or changed:

- `frontend/app/calendar-reminder-entry.css`
- `frontend/app/dictionary-catalog.css`
- `frontend/app/phrases.css`
- `frontend/app/adaptive-navigation.css`
- `frontend/app/adaptive-lesson-composer.css`
- `frontend/app/information-architecture.css`
- `frontend/app/issue-583-compact-library.css`
- `frontend/app/layout.tsx`
- `frontend/components/catalog-kind-navigation.tsx`
- `frontend/components/phrases-catalog.tsx`
- `frontend/components/issue-583-compact-library-source.test.ts`
- `frontend/e2e/route-transition-runtime-visual.spec.ts`
- `frontend/e2e/issue-583-compact-library.spec.ts`
- `frontend/e2e/phrases-search-clear-touch-targets.spec.ts`
- `frontend/e2e/profile-auto-theme.spec.ts`
- `frontend/package.json`
- `.agents/current/**`

## Actions performed

1. Confirmed no open PR and no pre-existing Issue #583 branch, then created the dedicated branch from exact live main.
2. Localized the 430px mismatch to cascade/container ownership instead of duplicating markup:
   - Dictionary keeps the shared <=719px safe-area-aware `.lx-app` inline inset.
   - Phrases clears that inset at <=767px and substitutes 24px catalog padding.
   - Reminder belongs to the <=719px compact header but its visible text was hidden only through 390px.
3. Added one late owner, `issue-583-compact-library.css`, that:
   - starts the Phrases geometry correction at 391px so exact 390px fingerprints remain unchanged;
   - restores the same shared safe-area inline inset as Dictionary;
   - removes only the redundant Phrases catalog inline inset;
   - keeps routed Reminder text visually hidden but accessible throughout <=719px.
4. Added source contracts preventing scope widening, Phrase Detail changes, `!important`, accessibility loss and test-routing drift.
5. Added a blocking iOS WebKit 430×932 Light/Dark proof covering Dictionary ↔ Phrases client navigation, direct entry, reload, real Back/Forward, no X overflow, Materials geometry equality, route-independent Reminder geometry, preview fit and Learn semantic selected-control tokens.
6. Routed the proof through normal `test:e2e:ui`.
7. Manually reviewed exact Linux WebKit evidence from run 32158725407 before approving six content-addressed fingerprints.
8. Updated the existing Profile Auto/system-Light 430×932 fingerprint because the intentional shared Reminder presentation changes that frame; the new image was reviewed before approval.
9. Stabilized an existing Phrases search-clear mobile test by waiting for the route's own hydration focus side effect before mutating its controlled search input. This removes a navigation/hydration race without production changes.
10. Re-ran the complete immutable-head CI. Run 32160012533 on implementation SHA `3f3c66275cf8ca0e2309ca3ce55c4a781d52dc33` completed successfully, including both UI shards, visual regression, iOS PWA, accessibility, security, performance, frontend core and backend suites.

## Authoritative visual evidence

Review source: run `32158725407`, head `f483bb61d96e8e010cd7c11ab20cb77f050ded8f`.

- Dictionary Light: 430×1200, `sha256:f08cfb773a0b60f300ed2054f6b5605b84fee8174990c844f1eca4bb889e074f`
- Dictionary Dark: 430×1200, `sha256:2bf51ccafbedac172ba22230c08f5e9fb2e50d21a921714c9c7aa9855038db6c`
- Phrases Light: 430×1505, `sha256:d08d940276584f80f82ac1d3fc46fd5f707041ae8f752d0cfc6db2112f3e9334`
- Phrases Dark: 430×1505, `sha256:ec34bfc76b33bd55e08a9e2af62eeece5c4899ee3b25358bee36bd16007404ed`
- Learn Light: 430×1575, `sha256:84e41f0c3f35a564df1ef9a821aee3ab58b842b62b9438788cff15ef478f510a`
- Learn Dark: 430×1575, `sha256:cfcedd118c241757efc64efdb8e3215f136cad749e99055a79b71f332846bd53`

Final deterministic proof: run `32160012533`, head `3f3c66275cf8ca0e2309ca3ce55c4a781d52dc33`, conclusion `success`.

## Failures and corrections

- Initial Issue #583 evidence runs were deliberately fail-closed with `REVIEW_REQUIRED` until screenshots were inspected.
- The first browser proof also treated a deterministic-runtime test style's expected CSP rejection as a product runtime error. The visual proof was corrected so harness-owned CSP noise is not reported as application runtime failure; production CSP remains covered by the dedicated security suite.
- A recurring Phrases search-clear flake was traced to filling a controlled input before React hydration completed on a repeated direct navigation. The test now waits for the route's own layout-effect focus signal.
- One existing calendar 200% reflow assertion failed once in an evidence run but passed unchanged in the final full immutable-head rerun; no speculative production or test change was made for a non-reproduced failure.

## Result

The implementation slice is complete and fully green before merge. At 430px Dictionary and Phrases now share the same compact shell/Materials geometry, Reminder remains an accessible icon-only compact control through <=719px, Learn selected controls remain semantic current-design tokens, and the reviewed 390×844 contract stays unchanged.

## Delivery state

- Draft PR #599 exists and contains the implementation plus reviewed evidence contracts.
- Branch is based on exact `main@0ff82f22404f94ed8f3fe568af0924fe65fc5f68`; latest verified compare before documentation reconciliation was `behind_by=0`.
- Next: complete documentation-only reconciliation CI, mark #599 ready, run final drift/review gate, squash merge, then verify exact-main CI and exact-SHA Stage/public browser matrix.

## Limitations

There is no dedicated 430px OpenPencil screen; 430px is validated as a responsive continuation of the active 390×844 screens using exact Linux WebKit evidence.

## Reusable lesson

A representative mobile viewport can miss presentation cutoffs nested inside a wider compact breakpoint. Shared components need cross-route bounding-box equality assertions, and controlled-input browser tests should wait on an application-owned hydration signal before mutating state immediately after navigation.
