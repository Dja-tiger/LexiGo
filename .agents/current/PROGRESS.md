# Current Task Progress

## 2026-08-10 Europe/Moscow

### Verified

- Exact branch base is `main=e5c20118b12023ae2b961365a64e01e814be7561`, the squash merge of PR #458.
- PR #458 removed the Scenario Catalog card-link residual and its blocking iOS/WebKit test defect before merge.
- Residual source audit identified two remaining in-scope engineering families: Scenario Lesson controls and the global Service Worker update banner.
- `scenario-lessons.css` keeps generic Scenario buttons at 44px with no coarse-pointer 48px owner; primary/secondary actions already paint at 52px.
- `service-worker-update.css` paints update-banner buttons at 42px.
- No existing `.lx-scenario button::before`, `.lx-scenario-dialog button::before` or `.lx-sw-update button::before` owner conflicts were found.
- Profile 42px/38px controls were also discovered, but Profile is outside the original Issue #74 affected-screen set and is explicitly excluded from this final bounded pass.

### Implemented

- Added `frontend/app/issue-74-final-touch-targets.css` as one interaction-only owner.
- Fine-pointer target variable is 44px; coarse-pointer variable is 48px.
- Expansion is block-axis only through a transparent, borderless, shadowless `::before` surface; canonical paint/layout remains unchanged.
- Owner covers Scenario route buttons, Scenario portal-dialog buttons and global Service Worker update actions.
- Added `frontend/e2e/issue-74-final-touch-targets.spec.ts` with desktop Chromium, Android Chromium and iOS WebKit real-hit geometry, transparent-paint and sibling non-overlap assertions.
- Added source ownership test and registered the browser proof in focused Scenario/SW plus blocking UI/accessibility commands.

### Product head before harness checkpoint

`d40485b19f5ad6d83d69adf3130a6719b3552a16`; resolve the live branch ref after harness documentation commits.

### Validation status

- Source ownership and test design self-review complete.
- Local execution is unavailable; immutable GitHub CI is the execution source of truth.
- Predecessor merge `e5c20118…` post-merge CI was still in progress when this branch was started; validate it independently and require the final residual PR's own immutable-head CI before merge.

### Next action

Open the final residual PR, validate exact changed-path scope and immutable-head CI, fix only confirmed failures, then expected-head squash merge. After exact-SHA main CI and Stage/public validation, reconcile #74 as engineering-complete with only mandatory physical-device acceptance remaining if that hardware gate cannot be executed here.
