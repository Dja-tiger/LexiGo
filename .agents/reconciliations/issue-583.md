# Issue #583 delivery reconciliation

Verified: 2026-08-18

## Delivery

- Umbrella: #205.
- Issue: #583.
- Runtime PR: #599.
- Runtime delivery base: `0ff82f22404f94ed8f3fe568af0924fe65fc5f68`.
- Reviewed evidence head: `f483bb61d96e8e010cd7c11ab20cb77f050ded8f`.
- Authoritative Linux WebKit evidence run: `32158725407`.
- Verified implementation SHA: `3f3c66275cf8ca0e2309ca3ce55c4a781d52dc33`.
- Immutable full CI: run `32160012533`, success.
- Final PR head: `5c4a66f04ac4b9e23d2af34ee5f8429ea9e63644`.
- Squash merge / product main SHA: `bbb3df760b9d2fe51e29c58980cd3388fa430db5`.
- Exact-main CI: run `32162270101`, success; frontend core, both UI shards, visual regression, iOS PWA dictionary, accessibility, content security, performance, controlled service worker, dictionary smoke, lesson completion, backend unit/security and backend integration all passed.
- Stage: run `32163146637`, exact image SHA `bbb3df760b9d2fe51e29c58980cd3388fa430db5`; deploy, public smoke and public browser all succeeded; public browser matrix passed 12/12 Chromium+iOS WebKit tests.
- Issue #583 closed through PR #599.

## Reviewed 430px evidence

All six exact Linux WebKit frames from run `32158725407` were manually inspected before fingerprint approval.

- Dictionary Light: 430×1200, `sha256:f08cfb773a0b60f300ed2054f6b5605b84fee8174990c844f1eca4bb889e074f`.
- Dictionary Dark: 430×1200, `sha256:2bf51ccafbedac172ba22230c08f5e9fb2e50d21a921714c9c7aa9855038db6c`.
- Phrases Light: 430×1505, `sha256:d08d940276584f80f82ac1d3fc46fd5f707041ae8f752d0cfc6db2112f3e9334`.
- Phrases Dark: 430×1505, `sha256:ec34bfc76b33bd55e08a9e2af62eeece5c4899ee3b25358bee36bd16007404ed`.
- Learn Light: 430×1575, `sha256:84e41f0c3f35a564df1ef9a821aee3ab58b842b62b9438788cff15ef478f510a`.
- Learn Dark: 430×1575, `sha256:cfcedd118c241757efc64efdb8e3215f136cad749e99055a79b71f332846bd53`.

The intentional shared Reminder change also altered the existing Profile Auto/system-Light 430×932 frame. Its replacement fingerprint `sha256:ad13c7ece87da840198b90f29721295fd0f465d1017eaa1390b2d3bfa086355d` from run `32154887658`, head `e9d477b4ec0282d2ec092903b34d72e1be1ba9c1`, was manually reviewed before approval.

## Durable contract

- The active OpenPencil 390×844 Dictionary/Phrases/Learn screens remain the compact design anchor; 430px is a responsive continuation, not a separate redesign.
- The shared <=719px `.lx-app` safe-area-aware inline inset is the compact shell owner for Dictionary and Phrases.
- Phrases must not add a second catalog inline inset on top of that shared shell between 391px and 719px.
- The routed Reminder stays icon-only but accessibility-labelled throughout the complete <=719px compact header range.
- `CatalogKindNavigation` remains one shared semantic owner; Dictionary and Phrases must expose equal Materials shell/button geometry at the same viewport.
- The reviewed 390×844 transition fingerprints remain unchanged.
- Learn compact selected controls resolve semantic `--ak-*` current-design tokens; no speculative legacy-palette override is needed.
- Phrase Detail remains outside this slice.
- Direct entry, client navigation, reload and real Back/Forward must preserve the same geometry with no horizontal overflow.

## Findings resolved during delivery

- The 430px Dictionary/Phrases mismatch came from duplicate padding ownership: Phrases cleared the shared mobile `.lx-app` inset and substituted its own 24px catalog inset while Dictionary retained the shared shell inset.
- Reminder text was hidden only through 390px although the fixed compact header remained active through 719px, causing the 391–719px control to expand into a wide pill.
- The runtime correction is isolated in `frontend/app/issue-583-compact-library.css` and deliberately starts the Library geometry correction at 391px so reviewed 390px pixels remain immutable.
- The dedicated 430×932 iOS WebKit proof covers Light/Dark, Dictionary↔Phrases switching, direct entry, reload, real Back/Forward, Materials equality, Reminder equality, preview fit, semantic paint and no-X-overflow.
- Existing Phrases search-clear E2E was stabilized by waiting for the route-owned hydration/focus signal before mutating its controlled input; production behavior was unchanged.
- An earlier calendar 200% reflow assertion failed once but passed unchanged in the final immutable full CI, so no speculative production change was made for a non-reproduced failure.

## Reusable lesson

- A representative 390px mobile baseline can miss ownership bugs that begin immediately above it while still inside the same compact breakpoint.
- Shared components need cross-route bounding-box equality assertions at real device-class widths, not only screenshot similarity at one representative viewport.
- When a shared compact shell already owns safe-area padding, route-specific catalog padding should not recreate the same inset.
- Controlled-input browser tests should wait for an application-owned hydration signal before immediate post-navigation mutation.

## Remaining work

- Continue umbrella #205 with the next unresolved route/parity slice.
- Do not reopen #583 unless the exact 430px compact shell/Reminder contract regresses.

## Harness reset

- `.agents/current/TASK.md`, `.agents/current/PROGRESS.md`, and `.agents/current/EXECUTION.md` are reset byte-for-byte to the canonical templates in this reconciliation PR.
