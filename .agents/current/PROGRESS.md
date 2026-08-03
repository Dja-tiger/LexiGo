# Current Task Progress

## 2026-08-04 00:35 Europe/Moscow

### Verified

- Base `7c3684a63e415c647f0b1c7a96ac86387f79cafd` is the exact current `main` after PR #369 reconciliation and exact-SHA lightweight main CI run `30855006068`.
- Latest deployed product remains `7c4f6b2fa9237080451f0a7ebaa48201e124b53f`, stage run `30854579569`, with deploy, public smoke and 12/12 public browser checks successful.
- Issue #70 remains open with exactly 21 `requires-proof` manifest items before this slice.
- The only `mobile-pwa-fixes.css` → `adaptive-navigation.css` exact-selector item is `.lx-resource-stack | width`.
- Live resource-stack renderers exist in Home, Learn, Progress, Dictionary, Active Lesson and the compatibility fallback, all below canonical `.lx-routed-app` production ancestry.

### Finding

The approved tablet result already requires `.lx-resource-stack` to fill `.lx-main-content`, but the unscoped adaptive selector had equal specificity with the global mobile-PWA max-width owner. Reversing stylesheet order could therefore restore the 28px inset inside the 720–1099px tablet range.

### Root cause

`adaptive-navigation.css` grouped `.lx-resource-stack` with `.lx-async-state` under one equal-specificity tablet rule. The two selectors are separate ownership boundaries: resource-stack is a routed application-shell layout owner, while async-state is a shared system-state owner reserved for a later atomic slice.

### Changed files

- `.agents/current/TASK.md`;
- `.agents/current/PROGRESS.md`;
- `.agents/current/EXECUTION.md`;
- `frontend/app/adaptive-navigation.css`;
- `frontend/app/global-feature-style-overlap-manifest.test.ts`;
- `frontend/components/navigation-mobile-shell-css-ownership.test.ts`;
- `frontend/e2e/navigation-mobile-shell-cascade.spec.ts`.

`frontend/app/global-feature-style-overlap-manifest.json` is intentionally still stale until the authoritative parser emits the exact 70-item inventory.

### Checks passed

- The tablet group was split without changing either declaration value.
- `.lx-routed-app .lx-resource-stack { width: 100%; }` is bounded to the existing 720–1099px media block.
- `.lx-async-state { width: 100%; }` remains unscoped and unchanged.
- Mobile-PWA still owns `min(1160px, calc(100% - 28px))` globally and remains unchanged.
- Source contracts now require zero mobile/adaptive exact-selector conflicts and protect all six live renderer files.
- Browser proof now measures whether resource stack and main-content widths match: false below 720px, true from 720px through 1099px.
- Production, routed-shell-first and mobile-first orders remain part of both authoritative UI scripts.

### Checks failed

- No authoritative CI has run on this branch yet.
- The manifest and its new 70-item expectations intentionally disagree until diagnostic CI provides parser-derived output.

### Current branch head

Resolve from the live branch after this Agent Harness update.

### Next action

Open a Draft PR and run full CI as a fail-closed diagnostic. Require frontend core to fail only on the stale manifest, extract the exact 70-item parser inventory, commit that generated manifest, then rerun the complete immutable-head product pipeline.
