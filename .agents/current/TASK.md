# Current Task

## Identity

- Issue: #593
- Branch: `fix/issue-593-profile-auto-light-theme`
- Base SHA: `f1cfa074ffe25db6e253b60b6b3c5970ba8dda03`
- Head SHA: resolve from live branch ref
- PR:

## Objective

Restore one semantic Profile theme owner at the real 430px iOS/WebKit gap so Auto follows the resolved system appearance instead of mixing Light Profile tokens with the legacy dark document/account canvas.

## Scope

- Make document canvas ownership follow `data-lexigo-resolved-appearance` for Auto, explicit Light and explicit Dark.
- Make Profile legacy account/security compatibility palette follow the resolved appearance instead of explicit-Light-only state.
- Add source-level ownership regression coverage.
- Add a dedicated 430px Auto/system-Light and Auto/system-Dark browser regression, including computed canvas/token ownership and exact screenshot evidence.
- Preserve direct entry, reload, client navigation and Back/Forward theme ownership.
- Preserve canonical 390×844 and 1440×1024 explicit Light/Dark Profile contracts.

## Non-goals

- No backend/API/account behavior changes.
- No broad legacy CSS rewrite.
- No Figma Cloud edits or active OpenPencil source changes unless runtime evidence proves the design source itself is wrong.
- No blind update of existing Profile visual fingerprints.

## Allowed paths

- `frontend/app/appearance.css`
- `frontend/app/profile.css`
- `frontend/components/profile-theme-ownership.test.ts`
- `frontend/e2e/profile-visual.spec.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- `frontend/app/globals.css`
- `frontend/app/premium-ui.css`
- backend/API/schema code
- `.github/workflows/**`
- `design/openpencil/**`
- existing canonical 390/1440 Profile fingerprint values unless exact reviewed evidence demonstrates an intentional change

## Runtime owners

- `frontend/lib/appearance-preference.ts` owns preference resolution and the `data-lexigo-resolved-appearance` runtime attribute; no behavior change is expected there.
- `frontend/app/appearance.css` owns resolved document canvas application.
- `frontend/app/profile.css` owns Profile-specific compatibility presentation.

## Documentation owners

- `.agents/current/**` for active-task evidence.

## Invariants

- Auto/system-Light must resolve to the same semantic visual palette as explicit Light.
- Auto/system-Dark must resolve to the same semantic visual palette as explicit Dark.
- Switching preference/system resolution must not require reload to repair the canvas.
- Existing explicit Light/Dark canonical Profile baselines remain unchanged unless reviewed evidence proves otherwise.
- No hard-coded heading color or broad `!important` workaround.

## Acceptance criteria

- 430px Auto + system Light has semantic Light `html/body/Profile` canvas and no navy legacy document background.
- 430px Auto + system Dark has one coherent Dark palette with no Light leakage.
- Profile account/security compatibility surfaces follow resolved Light/Dark state.
- Computed `html`, `body`, semantic tokens and Profile compatibility owners agree with resolved appearance.
- Direct entry, reload, Home→Profile navigation and real Back/Forward preserve ownership.
- 390×844 and 1440×1024 explicit Light/Dark Profile contracts stay green.
- Exact 430px Linux/WebKit screenshot evidence is manually reviewed before any new content-addressed fingerprint is approved.
- Full immutable-head CI succeeds, followed by exact-main CI and exact-SHA Stage/public validation.

## Required checks

- Source ownership unit contract.
- Dedicated 430px browser/computed-style contract for Auto Light/Dark.
- Existing Profile functional tests.
- Existing Profile canonical visual baselines.
- Full immutable-head CI and manual review of any new fail-closed visual evidence.
- Pre-merge diff/review/main-drift audit.
- Exact-main CI and exact-SHA Stage/public gate after merge.

## Risks

- Over-broad resolved selectors could change unrelated route presentation.
- Compatibility selectors may hide an actual legacy owner rather than resolve it.
- Auto bootstrap/navigation timing could create a transient stale canvas if only post-hydration state is tested.

## Rollback

Revert the atomic #593 theme-ownership merge; account/API behavior remains unaffected.
