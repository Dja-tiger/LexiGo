# Current Task

## Identity

- Issue: #70
- Branch: `refactor/issue-70-consolidate-phrases-css`
- Base SHA: `986ab18f4faa2f8a0581133e976cb104a3e4434a`
- Head SHA: resolve from live branch ref
- PR: #284

## Objective

Consolidate the live route-scoped Phrases computed-cascade overrides into the canonical `frontend/app/phrases.css` owner, remove `phrases-compat.css` and its root-layout import, and prove that effective styling and authoritative visual hashes remain unchanged.

## Scope

- Preserve the exact selectors, declarations and specificity formerly owned by `frontend/app/phrases-compat.css` in `frontend/app/phrases.css`.
- Remove `import "./phrases-compat.css"` from `frontend/app/layout.tsx`.
- Delete `frontend/app/phrases-compat.css`.
- Enforce canonical ownership, import order, selector uniqueness, exact declaration values and compatibility-file absence with an executable source contract.
- Update the Issue #70 compatibility cleanup document and CSS specificity rule with the canonical owner.
- Record exact execution and validation evidence in `.agents/current/*`.

## Non-goals

- No selector rename, declaration value change, specificity increase or visual behavior change.
- No Phrases markup, runtime, URL state, API, History or lesson-domain change.
- No CSS changes outside the exact Phrases override family.
- No visual baseline promotion.
- No backend, API, migration, deployment or bundle-budget change.
- No broad CSS consolidation beyond this one file/import family.

## Allowed paths

- `.agents/AGENTS.issue-261-css-specificity.md`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/app/layout.tsx`
- `frontend/app/phrases.css`
- `frontend/app/phrases-compat.css` — deletion
- `frontend/components/phrases-css-ownership.test.ts`
- `frontend/docs/compatibility-cleanup.md`

## Prohibited paths

- `.github/workflows/**`
- `scripts/ci/**`
- all other CSS files
- `frontend/e2e/**/*-snapshots/**`
- `frontend/bundle-budgets.json`
- frontend runtime components and libraries except the source-only ownership test
- backend, API, migrations and deployment files

## Runtime owners

- `frontend/components/lexigo-phrases-app.tsx` remains the sole Phrases route runtime owner.
- `frontend/app/phrases.css` is the sole route-specific Phrases visual and computed-cascade owner.
- `frontend/app/catalog-enhancements.css` remains the shared catalog-sort base owner.
- Root layout remains the explicit global stylesheet import owner.

## Documentation owners

- `.agents/AGENTS.issue-261-css-specificity.md` owns the stable CSS cascade lesson and canonical ownership rule.
- `frontend/docs/compatibility-cleanup.md` owns the exact Issue #70 delivery boundary and remaining CSS/runtime cleanup roadmap.
- `.agents/current/*` owns current task scope, progress, execution method and handoff evidence.

## Invariants

- `catalog-enhancements.css` remains imported before `phrases.css`.
- Every moved selector keeps byte-equivalent selector text and declaration values.
- Route scoping remains `.lx-app[data-route-client-island="phrases"]`.
- Catalog-sort border, text, surface, elevation and `backdrop-filter: none` overrides remain unchanged.
- Selected topic chip contrast remains `#10211d`/700 and forced-colors remains `HighlightText`/`Highlight`.
- Phrases result boundary remains `padding-top: 24px`.
- Forced-colors catalog sort remains Canvas/CanvasText with no shadow.
- `phrases-compat.css` is absent and layout imports `phrases.css` exactly once.
- Eight content-addressed compact/desktop Light/Dark catalog/detail hashes remain unchanged.
- No visual baseline or budget file changes.
- Temporary workflow/script changes are absent from the final compare.
- Final immutable PR head is developer-authored.

## Acceptance criteria

- `phrases-compat.css` no longer exists.
- Root layout no longer imports `phrases-compat.css` and still imports `catalog-enhancements.css` before `phrases.css`.
- `phrases.css` contains the complete former compatibility rule family under a canonical Issue #70 ownership comment.
- Source contract validates file absence, import order, selector uniqueness and exact preserved declarations.
- CSS specificity guidance names `phrases.css` as the canonical Phrases route override owner.
- Compatibility cleanup documentation records the consolidation and remaining boundaries.
- Lint, TypeScript, unit/source tests and production build pass.
- Browser, forced-colors, accessibility and all eight authoritative Phrases visual hashes pass unchanged.
- Full backend, frontend, browser, performance and container CI passes on one immutable developer-authored head.
- Final compare is behind `0` and contains only declared paths.
- PR is expected-head squash-merged and exact merge SHA passes stage/public smoke/browser validation.

## Required checks

- Agent Harness and change-scope classification.
- Frontend lint, TypeScript, unit/source contracts, production build and dependency audit.
- Source ownership contract for layout, canonical stylesheet and deleted compatibility file.
- Direct `/phrases` and `/phrases/[slug]` guest/auth route behavior.
- Forced-colors and accessibility matrix.
- Phrases compact/desktop Light/Dark catalog/detail content-addressed Linux visual regression.
- Existing performance budgets without ceiling changes.
- Complete Chromium/WebKit/Android/iOS browser matrix.
- Backend unit/security/integration and container builds.
- Review/comments/threads audit, exact compare, expected-head squash merge and exact-SHA stage/public validation.

## Risks

- Moving declarations earlier than a competing global rule could change computed values; import order and exact selector specificity must be executable contracts.
- Omitting one forced-colors or contrast declaration could pass source compilation but fail accessibility or visual hashes.
- A duplicate copied rule could preserve visuals while leaving ambiguous ownership; selector uniqueness must be tested.
- A pure cleanup visual mismatch indicates hidden import-order ownership and must stop the slice without baseline promotion.

## Rollback

Revert the atomic squash merge. This restores the separate compatibility stylesheet and import; no data, API or migration rollback is required.
