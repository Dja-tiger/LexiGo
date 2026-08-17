# Current Task Execution

## Task

- Issue: #577
- Branch: `fix/issue-577-route-runtime`
- Base SHA: `e25cee1b2ef991aff9ea5a27f63d170e1bc8d1b7`
- Reviewed-source head: `43e80f5b1b0d6c778f53147ba6a115fefc94df0b`
- PR: #579 Draft

## Skills used

### GitHub repository workflow

Instruction source: `skills://plugins/github/github/skill.md`, read live 2026-08-17.

Purpose: inspect live repository state, prove runtime ownership/root causes, create immutable evidence, and deliver #577 through CI, review audit, expected-head merge, exact-main and exact-SHA Stage/public validation.

## Actions performed

- Reconciled completed tablet audit through #578 before starting this runtime slice.
- Created `fix/issue-577-route-runtime` from exact reconciled main.
- Proved Library navigation emitted `product` for `/dictionary` and that existing Dictionary E2E encoded the compatibility fallback.
- Proved compact Materials and shared Reminder presentation owners from current source.
- Verified Dictionary/Learn UI specs already run in the normal Playwright matrix including `ios-webkit`.
- Verified OpenPencil compact provenance: Dictionary `fig_4008`, Phrases `fig_7281`, Learn `fig_6826`.
- Changed Library graph hint to `dictionary`.
- Added compact Materials no-wrap/equal-target geometry.
- Replaced Reminder hardcoded legacy dark/blue colors with semantic tokens.
- Rewrote Dictionary transition/history contract and added Learn Home-transition/history/reload contract.
- Added six fail-closed transition-derived Light/Dark visual states at 390×844.
- Opened Draft PR #579.

## CI history

- CI #3738 / run `32046134501` stopped on an existing source-order unit contract after `min-width` was placed before the required literal `min-height: 48px`; this was not a runtime pixel defect.
- Commit `43e80f5b1b0d6c778f53147ba6a115fefc94df0b` restored the source-contract order without changing runtime behavior.
- CI #3739 / run `32046365625` then passed the functional/browser matrix, including both UI shards and WebKit/iOS.
- Visual job `95435654939` failed exactly at the six intentional `REVIEW_REQUIRED` gates: `30 passed`, `62 skipped`, `6 failed`; no additional structural/runtime/token/geometry defect was present.

## Exact visual evidence

- Run: `32046365625` (CI #3739).
- Source head: `43e80f5b1b0d6c778f53147ba6a115fefc94df0b`.
- Artifact: `9293292461`, `frontend-playwright-report-visual`.
- Artifact digest: `sha256:fedbe32158ef6199005c1f11b834a2974f5bbef4291d4738f4b7069d1e1e2483`.
- Dictionary Light: `390×1197`, `4487459cea3e1347768e381ce393aeeecfb3f1e22b47e01554810cb6508b556d`.
- Dictionary Dark: `390×1197`, `9104709d0b7f742ae22f18bacfe605a7658eb0db0b539e93b597ff8779cd855c`.
- Phrases Light: `390×1616`, `91cc3fabe4cc7369e1c67992a28d4199b0a68028e354098fe17a78f5ddf93318`.
- Phrases Dark: `390×1616`, `066a3ba05e676501a6025214567bdbdd901c8b820e8cb632003e5fc44a00b6b9`.
- Learn Light: `390×1212`, `95e13c8164fea6ff0ba9ab0ae6032e4d01d4e9108d6fde79c3edef89fdff3169`.
- Learn Dark: `390×1212`, `012800cae78c9639a97908b7a1d687e8b4893f47cc2cf615ecb6d04667827dc5`.

## Manual artifact review

The exact job log was matched against exact artifact bytes. Each PNG's dimensions and SHA-256 matched the `REVIEW_REQUIRED` diagnostic and retry. All six PNGs were opened and inspected manually.

- Dictionary Light/Dark: canonical Dictionary shell after SPA navigation; stable one-line Materials; no relevant clipping/x-overflow or legacy fallback.
- Phrases Light/Dark: canonical Phrases shell after Dictionary→Phrases transition; stable one-line Materials; no relevant clipping/x-overflow.
- Learn Light/Dark: canonical Learn shell; Reminder disclosure open; semantic appearance-specific surface/text/primary tokens; no legacy dark presentation in Light.
- The magenta rectangle is an intentional Playwright mask over the profile button, explicitly configured by the evidence spec.

Result: all six exact Linux fingerprints are approved for content-addressed enforcement.

## Root cause conclusion

The proven route lifecycle defect was the wrong graph identity emitted by primary Library navigation. After that fix, executable Home→Learn and history evidence remained green, so broader bootstrap canonicalization was not justified and was intentionally omitted. Materials and Reminder were separate scoped presentation defects.

## Next procedure

- Create one atomic evidence-approval commit containing only `frontend/e2e/route-transition-runtime-visual.spec.ts` and `.agents/current/**`.
- Read back changed blobs and compare branch diff; require no runtime/snapshot mutation in the approval commit.
- Run full immutable-head CI and classify any failure before changing code.
- Audit PR reviews, review threads and comments plus main drift; Ready only on clean evidence.
- Squash merge with `expected_head_sha`.
- Require exact-main full CI and Stage/public validation that deploys exactly the squash SHA.
- Create a separate Agent Docs-only reconciliation PR, reset `.agents/current/**` to live templates, then continue the next live open #205 parity task.

## Limitations

Figma Cloud is intentionally excluded by #577; repo-owned OpenPencil plus Linux runtime evidence is authoritative for this slice. Physical-device sign-off is outside automated CI, but `ios-webkit` transition coverage is mandatory and passed on #3739.