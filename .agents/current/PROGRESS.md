# Current Task Progress

## 2026-08-19 — Issue #608 pre-flight

### Verified

- Live `main`: `2412dce6a0cbb71c9a781829c09416e531efc502`.
- Open PRs before branch creation: none.
- Issue #608 created under umbrella #205.
- Branch: `test/issue-608-route-keyboard-focus-parity`, created exactly from the verified main SHA.
- Existing Issue #45 is closed completed and owns baseline product keyboard accessibility; this slice does not reopen it.
- `frontend/e2e/accessibility-keyboard.spec.ts` currently covers shell Tab order, Enter/Space flows, Lesson Composer roving controls, calendar dialog focus trap/restore, positive-tabindex ban and axe keyboard baseline for six top-level routes.
- Missing consolidated route-by-route coverage is confirmed for the full 10-route #205 matrix, especially Word Detail, Phrase Detail and Onboarding, plus uniform focus geometry/RouteChrome evidence.
- `docs/keyboard-accessibility-checklist.md` and `docs/route-focus-accessibility-checklist.md` remain authoritative policy owners.

### Finding

A dedicated consolidated audit is justified, but it must not multiply native Tab traversal across browser engines with different platform Tab policies. Deterministic route-by-route traversal will execute once under `desktop-chromium`, while the existing specialized keyboard/axe suite continues to provide cross-browser coverage.

### Root cause

The current accessibility suite evolved from feature-specific keyboard contracts and six top-level route axe checks. Umbrella #205 later expanded final parity acceptance to ten canonical routes and both primary responsive navigation topologies, leaving no single executable owner for that complete matrix.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`

### Checks passed

- live main/open-PR pre-flight;
- duplicate/ownership audit against #45, #205 and current keyboard tests;
- Playwright project/CI collection audit;
- first branch write read back successfully; main remained unchanged.

### Checks failed

- none yet.

### Current branch head

Resolve from live branch ref after this write.

### Next action

Initialize execution memory, then add the fail-closed source contract and consolidated `route-keyboard-focus-parity.spec.ts`, register it in blocking `test:e2e:a11y`, open a Draft PR and use immutable CI to classify any discovered focus defects.
