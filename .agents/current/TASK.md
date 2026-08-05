# Current Task

## Identity

- Issue: #74 — increase small touch targets and mobile labels.
- Branch: `fix/issue-74-dictionary-search-clear-target`.
- Base SHA: `dc6dd82091b2d0076da6e4663936ff75a2852d28`.
- Head SHA: implementation head before task-record synchronization `e58c6ca3d1e10e9e8e89d52136c8604b185d88bc`; resolve the final head from the live branch ref.
- PR: #409 — Draft.

## Objective

Guarantee a minimum 44×44 CSS px fine-pointer and 48×48 CSS px coarse-pointer effective target for the live conditional Dictionary action `Очистить поиск`, without changing its approved 36×36 painted geometry, search behavior, URL state or catalog presentation.

## Scope

- Add one route-scoped interaction-only CSS owner for `/dictionary`.
- Expand the conditional clear button through a transparent pseudo-element.
- Add a fail-closed source ownership contract.
- Add blocking desktop Chromium, Android Chromium and iOS WebKit browser proof.
- Register the browser proof in the existing UI and accessibility commands.
- Maintain factual Agent Harness task records.

## Non-goals

- Dictionary search, API, controlled-input synchronization, URL/history or pagination behavior changes.
- Quick-filter, filter-panel, catalog-card, Word Detail or other remaining Issue #74 controls.
- Painted size, color, positioning, spacing, focus styling or visual baseline changes.
- Whole-application 200% browser zoom or physical-device acceptance.
- Dependabot PRs #304, #305 and #403.

## Allowed paths

- `frontend/app/dictionary-search-clear-touch-targets.css`
- `frontend/components/dictionary-search-clear-touch-target-source.test.ts`
- `frontend/e2e/dictionary-search-clear-touch-targets.spec.ts`
- `frontend/app/layout.tsx`
- `frontend/package.json`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- `frontend/components/dictionary-catalog.tsx`
- `frontend/app/dictionary-catalog.css`
- backend, API, migrations, deployment and workflow files
- visual snapshot PNG files
- `.agents/PROJECT_STATE.md` before completed merge and deployment evidence
- every path not listed in Allowed paths

## Runtime owners

- `LexigoDictionaryApp` is the canonical `/dictionary` route island.
- `DictionaryCatalog` owns authenticated search state, the exact `Очистить поиск` accessible name, callback and URL-backed filter update.
- `dictionary-catalog.css` owns the 48px search field, 36×36 painted clear control, position, color and focus presentation.
- `dictionary-search-clear-touch-targets.css` owns only the transparent effective event surface.

## Documentation owners

- `.agents/current/TASK.md` owns the bounded contract and path allow-list.
- `.agents/current/PROGRESS.md` owns factual progress and validation evidence.
- `.agents/current/EXECUTION.md` owns applied procedures, failures and limitations.

## Invariants

- The clear action remains conditional on non-empty `searchInput` and authenticated Dictionary catalog reachability.
- Exact accessible name remains `Очистить поиск`.
- Click continues to set the controlled input to an empty string and navigate with `{ query: "", page: 1 }`.
- Search field remains 48px high; painted clear control remains 36×36 at `right: 7px` and vertically centered.
- Expanded target remains inside the search field and has no background, border or shadow.
- Existing focus-visible owner remains unchanged.
- No horizontal overflow is introduced at 1440px, 390px or 320px.
- No visual baselines change.

## Acceptance criteria

- Fine-pointer effective target is a 44×44 CSS px square.
- Coarse-pointer effective target is a 48×48 CSS px square.
- All four expanded perimeter points hit the clear button.
- The target remains contained in the existing search field.
- The painted button retains its trailing inset and approved dimensions.
- Keyboard focus remains visible.
- Activating the control clears the input, removes the conditional action and preserves catalog behavior.
- Source ownership and blocking command registration are fail-closed.

## Required checks

- exact branch and allowed-path compare against live `main`
- source ownership contract through frontend unit tests
- frontend lint and TypeScript
- production build and dependency audit
- desktop Chromium, Android Chromium and iOS WebKit browser proof
- complete blocking UI and accessibility suites
- axe, visual regression without baseline updates, PWA, security, performance and container gates through authoritative full CI
- final developer-authored immutable-head CI
- no PR comments, reviews or unresolved threads before Ready
- expected-head squash merge, exact-SHA main CI and exact-image stage/public validation

## Risks

- Pseudo-element hit slop can escape the 48px field if the base inset or painted size changes.
- A global or less-specific selector could accidentally widen ownership to Word Detail or other Dictionary controls.
- Browser engines can serialize pseudo-element insets differently; proof uses numeric geometry rather than CSS strings.
- Conditional control timing can race with controlled-input synchronization; browser proof waits for the visible semantic owner.

## Rollback

Revert the product changes or remove the dedicated stylesheet import, source contract, browser proof and command registrations. Runtime search and URL-state code require no rollback because they are unchanged.
