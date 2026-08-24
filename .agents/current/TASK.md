# Current Task

## Identity

- Issue: #678 — `[High][Frontend][RouteChrome][Tablet] Убрать legacy navy/purple/cyan rail на 720–1023px`
- Branch: `fix/issue-678-tablet-route-chrome-palette`
- Base SHA: `e9a0876dc083fed3a79eae2ec9e6c8eeebf775dc`
- Head SHA: resolve from live branch ref
- PR: draft after the first executable runtime/test slice

## Objective

Close the #205 medium/tablet RouteChrome palette ownership gap so the canonical 768×1024 shared rail follows current semantic `--ak-color-*` appearance tokens instead of the legacy navy/purple/cyan premium UI palette.

## Scope

- Preserve existing tablet navigation geometry and route semantics.
- Add semantic shared RouteChrome ownership for the uncovered 720–1023px range.
- Cover Light and Dark computed presentation at 768×1024.
- Cover all non-focused routes that expose the shared tablet rail.
- Preserve focused Active Lesson / Onboarding ownership.
- Generate exact Linux visual evidence before approving any changed tablet fingerprints.

## Non-goals

- No broad `premium-ui.css` / `globals.css` cleanup.
- No navigation IA or geometry redesign.
- No backend/API/scheduler changes.
- No OpenPencil source mutation unless a separate evidence-backed design-source gap is proven.
- No Figma Cloud work.
- No blind visual baseline replacement.

## Allowed paths

- `.agents/current/**`
- `frontend/app/adaptive-knowledge-coach-home.css`
- `frontend/e2e/route-tablet-parity.spec.ts`
- tablet visual fingerprints in that test only after exact Linux actual PNG manual review proves the intentional palette-only delta

## Prohibited paths

- `backend/**`
- `design/**`
- `.github/workflows/**`
- dependency manifests / lockfiles
- unrelated frontend route/runtime files
- min-mobile/desktop fingerprints unless an independently reproduced regression requires a separate slice

## Runtime owners

- Shared route shell/navigation: `frontend/app/adaptive-knowledge-coach-home.css` semantic Application Shell + RouteChrome layer.
- Legacy fallback tablet presentation being superseded only in this breakpoint: `frontend/app/route-navigation.css`.
- Route graph/semantics remain owned by existing `RouteChrome` / routed-app components.

## Documentation owners

- Issue #678 owns the defect and acceptance contract.
- Parent #205 owns final route-by-route visual parity.
- `.agents/current/**` owns active execution state only.

## Invariants

- One atomic visual ownership defect per PR.
- Existing tablet rail dimensions/placement/interaction remain unchanged.
- Effective palette derives from semantic appearance tokens, not replacement hard-coded colors.
- Focused routes do not receive shared rail accidentally.
- No baseline is approved before exact Linux screenshot inspection.
- Main must remain the verified base until branch writes are complete; any main movement requires reconciliation/rebase before merge.

## Acceptance criteria

- 768×1024 rail background is no longer legacy `rgba(8, 14, 27, 0.84)`.
- Active state no longer effectively uses `#8b67ff`, `#33a8ff` or `#a989ff`.
- Route brand/inactive/hover/active states follow semantic Light/Dark tokens.
- Home, Learn, Progress, Dictionary, Word Detail, Phrases, Phrase Detail and Profile share one semantic tablet RouteChrome presentation.
- Active Lesson / Onboarding focused ownership is unchanged.
- No tablet overflow, clipping, geometry shift or focus regression.
- Direct entry, reload and real Back/Forward preserve the same owner/palette.
- Exact Linux tablet screenshots are manually reviewed before SHA-256 fingerprints change.

## Required checks

- targeted source/unit/frontend checks covering RouteChrome ownership
- `route-tablet-parity.spec.ts` in the appropriate Linux Playwright shard(s)
- visual regression / exact 768×1024 evidence
- accessibility and performance gates as collected by full CI
- full immutable-head CI
- clean review/review-thread audit
- expected-head squash merge
- exact-main CI and exact-SHA Stage/public smoke/browser validation because runtime CSS changes

## Risks

- Existing tablet hashes currently freeze the legacy rail; intentional pixels will fail the fingerprint gate until reviewed.
- CSS specificity/import order can make source declarations non-effective; computed-style proof is mandatory.
- Explicit Light/Dark token ownership must not be confused with prior Auto/system compatibility contracts from #589/#593.

## Rollback

Revert the atomic runtime/test PR. No schema/data/backend/design migration is involved.
