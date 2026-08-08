# Current Task

## Identity

- Issue: #74 — Increase small touch targets and mobile labels
- Branch: `fix/issue-74-system-state-targets`
- Base SHA: `f7067b5d30ed944c8431233fbb21ae1d9b27a765`
- Head SHA: resolve from live branch ref
- PR: #444

## Objective

Close the confirmed residual AsyncStatePanel action gap in Issue #74 while preserving the existing 44px painted button geometry and system-state semantics.

## Scope

- Give system-state primary/secondary actions a real >=44px fine-pointer / >=48px coarse-pointer effective target.
- Expand coarse targets only on the block axis with transparent hit slop.
- Add live Dictionary correlated-error acceptance covering geometry, `document.elementFromPoint` ownership, keyboard focus, retry callback and compact containment.
- Register the acceptance in authoritative UI and accessibility browser collections.

## Non-goals

- No API, catalog, retry or async-state behavior changes.
- No visual redesign or snapshot updates.
- No dependency/lockfile changes.
- No broad global `.lx-button` target rewrite.
- No `.agents/PROJECT_STATE.md` change in this product PR.
- No claim of final real-device acceptance.

## Allowed paths

- `frontend/app/system-state-touch-targets.css`
- `frontend/app/layout.tsx`
- `frontend/e2e/system-state-touch-targets.spec.ts`
- `frontend/package.json` — collection registration only
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- `.agents/PROJECT_STATE.md`
- Backend/API/migrations.
- Dependency versions or lockfile.
- Existing visual snapshots.
- Unrelated route-specific target owners.

## Runtime owners

- `frontend/components/async-state.tsx`
- `frontend/app/system-states.css`
- `frontend/app/system-state-touch-targets.css`
- `frontend/app/layout.tsx`
- `frontend/e2e/system-state-touch-targets.spec.ts`
- `frontend/package.json`

## Documentation owners

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Invariants

- `.lx-button` system-state actions retain the existing >=44px painted geometry.
- Coarse-pointer expansion is paint-inert and block-axis only.
- Expanded actions do not steal inline hit area from adjacent wrapped actions.
- Existing AsyncStatePanel roles, names, focus management and retry callbacks are unchanged.
- Security dependency baseline remains unchanged.

## Acceptance criteria

- Live Dictionary retry action exposes >=44px fine / >=48px coarse effective target.
- All four effective-target perimeter points resolve to the owning button.
- Pseudo target remains transparent, borderless and shadowless.
- Keyboard navigation exposes visible focus.
- Retry callback clears the correlated error while preserving the query.
- No horizontal overflow.
- Acceptance runs in desktop Chromium, Android Chromium and iOS WebKit through authoritative UI/a11y collections.

## Required checks

- Frontend lint/typecheck/unit/build and production dependency audit.
- Authoritative UI/a11y browser matrix.
- Full immutable-head CI including visual, performance, CSP/PWA and container gates.
- Clean review/thread audit before Ready.
- Expected-head squash merge.
- Exact-SHA main CI and exact-image Stage/public validation.

## Risks

- Pseudo hit slop can be clipped or overlap stacked actions if geometry assumptions are wrong.
- Keyboard focus assertion must originate from keyboard modality rather than programmatic focus alone.
- A standalone spec not explicitly collected would provide no authoritative evidence.

## Rollback

Remove `system-state-touch-targets.css`, its root import, the dedicated acceptance spec and its two collection entries; AsyncStatePanel behavior remains unchanged.
