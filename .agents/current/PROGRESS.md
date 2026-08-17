# Current Task Progress

## 2026-08-17 Europe/Berlin

### Verified

- Issue #574 is open and Draft PR #575 is the atomic runtime delivery path.
- Runtime base/current `main` is `580300373bfad88eed5bbaf7b024d004837058fa` at the last pre-approval drift check.
- #568 / Draft PR #570 remains intentionally fail-closed; no consolidated tablet fingerprints are approved by #574.
- Exact #570 evidence that reproduced the Home defect: head `7f6efef0d3832e095900b571708f7788760d76e5`, CI #3719 / run `32003874006`, artifact `9279509833`, digest `sha256:be73d655914078a78ddf78872432861ba19a4fb367e04e5cf13b362c40bc4303`.
- Source root cause is adjacent `<span>`/`<strong>` metric siblings with row flex ownership only through compact `max-width:760px`; no equivalent row layout existed at 768px.
- Existing `home-visual-medium-linux.png` on `main` already encodes the defect and therefore cannot be treated as valid approval after the fix.

### Implemented

- Added `frontend/app/home-tablet-progress-spacing.css`, scoped only to authenticated Home progress rows at `761px–1023px`.
- Imported the companion immediately after `adaptive-knowledge-coach-home.css`.
- Added `frontend/e2e/home-tablet-progress-visual.spec.ts` and registered it in the authoritative Visual regression collection.
- Synthetic boundary coverage is `760/761/768/1023/1024`.
- Real-route evidence covers `768×1024` Light/Dark, reduced motion, runtime errors, horizontal overflow, label/value separation and partially clipped focusable controls.
- Commit `495c7681a8c2e85ee6b5c454e40b84006faadeb0` repaired only the synthetic 760px fixture by reproducing the real compact selector `.lx-home-next-action`; runtime CSS was not changed by that classification.

### Immutable evidence after fixture repair

- CI #3728 / run `32006920077` ran on exact head `495c7681a8c2e85ee6b5c454e40b84006faadeb0`.
- Core/backend/browser collections passed; the Visual job failed only at the two deliberate `REVIEW_REQUIRED` Home Light/Dark strict fingerprints.
- The boundary contract passed, including 760px compact ownership and the 761–1023px companion interval.
- Exact Linux Visual artifact: `9280469563`.
- Artifact digest: `sha256:abac6b119734b77795ec3d0838afb092405dc9f12568ac892e213288df233847`.

### Manual Linux review

The exact artifact was downloaded and the attached full-page PNGs were inspected directly before approving any hash:

- Home Light: `768×1105`, SHA-256 `08d213c5fa280702abadc675476e8f4197c100ffd9011eb0d5a7f5772bab9d8e`.
- Home Dark: `768×1105`, SHA-256 `d2ca7909b3a0f3480f28af24f9d734f0c641cc5f1ebc174108a408cbefb40bbc`.
- Retry captures reproduced the same dimensions and SHA-256 values.
- All three progress rows have visible label/value separation in both appearances.
- No horizontal clipping/overflow or unrelated visible Home regression was found.
- The masked Profile control is expected evidence-harness behavior and is identical in the reviewed strict capture procedure.

### Legacy fuzzy medium snapshot classification

- The legacy `home-visual-medium-linux.png` still shows the old concatenated label/value defect.
- Its generic `toHaveScreenshot` assertion did not emit an exact mismatch in CI #3728 because the configured pixel-diff tolerance is broad enough to accept this localized change.
- Therefore there is no exact Linux actual from that assertion that can be safely used to replace its binary snapshot.
- No blind binary snapshot update is permitted. The old binary remains historical fuzzy evidence, not the #574 approval source.
- `home-tablet-progress-visual.spec.ts` is the strict content-addressed Home medium regression owner and records exact dimensions/SHA-256/run/head provenance.

### Changed files in #575

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/app/home-tablet-progress-spacing.css`
- `frontend/app/layout.tsx`
- `frontend/e2e/home-tablet-progress-visual.spec.ts`
- `frontend/playwright.visual.config.ts`

### Current state

Reviewed Light/Dark content-addressed fingerprints are approved for commit from exact Linux artifact `9280469563`. No #568/#570 hash and no legacy fuzzy Home binary snapshot is approved by this review.

### Next action

Commit only the reviewed strict fingerprints plus factual Agent Harness evidence, run a new full immutable-head CI, audit reviews/threads and diff scope, then Ready → expected-head squash merge only if all required checks are green and `main` has not moved. After merge run exact-main CI and exact-SHA Stage/public validation, then perform a separate docs-only Agent Harness reconciliation before rebuilding #568/#570 on the delivered runtime.
