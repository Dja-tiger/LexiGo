# Current Task Execution

## Task

- Branch: `fix/issue-74-phrases-catalog-targets-v3`
- Base SHA: `faf466e56e05b6d365b8a0acf14d63a25140a36b`
- Head SHA: resolve from live branch ref
- PR: #442

## Skills used

### GitHub repository harness / connector-first Issue #74 delivery

Purpose:

Deliver the confirmed Phrases catalog residual target gap through exact-base writes, authoritative browser collection, full immutable-head CI, merge and deployment evidence.

Instruction source:

- `AGENTS.md`
- `.agents/AGENTS.md` and mandatory specialized instructions
- `.agents/AGENTS.issue-74-browser-zoom-collection.md`
- `.agents/SKILLS.md`
- `.agents/PROJECT_STATE.md`
- `.agents/current/*`
- `docs/agent-harness.md`
- GitHub plugin workflow guidance

Version or verification date:

2026-08-08 Europe/Moscow; PR #442 base remains exact `faf466e56e05b6d365b8a0acf14d63a25140a36b`.

Inputs:

- Live Issue #74 acceptance criteria and current Phrases route/CSS owners.
- Delivered Phrases search-clear and Active Lesson paint-inert target patterns.
- Authoritative UI/a11y/visual collections.
- CI #3038 retained Visual job log `93052328695`.

Files inspected:

- `frontend/components/phrases-catalog.tsx`
- `frontend/components/catalog-kind-navigation.tsx`
- `frontend/components/catalog-pagination.tsx`
- `frontend/app/phrases.css`
- `frontend/app/phrases-search-clear-touch-targets.css`
- `frontend/app/information-architecture.css`
- `frontend/app/catalog-pagination.css`
- `frontend/app/premium-ui.css`
- `frontend/app/layout.tsx`
- `frontend/e2e/phrases-search-clear-touch-targets.spec.ts`
- `frontend/e2e/phrases-visual.spec.ts`
- `frontend/e2e/phrases-catalog-touch-targets.spec.ts`
- `frontend/package.json`

Actions performed:

- Reconciled stale current-task/project-state prerequisites before product work and replayed from the exact live base.
- Added route-scoped 44px fine / 48px coarse transparent effective targets and authoritative browser acceptance.
- Preserved compact painted control dimensions in the acceptance, including mobile 36px search submit and 40px lesson action.
- Ran immutable-head CI #3038 on `e39c252b2a8b6af185b47cb693807e20a4e4761c`.
- Read the exact failed Visual job log instead of updating baselines or retrying blindly.
- Confirmed four content-addressed Phrases catalog baseline mismatches and a separate 200% browser-zoom `search`/`topics` overlap assertion.
- Traced both symptoms to the same CSS bug: the compensation margin replaced the base `var(--ak-space-lg)` rather than subtracting only the added scrollport padding.
- Corrected fine-pointer compensation to `calc(var(--ak-space-lg) - 2px)` and coarse-pointer compensation to `calc(var(--ak-space-lg) - 4px)` while leaving hit-target size, radio spacing and select geometry unchanged.

Commands or procedures:

GitHub connector exact-ref reads/writes, exact failed-job log inspection, Git tree/commit construction, immutable CI/PR lifecycle and deployment inspection.

Artifacts produced:

- `frontend/app/phrases-catalog-touch-targets.css`
- `frontend/e2e/phrases-catalog-touch-targets.spec.ts`
- root CSS import
- UI/a11y collection registration
- current Agent Harness records
- diagnostic evidence from CI #3038 Visual job `93052328695`

Result:

The deterministic Phrases layout regression is corrected without changing approved visual baselines or weakening the 44/48px effective-target contract.

Failures:

- CI #3038 Visual regression failed on head `e39c252b2a8b6af185b47cb693807e20a4e4761c`: compact catalog height changed `1628 -> 1658`; desktop catalog height changed `1185 -> 1169`; true 200% browser zoom reported real search/topic overlap.

Root cause:

The initial compensation used absolute negative margins (`-2px` / `-4px`), unintentionally deleting the canonical `var(--ak-space-lg)` topic separation. The correct compensation is relative to that owned spacing.

Fallback:

If the fresh immutable CI still detects Phrases geometry drift, inspect the new exact trace/geometry and modify only the route-scoped scrollport/target owner. Do not update content-addressed baselines unless a separately approved product visual change is intended, and do not weaken target-size/perimeter/non-overlap assertions.

Limitations:

Automated Chromium/WebKit and Stage validation cannot substitute for the final physical-device acceptance required to close Issue #74.

Reusable lesson:

When compensating accessibility-only padding, preserve the original authored margin expression and subtract only the delta introduced by the accessibility layer. An absolute negative margin can accidentally erase canonical layout spacing while appearing locally symmetrical.
