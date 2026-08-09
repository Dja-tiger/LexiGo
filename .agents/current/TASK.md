# Current Task

## Identity

- Issue: #74
- Branch: `fix/issue-74-dictionary-kind-nav-targets`
- Base SHA: `b75d8a4c3a5fbba2be94c091f1e27ab6f9306c86`
- Head SHA: resolve from live branch ref
- PR: #452

## Objective

Close the next verified Issue #74 residual gap on guest `/dictionary`: give the shared CatalogKindNavigation buttons `Слова и термины` and `Рабочие фразы` a minimum 44px fine-pointer / 48px coarse-pointer effective target without changing their approved painted geometry or navigation semantics.

## Scope

- Guest canonical `/dictionary` only; authenticated Dictionary does not render CatalogKindNavigation.
- Shared `CatalogKindNavigation` buttons rendered by the guest Dictionary branch.
- Reuse the existing Dictionary route-scoped paint-inert touch-target layer.
- Extend the existing Dictionary source ownership contract and blocking Playwright acceptance.
- Desktop Chromium, Android Chromium and iOS WebKit evidence, including a coarse-pointer viewport wider than the existing 640px painted-48 breakpoint.

## Non-goals

- Phrases CatalogKindNavigation; it is already owned by `phrases-catalog-touch-targets.css`.
- Authenticated Dictionary filters, result cards, pagination or search-clear behavior beyond existing ownership.
- Runtime component/callback/navigation changes.
- Painted dimensions, colors, borders, typography, layout composition or visual-baseline updates.
- Dependencies, lockfile, package scripts, workflows, backend or deployment configuration.
- Physical-device acceptance; this remains a final manual Issue #74 gate.

## Allowed paths

- `frontend/app/dictionary-catalog-touch-targets.css`
- `frontend/components/dictionary-catalog-touch-target-source.test.ts`
- `frontend/e2e/dictionary-catalog-touch-targets.spec.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- `.agents/PROJECT_STATE.md`
- `frontend/package.json`
- `frontend/package-lock.json`
- `frontend/app/information-architecture.css`
- `frontend/app/dictionary-catalog.css`
- `frontend/components/catalog-kind-navigation.tsx`
- `frontend/components/dictionary-catalog.tsx`
- visual-baseline metadata or binary snapshots
- `.github/workflows/**`
- backend/runtime API files
- dependency/devDependency version fields

## Runtime owners

- `frontend/components/catalog-kind-navigation.tsx` owns the two shared catalog-kind buttons and callbacks.
- `frontend/components/dictionary-catalog.tsx` owns when the shared navigation is rendered on guest Dictionary.
- `frontend/app/information-architecture.css` owns its painted 44px base geometry and existing <=640px painted 48px geometry.
- `frontend/app/dictionary-catalog-touch-targets.css` owns only effective pointer geometry for compact Dictionary controls.

## Documentation owners

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Invariants

- Preserve the shared navigation's painted geometry and runtime semantics.
- Expand only block-axis hit ownership; both text-bearing buttons already exceed the modality contract inline.
- Transparent target slop must have no border, background or box-shadow and must not replace focus ownership.
- The two side-by-side buttons must remain independently clickable and non-overlapping.
- `/phrases` ownership remains unchanged and must not be duplicated or weakened.
- Existing blocking UI/a11y collection remains authoritative; no package-script change is necessary.
- No visual baseline may be updated for this paint-inert slice.

## Acceptance criteria

- Guest `/dictionary` renders exactly two CatalogKindNavigation buttons with their existing accessible names.
- Fine pointer exposes >=44px effective width/height for both controls.
- Coarse pointer exposes >=48px effective width/height for both controls at a viewport wider than 640px, proving the interaction owner rather than the existing painted mobile breakpoint.
- Four perimeter probes resolve to each owning button.
- Effective target rectangles do not intersect.
- Painted geometry remains unchanged: wide guest controls remain approximately 44px tall while the coarse target reaches 48px.
- Keyboard focus remains visible and the phrase switch retains navigation to `/phrases`.
- No horizontal overflow is introduced.
- Source contract locks live runtime ownership, transparent block-axis expansion and blocking test collection.

## Required checks

- Frontend unit/Vitest source ownership contract.
- Existing `e2e/dictionary-catalog-touch-targets.spec.ts` in blocking UI and accessibility commands.
- Full immutable-head product CI before Ready.
- Clean PR review/comment/thread audit.
- Expected-head squash merge.
- Exact-SHA main CI and exact-image Stage/public validation.
- Separate docs-only Agent Harness reconciliation after product delivery.

## Risks

- A pseudo target could accidentally intercept the adjacent shared catalog-kind button; pairwise target geometry must stay disjoint.
- Testing only <=640px would produce a false green because canonical paint is already 48px there; acceptance must include a wider coarse-pointer viewport.
- Shared selectors could broaden ownership to `/phrases`; route scoping must remain exact `/dictionary`.

## Rollback

Revert the Dictionary route-scoped selector extension and its source/browser evidence as one atomic slice. No runtime data, API or visual migration is involved.
