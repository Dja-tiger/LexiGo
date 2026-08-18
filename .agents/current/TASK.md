# Current Task

## Identity

- Issue: #593
- Branch: `fix/issue-593-profile-auto-light-theme`
- Base SHA: `f1cfa074ffe25db6e253b60b6b3c5970ba8dda03`
- Head SHA: resolve from live branch ref after final evidence commit
- PR: #597

## Objective

Restore one semantic Profile theme owner at the real 430px iOS/WebKit gap so Auto follows the resolved system appearance instead of mixing Light Profile tokens with the legacy dark document/account canvas.

## Scope

- Preserve explicit Light/Dark document canvas ownership globally while applying resolved Auto canvas ownership only to the Profile route.
- Extend the existing Profile compatibility bridge in `appearance.css` so legacy account/security presentation follows resolved Light/Dark state.
- Keep the Profile legal footer on the resolved-Light semantic contrast token.
- Add source-level ownership regression coverage.
- Add a dedicated blocking 430×932 Auto/system-Light and Auto/system-Dark `ios-webkit` regression, including computed canvas/token ownership and exact screenshot evidence.
- Preserve direct entry, reload, client navigation and Back/Forward theme ownership.
- Preserve canonical explicit Light/Dark route and Profile visual contracts without updating their fingerprints.

## Non-goals

- No backend/API/account behavior changes.
- No broad legacy CSS rewrite.
- No Figma Cloud edits or active OpenPencil source changes unless runtime evidence proves the design source itself is wrong.
- No blind update of existing visual fingerprints.

## Allowed paths

- `frontend/app/appearance.css`
- `frontend/components/profile-theme-ownership.test.ts`
- `frontend/e2e/profile-auto-theme.spec.ts`
- `frontend/package.json`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- `frontend/app/globals.css`
- `frontend/app/premium-ui.css`
- `frontend/app/profile.css`
- `frontend/app/layout.tsx`
- `frontend/e2e/profile-visual.spec.ts`
- backend/API/schema code
- `.github/workflows/**`
- `design/openpencil/**`
- existing canonical Profile fingerprint values

## Runtime owners

- `frontend/lib/appearance-preference.ts` owns stored preference resolution and `data-lexigo-resolved-appearance`; runtime behavior remains unchanged.
- `frontend/app/appearance.css` owns explicit global document presentation plus the narrow resolved-Auto Profile canvas and resolved Profile compatibility bridges.
- `frontend/package.json` routes the dedicated regression into the existing blocking UI shard command; no workflow change is required.

## Documentation owners

- `.agents/current/**` for active-task evidence.

## Invariants

- Auto/system-Light must resolve to the same semantic Profile palette as explicit Light.
- Auto/system-Dark must resolve to the same semantic Profile palette as explicit Dark.
- Switching system resolution in Auto must not require reload to repair the Profile canvas.
- Unrelated routes must retain their established Auto canvas behavior.
- Existing explicit Light/Dark canonical visual baselines remain unchanged.
- No hard-coded heading color or broad `!important` workaround.

## Acceptance criteria

- 430px Auto + system Light has semantic Light `html/body/Profile` canvas and no navy legacy document/account background.
- 430px Auto + system Dark has one coherent Dark palette with no Light leakage.
- Profile account/security compatibility surfaces follow resolved Light/Dark state.
- Profile legal-footer text keeps accessible resolved-Light contrast.
- Computed `html`, `body`, semantic tokens and Profile compatibility owners agree with resolved appearance.
- Direct entry, reload, Home→Profile navigation and real Back/Forward preserve ownership.
- Existing canonical route/Profile visual contracts stay green without baseline edits.
- Approved 430×932 Linux WebKit baseline is pinned to CI run `32141138160`, source head `03832a62e2bfe064cabce6dc81fe333e8af6dd80`, and screenshot SHA-256 `2f0740a996c7198811e66dd77a8d5a845d4ca285d9a6f4350ae74e3635c98b35`.
- Full immutable final-head CI succeeds, followed by pre-merge drift/review checks, exact-main CI and exact-SHA Stage/public validation.

## Required checks

- Source ownership unit contract.
- Dedicated 430px `ios-webkit` browser/computed-style contract for Auto Light/Dark in blocking UI CI.
- Existing Profile functional tests.
- Existing canonical visual regression suite.
- Accessibility audit.
- Full immutable-head CI on the approved final fingerprint commit.
- Pre-merge diff/review/main-drift audit.
- Exact-main CI and exact-SHA Stage/public gate after merge.

## Risks

- Over-broad resolved selectors could change unrelated route presentation.
- Compatibility selectors may hide an actual legacy owner rather than resolve it.
- Auto bootstrap/navigation timing could create a transient stale canvas if only post-hydration state is tested.
- Content-addressed screenshots are invalid if run/head provenance is not preserved exactly.

## Rollback

Revert the atomic #593 theme-ownership merge; account/API behavior remains unaffected.
