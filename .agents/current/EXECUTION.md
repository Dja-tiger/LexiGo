# Current Task Execution

## Identity

- Issue: #601
- Parent: #205
- Branch: `test/issue-601-route-browser-zoom-parity`
- PR: #602 (Draft)
- Corrected base: `cb51f7ae8ff4ce0b92c09719c3d7b1c2f5dc960c`
- Pre-approval head: `d04e2bacbb0d5f3ad2b7bc83dd1a251f481e8b20`

## Purpose

Finish the evidence/test-only consolidated true browser-owned 200% zoom audit for ten canonical routes after Issue #603 corrected both the exact-720 ordinary-route responsive boundary and the browser-zoom screenshot coordinate contract.

## Applied procedure

1. Re-read repository GitHub/CI/visual rules and current task scope.
2. Verified live `main`, PR #602 head/base/mergeability, Issue #601, current repository memory and allowed paths.
3. Confirmed no runtime-bearing files are present in the PR.
4. Classified the previous compact/medium failure as a Playwright project-collection defect, not a product regression:
   - the consolidated audit owns a canonical source viewport `1440×900`;
   - true 2× zoom must therefore be exercised only by the canonical desktop project;
   - compact/medium projects now explicitly ignore the consolidated owner.
5. Preserved fail-closed collection/source protection and the delivered #603 visual owner.
6. Ran the new immutable-head CI through GitHub Actions.
7. Verified CI #3845 / Actions run `32224361667` executes `route-browser-zoom-parity.spec.ts` only in `visual-desktop` and reaches exactly two deliberate `REVIEW_REQUIRED` failures after the structural/runtime assertions.
8. Downloaded exact Linux artifact `9355233690`, digest `sha256:3106254cdd3923dc97d7e58cd0d4edf7e6a868f80c78a6a6f55e238a95f763af`.
9. Verified every reported fingerprint against the artifact bytes and PNG dimensions.
10. Manually inspected all 20 corrected Light/Dark 720px captures.
11. Re-evaluated historical focused-route defect reports:
    - corrected Active Lesson Light/Dark captures are complete and contained;
    - corrected Onboarding Light/Dark captures are complete and contained;
    - structural text-range/interactive containment and runtime-error gates passed before capture.
12. Added exact evidence comments to #604/#605 and closed both `not_planned` because their premise depended on the invalidated historical capture path.
13. Prepared the reviewed fingerprint map using the exact Actions run ID and exact evidence-producing head as immutable provenance.

## Review evidence provenance

- CI: #3845
- Actions run: `32224361667`
- Artifact: `9355233690`
- Artifact digest: `3106254cdd3923dc97d7e58cd0d4edf7e6a868f80c78a6a6f55e238a95f763af`
- Evidence-producing head: `d04e2bacbb0d5f3ad2b7bc83dd1a251f481e8b20`
- Source viewport: `1440×900`
- Browser-owned zoom: `2.0`
- Effective layout width: `720px`
- Capture owner: CDP `Page.captureScreenshot`, normalized from `cssVisualViewport.zoom`
- Appearance matrix: explicit Light + Dark
- Routes: Home, Learn, Active Lesson, Progress, Dictionary, Word Detail, Phrases, Phrase Detail, Profile, Onboarding

## Guardrails preserved

- No production CSS/React/backend/deploy/design/workflow changes.
- No force push and no direct write to `main`.
- Existing 320×700, 768×1024, 1440×1024 and Issue #603 reviewed evidence is untouched.
- The `REVIEW_REQUIRED` sentinel remains available for future unreviewed entries; only the 20 exact manually reviewed #601 entries are promoted.
- No tolerance widening, disabled assertion, browser skip or synthetic root-font scaling.
- Review approval is tied to exact Linux bytes, dimensions, artifact ID, Actions run and head SHA.

## Remaining completion gates

- Commit the reviewed fingerprint map and synchronized current-task evidence.
- Fresh full immutable-head CI must be green on the new developer-authored head.
- Review submissions/inline threads must be clean.
- Branch must remain current with `main` and diff must remain inside allowed paths.
- Mark PR #602 Ready only after those gates.
- Squash merge with expected-head protection.
- Validate exact new `main` and exact-main CI.
- Do not redeploy Stage because #601 is a test/evidence-only audit.
- Reconcile `.agents/PROJECT_STATE.md` and reset `.agents/current/**` through the required post-merge repository-memory flow.
