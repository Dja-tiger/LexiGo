# Current Task Progress

## 2026-08-14 17:31 Europe/Moscow

### Verified

- Live `main`: `c13cf3bae514c03d1d54a237add7dacedf4573e5`.
- Issue #515 is open and defines canonical Progress parity at `390×844` and `1440×1024` in Light/Dark.
- Canonical known Figma Progress nodes: `76:6` mobile Light, `76:53` mobile Dark, `76:154` desktop; Screen Map `82:3`.
- Live Figma MCP calls are currently blocked by the connected Starter-plan tool-call quota, so no new canvas/screenshot approval is claimed.
- `frontend/playwright.config.ts` has no explicit `testMatch`; normal `*.spec.ts` owners are collected across desktop Chromium/WebKit and Android/iOS projects.
- `frontend/e2e/progress-route-island.spec.ts` is the authoritative owner for direct Progress entry, route-island semantics, session-bootstrap and primary-navigation history.
- Existing approved Progress Linux PNGs remain untouched.

### Finding

The smallest #515 implementation is test-only. Canonical geometry is measured in four explicit cases in desktop Chromium: mobile Light/Dark `390×844`, desktop Light/Dark `1440×1024`. The existing route-island journey remains cross-browser and now additionally proves real Browser Back/Forward without a second auth refresh.

### Root cause

Progress acceptance was split across visual screenshots, data/reflow evidence and route navigation. There was no executable contract binding canonical viewport + appearance + shell ownership + horizontal geometry + reload/history in one route-owner suite.

### Changed files

- `frontend/e2e/progress-route-island.spec.ts` — four canonical viewport/appearance cases, common-frame geometry assertions, explicit semantic canvas token validation, reload validation and Back/Forward coverage.
- `.agents/current/TASK.md` — pre-flight, scope and PR binding.
- `.agents/current/PROGRESS.md` — factual task state.
- `.agents/current/EXECUTION.md` — applied skills and limitations.

### Checks passed

- Mandatory AGENTS/SKILLS/harness pre-flight completed.
- Branch created from exact `main`; every changed path read back after write.
- `main` remained unchanged after branch writes.
- Normal Playwright collection boundary verified; no standalone uncollected owner introduced.
- Geometry is sampled in one `page.evaluate` without intervening scroll.
- Branch compare before PR: `0 behind`, exactly four allowed files; no CSS, visual config, PNG, workflow, backend or dependency changes.
- Draft PR #517 opened against `main`.

### Checks failed

- Live Figma inspection/screenshot calls are unavailable because the connected Starter-plan MCP quota is exhausted. This is an external design-tool limitation and explicitly blocks snapshot approval, not executable geometry/history testing.

### Current branch head

Resolve from live branch ref after final harness metadata writes. Implementation head before PR metadata binding was `74df09423f896bff948c9586f6aeb163ffc760ba`.

### Next action

Freeze the final developer-authored head after PR metadata binding, run full immutable-head CI for PR #517, classify any failure before changing source, then Ready/expected-head squash merge followed by exact-main CI and Stage/public validation.