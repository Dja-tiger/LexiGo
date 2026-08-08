# Current Task

## Identity

- Issue: #74 — Increase small touch targets and mobile labels
- Branch: `fix/issue-74-dictionary-catalog-targets`
- Base SHA: `80b0a8d3d13f0d7ac12350867eba64f312fe750c`
- Head SHA: resolve from live branch ref
- PR:

## Objective

Close the confirmed live Dictionary catalog interaction gaps in Issue #74 while preserving the approved compact painted geometry, filtering semantics, URL/history ownership and catalog API behavior.

## Scope

- Give the live Dictionary quick-filter pills a 44px fine-pointer / 48px coarse-pointer effective target without enlarging their painted 34px controls.
- Give live Dictionary source/status/sort filter-panel buttons a 44/48px effective target without enlarging their painted 38px controls.
- Give the live Dictionary reset and catalog-pagination actions a 44/48px effective target while preserving their current painted geometry.
- Preserve independent targets when compact quick filters wrap to two rows at <=340px and when coarse-pointer panel filters are vertically stacked.
- Preserve the 44px painted Dictionary topic select while proving a semantic 48px coarse-pointer label target.
- Add desktop Chromium, Android Chromium and iOS WebKit real-hit acceptance and collect it in authoritative UI/accessibility suites.

## Non-goals

- No Dictionary API, metadata, pagination-data, filtering, sorting, URL-state or history changes.
- No search-clear change; PR #409 already owns that contract.
- No result-card, mobile filter-toggle, Word Detail or shared navigation change; those surfaces are already compliant or separately owned.
- No visual snapshot update unless deterministic product evidence proves an intended painted-layout change.
- No dependency, workflow or `.agents/PROJECT_STATE.md` change in this product PR.

## Allowed paths

- `frontend/app/dictionary-catalog-touch-targets.css`
- `frontend/app/layout.tsx` — stylesheet import only
- `frontend/e2e/dictionary-catalog-touch-targets.spec.ts`
- `frontend/package.json` — authoritative UI/a11y collection registration only
- `frontend/components/dictionary-catalog-touch-target-source.test.ts` — source/ownership contract only if required
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `.agents/AGENTS.md` plus one new specialized lesson only if CI exposes a new confirmed reusable failure category

## Prohibited paths

- `.agents/PROJECT_STATE.md`
- Backend/API/migrations.
- `frontend/components/dictionary-catalog.tsx` behavior/markup unless deterministic acceptance proves a semantic defect that CSS cannot solve.
- `frontend/app/dictionary-catalog.css` painted geometry unless deterministic evidence proves the canonical owner itself must change.
- Dependency versions, lockfile or workflows.
- Existing visual snapshots without deterministic product evidence.

## Runtime owners

- `frontend/components/dictionary-catalog.tsx`
- `frontend/components/catalog-pagination.tsx`
- `frontend/app/dictionary-catalog.css`
- `frontend/app/catalog-pagination.css`
- `frontend/app/dictionary-catalog-touch-targets.css`
- `frontend/app/layout.tsx`
- `frontend/e2e/dictionary-catalog-touch-targets.spec.ts`

## Documentation owners

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Invariants

- Filter callbacks and URL/history state remain unchanged.
- Existing exact accessible names, native button/select semantics and focus order remain unchanged.
- Search-clear remains owned by `dictionary-search-clear-touch-targets.css`.
- Effective hit surfaces are transparent, borderless and shadowless.
- Expanded sibling targets never intersect.
- Compact <=340px quick-filter rows remain horizontally contained.
- Cross-target geometry is compared only in one common coordinate frame.
- The 44px topic select remains painted at its approved size; coarse-pointer expansion is semantic label padding, not a visual resize.

## Acceptance criteria

- All four live quick-filter buttons expose >=44px fine / >=48px coarse effective height and real perimeter hit ownership.
- Source/status/sort filter buttons expose >=44/48px effective targets and adjacent vertical targets remain positively separated.
- Reset and pagination actions expose >=44/48px effective targets.
- At 320px compact width, wrapped quick-filter targets do not intersect and there is no horizontal overflow.
- The topic select remains >=44px painted height while its semantic label exposes >=48px coarse-pointer clickable height.
- Keyboard focus remains visibly discernible.
- Representative filter and pagination activation preserves existing navigation/filter behavior.
- Acceptance is collected by authoritative UI and accessibility suites.

## Required checks

- Frontend lint/typecheck/unit/build and production dependency audit.
- Authoritative UI/a11y browser matrix.
- Full immutable-head product CI including visual, performance, CSP/PWA and container gates.
- Clean review/thread audit before Ready.
- Expected-head squash merge.
- Exact-SHA main CI and exact-image Stage/public validation.

## Risks

- Transparent block-axis expansion can overlap stacked 38px panel buttons unless coarse-pointer row gaps are increased.
- At <=340px quick filters wrap into two rows; a 48px target around a 34px painted pill requires enough row gap to keep targets independent.
- Fixed/mobile navigation can cover off-screen perimeter probes; acceptance must normalize each individual target into a safe viewport before real hit testing.
- Pairwise overlap must be measured from one shared scroll state.

## Rollback

Remove the Dictionary catalog interaction-only stylesheet, its layout import, dedicated acceptance/source contracts and collection entries. Dictionary filtering/navigation behavior remains otherwise unchanged.
