# Current Task Progress

## 2026-08-22 18:25 +03

### Verified

- Repository: `Dja-tiger/LexiGo`.
- Issue: #642; Draft PR: #645.
- Current `main`: `0fce4b690a6fbff95dd2d4ec6c5e725a21700d9d` after Issue #651 Stage-1 reconciliation PR #657.
- Delivered First Use runtime repair remains Issue #647 / PR #648, squash merge `d05c37351d05e3b76a5e0cf9d03c943cf0cbad40`, with exact-main CI `32506357884` and Stage `32507433547` successful.
- Current `main` contains the later desktop CSS reassertion that keeps `.lx-first-use-loading-note--mobile` hidden at desktop width.
- Active OpenPencil source SHA-256 remains `6d73b785aaeb7dda35a53c9c5f16edfc9cbef1092dbce992183538f16505520e`.
- Exact OpenPencil acceptance run `32486519368`, artifact `9448087269`, digest `sha256:6613ec5c6680ff962e2612c366aba454a7ab815212e2b1a763a9f4c085b95689`.
- Canonical nodes: loading `n117/n277/n442/n614`; error `n128/n288/n456/n628`.
- Previous reconstructed head `93eb5733d6250eb159b76e23862c88b14c9c006f` ran CI #3969 / `32539008972`: every gate passed except intentional Visual regression / aggregate frontend failure on `REVIEW_REQUIRED`.
- Previous Visual artifact `9466508067`, digest `sha256:f71fc4f0ab26b565608d622a3cb5f1d8253cedde85d02eb8c5260d318a9468b8`, was manually inspected only as diagnostic evidence and is not eligible for hash approval because that head predates current `main` runtime/CSS.

### Finding

The previous fail-closed run produced stable eight-state evidence, but both desktop loading screenshots still displayed the compact `Никакие ответы...` callout in addition to the canonical desktop note. Current `main` has a later CSS specificity reassertion that fixes exactly this stale-base condition, so the correct next step is to reconstruct #645 again on current `main` and recollect all eight actuals rather than approve any old fingerprint.

### Root cause

PR #645 is an evidence branch whose browser fingerprints are meaningful only for the exact runtime/CSS commit under test. Its prior reconstructed head was based on an older `main`; later delivered CSS changed desktop loading visibility without touching the evidence-test owner. Therefore the old Linux hashes are reproducible for the old head but not authoritative for current production code.

### Changed files

The new single-parent reconstruction contains only:

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/e2e/first-use-visual.spec.ts`

### Checks passed

- Live `main`, PR #645, Issue #642, prior CI and exact artifacts re-audited before writes.
- Existing eight approved First Use fingerprints remain unchanged.
- New eight loading/error fingerprints remain `REVIEW_REQUIRED`.
- Error fixture uses the canonical OpenPencil/runtime copy.
- Compact error assertions are scoped to the `role=alert` panel.
- Desktop error assertions separately verify `.lx-first-use-state-intro` and the alert panel.
- Previous CI #3969 proved the reconstructed test semantics reach the intended fail-closed fingerprint gate; no non-visual job failed.
- Manual comparison of the prior artifact identified the stale desktop loading note discrepancy instead of accepting it.

### Checks failed

No fresh current-main CI has run yet. The next Visual regression is expected to fail only on the eight `REVIEW_REQUIRED` values after publishing fresh PNG/JSON evidence. Any semantic/runtime failure before fingerprint comparison is a reconstruction defect.

### Current branch head

Resolve from live branch ref after the single-parent current-main reconstruction commit is written and the branch is force-moved from `93eb5733d6250eb159b76e23862c88b14c9c006f`.

### Next action

Create one commit with parent `0fce4b690a6fbff95dd2d4ec6c5e725a21700d9d`, force-move `test/issue-642-first-use-loading-error-visual` to that commit, audit the resulting four-file diff, then wait for the fresh immutable CI. Download the new Visual artifact, manually compare all eight PNGs with the exact active OpenPencil renders, and only then replace `REVIEW_REQUIRED` with the reviewed Linux SHA-256 values.
