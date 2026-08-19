# Current Task Progress

## 2026-08-19 — Issue #617

### Verified

- Live base at task start: `main@d305300c0d22cbb8ed2744e568a5eab7583c3923`.
- Open PRs before task selection: none.
- Parent #205 now uses OpenPencil as the active design source; Figma is archival provenance only.
- Existing `frontend/e2e/app-router-routes.spec.ts` has specialized direct-route, partial Back/Forward, detail reload, phrase filter/scroll restoration and guest return-target coverage, but no unified 10-route × desktop/iOS × Light/Dark matrix.
- Issue #202 system-state implementation is already closed, so the next non-duplicate automatable #205 gap is direct-entry/reload/Back-Forward parity.

### Finding

Route/history behavior is already implemented and partially covered, but the #205 acceptance dimension lacks a single fail-closed owner proving every canonical route across both target browser surfaces and both appearances.

### Root cause

Existing navigation tests were written per route/slice and therefore do not prove that all ten canonical routes share the same direct-entry/reload/browser-history ownership contract.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `frontend/e2e/route-history-parity.spec.ts`
- `frontend/components/route-history-collection-contract.test.ts`
- `frontend/package.json`

### Implementation

- Added 10 canonical route contracts.
- Target surfaces: desktop Chromium `1440×1024` and iOS WebKit `390×844`.
- Explicit Light/Dark loop.
- Each matrix state performs real `goto → reload → second entry → goBack → goForward`.
- Exact pathname/search and canonical route owner are verified after each history transition.
- Active Lesson gets a narrow page-level `/api/v1/lessons/active` valid-state override; the stabilizer accepts both BFCache-expanded and cold-reload saved-lesson disclosure before requiring `.lx-active-lesson[data-active-lesson-state=prompt]`.
- Onboarding gets a narrow page-level `/api/v1/onboarding` in-progress override.
- Shared `installQualityGateAPI` remains authoritative for the rest of authenticated route fixtures.
- Detail routes retain exact word/phrase semantic identity.
- Runtime errors and per-state machine-readable JSON evidence are captured.
- Source contract forbids synthetic `pushState`/`replaceState`/`popstate`, arbitrary sleeps, and requires real reload/Back/Forward plus exact URL restoration.
- `test:e2e:navigation` now explicitly collects `e2e/route-history-parity.spec.ts`.

### Checks passed

- Per-write GitHub readback for TASK, history owner, source contract and package collection update.
- Existing specialized history owners were inspected and left unchanged.
- No runtime/router/OpenPencil file has been modified.

### Checks failed

None yet; GitHub Actions has not run on this branch.

### Current branch head

Latest implementation/collection commit before this progress record: `6a54e9c5fa2e5650ee50ef4e56b8fbf8558251b4`.

### Next action

Record execution evidence, compare branch scope/drift against live main, open Draft PR, and use immutable GitHub Actions as the first executable validation. If the matrix finds a real route-history defect, split it into a separate runtime Issue/PR instead of weakening the audit.
