# Current Task Progress

## 2026-08-19 — Issue #608 diagnostic PR opened

### Verified

- Live base: `main@2412dce6a0cbb71c9a781829c09416e531efc502`.
- Issue: #608 under umbrella #205.
- Branch: `test/issue-608-route-keyboard-focus-parity`.
- Draft PR: #609.
- Initial PR head before harness sync: `edd1a17875e3e7c6698be6398a92d8db70d1ce30`.
- Diagnostic CI head before evidence sync: `7edea4fc3095408537ff8a6a4acb4714532079ef`.
- Pre-PR compare: `behind_by=0`, exactly six allowed paths, no production runtime files.
- Existing Issue #45 is closed completed and remains the baseline product keyboard owner; this slice does not reopen it.
- `frontend/e2e/accessibility-keyboard.spec.ts` already protects shell Tab order, Enter/Space flows, Lesson Composer roving controls, calendar dialog focus trap/restore, positive-tabindex ban and axe keyboard baseline for six top-level routes.
- The confirmed gap is one uniform ten-route #205 matrix including Word Detail, Phrase Detail and Onboarding plus consistent compact/desktop focus geometry and RouteChrome evidence.

### Finding

The consolidated owner is implemented as a deterministic desktop-Chromium traversal over explicit `390×844` and `1440×1024` viewports in Light/Dark. Cross-browser engine coverage remains owned by the existing specialized keyboard/axe suites.

### Implementation

- added `frontend/e2e/route-keyboard-focus-parity.spec.ts`;
- added `frontend/components/keyboard-focus-collection-contract.test.ts`;
- added the new owner to blocking `test:e2e:a11y` in `frontend/package.json`;
- the owner uses real `Tab` / `Shift+Tab` and contains no `.focus()` proof path;
- every sequential stop is checked for rendered/enabled/non-inert/non-aria-hidden state, `:focus-visible`, painted indicator, inline ring containment, clipping ancestors, fixed/sticky RouteChrome overlap and unobscured center point;
- exact ordinary/focused RouteChrome ownership, positive-tabindex ban, reduced motion and runtime errors are fail-closed;
- JSON traces are attached per route/theme/viewport.

### Diagnostic CI

- CI #3853 / run `32229895571` on head `7edea4fc3095408537ff8a6a4acb4714532079ef` passed frontend core, backend, accessibility audit, visual regression, iOS PWA dictionary, service-worker, content-security, performance and UI shard 1.
- The new Issue #608 consolidated keyboard/focus owner passed in the blocking Accessibility audit.
- Initial `UI tests (shard 2/2)` job `95997913850` failed only the pre-existing Issue #74 calendar reminder test in `ios-webkit`, original + Playwright retry: viewport `320`, document/body `scrollWidth=331`, expected `<=321`.
- Failure artifact: `frontend-playwright-report-ui-2`, ID `9357114659`, digest `sha256:c3747f03658c5ae474a81425a02f9c36fd6b359ddf66752a8cdf80de8b9b9d2a`.
- The trace proves completed Issue #468 did not regress: the closed preview was already `display:none` with zero width/height before the page-level overflow gate.
- The same trace shows Home changing from loading/`aria-busy` state to final progress/streak state during the whole-document overflow evaluation. The calendar test did not synchronize the host `/` route before measuring page geometry.
- The same runtime tree previously passed UI shard 2 in CI #3848 / run `32227193079`.
- Re-running only the failed job on the same #609 head, with no code changes, passed as job `96039144964`.
- Classification: independent pre-existing test synchronization race, not a #608 keyboard/focus product regression and not a reason to weaken #608 assertions.
- Follow-up Issue #610 tracks stabilization of the 320px / 200% calendar reflow gate without widening overflow tolerance.

### Checks passed

- live main/open-PR pre-flight;
- duplicate/ownership audit against #45/#205 and current keyboard tests;
- allowed-path compare audit;
- write readbacks for new spec/source contract/package collection;
- source contract explicitly forbids `.focus()` in the consolidated owner;
- diagnostic immutable-head Accessibility audit including the new owner;
- diagnostic full matrix except the independently classified first-attempt calendar synchronization race;
- same-head rerun of the failed UI shard passed;
- PR review submissions: none;
- inline review threads: none;
- `main` remained `2412dce6a0cbb71c9a781829c09416e531efc502` during diagnostic classification.

### Checks failed / classified

- CI #3853 initial UI shard 2 attempt failed due Issue #610 host-route synchronization race. No #608 runtime/focus defect was found.

### Current branch head

Resolve from live branch ref after this evidence-sync write set.

### Next action

Run a fresh full immutable-head CI on the final developer-authored evidence-sync head. Require the full run to pass without relying on a rerun, then repeat diff/review/main-drift audit, mark PR #609 Ready and guarded-squash merge. No Stage redeploy is required for this test/evidence-only slice.
