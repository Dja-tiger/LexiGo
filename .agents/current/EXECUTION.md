# Current Task Execution

## Task

- Branch: `fix/issue-74-system-state-targets`
- Base SHA: `f7067b5d30ed944c8431233fbb21ae1d9b27a765`
- Head SHA: resolve from live branch ref
- PR: #444

## Skills used

### GitHub repository harness / Issue #74 target delivery

Purpose:

Deliver one confirmed residual live-control gap through bounded product change, authoritative browser evidence and full repository delivery gates.

Instruction source:

- `AGENTS.md`
- `.agents/AGENTS.md` and mandatory specialized instructions
- `.agents/AGENTS.issue-74-browser-zoom-collection.md`
- `.agents/AGENTS.issue-247-request-scoped-fixtures.md`
- `.agents/AGENTS.issue-261-css-specificity.md`
- `.agents/AGENTS.tool-selection.md`
- `.agents/SKILLS.md`
- `.agents/PROJECT_STATE.md`
- `.agents/current/*`
- `docs/agent-harness.md`
- GitHub plugin workflow guidance

Version or verification date:

2026-08-08 Europe/Moscow; exact branch base `f7067b5d30ed944c8431233fbb21ae1d9b27a765`.

Inputs:

- Live Issue #74 acceptance criteria.
- Canonical `AsyncStatePanel` action markup.
- Shared `.lx-button` 44px visual contract plus routed-app 1px primary/ghost borders.
- Existing live Dictionary correlated-error/retry browser path.
- Prior Issue #74 paint-inert pseudo-target patterns.
- CI #3050 / run `31253827648`, UI shard 2 artifact `9020875402`.
- CI #3054 / run `31273126592`, UI shard 1 artifact `9026300145` and UI shard 2 artifact `9026296119`.

Files inspected:

- `frontend/components/async-state.tsx`
- `frontend/components/phrases-catalog.tsx`
- `frontend/app/system-states.css`
- `frontend/app/premium-ui.css`
- `frontend/app/information-architecture.css`
- `frontend/app/appearance.css`
- built CSS resources from the exact CI #3054 Playwright trace
- `frontend/e2e/system-states.spec.ts`
- `frontend/e2e/phrases-catalog-touch-targets.spec.ts`
- `frontend/e2e/active-lesson-touch-targets.spec.ts`
- `frontend/e2e/support/quality-gates.ts`
- `frontend/package.json`
- `frontend/app/layout.tsx`

Actions performed:

- Confirmed reusable AsyncStatePanel recovery actions stop at a 44px painted border box with no prior 48px coarse target owner.
- Added a dedicated paint-inert system-state target stylesheet with block-axis-only coarse expansion.
- Added cross-browser live Dictionary retry acceptance with effective geometry, four-side `elementFromPoint` ownership, paint-inert pseudo evidence, keyboard focus, callback recovery and overflow assertions.
- Registered the spec in both authoritative UI and accessibility browser collections.
- For CI #3050, inspected exact Playwright diagnostics and repaired viewport normalization rather than retrying blindly.
- For CI #3054, downloaded and parsed both authoritative UI shard reports and exact traces.
- Verified desktop Chromium failed deterministically at 42px because the helper measured only the pseudo padding-box surface; the clickable button border box itself remains 44px.
- Verified Android Chromium and iOS WebKit failed deterministically at 46px because the original coarse pseudo expanded the routed button's 42px padding box by only 2px per block edge.
- Inspected built CSS from the exact Playwright trace and confirmed the higher-specificity routed owner applies a 1px border to `.lx-routed-app .lx-button.primary`.
- Corrected the acceptance model to measure the union of the clickable button border box and pseudo surface.
- Increased only the coarse pseudo block inset from 2px to 3px, making the worst-case 42px pseudo base reach 48px without visible paint or inline expansion.
- Kept every 44/48px size, four-perimeter-hit, paint-inert, focus-visible, retry recovery, query retention and overflow assertion intact.
- Performed branch read-back after product writes and confirmed `main` remained exactly `f7067b5d30ed944c8431233fbb21ae1d9b27a765`.

Commands or procedures:

GitHub connector exact-ref reads/writes, repository search, exact workflow/job/artifact inspection, local read-only Playwright report/trace extraction, built-CSS inspection, allowed-path branch writes and authoritative browser-collection registration.

Artifacts produced:

- `frontend/app/system-state-touch-targets.css`
- `frontend/e2e/system-state-touch-targets.spec.ts`
- root stylesheet import
- UI/a11y collection entries
- current Agent Harness records

## Failure history and classification

### CI #3050 — run `31253827648`

- Exact candidate: `6e37feee6dc62b242004e7e53207a34b3f39303b`.
- `UI tests (shard 2/2)` job `93094264820` failed.
- Android Chromium and iOS WebKit both returned lower perimeter miss `[true, true, false, true]`, including retry.
- Size assertions passed first.
- Classification: deterministic acceptance-harness viewport-normalization defect.
- Repair: `43bbe0edfe9bedfd75e162dcf439710cf3d7d088` centered the owner and introduced border-aware pseudo-bound calculations without weakening assertions.

### CI #3054 — run `31273126592`

- Exact candidate: `e29649157939c719775fdf5d552a9e2296f818f3`.
- `UI tests (shard 1/2)` job `93142551938` failed only the new system-state acceptance on desktop Chromium: expected effective target >=43.5px, measured 42px on both attempts.
- `UI tests (shard 2/2)` job `93142551934` failed only the new system-state acceptance on Android Chromium and iOS WebKit: expected effective target >=47.5px, measured 46px on both attempts.
- Change-scope, frontend core, backend unit/security, backend integration, Lesson completion, iOS PWA Dictionary, controlled Service Worker, content security, Dictionary smoke, visual regression, accessibility audit and performance budgets were green.
- Aggregate frontend quality failed because both authoritative UI shards failed; container build was skipped.

Classification:

Mixed acceptance-model defect plus confirmed product geometry defect.

Root cause:

- Fine pointer: the helper incorrectly treated the pseudo surface as the entire effective target. The routed 1px button border is itself clickable, so the real fine target is the 44px button border box even when the inset-zero pseudo is only 42px high.
- Coarse pointer: the real target is the union of the 44px button and expanded pseudo. With a routed 1px border, the pseudo starts from a 42px padding box; `inset-block: -2px` made it only 46px high, so the union remained below the 48px contract.

Recovery:

- `d9688d649945d3e928df50cc425559ed5cd613f6`: coarse pseudo block inset changed to `-3px`, yielding a 48px worst-case hit surface.
- `34637795268b65c09b7101a46ef6209a88baebfe`: acceptance computes the union of button border box and pseudo surface for viewport normalization, target size and perimeter probes.

Regression protection:

`frontend/e2e/system-state-touch-targets.spec.ts` remains fail-closed across desktop Chromium, Android Chromium and iOS WebKit; it still requires the real 44/48px minima, four perimeter hits, transparent/borderless/shadowless pseudo, visible keyboard focus, successful retry, preserved query and no horizontal overflow.

Tool-selection recovery:

One earlier read-only `fetch_issue_comments` call was rejected before any repository write because the wrong argument key (`repository_full_name` instead of `repo_full_name`) was supplied. Repository state was immediately re-read, `main` remained unchanged, the exact action schema was reloaded, and the subsequent read succeeded. No repository state changed from that rejected read.

Fallback:

If the next immutable-head browser evidence fails, inspect exact trace/result geometry and hit ownership before changing runtime CSS again. Do not weaken the 48px assertion, skip a required browser, inflate a timeout or update visual baselines without product evidence.

Limitations:

Automated browser and Stage evidence cannot replace the final real physical-device acceptance required to close Issue #74.

Reusable lesson:

For bordered controls, an absolutely positioned pseudo element is laid out from the padding box while the control's border box remains independently clickable. Effective target acceptance must measure the union of both surfaces. A nominal 44px button with a 1px border needs 3px of transparent block-axis pseudo expansion per side to guarantee a 48px coarse hit surface when the pseudo starts from the 42px padding box.
