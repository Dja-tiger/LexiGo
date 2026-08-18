# Current Task Progress

## 2026-08-18 20:20 +03:00

### Verified

- Live `main` is `b1444d5e5153da9b8fe275b7f1f175e9bd25286b` after Issue #583 reconciliation PR #600.
- There are no open PRs before starting this slice.
- Umbrella #205 remains open.
- Consolidated 320×700 (#587/#588), 768×1024 (#568/#570) and 1440×1024 (#581) route-parity dimensions are already delivered.
- `browser-zoom-collection-contract.test.ts` currently recognizes true browser-owned zoom for Home, Learn, Active Lesson and Phrases, but there is no one 10-route #205 zoom sign-off.
- Existing true zoom owners use `lexigoBrowserZoomController`, `setBrowserZoom(..., 2)` and CDP `cssVisualViewport.zoom`; this is the required mechanism for #601.
- `route-tablet-parity.spec.ts` already contains deterministic fixtures and ownership/overflow semantics for all ten canonical routes.
- Issue #601 was created as an evidence/test-only child of #205.
- Branch `test/issue-601-route-browser-zoom-parity` was created from exact `main@b1444d5e5153da9b8fe275b7f1f175e9bd25286b`.

### Finding

The remaining 200% acceptance gap is not lack of scattered reflow coverage; it is lack of one consolidated true-browser-zoom contract across the complete canonical route set with the same ownership/overflow/focus policy.

### Root cause

Historical zoom coverage evolved route-by-route. The authoritative collection only explicitly owns true browser zoom for four route surfaces, while umbrella #205 requires route-by-route sign-off across ten canonical routes.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- planned: `frontend/e2e/route-browser-zoom-parity.spec.ts`
- planned: `frontend/playwright.visual.config.ts`
- planned: `frontend/components/browser-zoom-collection-contract.test.ts`

### Checks passed

- Live repo/PR/main preflight.
- Existing #205 delivery history and remaining acceptance audit.
- Existing true browser zoom mechanism/source contract inspection.
- Existing ten-route fixture/ownership owner inspection.

### Checks failed

None yet. The first authoritative Visual run is intentionally expected to fail at `REVIEW_REQUIRED` after all structural/runtime assertions pass.

### Current branch head

Resolve from live branch ref after implementation writes.

### Next action

Implement the consolidated true browser-owned 200% zoom spec, register it in the authoritative Visual collection/source contract, open a Draft PR, and run the fail-closed diagnostic CI.
