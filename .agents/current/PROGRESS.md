# Current Task Progress

## 2026-08-17 22:14 Europe/Berlin

### Verified

- Live `main` is `d073fcf21707deb73fda6b54b969fcb937673f9f` after docs-only PR #580 reconciliation.
- Issue #581 is open under parent #205.
- Branch `test/issue-581-desktop-route-parity` was created exactly from that main SHA.
- Existing `frontend/e2e/route-tablet-parity.spec.ts` is the authoritative ten-route Light/Dark consolidated matrix for `768×1024` and already owns deterministic route fixtures, ownership geometry, runtime-error capture, reduced-motion and exact Linux evidence.
- Existing `playwright.visual.config.ts` has `visual-desktop` at 1440×900; this task will set `page.setViewportSize({ width: 1440, height: 1024 })` inside its dedicated desktop cases so no new global project duplicates unrelated visual suites.

### Finding

Parent #205 still has no complete consolidated `1440×1024` 10-route desktop runtime/evidence owner. Existing desktop visual coverage is route-specific/partial.

### Root cause

The prior consolidated work intentionally focused on tablet #568 and compact transition #577. Desktop acceptance remained as a parent-level matrix item rather than an atomic executable child contract.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`

### Checks passed

- #579 runtime exact-main CI #3743 and Stage #3598 are green.
- #580 Agent Docs PR CI #3744, exact-main CI #3745 and docs-only Stage scope #3600 are green/skipped as intended.
- Main remained unchanged while initializing #581.

### Checks failed

- None yet. New desktop exact fingerprints have not been generated; their first CI is expected to stop at `REVIEW_REQUIRED`.

### Current branch head

Resolve from live branch ref after this write.

### Next action

Extend the existing consolidated route parity spec with a `1440×1024` desktop matrix, preserving all reviewed tablet fingerprints and using fail-closed `REVIEW_REQUIRED` desktop evidence until Linux artifact review.
