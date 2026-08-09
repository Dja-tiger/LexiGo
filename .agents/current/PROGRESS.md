# Current Task Progress

## 2026-08-09 Europe/Moscow

### Verified

- Exact reconciled base is `main` SHA `85c3b69350e87cb5ed399f93a418a020ef9170c9`; latest deployed product remains `237eda1ad38a30a2b9b811b9415b1c9cd4fa1f0f`.
- `.agents/current/*` was canonical idle before this slice.
- Open PRs at pre-flight are unrelated Dependabot PRs #304, #403 and #432; no competing product PR is active.
- Issue #74 remains open for residual live-control inventory/remediation and final physical-device/manual acceptance.
- The old Issue literal `Подробнее` is already covered by connectivity target PR #387 and its cross-browser acceptance; `Все режимы` is no longer a live runtime literal.
- Canonical Phrase Detail is owned by `frontend/components/phrase-detail-presentation.tsx` and deterministic `/phrases/:slug` fixtures already exist in `frontend/e2e/phrases-visual.spec.ts`.
- Five live Phrase Detail actions are painted with a 44px minimum: back, speech, primary lesson configuration, secondary return and side practice.
- No Phrase Detail-specific effective-target owner exists; Phrases catalog target ownership from PR #442 does not select these detail controls.
- AsyncStatePanel error actions are excluded because shared system-state target ownership from PR #444 already covers them.
- SpeechPlayerButton uses no `::before` pseudo target, so a route-scoped transparent pseudo hit surface does not collide with an existing speech pseudo owner.
- Existing Phrase Detail content-addressed visual baselines cover compact 390px and desktop 1440px Light/Dark presentations and must remain unchanged for this paint-inert slice.

### Finding

The next bounded Issue #74 residual gap is the canonical Phrase Detail action set on `/phrases/:slug`: all five live controls satisfy the current 44px painted minimum but lack a coarse-pointer 48px effective-target owner.

### Root cause

Phrase Detail was delivered with a consistent visual 44px button minimum before the route-specific Issue #74 target layers were introduced. Later Phrases work added 44/48px ownership for catalog controls only; detail actions remained outside that selector set.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Checks passed

- Pre-flight live `main`, open-PR and Issue state verification.
- Runtime inventory confirms exactly five in-scope live Phrase Detail actions.
- Existing ownership audit excludes catalog, AsyncStatePanel and already compliant shared owners from duplicate remediation.
- Existing CSS confirms all five controls already have >=44px painted height; only coarse-pointer effective ownership is missing.
- Existing speech CSS/component audit found no pseudo-element collision.
- Existing Phrase Detail visual suite provides deterministic no-paint-regression evidence without baseline changes.

### Checks failed

None yet.

### Current branch head

Resolve from live `fix/issue-74-phrase-detail-targets` branch ref after harness initialization.

### Next action

Add the route-scoped paint-inert block-axis hit layer, dedicated multi-browser real-hit/non-overlap acceptance, source/collection contract and exact package collection entries; then fail-close the base/head diff before opening the product PR.
