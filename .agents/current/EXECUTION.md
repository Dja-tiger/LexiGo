# Current Task Execution

## Task

- Issue: #577
- Parent: #205
- Branch: `fix/issue-577-route-runtime`
- Base SHA: `e25cee1b2ef991aff9ea5a27f63d170e1bc8d1b7`
- Runtime reviewed-source head: `43e80f5b1b0d6c778f53147ba6a115fefc94df0b`
- First evidence-approval head: `be2bf0341bc85bdb3f860e5e7ba3226f2cedbc25`
- PR: #579 Draft

## Skills used

GitHub repository workflow instruction was read live from `skills://plugins/github/github/skill.md` on 2026-08-17. The delivery uses exact GitHub refs, immutable Actions evidence, manual Linux visual review, fail-closed fingerprints, expected-head merge, exact-main CI and exact-SHA Stage/public validation.

## Runtime implementation

- Primary Library route graph now writes `dictionary` rather than compatibility `product`.
- Compact Materials owns equal 48px minimum targets, nowrap labels and overflow-safe geometry.
- Shared `CalendarReminderRouteEntry` keeps one component/geometry owner and uses semantic `--ak-*` appearance tokens instead of legacy hardcoded dark/blue values.
- Dictionary/Phrases transition/history and Learn Home-transition/history/reload browser contracts were added/strengthened.
- Six transition-derived Light/Dark content-addressed states at 390×844 were added.

## Evidence history

- CI #3738 found a brittle source-order contract only; fixed without runtime pixel change.
- CI #3739 / run `32046365625` passed functional/browser coverage including WebKit/iOS and failed Visual only at six deliberate `REVIEW_REQUIRED` transition states.
- Artifact `9293292461` was downloaded and all six exact PNGs manually reviewed; hashes were approved in commit `be2bf0341bc85bdb3f860e5e7ba3226f2cedbc25`.
- Final CI attempt #3740 / run `32048818693` on that head exposed two independent gates: one unrelated new-tab UI flake and stale dependent visual evidence caused by the intended shared Reminder presentation change.

## #3740 visual classification

Exact Visual artifact `9294131591`, digest `sha256:df25e2d160218fb355a3a5b86a0e1d4883dd3a2bdda5bf335e64cdbb876179b7`, was downloaded. The six new transition contracts passed. Failing pre-existing suites were route/tablet/home/phrases/profile/system contracts that include the shared Reminder.

Manual review confirmed the expected semantic Reminder and no route-shell regression. To rule out hidden tablet drift, exact current 768px captures were pixel-diffed against approved artifact `9291962719` from CI `32040684330`. For all 14 affected states the bounding box of every changed pixel is exactly `x=541..646, y=0..102`; all pixels below the shared Reminder region are identical.

The dependent evidence update therefore:

- re-fingerprints only affected strict route/tablet/phrases/home contracts from #3740;
- preserves Figma-primary fingerprints for Profile/System states and adds reviewed exact renderer-equivalent #577 hashes;
- migrates only the three failing fuzzy states (Home compact, Progress compact and Progress desktop) to exact content-addressed #3740 checks, leaving binary snapshot files untouched;
- changes no runtime/CSS/navigation file.

## #3740 UI classification

Artifact `9294130463`, digest `sha256:a17d8d85ddc961996524a420e224ebe74a0862a4fc19116e6f9ca82d881efde1`, shows `app-router-routes.spec.ts` new-tab navigation timing out while `/learn` navigation was still pending. This file is unchanged by #579 and matches the repository's known same-head new-tab flake class. A same-head failed-job rerun is permitted only after the visual evidence commit if it recurs.

## Delivery procedure

1. Commit reviewed dependent evidence atomically and verify exact branch diff.
2. Require a fully green immutable-head CI; classify any new failure before writing code.
3. Audit PR reviews, review threads, comments and main drift.
4. Mark #579 Ready only on clean evidence and squash merge with `expected_head_sha`.
5. Require full exact-main CI and exact-SHA Stage/public validation.
6. Create a separate Agent Docs-only reconciliation PR, record final developer head/squash/CI/Stage evidence, reset `.agents/current/**` from live templates, merge it, then continue the next live open #205 slice.

## Design provenance

No Figma Cloud editing is used for #577. Repo-owned OpenPencil and Linux GitHub container evidence are authoritative for this runtime defect; existing Figma-approved visual hashes are retained where contracts explicitly model design provenance.
