# Current Task Progress

## 2026-08-17 Europe/Berlin

### Verified

- Reconciliation PR #578 is merged; exact reconciled base/main is `e25cee1b2ef991aff9ea5a27f63d170e1bc8d1b7` and exact-main lightweight CI #3737 / run `32045106793` is green.
- Issue #577 is open under umbrella #205 and explicitly requires repo-owned OpenPencil/Linux evidence rather than Figma Cloud editing.
- OpenPencil screen map binds compact Dictionary to `fig_4008`, Learn recommended to `fig_6826`, and Phrases catalog to `fig_7281`, all canonical 390×844 owners.
- Root layout imports route/material/reminder CSS globally, so the reproduced stale presentation is not explained by a lazily loaded route stylesheet.
- Existing `test:e2e:ui` runs Dictionary/Learn specs across all Playwright projects, including `ios-webkit`.

### Finding

- `RoutePrimaryNavigation.routeGraphHint()` marked Library `/dictionary` as `product`; the bootstrap then legitimately selected compatibility `LexigoPremiumApp` instead of `LexigoDictionaryApp` after that client transition.
- `historyRouteGraph()` also permits stale `product` markers on canonical `/learn` and `/dictionary`; this remains a risk to verify with executable transition/history evidence after the navigation-hint repair.
- The pre-existing Dictionary transition test explicitly expected `data-route-client-island="dictionary"` count `0` after Home → Dictionary and Forward, so the regression was encoded as expected behavior.
- Compact Materials already uses a two-column grid at ≤640px but lacked a no-wrap constraint and compact font/padding ownership.
- Shared Reminder has a single correct component owner, but its CSS used legacy dark/blue hardcoded colors instead of current semantic `--ak-*` tokens.

### Root cause

- Proven Dictionary owner mismatch: primary Library navigation wrote the wrong graph identity (`product`) for a canonical Dictionary destination.
- Materials: insufficient compact text geometry ownership allowed both long labels to wrap.
- Reminder: presentation debt in `calendar-reminder-entry.css`, not a duplicate component or lazy-style lifecycle owner.
- Learn stale-shell root cause is not assumed complete yet; new Home → Learn + Back/Forward executable evidence will determine whether bootstrap history canonicalization is additionally required.

### Changed files

- `frontend/components/route-primary-navigation.tsx`: Library now writes `dictionary` graph ownership.
- `frontend/app/information-architecture.css`: compact Materials uses minmax columns, 48px targets, compact padding/type and `white-space: nowrap`.
- `frontend/app/calendar-reminder-entry.css`: route Reminder now uses semantic surface/text/primary/elevation tokens while preserving geometry and behavior.
- `frontend/e2e/dictionary-route-island.spec.ts`: legacy fallback expectations replaced with canonical Dictionary owner plus 390px Materials, intra-tab and Back/Forward checks.
- `frontend/e2e/learn-route-island.spec.ts`: added Home → Learn + Back/Forward/reload ownership and history marker contract; runs in normal UI project matrix including WebKit/iOS.
- `frontend/e2e/route-transition-runtime-visual.spec.ts`: new fail-closed 390×844 transition-derived Light/Dark evidence for Dictionary/Phrases/Learn.
- `frontend/playwright.visual.config.ts`: includes the new transition visual spec.
- `.agents/current/**`: active #577 task context.

### Checks passed

- Live source/provenance inspection and ownership analysis completed.
- #570/#578 delivery reconciliation and exact-main CI completed before starting #577.
- No workflow/package routing change required for WebKit/iOS transition coverage.

### Checks failed

- Not yet run on the #577 branch. The first Visual run is intentionally expected to fail only at six `REVIEW_REQUIRED` fingerprints if structural/runtime contracts pass.

### Current branch head

Resolve from live `fix/issue-577-route-runtime` branch ref after the Agent Harness writes complete.

### Next action

Finish current Agent Harness execution record, read back the exact diff, open Draft PR #577, and run immutable CI. Classify any structural/route failure before reviewing visual evidence; if Visual reaches only the six intentional review gates, download and manually inspect the exact Linux artifact before approving hashes.