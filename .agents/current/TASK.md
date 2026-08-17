# Current Task

## Identity

- Issue: #574
- Branch: fix/issue-574-home-progress-spacing
- Base SHA: 580300373bfad88eed5bbaf7b024d004837058fa
- Head SHA: resolve from live branch ref
- PR: pending Draft PR

## Objective

Repair the authenticated Home progress label/value spacing defect reproduced by Issue #568 at `768×1024` without redesigning Home or changing progress semantics.

## Scope

- Fill the responsive presentation gap between compact Home (`<=760px`) and desktop Home (`>=1024px`) for `.lx-progress-list` rows.
- Keep the existing Home markup and data semantics unchanged.
- Add a narrow computed/browser regression proving deterministic label/value separation through the tablet interval.
- Add or reuse exact Linux `768×1024` Light/Dark visual evidence for Home; hashes remain fail-closed until manual artifact review.

## Non-goals

- Approving any Issue #568 / PR #570 consolidated tablet fingerprints.
- Redesigning the Home progress card.
- Changing progress values, labels, API/state/session/history/navigation behavior.
- Modifying OpenPencil/Figma/tokens/screen-map.
- Changing Learn, Phrases, Profile or unrelated route presentation.

## Allowed paths

- `frontend/app/adaptive-knowledge-coach-home.css`
- `frontend/e2e/adaptive-layout-cascade.spec.ts`
- a narrowly scoped Home tablet visual spec under `frontend/e2e/**` if required for explicit Light/Dark evidence
- `frontend/playwright.visual.config.ts` only to collect that narrow visual spec if created
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

## Runtime owners

- `LexigoHomeApp` remains the semantic owner of authenticated Home and its progress values.
- `adaptive-knowledge-coach-home.css` owns the adaptive Home presentation.
- Compact Home remains owned by `compact-home.css` through `max-width:760px`.
- Desktop shell/Home behavior remains owned by existing `min-width:1024px` rules.

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
- No visual fingerprint changes before manual review of the exact Linux artifact.
- Any unexpected unrelated visual change blocks approval rather than being normalized into a new hash.

## Acceptance criteria

- At `768×1024`, every visible Home progress row has deterministic separation between label and value in Light and Dark.
- Computed regression proves the tablet row layout at representative interval boundaries and preserves compact/desktop ownership.
- Existing compact/mobile visual behavior remains unchanged.
- Existing desktop visual behavior remains unchanged.
- Exact Linux Home tablet Light/Dark actuals are manually inspected before any fingerprint write.
- Full immutable-head CI is green after reviewed evidence is committed.
- Review/thread audit is clean and expected-head squash merge succeeds.
- Exact-main CI is green.
- Exact-SHA Stage deploy, public endpoint smoke and public browser validation are green because runtime CSS changes.

## Required checks

- Frontend lint/typecheck/unit/build/dependency audit.
- Browser cascade/responsive contract at `760/761/768/1023/1024` boundaries as appropriate.
- Fail-closed Linux Home tablet Light/Dark visual evidence.
- Full repository immutable-head CI after evidence approval.
- Clean reviews/threads and unchanged `main` before merge.
- Exact-main CI and exact-SHA Stage/public validation after merge.

## Risks

- The old Home medium baseline already encoded the defect; updating it without a fresh Linux review would silently legitimize the bug.
- A broad selector could unintentionally alter compact or desktop Home. The fix must be media-scoped and Home-scoped.
- Full-page visual height may legitimately vary with fixture content; approval is content-addressed, not height-guessed.

## Rollback

Revert the Home-scoped tablet CSS and its regression evidence. Do not revert the independently delivered #572 runtime repair or modify #570 fingerprints as part of rollback.
