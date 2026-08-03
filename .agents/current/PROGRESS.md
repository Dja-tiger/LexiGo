# Current Task Progress

## 2026-08-03 23:59 Europe/Moscow

### Verified

- Base `1030ef2decd970251846650371c18ed8ff9f0ba1` was the exact current `main` used to create the branch and remains the live main tip.
- Draft PR #368 is the only open product PR for this slice.
- Root CSS order remains premium → mobile PWA → adaptive navigation → routed application-shell chrome.
- The original bounded inventory contained exactly ten premium → mobile-PWA conflicts.
- `adaptive-knowledge-coach-home.css` is a routed application-shell owner across canonical routes, not a Home-only stylesheet: it owns routed header background, 34×34 logo and stronger compact non-dictionary shell geometry.
- Diagnostic CI #2633 / run `30850565546` emitted exactly 71 actual conflict IDs with no replacement mobile → routed-chrome pair.
- The parser-derived manifest blob `d379ee2f149fee52464272d70be4a88cfe84ba0e` exactly matches the generated CI artifact.
- Full CI #2636 / run `30851215899` ran on head `77d36b1e066e2be0da36b872444d3c0a1ff3ce9b`.

### Finding

The first full browser run exposed an error in the newly added proof fixture, not a production CSS regression. At 390px and 719px the fixture expected shadowed mobile fallback values `58px / 12px / 18px`, while production order correctly computed the pre-existing stronger routed-shell values `54px / 0px / 0px` for the `/learn`-shaped non-dictionary shell.

### Root cause

The mobile file contains fallback/dictionary compact declarations, but the actual `/learn` ancestry matches these more specific routed-shell selectors:

- `.lx-routed-app .lx-app:not(.lx-lesson-focus-mode):not([data-route-client-island="dictionary"]) .lx-header`;
- `.lx-routed-app .lx-app:not([data-route-client-island="dictionary"]) .lx-view`.

The new test correctly loaded the real routed-shell stylesheet but its expected compact snapshot still described the lower-specificity mobile declarations. Desktop Chromium and Android Chromium therefore failed identically and deterministically in both retries.

### Changed files

- `.agents/current/TASK.md`;
- `.agents/current/PROGRESS.md`;
- `.agents/current/EXECUTION.md`;
- `frontend/app/mobile-pwa-fixes.css`;
- `frontend/app/global-feature-style-overlap-manifest.json`;
- `frontend/app/global-feature-style-overlap-manifest.test.ts`;
- `frontend/components/navigation-mobile-shell-css-ownership.test.ts`;
- `frontend/e2e/navigation-mobile-shell-cascade.spec.ts`.

### Checks passed

- Mobile header background and logo declarations were removed rather than re-owned under a competing routed selector.
- Compact fallback/dictionary header declarations remain routed and bounded to `max-width: 719px`.
- Avatar 42×42 and view padding-top 18px remain routed and bounded to `max-width: 760px`; stronger compact non-dictionary routed-shell values remain unchanged.
- Source contracts protect routed-shell background/logo ownership, bounded mobile declarations and the separate resource-stack boundary.
- The fail-closed parser reports exactly 71 IDs: 50 `intentional`, 21 `requires-proof`, 0 `protected`; no new stylesheet pair exists.
- CI #2636 passed frontend lint, TypeScript, 84 unit/source files and 532 tests, production build and dependency audit.
- Backend unit/security and integration/security passed.
- Linux visual regression passed without snapshot/hash changes.
- Accessibility, CSP, controlled service worker, iOS PWA, Dictionary smoke, Lesson completion and route-performance budgets passed.
- Playwright diagnostics proved the two UI shard failures were limited to the new 390px/719px expected snapshot and were identical across desktop/Android Chromium and retries.
- The browser proof now asserts the unchanged routed-shell compact values `54px / 0px / 0px` while retaining 58px/safe-area/18px source contracts for fallback/dictionary ownership.

### Checks failed

- CI #2636 failed UI shard 1 and UI shard 2 because the new proof expected the wrong compact owner values.
- The aggregate Frontend quality job consequently failed and container builds were skipped.
- No production test, visual baseline, accessibility rule, performance budget or backend check failed.

### Current branch head

Resolve from the live branch after this Agent Harness update.

### Next action

Run complete CI on the corrected immutable head. Require both UI shards, aggregate frontend quality and both container builds to pass in addition to the already-green gates before marking PR #368 Ready.
