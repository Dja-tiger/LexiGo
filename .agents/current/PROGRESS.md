# Current Task Progress

## 2026-08-22 03:16 +03

### Verified

- Repository: `Dja-tiger/LexiGo`.
- Runtime defect: Issue #652.
- Base `main`: `3f60ebf36bee55843936fcf76acd5be1bc3d5a5f`.
- Parent evidence: Issue #642 / Draft PR #645.
- Reconstructed #645 exact head: `93eb5733d6250eb159b76e23862c88b14c9c006f`.
- First fail-closed CI: #3969 / run `32539008972`.
- Visual job `96945407446` failed as designed after all eight new cases reached the exact SHA gate; every other required group, including both UI shards, passed.
- Visual artifact: `9466508067`, digest `sha256:f71fc4f0ab26b565608d622a3cb5f1d8253cedde85d02eb8c5260d318a9468b8`.
- Active OpenPencil desktop loading nodes: `n442` Light / `n614` Dark.

### Finding

Manual review of the exact Linux desktop loading actuals found two note surfaces in runtime while active OpenPencil has one canonical lower desktop note. The extra surface contains the compact copy `Никакие ответы не раскрываются во время загрузки.`.

### Root cause

The initial `.lx-first-use-loading-note--mobile { display: none; }` participates in a grouped rule before `.lx-first-use-note { display: grid; }`. Both selectors have the same specificity, so the later generic note owner wins by source order and re-enables the compact note on desktop. The compact media query was correct; the missing invariant was an explicit desktop reassertion after the generic owner.

### Changed files

Planned atomic slice:

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/app/first-use.css`
- `frontend/components/first-use-route-contract.test.ts`

### Checks passed

- Duplicate issue search found no existing open owner for this exact defect.
- The CSS correction is media-scoped to `min-width: 720px`, leaving compact ownership intact.
- The source contract now verifies that the desktop media boundary occurs after the generic note owner and contains an explicit mobile-note `display: none` rule; compact `display: grid` remains required.

### Checks failed

- CI #3969 Visual regression on #645 intentionally failed at `REVIEW_REQUIRED`; manual review then classified the desktop loading images as invalid for approval because of this product defect.
- No hash from that run is approved or reusable after runtime repair.

### Current branch head

Branch `fix/issue-652-first-use-loading-note-cascade` currently starts at `3f60ebf36bee55843936fcf76acd5be1bc3d5a5f`; resolve final head after the atomic commit.

### Next action

Commit the five-file runtime slice, open Draft PR, require full immutable-head CI, audit the Visual job for unchanged existing baselines, then mark Ready and protected squash-merge. After exact-main CI and exact-SHA Stage/public validation, reconstruct #645 again and recollect all eight loading/error fingerprints.