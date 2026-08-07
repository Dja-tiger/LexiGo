# Current Task Execution

## Task

- Branch: `feat/issue-74-progress-control-targets`
- Base SHA: `adde2a0124ae90d15e2e038afd266c31927b9a67`
- Head SHA: resolve from live branch ref after every write
- PR: #428

## Skills used

### GitHub repository harness

Purpose:

Continue Issue #74 through one atomic Progress product slice with exact GitHub state, branch-scoped writes, immutable-head CI, expected-head merge and post-merge validation.

Instruction source:

`AGENTS.md`, `.agents/AGENTS.md`, `.agents/AGENTS.base.md`, mandatory specialized Agent docs, `.agents/SKILLS.md`, `.agents/PROJECT_STATE.md`, `.agents/current/**`, `docs/agent-harness.md`, live Issue #74 and GitHub PR/CI/stage state.

Version or verification date:

2026-08-07 Europe/Moscow, base `adde2a0124ae90d15e2e038afd266c31927b9a67`.

Inputs:

Issue #74 acceptance criteria; canonical Progress component/CSS; existing `progress-evidence.spec.ts`; exact current main, PR and deployment state.

Files inspected:

- `frontend/components/lexigo-progress-app.tsx`
- `frontend/components/progress-evidence-dashboard.tsx`
- `frontend/app/progress-evidence.css`
- `frontend/app/progress-evidence-accessibility.css`
- `frontend/e2e/progress-evidence.spec.ts`
- prior delivered Issue #74 PR #387 hit-target CSS and browser acceptance

Actions performed:

- Verified `main`, open PRs, Issue #74, current stage product SHA and Agent Harness before writes.
- Confirmed PR #428 is the active product slice and is based on exact current `main`.
- Identified the live 36px weak-area painted control and missing coarse-pointer effective target contract.
- Selected the existing collected Progress E2E owner to avoid another silent Playwright collection gap.
- Kept every write on `feat/issue-74-progress-control-targets`, read each changed path back, verified returned blob SHA/branch head and rechecked `main` drift.

Result:

In progress until final immutable-head CI, merge and stage validation complete.

### Frontend accessibility implementation

Purpose:

Meet Issue #74 effective 44px fine-pointer / 48px coarse-pointer target requirements without redesigning or moving the canonical Progress layout.

Instruction source:

Issue #74, `.agents/AGENTS.base.md`, `.agents/AGENTS.progress-pr214.md`, `.agents/AGENTS.issue-261-css-specificity.md`, `.agents/SKILLS.md` frontend/visual procedures and the already delivered PR #387 hit-slop precedent.

Actions performed:

- Added `--lx-progress-control-touch-target: 44px` to the canonical Progress route owner and override it to 48px only for `(pointer: coarse)`.
- Preserved existing painted dimensions, including the 2.25rem weak-action override.
- Added `position: relative`, `touch-action: manipulation` and a transparent `::before` hit surface to global/weak/empty Progress buttons and the native activity `summary`.
- Expanded only the block axis; `inset-inline: 0` prevents new horizontal target overlap.
- Kept native `details/summary`, button accessible names and existing due-Recall callbacks unchanged.

Artifacts produced:

- `frontend/app/progress-evidence.css`
- production diff limited to the route target token, transparent hit-surface owner and coarse-pointer token override

Result:

Implementation preserves painted layout by construction; CI #2992 later confirmed unchanged Linux visual baselines.

### Browser acceptance

Purpose:

Prove the effective target rather than confusing painted `boundingBox()` geometry with the actual clickable surface.

Actions performed:

- Extended existing `frontend/e2e/progress-evidence.spec.ts`; no standalone uncollected test owner was created.
- Added an effective-target probe that combines painted rect and computed `::before` top/bottom insets.
- Requires effective width/height >=44px fine / >=48px coarse.
- Verifies `inset-inline-start/end` remain `0px`.
- Verifies top and bottom target perimeter points resolve to the owning control with `document.elementFromPoint`.
- Verifies weak target separation from the sibling status badge and from neighboring weak actions.
- Verifies the weak painted height remains below the required effective target, proving the accessibility fix is hit slop rather than hidden layout inflation.
- Retains keyboard-returned `:focus-visible`, native disclosure opening and compact no-horizontal-overflow checks.
- Runs the target contract in desktop Chromium, iOS WebKit and Android Chromium.
- Calls `scrollIntoViewIfNeeded()` before viewport-relative `elementFromPoint` assertions so each measured control is actually inside the browser viewport.

Artifacts produced:

- `frontend/e2e/progress-evidence.spec.ts`

Result:

Regression protection remains inside the collected Progress browser owner and now distinguishes document visibility from viewport hit-testability.

### CI debugging and visual regression classification

Purpose:

Classify the first full-CI failure before changing code or baselines.

Instruction source:

`.agents/SKILLS.md` CI debugging and visual artifact procedures; `gh-fix-ci` workflow; Issue #74 no-baseline-update non-goal.

Evidence:

- Initial PR #428 head `05caf9f05463a4bc66392adf35b735524b36c516` ran CI #2987 / `31176989529`.
- Backend unit/security, backend integration, frontend core, UI browser shards, accessibility, Content Security and performance were green.
- Linux Visual regression failed compact `progress` and `calendar dialog`: expected 390×1900, received stable 390×1916.
- The calendar dialog mismatch shared the same Progress page-height drift beneath the overlay.
- A compact Dictionary hash mismatch passed on retry in the same job and is classified as an unrelated flake.
- No visual baseline was changed.

Failure classification:

Production visual-layout regression caused by the initial implementation strategy, not a stale baseline.

Root cause:

The first implementation satisfied the target requirement by increasing painted `min-height`. That changed compact document height. Issue #74 requires an effective hit area and explicitly permits invisible padding/hit slop; the repository already has a validated paint-inert target-expansion pattern.

Correction:

Reverted the painted size changes and implemented block-axis transparent hit slop. Replaced visual-box-only acceptance with effective-target and real browser hit testing.

Why blind retry was rejected:

The 1916px Progress actual was stable and directly attributable to source. Source changed, so the failed run is historical evidence only; the correction required a new full immutable-head run.

### CI #2992 viewport-test classification

Purpose:

Classify the remaining UI shard 2 failure on corrected production CSS before deciding whether another production change was warranted.

Evidence:

- Immutable candidate `c0e470de15c06b35badd12386ca1e224c0ea67fb` ran CI #2992 / `31206575801`.
- Backend unit/security, Frontend core, Backend integration, Lesson completion, Accessibility audit, iOS PWA dictionary, Controlled service worker, Performance budgets, Dictionary smoke, Content security, UI shard 1 and Linux Visual regression were green.
- Linux Visual regression passed existing Progress and calendar-dialog baselines with no snapshot update.
- UI shard 2 failed the new Progress target acceptance on compact iOS and Android, including retry, at `activity summary` `perimeterHits` only.
- Downloaded Playwright traces showed `nextAction` passed the same effective-target helper immediately before `activity summary`.
- The compact `activity summary` is below the 844px viewport. `document.elementFromPoint()` accepts viewport coordinates only, so passing the off-screen `getBoundingClientRect()` Y positions returned no owning element and produced `[false, false]`.
- The same shard also captured an unrelated pre-existing iOS connectivity test race: `getByText("Нет подключения к сети", { exact: true })` resolved to four simultaneous messages. That failure is outside this PR's allowed paths and does not invalidate the Progress implementation.

Failure classification:

New-test harness defect for Progress viewport-relative hit testing; separate existing flake/race in connectivity acceptance. No production CSS defect was demonstrated.

Correction:

Added Playwright `control.scrollIntoViewIfNeeded()` before each effective-target measurement. Production CSS was intentionally left unchanged. This preserves strict real-browser perimeter hit assertions instead of weakening them.

Why blind retry was rejected:

The Progress failure repeated on both compact engines and retry with the same off-screen geometry, so it was deterministic test logic. The helper source changed and requires a fresh full immutable-head CI run.

### Review and scope audit

- PR #428 changed paths remain exactly the three current task documents plus `frontend/app/progress-evidence.css` and `frontend/e2e/progress-evidence.spec.ts`.
- PR diff contains no workflow, dependency, backend, API, migration, visual-baseline or unrelated route changes.
- Review-thread audit found zero review threads at the previous audit.
- Submitted-review audit found zero reviews requiring action at the previous audit.
- `main` remained `adde2a0124ae90d15e2e038afd266c31927b9a67` through all source/task-document writes recorded here.

## Remaining execution gates

1. Treat the branch head after this execution-log write as the new immutable candidate.
2. Update PR description without changing source head so it records both CI classifications and the viewport correction.
3. Require complete product CI on that exact head, with Progress target acceptance collected in desktop Chromium, iOS WebKit and Android Chromium and Linux visual regression green without snapshot update.
4. If the independently classified connectivity race reappears, inspect evidence and use only a justified source-free retry; do not broaden this PR's allowed paths.
5. Re-audit diff, branch/base, reviews and threads.
6. Mark PR Ready and squash-merge using the expected final head SHA.
7. Verify new `main`, exact-SHA main CI and automatic exact-image Stage deploy/public smoke/public browser evidence.
8. Record the delivered slice in Issue #74 while leaving the Issue open for residual whole-app audit/real-device acceptance unless live acceptance evidence proves otherwise.
9. Reconcile `.agents/PROJECT_STATE.md` and reset `.agents/current/**` in the normal follow-up Agent Docs slice.

## Limitations

Real physical-device acceptance cannot be synthesized from Playwright emulation or desktop CI. This product slice does not claim that final Issue #74 criterion.

## Reusable lesson

When browser acceptance uses `document.elementFromPoint`, the probed coordinates must be inside the current viewport. Playwright visibility is not the same as viewport intersection: scroll the target into view first, then assert the expanded hit region. For accessibility criteria that permit hit slop, preserve approved painted geometry and test the actual hit surface rather than inflating layout solely to satisfy `boundingBox()` dimensions.
