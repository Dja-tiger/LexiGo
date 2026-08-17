# Current Task Execution

## Task

- Issue: #577
- Parent: #205
- Branch: `fix/issue-577-route-runtime`
- Base SHA: `e25cee1b2ef991aff9ea5a27f63d170e1bc8d1b7`
- Runtime reviewed-source head: `43e80f5b1b0d6c778f53147ba6a115fefc94df0b`
- First evidence-approval head: `be2bf0341bc85bdb3f860e5e7ba3226f2cedbc25`
- Dependent evidence head: `d31419799272e5fbb697980eb6c976f7aa05b6b7`
- PR: #579 Draft

## Runtime implementation

- Library navigation writes canonical `dictionary` ownership.
- Compact Materials owns equal 48px minimum targets, nowrap labels and no document x-overflow.
- Shared `CalendarReminderRouteEntry` keeps one semantic owner/geometry and uses `--ak-*` appearance tokens rather than legacy dark/blue hardcodes.
- Dictionary/Phrases transition/history and Learn Home-transition/history/reload browser contracts are executable in the normal browser matrix, including WebKit/iOS.
- Six 390×844 Light/Dark transition-derived content-addressed states are enforced.

## Evidence chain

1. CI #3739 / run `32046365625`, head `43e80f5b…`: functional/browser matrix green; Visual failed only at six deliberate `REVIEW_REQUIRED` states. Exact artifact `9293292461`, digest `sha256:fedbe32158ef6199005c1f11b834a2974f5bbef4291d4738f4b7069d1e1e2483`, was manually reviewed and approved at `be2bf034…`.
2. CI #3740 / run `32048818693`, head `be2bf034…`: six new #577 baselines passed. Old visual contracts failed only because intended shared Reminder pixels changed. Artifact `9294131591`, digest `sha256:df25e2d160218fb355a3a5b86a0e1d4883dd3a2bdda5bf335e64cdbb876179b7`, was reviewed. Differential proof against artifact `9291962719` showed the 14 affected 768px states differ only within `x=541..646, y=0..102`; all lower pixels are identical. Evidence-only commit `d3141979…` reconciled those contracts.
3. #3740 also had one unrelated unchanged `app-router-routes.spec.ts` new-tab timing flake, diagnostics artifact `9294130463`, digest `sha256:a17d8d85ddc961996524a420e224ebe74a0862a4fc19116e6f9ca82d881efde1`.
4. CI #3741 / run `32053496642`, head `d3141979…`: Visual produced `113 passed`, `198 skipped`, `1 failed`; all suites except Profile compact Light passed. Exact artifact `9295711128`, digest `sha256:fa96254d31f7b4fdb97c30d7311085aa968d4d2b61e78141d7a071a2c8bc56b2`, was downloaded and the failing `390×844` PNG manually inspected. It is byte-stable across retry at SHA-256 `b2fc018f0c1a86e484d33405c334b7f70a9b658bee5f235c532cebfefee551b0`.
5. Pixel comparison against #3740 Profile compact Light SHA `821083de2f8a57488671ef2e4014384b8ad5dd531a5f9d96c52e5409cbf1b8e9` found only 4 pixels changed, bbox `x=272..321, y=7..21`, max RGB delta 1 LSB, all on an antialiased Reminder edge. Both exact hashes are allowed as scoped renderer-equivalent fingerprints. No numerical tolerance, runtime modification or broad snapshot rewrite is permitted.

## Current write

Create one atomic evidence-correction commit from parent `d31419799272e5fbb697980eb6c976f7aa05b6b7` containing only:

- `frontend/e2e/profile-visual.spec.ts` — add the independently reviewed `b2fc018f…` compact-Light renderer-equivalent hash while retaining `821083de…`.
- `.agents/current/PROGRESS.md` and `.agents/current/EXECUTION.md` — record #3741 provenance and pixel-diff classification.

## Delivery procedure

1. Read back/compare the correction commit and confirm no runtime/CSS/navigation file changed.
2. Require full immutable-head CI green. Classify any failure before changing code; only the already-proven unrelated new-tab flake may receive same-head failed-job rerun if it recurs identically.
3. Audit PR reviews, review threads, comments and main drift.
4. Mark #579 Ready and squash merge with `expected_head_sha` only after green CI.
5. Require exact-main full CI and exact-SHA Stage/public validation.
6. Create a separate Agent Docs-only reconciliation PR, reset `.agents/current/**` from live templates, merge it, then continue the next live #205 slice.

## Design provenance

No Figma Cloud editing is used for #577. Repo-owned OpenPencil mapping and exact Linux runtime artifacts are authoritative for this defect; Figma-primary visual fingerprints remain preserved where the suites model design provenance.
