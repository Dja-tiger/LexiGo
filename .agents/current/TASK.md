# Current Task

## Identity

- Issue: #568
- Branch: test/issue-568-tablet-parity
- Base SHA: f614c1646f113e1303286ca3cc759a87e6dd74d5
- Head SHA: resolve from live branch ref
- PR: #570

## Objective

Complete the consolidated medium/tablet `768×1024` Light/Dark responsive parity audit for all ten canonical routes on the runtime delivered by #575 and the Agent Harness reconciliation delivered by #576, with fresh exact Linux evidence and no inherited visual approval.

## Scope

- Reconstruct `frontend/e2e/route-tablet-parity.spec.ts` from the existing #568 fail-closed contract on exact current `main`.
- Preserve the #575 Home tablet runtime fix and its independent strict Home visual contract.
- Collect all ten canonical routes in explicit Light/Dark through the existing `visual-medium` Playwright project.
- Verify pathname, semantic route owner, RouteChrome/focused-route boundary, exact viewport, horizontal geometry, visible-focusable clipping and runtime errors before screenshot approval.
- Attach content-addressed PNG/JSON evidence and leave all 20 states at `REVIEW_REQUIRED` until the exact Linux artifact is manually inspected.

## Non-goals

- Runtime UI/CSS/component changes in this evidence PR.
- Backend/API/schema/session/history changes.
- OpenPencil/Figma/token/screen-map changes.
- Reusing pre-#575 dimensions or hashes as post-fix approval.
- Closing unrelated #205 dimensions.

## Allowed paths

- `frontend/e2e/route-tablet-parity.spec.ts`
- `frontend/playwright.visual.config.ts`
- `.agents/current/**`
- A narrowly scoped existing test fixture/helper only if fresh evidence proves the fixture itself stale and the classification is recorded before writing.

## Prohibited paths

- `frontend/app/**` runtime files
- `frontend/components/**`
- `backend/**`
- API/schema/auth/session/history owners
- `design/**`
- `docs/figma/openpencil-screen-map.json`
- `.github/workflows/**`
- deploy configuration
- unrelated tests
- blind snapshot/hash update mechanisms

## Runtime owners

- `LexigoHomeApp` for authenticated `/`.
- `LexigoLearnApp` for `/learn`.
- `LexigoActiveLessonApp` for `/lesson/active`.
- `LexigoProgressApp` for `/progress`.
- `LexigoDictionaryApp` for `/dictionary` and `/words/[id]`.
- `LexigoPhrasesApp` for `/phrases` and `/phrases/[slug]`.
- `LexigoProfileApp` for `/profile`.
- `LexigoOnboardingApp` for `/onboarding`.
- `RouteChrome` for ordinary route navigation; Active Lesson and Onboarding remain focused routes.

## Documentation owners

- Issue #568 acceptance contract.
- `.agents/PROJECT_STATE.md` from reconciliation PR #576.
- `.agents/current/**` for this atomic audit execution.

## Invariants

- `768×1024` is responsive runtime interpolation, not a fabricated canonical tablet design node.
- All 20 states begin unapproved after reconstruction.
- The #575 Home spacing repair and `home-tablet-progress-visual.spec.ts` remain present on the reconstructed base.
- Explicit Light/Dark and reduced-motion deterministic runtime remain active.
- Test data remains runtime-truthful.
- Structural assertions pass before the screenshot hash gate.
- No fingerprint is committed before direct review of the exact Linux PNG that produced it.
- `--update-snapshots` is not an approval mechanism.
- Any new product defect is split into a separate runtime Issue/PR.

## Acceptance criteria

- Ten canonical routes × Light/Dark produce deterministic fresh Linux evidence.
- Every capture proves semantic owner, route shell ownership and horizontal geometry.
- All 20 exact Linux PNGs are manually reviewed after #575.
- Only reviewed dimensions/SHA-256 values are committed with exact source run/head provenance.
- Full immutable-head CI is green after approval.
- Review/thread audit is clean, expected-head squash merge succeeds and exact-main CI is green.
- Stage redeploy is not required if the PR remains evidence-only.

## Required checks

- First reconstructed Visual run must fail only at intentional `REVIEW_REQUIRED` after structural checks pass.
- Exact artifact download and manual review of all 20 PNGs.
- Full repository immutable-head CI after fingerprint approval.
- Clean review/thread audit and live `main` drift check before merge.
- Exact-main CI after merge.

## Risks

- A real responsive defect may still exist on another route; it must block approval rather than become a new hash.
- Draft PR #569 overlaps structural tablet coverage; it must not become a competing authoritative evidence path.
- Full-page heights are content-addressed evidence, not assumed from viewport height.

## Rollback

Revert the evidence-only audit changes. Do not roll back independently delivered runtime PRs #572/#575.
