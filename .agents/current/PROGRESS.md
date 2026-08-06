# Current Task Progress

## 2026-08-06 13:34 Europe/Moscow

### Verified

- Live repository is `Dja-tiger/LexiGo`.
- Live `main` and selected base are `5e2b3e59ac0b34c3e4572bca8a97c656f7e234fb`.
- Main CI #2935 / run `31088745138` completed successfully on the exact base SHA.
- Latest validated deployed product remains `51e3ee5a6ea63146bdb7eb7d0faa9e351c52f56b`; PR #415 and exact-image stage/public validation are complete.
- Open PRs #304, #305 and #403 are unrelated Dependabot maintenance.
- Issue #74 remains open and repository memory selects a bounded canonical `/words/[id]` 200% browser-zoom audit as the next slice.
- Branch `test/issue-74-word-detail-browser-zoom` was created from the exact live base and read back at the same SHA.
- Existing `word-detail-visual.spec.ts` and `profile-reflow.spec.ts` apply `html { font-size: 200% }`; they prove enlarged text, not browser zoom.
- No repository test previously used a persistent Chromium extension context or `chrome.tabs.setZoom`.
- Official Chromium/Playwright contracts support a Manifest V3 extension in `chromium.launchPersistentContext`, `chrome.tabs.setZoom`, `chrome.tabs.getZoom`, and independent CDP `cssVisualViewport.zoom` evidence.

### Finding

The previous automated coverage did not satisfy the remaining Issue #74 browser-zoom criterion. Root-font enlargement leaves the layout viewport unchanged and cannot prove browser-owned page zoom, responsive breakpoint activation or sticky-content behavior under a contracted CSS viewport.

### Root cause

Previous reflow coverage was designed for system/enlarged text and used direct root `font-size` injection. A browser-owned zoom control and independent zoom telemetry were not present in the Playwright harness.

### Implemented test-first audit

- Added a test-only Manifest V3 extension with exact target-URL selection and fail-closed unique-tab ownership.
- The extension normalizes zoom, applies `chrome.tabs.setZoom(tabId, 2)`, and returns `getZoom` plus zoom settings.
- Added an authoritative `visual-desktop` audit to the existing Word Detail visual spec.
- The audit separately verifies CDP `cssVisualViewport.zoom`, unchanged root font size and contracted CSS viewport width.
- Added assertions for single-column reflow, non-sticky knowledge content, horizontal containment, Back/status and term/speech separation, document-order panel placement, visible focus and runtime-error absence.
- Existing root-text reflow coverage and all content-addressed visual hashes remain unchanged.
- No product CSS, runtime, API, session, History, storage, Service Worker or dependency file changed.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/e2e/support/browser-zoom-extension/manifest.json`
- `frontend/e2e/support/browser-zoom-extension/background.js`
- `frontend/e2e/word-detail-visual.spec.ts`

### Checks passed

- Mandatory Agent Harness and architecture reading.
- Live GitHub/main/PR/CI/stage reconciliation.
- Exact branch-base and post-write main-isolation verification.
- Existing Word Detail runtime, CSS, visual/reflow and deterministic fixture inspection.
- External primary-source feasibility check for Chromium extension zoom and Playwright persistent contexts.
- Read-back verification for every changed test file and exact blob SHA.
- Source review confirms no `deviceScaleFactor`, CSS zoom/transform or page-scale emulation is used by the new audit.

### Checks pending

- Frontend lint and TypeScript.
- Targeted visual Chromium execution in the pinned Playwright container.
- Full required CI matrix.
- Review audit, Ready transition, expected-head squash merge and post-merge validation.

### Checks failed

- None yet. The new Chromium extension path has not run in authoritative CI.

### Current branch head

`2bbc926ab49210ee5fc6114d975dd1b67d3ecb2d` before this ledger update.

### Next action

Commit this factual ledger update, open a Draft PR, inspect the first authoritative CI run and distinguish harness defects from any reproduced Word Detail layout defect before changing product CSS.
