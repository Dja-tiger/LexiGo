# Current Task

## Identity

- Issue: #574
- Branch: fix/issue-574-home-progress-spacing
- Base SHA: 580300373bfad88eed5bbaf7b024d004837058fa
- Head SHA: resolve from live branch ref
- PR: #575

## Objective

Repair the authenticated Home progress label/value spacing defect reproduced by Issue #568 at `768×1024` without redesigning Home or changing progress semantics.

## Scope

- Fill the responsive presentation gap between compact Home (`<=760px`) and desktop Home (`>=1024px`) for `.lx-progress-list` rows.
- Keep the existing Home markup and data semantics unchanged.
- Add a narrow computed/browser regression proving deterministic label/value separation through the tablet interval.
- Add exact Linux `768×1024` Light/Dark visual evidence for Home with strict content-addressed dimensions/SHA-256 and immutable run/head provenance.
- Use a route-scoped companion stylesheet imported immediately after the adaptive Home owner to avoid rewriting unrelated Home presentation.

## Non-goals

- Approving any Issue #568 / PR #570 consolidated tablet fingerprints.
- Redesigning the Home progress card.
- Changing progress values, labels, API/state/session/history/navigation behavior.
- Modifying OpenPencil/Figma/tokens/screen-map.
- Changing Learn, Phrases, Profile or unrelated route presentation.
- Blindly replacing the legacy fuzzy `home-visual-medium-linux.png` snapshot. It already encodes the defect and is not an approval source for #574.

## Allowed paths

- `frontend/app/home-tablet-progress-spacing.css`
- `frontend/app/layout.tsx` only to import the companion stylesheet next to its Home owner
- `frontend/e2e/home-tablet-progress-visual.spec.ts`
- `frontend/playwright.visual.config.ts` only to collect the narrow #574 visual spec
- `.agents/current/**`

## Prohibited paths

- `frontend/components/**`
- unrelated `frontend/app/**`
- `backend/**`
- API/schema/auth/session/history/navigation owners
- `design/**`
- `docs/figma/openpencil-screen-map.json`
- `.github/workflows/**`
- deploy configuration
- Issue #568 / PR #570 fingerprint approval
- blind snapshot/hash update mechanisms
- `frontend/e2e/visual-regression.spec.ts-snapshots/home-visual-medium-linux.png` unless a separate exact Linux actual from that exact assertion is manually reviewed first

## Runtime owners

- `LexigoHomeApp` remains the semantic owner of authenticated Home and its progress values.
- `adaptive-knowledge-coach-home.css` remains the base adaptive Home presentation owner.
- `home-tablet-progress-spacing.css` owns only the missing `761px–1023px` progress-row layout interval.
- Compact Home remains owned by `compact-home.css` through `max-width:760px`.
- Desktop shell/Home behavior remains owned by existing `min-width:1024px` rules.
- `home-tablet-progress-visual.spec.ts` is the strict content-addressed Home medium acceptance owner because the older generic pixel-diff snapshot can pass while retaining this localized defect.

## Documentation owners

- Issue #574 acceptance contract.
- `.agents/current/**` task-local evidence.
- `.agents/PROJECT_STATE.md` only after runtime delivery through the separate post-merge reconciliation slice.

## Invariants

- Fix presentation with CSS; do not alter Home metric markup or content unless CSS proves insufficient.
- `<=760px` compact behavior must remain unchanged.
- `>=1024px` desktop behavior must remain unchanged.
- Tablet fill interval is `761px–1023px`; `768px` must have complete, readable label/value separation.
- No horizontal overflow or partially clipped focusable controls.
- Light/Dark and reduced-motion runtime remain truthful.
- No visual fingerprint or binary snapshot changes before manual review of the exact Linux artifact.
- Any unexpected unrelated visual change blocks approval rather than being normalized into a new hash.

## Reviewed evidence

Exact immutable-head evidence after the synthetic boundary fixture repair:

- head: `495c7681a8c2e85ee6b5c454e40b84006faadeb0`
- CI: #3728 / run `32006920077`
- Linux Visual artifact: `9280469563`
- artifact digest: `sha256:abac6b119734b77795ec3d0838afb092405dc9f12568ac892e213288df233847`
- Home Light: `768×1105`, SHA-256 `08d213c5fa280702abadc675476e8f4197c100ffd9011eb0d5a7f5772bab9d8e`
- Home Dark: `768×1105`, SHA-256 `d2ca7909b3a0f3480f28af24f9d734f0c641cc5f1ebc174108a408cbefb40bbc`

Both exact Linux PNGs were manually inspected. Label/value separation is restored, no clipping/overflow is visible, no unrelated Home change was found, and retry captures reproduced the same dimensions and hashes. The legacy generic Home medium assertion did not emit an exact mismatch because its tolerance masked the localized change, so its old binary is intentionally not replaced in this slice.

## Acceptance criteria

- At `768×1024`, every visible Home progress row has deterministic separation between label and value in Light and Dark.
- Computed regression proves the tablet row layout at representative interval boundaries and preserves compact/desktop ownership.
- Existing compact/mobile visual behavior remains unchanged.
- Existing desktop visual behavior remains unchanged.
- Exact Linux Home tablet Light/Dark actuals are manually inspected before strict fingerprints are committed.
- The strict Home medium contract reproduces the reviewed dimensions/SHA-256 on the final developer-authored head.
- Full immutable-head CI is green after reviewed evidence is committed.
- Review/thread audit is clean and expected-head squash merge succeeds.
- Exact-main CI is green.
- Exact-SHA Stage deploy, public endpoint smoke and public browser validation are green because runtime CSS changes.

## Required checks

- Frontend lint/typecheck/unit/build/dependency audit.
- Browser cascade/responsive contract at `760/761/768/1023/1024` boundaries.
- Strict content-addressed Linux Home tablet Light/Dark visual evidence.
- Existing fuzzy `home.png` medium snapshot must not be treated as approval for #574.
- Full repository immutable-head CI after evidence approval.
- Clean reviews/threads and unchanged `main` before merge.
- Exact-main CI and exact-SHA Stage/public validation after merge.

## Risks

- The old Home medium baseline already encoded the defect and its broad Playwright tolerance can mask this targeted spacing change; the dedicated strict hash contract prevents recurrence.
- A broad selector could unintentionally alter compact or desktop Home. The fix must be media-scoped and Home-scoped.
- Full-page visual height may legitimately vary with fixture content; approval is content-addressed, not height-guessed.

## Rollback

Revert the Home-scoped tablet companion CSS/import and its strict regression evidence. Do not revert the independently delivered #572 runtime repair or modify #570 fingerprints as part of rollback.
