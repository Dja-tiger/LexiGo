# Current Task Progress

## 2026-08-06 13:40 Europe/Moscow

### Verified

- Live repository is `Dja-tiger/LexiGo`.
- Live `main` and selected base remain `5e2b3e59ac0b34c3e4572bca8a97c656f7e234fb`.
- Main CI #2935 / run `31088745138` completed successfully on the exact base SHA.
- Latest validated deployed product before this test-only slice remains `51e3ee5a6ea63146bdb7eb7d0faa9e351c52f56b`.
- Issue #74 remains open; this slice covers only the canonical `/words/[id]` true 200% browser-zoom audit.
- Branch `test/issue-74-word-detail-browser-zoom` was created from the exact live base and remained isolated from `main` after every write.
- Draft PR #417 was opened with base `5e2b3e59ac0b34c3e4572bca8a97c656f7e234fb` and pre-ledger head `257f5f222fc29d4964d86c5303c691220d12f678`.
- PR discussion audit returned no issue comments, review submissions or inline review comments.

### Finding

The previous automated coverage did not satisfy the remaining Issue #74 browser-zoom criterion. Root-font enlargement leaves the layout viewport unchanged and cannot prove browser-owned page zoom, responsive breakpoint activation or sticky-content behavior under a contracted CSS viewport.

### Root cause

Previous reflow coverage was designed for system/enlarged text and used direct root `font-size` injection. A browser-owned zoom control and independent zoom telemetry were not present in the Playwright harness.

### Implemented audit

- Added a test-only Manifest V3 extension with exact target-URL selection and fail-closed unique-tab ownership.
- The extension normalizes zoom, applies `chrome.tabs.setZoom(tabId, 2)`, and reports `chrome.tabs.getZoom` plus zoom settings.
- Added an authoritative `visual-desktop` audit to the existing Word Detail visual spec.
- The audit independently verifies CDP `cssVisualViewport.zoom`, unchanged root font size and contracted CSS viewport width.
- Added assertions for single-column reflow, non-sticky knowledge content, horizontal containment, Back/status and term/speech separation, document-order panel placement, visible focus and runtime-error absence.
- Existing root-text reflow coverage and all content-addressed visual hashes remain unchanged.
- No product CSS, runtime, API, session, History, storage, Service Worker, dependency or workflow file changed.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/e2e/support/browser-zoom-extension/manifest.json`
- `frontend/e2e/support/browser-zoom-extension/background.js`
- `frontend/e2e/word-detail-visual.spec.ts`

### Checks passed on pre-ledger head `257f5f222fc29d4964d86c5303c691220d12f678`

- CI #2936 / run `31093355530`: completed successfully.
- Frontend core quality job `92589406580`: lint, TypeScript, unit tests, production build and dependency audit passed.
- Visual regression job `92589715848`: the extension loaded in persistent new-headless Chromium, the browser-owned 200% zoom contract passed, and existing visual hashes remained stable.
- UI shard 1 job `92589715854`: passed.
- UI shard 2 job `92589715849`: passed.
- Performance budgets job `92589715907`: passed.
- Backend integration job `92589406579`: passed.
- Backend unit and security job `92589406597`: passed.
- Remaining required content-security, controlled-Service-Worker, lesson-completion, iOS PWA dictionary, accessibility and dictionary-smoke jobs passed in the same authoritative run.
- Source review confirms the audit uses no `deviceScaleFactor`, CSS zoom/transform or `Emulation.setPageScaleFactor` substitute.
- Read-back verification completed for every changed source/test file and exact blob SHA.
- PR review/discussion audit is empty.

### Result

The canonical Word Detail route already satisfies the true 200% browser-zoom layout contract. The missing production asset was permanent browser-owned zoom evidence, not a CSS remediation. Product presentation and runtime owners remain unchanged.

### Checks pending

- Full required CI on the final Agent Harness evidence head created by this ledger update.
- Ready-for-review transition.
- Final review-thread audit.
- Expected-head squash merge.
- Exact-SHA main CI and repository-required post-merge validation.
- Separate post-merge reconciliation of `.agents/PROJECT_STATE.md` and reset of `.agents/current/**`.

### Checks failed

- None.

### Current branch head

`257f5f222fc29d4964d86c5303c691220d12f678` before this final evidence commit.

### Next action

Commit and read back the final evidence ledger, run the complete authoritative matrix on the resulting immutable head, then mark PR #417 Ready and squash-merge only with the expected head SHA.
