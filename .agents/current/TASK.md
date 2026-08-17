# Current Task

## Identity

- Issue: #589
- Branch: `fix/min-mobile-learn-contrast`
- Base SHA: `2edf865448fb47951bd80963215cb3a6a76b01a4`
- Head SHA: resolve from live branch ref
- PR: pending

## Objective

Restore readable Learn intro heading contrast on compact Light surfaces exposed by the fail-closed #587 minimum-width audit, without weakening the approved desktop/tablet dark-hero accessibility foreground.

## Scope

- correct viewport-aware heading foreground ownership in the progressive Lesson Composer accessibility stylesheet;
- add fail-closed source protection for the compact/mobile cascade;
- collect exact Linux evidence for the corrected canonical 390px Light baseline before accepting any changed content hash;
- validate the 320px Light/Dark audit state before reconstructing #588.

## Non-goals

- no API, state, session, history, navigation or lesson-composition changes;
- no Figma/OpenPencil writes;
- no Phrase Detail repair (#590) in this PR;
- no calendar/WebKit repair;
- no unrelated CSS cleanup or redesign.

## Allowed paths

- `frontend/app/adaptive-lesson-composer-accessibility.css`
- `frontend/app/adaptive-lesson-composer-accessibility.test.ts`
- `frontend/e2e/visual-regression.spec.ts` only if an exact manually reviewed corrected 390px content-addressed fingerprint must be recorded
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- backend/API/migrations;
- Figma/OpenPencil sources;
- route/session/history owners;
- Phrases runtime/CSS;
- workflows and dependencies;
- existing tablet/desktop visual fingerprints except the Learn compact fingerprint explicitly allowed after review.

## Runtime owners

- `frontend/app/adaptive-lesson-composer.css` defines the transparent compact Learn hero surface and semantic compact heading color; read-only in this slice.
- `frontend/app/adaptive-lesson-composer-accessibility.css` is the later WCAG foreground owner and contains the defective unbounded fixed hero foreground.
- `frontend/components/lexigo-learn-app.tsx` owns `/learn` presentation; read-only.

## Documentation owners

- `.agents/current/**` records task scope, evidence and execution.

## Invariants

- canonical `/learn` route ownership remains `LexigoLearnApp`;
- compact hero remains transparent and uses semantic Light/Dark text foreground;
- desktop/tablet dark hero keeps `--lx-composer-hero-foreground: #f4f7f5`;
- no accessibility rule, browser project or visual gate is weakened;
- changed Linux visual hash is accepted only after exact artifact review.

## Acceptance criteria

- 320×700 Light heading is visibly readable on the transparent light canvas;
- canonical 390×844 Light heading is visibly readable and exact Linux actual is manually reviewed against `learn.mobile.recommended` / Figma `202:6` / OpenPencil `fig_6826`;
- compact Dark remains readable;
- medium/desktop foreground behavior remains unchanged;
- source contract protects the viewport-aware cascade;
- full immutable-head CI, clean review audit, exact-main CI and Stage/public validation pass.

## Required checks

- source contract for accessibility stylesheet/import order;
- frontend core lint/typecheck/unit/build through required CI;
- authoritative Linux Visual collection with manual inspection of any changed Learn compact actual;
- browser/accessibility/zoom/reduced-motion suites selected by full CI;
- final review-thread and main-drift audit.

## Risks

- an existing 390px content-addressed baseline may have captured the defect and therefore legitimately change;
- a too-broad override could remove the fixed foreground from the desktop dark hero.

## Rollback

Revert the compact foreground override and matching regression contract. If a corrected 390px hash is accepted, restore runtime and fingerprint together rather than mixing incompatible states.
