# Current Task

## Identity

- Issue: #74
- Branch: `agent/issue-74-header-touch-targets`
- Base SHA: `c56485511c752aacd3e2f43cd0d102f229a9c25f`
- Head SHA: resolve from live branch ref
- PR: #387

## Objective

Make the live global connectivity actions, beginning with `Подробнее`, expose a minimum 44 CSS px fine-pointer and 48 CSS px coarse-pointer touch target without changing their visible 40px/36px button geometry or surrounding banner layout.

## Scope

- Replace the invalid hidden Dictionary reminder slice with the first confirmed live Issue #74 defect.
- Add one narrow stylesheet imported after `system-states.css`.
- Expand only the block-axis hit surface of buttons inside `.lx-review-sync__actions`; keep their inline area unchanged.
- Preserve existing button paint, text, layout, global focus owner and ReviewOutbox runtime behavior.
- Add fail-closed source ownership evidence and real desktop Chromium, iOS WebKit and Android Chromium perimeter hit-testing.
- Register the focused browser suite in authoritative UI and accessibility CI.

## Non-goals

- No change to the hidden legacy Dictionary bell or route reminder entry.
- No broad route-by-route control audit.
- No mobile navigation label change; compact navigation already has 48×52 targets and 11–12 px labels.
- No connectivity state, IndexedDB, sync, API or session behavior change.
- No visible button resize, Figma redesign, visual baseline, budget or dependency change.
- No claim that Issue #74 is fully closed; real-device and remaining route controls stay pending.

## Allowed paths

- `frontend/app/connectivity-touch-targets.css`
- `frontend/app/layout.tsx`
- `frontend/components/connectivity-touch-target-source.test.ts`
- `frontend/e2e/connectivity-touch-targets.spec.ts`
- `frontend/package.json`
- deletion of superseded `frontend/app/header-touch-targets.css`
- deletion of superseded `frontend/components/header-touch-target-source.test.ts`
- deletion of superseded `frontend/e2e/header-touch-targets.spec.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- runtime component JSX/TSX
- `frontend/app/system-states.css` and existing visual owners
- visual snapshots and route budgets
- backend, API, migrations and deployment workflows
- dependencies and lockfiles
- `.agents/PROJECT_STATE.md` before product merge and stage validation

## Runtime owners

- `frontend/components/review-outbox-runtime.tsx` — unchanged live connectivity actions and state behavior.
- `frontend/app/system-states.css` — unchanged 40px default and 36px active-lesson visible button geometry.
- `frontend/app/connectivity-touch-targets.css` — effective 44/48px block-axis hit surface only.
- `frontend/app/accessibility-focus.css` — unchanged global keyboard-focus visual owner.

## Documentation owners

- `.agents/current/**` during the active slice.
- `.agents/PROJECT_STATE.md` only after product merge and exact-image stage validation.

## Invariants

- The live action is selected by role and exact accessible name, not by hidden legacy markup.
- Visible button border box, paint, typography and layout remain unchanged.
- Effective target height is at least 44px with a fine pointer and 48px with a coarse pointer.
- Inline hit area is not expanded, so adjacent action targets cannot overlap horizontally.
- Pointer events at the expanded top and bottom perimeter resolve to the intended button.
- Existing keyboard focus remains visible and no semantic role/name changes.
- The hit-slop pseudo-element has no transform, background, border, shadow or other painted output.
- No horizontal overflow at compact widths.
- Existing global stylesheet imports remain in their current relative order.

## Acceptance criteria

- `Подробнее` in the live offline connectivity banner meets the 44/48px effective target contract.
- Desktop Chromium, iOS WebKit and Android Chromium prove top/bottom perimeter hit-testing.
- The active-lesson 36px visible override remains covered by the same source contract.
- Source contract maps CSS owner, runtime labels, existing visible geometry, focus owner and authoritative browser registration.
- Existing visual hashes remain unchanged.
- Full immutable-head CI, expected-head merge, exact-SHA main CI and exact-image stage/public validation succeed.

## Required checks

- Frontend lint, TypeScript, Vitest source contract and production build.
- Focused desktop Chromium, iOS WebKit and Android Chromium hit-testing.
- Existing keyboard, axe, navigation, visual, performance and PWA matrices.
- Full backend/container gates required by product CI.
- Post-merge main and exact-image stage/public validation.

## Risks

- Pseudo-element hit testing may differ across Chromium and WebKit.
- Vertical hit slop could escape the fixed banner at compact widths if spacing is insufficient.
- A transparent positioned pseudo-element could still perturb deterministic raster output; visual CI must remain byte-identical.

## Rollback

Revert the narrow stylesheet/import, source/browser contracts, command registration and current Agent Harness records. No data, API, JSX or visual snapshot rollback is required.
