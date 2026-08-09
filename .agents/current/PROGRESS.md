# Current Task Progress

## 2026-08-09 Europe/Moscow

### Verified

- Exact reconciled base is `main` SHA `85c3b69350e87cb5ed399f93a418a020ef9170c9`; latest deployed product remains `237eda1ad38a30a2b9b811b9415b1c9cd4fa1f0f`.
- `.agents/current/*` was canonical idle before this slice.
- Open PRs at pre-flight were unrelated Dependabot PRs #304, #403 and #432; no competing product PR was active.
- Issue #74 remains open for residual live-control inventory/remediation and final physical-device/manual acceptance.
- The old Issue literal `Подробнее` is already covered by connectivity target PR #387 and its cross-browser acceptance; `Все режимы` is no longer a live runtime literal.
- Canonical Phrase Detail is owned by `frontend/components/phrase-detail-presentation.tsx` and deterministic `/phrases/:slug` fixtures already exist in `frontend/e2e/phrases-visual.spec.ts`.
- Five live Phrase Detail actions are painted with a 44px minimum: back, speech, primary lesson configuration, secondary return and side practice.
- No Phrase Detail-specific effective-target owner existed; Phrases catalog target ownership from PR #442 does not select these detail controls.
- AsyncStatePanel error actions are excluded because shared system-state target ownership from PR #444 already covers them.
- SpeechPlayerButton uses no `::before` pseudo target, so the route-scoped transparent hit surface does not collide with an existing speech pseudo owner.
- Existing Phrase Detail content-addressed visual baselines cover compact 390px and desktop 1440px Light/Dark presentations and remain immutable for this paint-inert slice.
- Draft PR #450 is open from `fix/issue-74-phrase-detail-targets` against exact base `85c3b69350e87cb5ed399f93a418a020ef9170c9`.

### Finding

The next bounded Issue #74 residual gap is the canonical Phrase Detail action set on `/phrases/:slug`: all five live controls satisfy the current 44px painted minimum but lacked a coarse-pointer 48px effective-target owner.

### Root cause

Phrase Detail was delivered with a consistent visual 44px button minimum before the route-specific Issue #74 target layers were introduced. Later Phrases work added 44/48px ownership for catalog controls only; detail actions remained outside that selector set.

### Changed files

- `frontend/app/phrase-detail-touch-targets.css`
- `frontend/app/layout.tsx` — one stylesheet import only
- `frontend/e2e/phrase-detail-touch-targets.spec.ts`
- `frontend/components/phrase-detail-touch-target-source.test.ts`
- `frontend/package.json` — UI/a11y collection entries only
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Checks passed

- Pre-flight live `main`, open-PR and Issue state verification.
- Runtime inventory confirms exactly five in-scope live Phrase Detail actions.
- Existing ownership audit excludes catalog, AsyncStatePanel and already compliant shared owners from duplicate remediation.
- Existing CSS confirms all five controls already have >=44px painted height; only coarse-pointer effective ownership was missing.
- Existing speech CSS/component audit found no pseudo-element collision.
- Added route-scoped block-axis effective ownership with 44px fine / 48px coarse variables and transparent/no-border/no-shadow pseudo paint.
- Added desktop Chromium, Android Chromium and iOS WebKit acceptance at 1440/820/390/320 widths with border-aware geometry, real four-side `elementFromPoint` ownership, shared-frame main-action non-overlap, keyboard focus and horizontal containment.
- Compact <=767px acceptance correctly treats the desktop/tablet side-practice aside as intentionally hidden rather than inventing a mobile control.
- Added a source contract locking the five live selectors, paint-inert declarations, import order and authoritative UI/a11y collection.
- Registered the acceptance exactly once in both `test:e2e:ui` and `test:e2e:a11y`; dependency/devDependency metadata remains exact-main and `package-lock.json` is untouched.
- Fail-closed comparison against exact base shows exactly eight allowed paths. `layout.tsx` is `+1/-0`; no runtime component, canonical `phrases.css`, visual baseline, workflow, backend, lockfile or `PROJECT_STATE` drift exists.

### Checks failed

None yet. Final immutable-head CI is pending after PR identity records are frozen.

### Current branch head

Resolve from live `fix/issue-74-phrase-detail-targets` branch ref after final PR identity records are written.

### Next action

Freeze the final developer-authored head, require full immutable-head CI for PR #450, then classify any failure at its exact owner without weakening target or visual contracts. On full green: clean review/thread audit, Ready, expected-head squash merge, exact-SHA main CI, exact-image Stage/public validation and separate docs reconciliation.
