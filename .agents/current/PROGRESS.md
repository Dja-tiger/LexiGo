# Current Task Progress

## 2026-08-08 Europe/Moscow

### Verified

- Docs-only reconciliation #443 merged as `f7067b5d30ed944c8431233fbb21ae1d9b27a765`; exact docs-only main CI #3049 / run `31253606487` succeeded.
- Product Draft PR #444 is the active Issue #74 slice on branch `fix/issue-74-system-state-targets`, based on exact `main` SHA `f7067b5d30ed944c8431233fbb21ae1d9b27a765`.
- `main` remained exactly `f7067b5d30ed944c8431233fbb21ae1d9b27a765` after every product/harness branch write through the CI #3054 recovery.
- Stage remains on validated product SHA `2ee32d075b20dca000f1e10726ba8842b4685434` from PR #442.
- Issue #74 remains open for residual live-control inventory/remediation plus final physical-device acceptance.
- `AsyncStatePanel` renders live primary/secondary recovery actions through `.lx-button`; canonical painted minimum is 44px and no coarse-pointer 48px owner existed for `.lx-async-state-actions` before this slice.
- Routed `.lx-button.primary` / `.lx-button.ghost` controls may carry a 1px border from the higher-specificity routed-app owner even though the legacy primary owner sets `border: 0`.

### Finding

System-state retry/login/recovery actions are a confirmed residual Issue #74 target gap. The routed 44px button border box is sufficient on fine pointers, but the original coarse pseudo expansion from the 42px padding box reached only 46px.

### Root cause

The shared visual owner intentionally stops at a 44px border box. Route-specific Issue #74 slices expanded individual controls, but reusable AsyncStatePanel actions never received a border-aware coarse-pointer hit-slop owner or real hit-test acceptance.

### Product candidate

- `frontend/app/system-state-touch-targets.css` adds a route-independent but narrowly scoped `.lx-async-state-actions .lx-button` effective-target owner.
- Fine pointers retain the normal 44px button border box as the effective target.
- Coarse expansion is paint-inert and block-axis only; inline geometry is unchanged.
- The final coarse inset is 3px on each block edge. With a worst-case 1px button border, the pseudo surface starts from a 42px padding box and reaches 48px.
- `frontend/e2e/system-state-touch-targets.spec.ts` exercises the live Dictionary correlated-error retry action and is registered in both authoritative UI and accessibility collections.
- Acceptance measures the union of the clickable button border box and transparent pseudo hit surface, then proves four perimeter points with `document.elementFromPoint`.
- No dependency, API, visual-baseline or `.agents/PROJECT_STATE.md` change is part of this product PR.

### CI #3050 classification

Candidate head `6e37feee6dc62b242004e7e53207a34b3f39303b` ran CI #3050 / run `31253827648`.

Failed only:

- `UI tests (shard 2/2)`, job `93094264820`;
- aggregate `Frontend quality` consequently failed and container builds were not started.

Exact Playwright artifact `9020875402` showed the new target case failing Android Chromium and iOS WebKit, including retry, only at the lower perimeter point: `[true, true, false, true]`. Size assertions had already passed. The unrelated low-end Android catalog-pagination case was flaky and recovered on retry.

Classification: deterministic acceptance-harness viewport-normalization defect.

Repair `43bbe0edfe9bedfd75e162dcf439710cf3d7d088` centered the painted owner, kept the effective target inside a viewport margin and introduced border-aware pseudo-bound calculations without weakening any assertion.

### CI #3054 classification

Candidate head `e29649157939c719775fdf5d552a9e2296f818f3` ran CI #3054 / run `31273126592`.

Green jobs included:

- change-scope classification;
- frontend core quality;
- backend unit/security and integration;
- Lesson completion;
- iOS PWA Dictionary;
- controlled Service Worker;
- content security;
- Dictionary smoke;
- visual regression;
- accessibility audit;
- performance budgets.

Failed:

- `UI tests (shard 1/2)`, job `93142551938`;
- `UI tests (shard 2/2)`, job `93142551934`;
- aggregate `Frontend quality` then failed; container build was skipped.

Exact artifacts:

- UI shard 1 artifact `9026300145`: desktop Chromium failed deterministically on both attempts at target height, expected >=43.5, measured 42px; desktop WebKit was intentionally skipped by this acceptance.
- UI shard 2 artifact `9026296119`: Android Chromium and iOS WebKit both failed deterministically on both attempts at target height, expected >=47.5, measured 46px.
- No unrelated unexpected test remained in either report.

### CI #3054 root cause

The repaired helper correctly exposed two distinct facts:

1. Desktop 42px was an acceptance-model error. A bordered `<button>` is itself clickable across its full 44px border box; measuring the pseudo padding-box surface alone incorrectly excluded the two clickable border pixels. Fine-pointer effective geometry must be the union of the button border box and pseudo surface.
2. Mobile 46px was a real product defect. The coarse pseudo was laid out from the routed button's 42px padding box and `inset-block: -2px` expanded it only to 46px. The union with the 44px button therefore remained 46px, below the 48px contract.

### CI #3054 recovery

- Commit `d9688d649945d3e928df50cc425559ed5cd613f6` changes only the product target owner: coarse `inset-block` from `-2px` to `-3px`, producing a 48px worst-case pseudo target without visual paint or inline expansion.
- Commit `34637795268b65c09b7101a46ef6209a88baebfe` changes only acceptance geometry: effective bounds are now the union of the clickable border box and pseudo surface for both viewport normalization and four-side hit probing.
- The 44/48px minima, four perimeter hits, paint-inert pseudo evidence, keyboard focus, retry callback, query retention and overflow assertions remain fail-closed and unchanged in strength.

### Changed files

- `frontend/app/system-state-touch-targets.css`
- `frontend/app/layout.tsx`
- `frontend/e2e/system-state-touch-targets.spec.ts`
- `frontend/package.json` — UI/a11y collection only
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Current branch head

Resolve from the live branch ref after the final CI #3054 Agent Harness record is written. Code recovery currently ends at `34637795268b65c09b7101a46ef6209a88baebfe`.

### Next action

Finalize the current Agent Harness record, treat the resulting developer-authored head as immutable and require full product CI. On exact-head green: re-audit scope/review threads, mark PR #444 Ready, expected-head squash merge, require exact-SHA main CI, deploy/validate the exact product image on Stage/public, then reconcile `.agents/PROJECT_STATE.md` and reset `.agents/current/*` in a separate docs-only PR. Issue #74 remains open until residual inventory and real physical-device acceptance are complete.
