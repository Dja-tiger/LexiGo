# Current Task Progress

## 2026-08-19 — Issue #608 diagnostic PR opened

### Verified

- Live base: `main@2412dce6a0cbb71c9a781829c09416e531efc502`.
- Issue: #608 under umbrella #205.
- Branch: `test/issue-608-route-keyboard-focus-parity`.
- Draft PR: #609.
- Initial PR head before harness sync: `edd1a17875e3e7c6698be6398a92d8db70d1ce30`.
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

### Checks passed

- live main/open-PR pre-flight;
- duplicate/ownership audit against #45/#205 and current keyboard tests;
- allowed-path compare audit;
- write readbacks for new spec/source contract/package collection;
- source contract explicitly forbids `.focus()` in the consolidated owner.

### Checks failed

- none yet; CI has not been classified on the post-harness-sync head.

### Current branch head

Resolve from live branch ref after this atomic harness-sync commit.

### Next action

Run and classify immutable PR CI. Treat any source/type/test defect as an audit implementation fix; treat any reproducible current product focus failure as a separate atomic runtime Issue/PR without weakening #608.
