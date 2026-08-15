# Current Task Progress

## 2026-08-15 17:52 Europe/Moscow

### Verified

- Issue #536 is the active Figma child under umbrella #205.
- PR #538 is open as a draft from `test/issue-536-phrases-catalog-figma-parity` into `main`.
- Product branch base remains exact `main` SHA `a16a9dc598d61aa35ff7d10317a7a60b75e390e7`; live `main` has not moved during implementation.
- Existing authoritative owner is `frontend/e2e/phrases-visual.spec.ts`; no competing spec was created.
- Repository handoff maps `/phrases` to Figma `255:10`, `257:2`, `255:81`, `257:74` with canonical 390x844 and 1440x1024 viewports.
- Runtime inspection confirms semantic main `Технические фразы`, `data-route-client-island="phrases"`, URL-backed query/topic state and RouteChrome ownership.
- Executable browser evidence from immutable-head CI #3557 proves 390px uses `mobile` RouteChrome and 1440px uses the persistent `rail` RouteChrome owner.
- Guest catalog filtering is the deterministic source for Travel-search and empty-search states; authenticated quality-gate API fixtures intentionally do not filter returned phrases.
- `frontend/playwright.visual.config.ts` already collects `phrases-visual.spec.ts` in authoritative `visual-compact` and `visual-desktop` projects.

### Finding

The existing Phrases visual owner had strong content-addressed screenshot and browser zoom/reflow coverage but no executable canonical #205 node/state matrix. The new block adds that evidence without touching the existing owners.

Immutable-head CI #3557 on `961010a6116e443e2728eaf7b21e67da95eb730e` exposed two independent Visual regression failures:

1. The new desktop Phrases canonical cases incorrectly expected `data-route-navigation="header"`; the actual 1440px runtime correctly exposes the persistent `rail` owner.
2. The unrelated existing `Dictionary empty light` owner reproduced the previously observed nondeterministic content-addressed hash drift `e140551792a87445af08658ed78439638918b174b4b1a0e3d36448ef1ce7dbdf` → `dd2d0c587d648a01c1fc2d851fcea21f881716acf743268779f6132d15322ff6`.

### Root cause

The Phrases failure was a test-contract mistake: the initial preflight inferred desktop navigation from the wrong breakpoint expectation instead of the executable shell owner. Browser evidence and the existing 200% zoom owner both establish `rail` for the canonical 1440px desktop route.

The Dictionary hash drift is outside Issue #536 and is not evidence for a baseline refresh.

### Changed files

- `frontend/e2e/phrases-visual.spec.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Checks passed

- Agent Harness mandatory documents re-read.
- Live branch/main base verified after every write.
- Existing Phrases visual owner, runtime owner, catalog presentation, route navigation, URL-state parser, quality-gate fixtures and approved Figma handoff inspected.
- Four canonical cases added with exact Figma nodes, explicit appearance/canvas, deterministic URL state, route-island/main/catalog ownership, exact visible RouteChrome ownership, horizontal containment and reload stability.
- Pre-PR compare was ahead-only with exactly four allowed files.
- All eight existing content-addressed Phrases hashes and the browser-owned zoom block remain unchanged.
- Frontend core in CI #3557 passed lint, typecheck, unit tests, production build and dependency audit before browser execution.
- CI artifact `frontend-playwright-report-visual` was inspected to classify the exact failures rather than changing baselines blindly.
- Focused fix changes the canonical case type from `mobile|header` to `mobile|rail` and both desktop expectations from `header` to `rail`.
- The corrected Phrases source is byte-for-byte verified with Git blob SHA `2567b08657d973bc3ec5fe69d42b2febf257590e`; no production or baseline files changed.
- Live Figma MCP limitation remains external; repository-approved node mapping is the permitted evidence source.

### Checks failed

- CI #3557 Visual regression failed on the original head for the two classified reasons above. That run is superseded by the focused test-contract correction and must not be used as merge evidence.

### Current branch head

Resolve from live branch ref after the final Execution write.

### Next action

Finalize execution metadata, freeze the new PR head, run full immutable-head CI again, and only use a controlled same-head Visual regression rerun if the known independent Dictionary hash drift is the sole remaining blocker.
