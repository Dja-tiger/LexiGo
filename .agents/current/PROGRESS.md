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
- Fine-pointer effective minimum is 44 x 44 CSS px; coarse-pointer minimum is 48 x 48 CSS px.
- Expansion uses a transparent, borderless, shadowless `::before` surface on both axes only when the painted control is narrower/shorter than the target; canonical paint/layout remains unchanged.
- Owner covers Scenario route buttons, Scenario portal-dialog buttons and global Service Worker update actions.
- Added `frontend/e2e/issue-74-final-touch-targets.spec.ts` with desktop Chromium, Android Chromium and iOS WebKit real-hit geometry, transparent-paint and sibling non-overlap assertions.
- Added source ownership test and registered the browser proof in focused Scenario/SW plus blocking UI/accessibility commands.

### CI finding and correction

- PR #459 initial immutable head `d8d0b8b28c1fd237db812f43c8f3e4329c856bcb` passed frontend lint/type/unit/build/audit.
- Controlled Service Worker shard exposed a real iOS geometry gap: Scenario header back button effective size was 36 x 48 CSS px; height remediation alone was insufficient.
- Corrected the interaction owner from block-axis-only expansion to a minimum square on both axes; source contract was updated accordingly.
- Product correction head before final harness checkpoint: `5b0ad8d48dc024d90787a6604d567407ca047b94`.

### Validation status

- Local execution is unavailable; immutable GitHub CI is the execution source of truth.
- A fresh immutable CI is required after this harness checkpoint because the branch head changed.
- Predecessor merge `e5c20118…` post-merge CI is tracked independently.

### Next action

Validate final PR #459 head through the full CI matrix, fix only confirmed failures, then expected-head squash merge. After exact-SHA main CI and Stage/public validation, reconcile #74 as engineering-complete with only mandatory physical-device acceptance remaining if that hardware gate cannot be executed here.
