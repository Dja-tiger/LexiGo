# Current Task Progress

## 2026-08-08 Europe/Moscow

### Verified

- Docs-only reconciliation #443 merged as `f7067b5d30ed944c8431233fbb21ae1d9b27a765`; exact docs-only main CI #3049 / run `31253606487` succeeded.
- Product Draft PR #444 is the active Issue #74 slice on branch `fix/issue-74-system-state-targets`, based on exact `main` SHA `f7067b5d30ed944c8431233fbb21ae1d9b27a765`.
- Stage remains on validated product SHA `2ee32d075b20dca000f1e10726ba8842b4685434` from PR #442.
- Issue #74 remains open for residual live-control inventory/remediation plus final physical-device acceptance.
- `AsyncStatePanel` renders live primary/secondary recovery actions through `.lx-button`; canonical `.lx-button` painted minimum is 44px and no coarse-pointer 48px owner existed for `.lx-async-state-actions` before this slice.
- Existing `system-states.spec.ts` proves a live correlated Dictionary error/retry path, but does not prove effective target geometry or hit ownership.

### Finding

System-state retry/login/recovery actions are a confirmed residual Issue #74 target gap: 44px paint satisfies the fine-pointer contract but does not guarantee the required 48px coarse-pointer effective target.

### Root cause

The shared `.lx-button` visual owner intentionally stops at 44px. Route-specific Issue #74 slices expanded individual controls, but reusable AsyncStatePanel action buttons never received a bounded coarse-pointer hit-slop owner or real hit-test acceptance.

### Product candidate

- `frontend/app/system-state-touch-targets.css` adds a route-independent but narrowly scoped `.lx-async-state-actions .lx-button` effective-target owner.
- Coarse expansion is paint-inert and block-axis only; inline geometry is unchanged.
- `frontend/e2e/system-state-touch-targets.spec.ts` exercises the live Dictionary correlated-error retry action and is registered in both authoritative UI and accessibility collections.
- No dependency, API, visual-baseline or `.agents/PROJECT_STATE.md` change is part of this product PR.

### CI #3050 classification

Immutable candidate head `6e37feee6dc62b242004e7e53207a34b3f39303b` ran CI #3050 / run `31253827648`.

Passed before the aggregate gate:

- change-scope classification;
- frontend core quality;
- backend unit/security and integration;
- Lesson E2E;
- content security;
- UI shard 1/2;
- Dictionary smoke;
- iOS PWA Dictionary;
- Linux visual regression;
- controlled Service Worker;
- performance budgets;
- accessibility audit.

Failed:

- `UI tests (shard 2/2)`, job `93094264820`;
- aggregate `Frontend quality` consequently failed and container builds were not started.

Exact Playwright artifact `9020875402` showed:

- the new system-state target case failed on both `android-chromium` and `ios-webkit`, including retry, only at the lower `document.elementFromPoint` perimeter point: received `[true, true, false, true]`;
- target minimum-size assertions passed before that hit-ownership assertion;
- unrelated `catalog-pagination` on low-end Android was classified as flaky and passed its retry; it was not a final unexpected test.

### CI failure root cause

This was a deterministic acceptance-harness defect, not evidence for a runtime/CSS change. The helper used `scrollIntoViewIfNeeded()`, which proves the painted control is visible but does not normalize the larger transparent pseudo target for viewport-relative hit testing. It also calculated pseudo bounds without the border-box normalization already used by the canonical Issue #74 Phrases and Active Lesson helpers.

The fix on commit `43bbe0edfe9bedfd75e162dcf439710cf3d7d088`:

- keeps all four `elementFromPoint` perimeter assertions;
- centers the painted owner before probing the transparent perimeter and then keeps the complete effective target inside a small viewport margin;
- computes target edges using the element border widths plus pseudo insets;
- does not weaken the 44/48px minimum, focus-visible, callback, query-retention, paint-inert or overflow assertions;
- changes no production CSS/runtime behavior.

### Changed files

- `frontend/app/system-state-touch-targets.css`
- `frontend/app/layout.tsx`
- `frontend/e2e/system-state-touch-targets.spec.ts`
- `frontend/package.json` — UI/a11y collection only
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Current branch head

Resolve from the live branch ref after the current Agent Harness records are written; the acceptance-helper fix itself is commit `43bbe0edfe9bedfd75e162dcf439710cf3d7d088`.

### Next action

Complete the current Agent Harness record, treat the resulting developer-authored head as immutable, require full product CI, then complete review/thread audit, Ready, expected-head squash merge, exact-SHA main CI and exact-image Stage/public validation. If final CI is green, do not add unrelated changes to this product PR.
