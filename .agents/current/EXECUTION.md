# Current Task Execution

## Task

- Branch: `fix/issue-577-route-runtime`
- Base SHA: `e25cee1b2ef991aff9ea5a27f63d170e1bc8d1b7`
- Head SHA: resolve from live branch ref
- PR: pending Draft PR

## Skills used

### GitHub repository workflow

Purpose:

Inspect live repository state, prove runtime ownership/root causes, write the atomic #577 branch through GitHub, open a Draft PR, and use immutable Actions evidence for delivery.

Instruction source:

`skills://plugins/github/github/skill.md`

Version or verification date:

Read live on 2026-08-17.

Inputs:

Issue #577, umbrella #205, reconciled main `e25cee1b2ef991aff9ea5a27f63d170e1bc8d1b7`, current route runtime source, OpenPencil screen map and existing browser/visual contracts.

Files inspected:

- `frontend/components/route-primary-navigation.tsx`
- `frontend/components/lexigo-bootstrapped-app.tsx`
- `frontend/components/routed-lexigo-app.tsx`
- `frontend/components/calendar-reminder-route-entry.tsx`
- `frontend/app/information-architecture.css`
- `frontend/app/calendar-reminder-entry.css`
- `frontend/app/design-tokens.css`
- `frontend/app/appearance.css`
- `frontend/app/layout.tsx`
- `frontend/e2e/dictionary-route-island.spec.ts`
- `frontend/e2e/learn-route-island.spec.ts`
- `frontend/e2e/calendar-reminder-entry.spec.ts`
- `frontend/e2e/information-architecture.spec.ts`
- `frontend/e2e/home-tablet-progress-visual.spec.ts`
- `frontend/e2e/route-tablet-parity.spec.ts`
- `frontend/playwright.config.ts`
- `frontend/playwright.visual.config.ts`
- `frontend/package.json`
- `.github/workflows/ci.yml`
- `docs/figma/openpencil-screen-map.json`

Actions performed:

- Verified #570 exact-main CI #3735 completion and reconciled it through docs-only PR #578 before starting new runtime work.
- Created `fix/issue-577-route-runtime` from exact reconciled main.
- Proved that Library navigation wrote `product` rather than `dictionary` graph ownership.
- Proved that existing Dictionary E2E encoded the legacy fallback as expected behavior.
- Proved Materials compact owner and Reminder shared presentation owner from live source.
- Verified existing UI CI already executes Dictionary/Learn specs in `ios-webkit`; no workflow/package topology expansion is required.
- Verified active OpenPencil provenance for Dictionary/Learn/Phrases compact screens.
- Changed primary Library graph hint to `dictionary`.
- Added compact Materials no-wrap/equal-target ownership.
- Replaced Reminder legacy hardcoded dark/blue colors with existing semantic design tokens.
- Rewrote Dictionary transition regression contract to require canonical ownership through Home, Dictionary↔Phrases and Back/Forward.
- Added Learn Home-transition, history and reload contract.
- Added six fail-closed transition-derived visual states at canonical 390×844.

Commands or procedures:

- GitHub connector reads/searches for live source, issues and workflows.
- GitHub contents API writes on the dedicated branch with exact source blob SHAs.
- CI will be triggered through a Draft PR after read-back/compare.
- Exact Linux visual artifact will be downloaded and manually reviewed before any fingerprint approval.

Artifacts produced:

- New `frontend/e2e/route-transition-runtime-visual.spec.ts` with `REVIEW_REQUIRED` baselines.
- Updated transition/history browser contracts and runtime presentation owners.
- Updated `.agents/current/**` task state.

Result:

Implementation skeleton is on the #577 branch. No visual fingerprint has been approved and no runtime delivery claim has been made before CI/artifact review.

Failures:

None classified yet on the #577 branch; immutable CI has not started.

Root cause:

Dictionary root cause is a wrong route-graph identity emitted for Library client navigation. Materials and Reminder have independent scoped presentation ownership defects. Learn requires executable confirmation to determine whether stale history acceptance in bootstrap also needs a runtime code change.

Fallback:

If Home → Learn or history traversal still enters compatibility `product` ownership after the navigation fix, canonicalize stable `/learn` and `/dictionary|/words/*` graph requests/history in `LexigoBootstrappedApp` while preserving `/lesson/*` product handoff. Do not add timing/remount workarounds.

Limitations:

Figma Cloud is intentionally excluded by Issue #577. Current design evidence comes from the repo-owned OpenPencil screen map and Linux runtime artifacts. Physical-device sign-off remains outside automated CI, but `ios-webkit` is required and available in the existing project matrix.

Reusable lesson:

A client route can have correct direct-entry visuals while still using the wrong semantic owner after SPA navigation if route graph/history metadata names the compatibility graph. Transition tests must assert the semantic island and history identity, not just final pathname or heading text.