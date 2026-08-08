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
- Shared `.lx-button` 44px visual contract.
- Existing live Dictionary correlated-error/retry browser path.
- Prior Issue #74 paint-inert pseudo-target patterns.
- Canonical `scrollEffectiveTargetIntoView` / effective-bound calculations already proven by Phrases and Active Lesson touch-target suites.
- CI #3050 / run `31253827648` and Playwright report artifact `9020875402` from immutable candidate head `6e37feee6dc62b242004e7e53207a34b3f39303b`.

Files inspected:

- `frontend/components/async-state.tsx`
- `frontend/components/phrases-catalog.tsx`
- `frontend/app/system-states.css`
- `frontend/app/premium-ui.css`
- `frontend/app/information-architecture.css`
- `frontend/app/appearance.css`
- `frontend/e2e/system-states.spec.ts`
- `frontend/e2e/phrases-catalog-touch-targets.spec.ts`
- `frontend/e2e/active-lesson-touch-targets.spec.ts`
- `frontend/e2e/support/quality-gates.ts`
- `frontend/package.json`
- `frontend/app/layout.tsx`

Actions performed:

- Confirmed reusable AsyncStatePanel recovery actions stop at the shared 44px painted minimum with no 48px coarse target owner.
- Added a dedicated paint-inert system-state target stylesheet with coarse block-axis expansion only.
- Added cross-browser live Dictionary retry acceptance with effective geometry, four-side `elementFromPoint` ownership, paint-inert pseudo evidence, keyboard focus, callback recovery and overflow assertions.
- Registered the spec in both authoritative UI and accessibility browser collections.
- Inspected exact failing UI shard Playwright artifact rather than retrying blindly.
- Parsed the Playwright report: the new case was unexpected in Android Chromium and iOS WebKit on both attempts; the unrelated low-end Android catalog-pagination case was flaky and recovered on retry.
- Compared the failing helper with already-green Issue #74 Phrases and Active Lesson helpers.
- Updated only the acceptance helper: center the painted owner before viewport-relative hit probing, keep the full pseudo target inside a small viewport margin and calculate target edges with border-width normalization.
- Kept every 44/48px size, four-perimeter-hit, paint-inert, focus-visible, retry recovery, query retention and overflow assertion intact.
- Performed read-back verification after every branch write and confirmed `main` remained `f7067b5d30ed944c8431233fbb21ae1d9b27a765`.

Commands or procedures:

GitHub connector exact-ref reads/writes, repository search, exact workflow/job/artifact inspection, local read-only Playwright report/trace extraction, allowed-path branch writes and authoritative browser-collection registration.

Artifacts produced:

- `frontend/app/system-state-touch-targets.css`
- `frontend/e2e/system-state-touch-targets.spec.ts`
- root stylesheet import
- UI/a11y collection entries
- current Agent Harness records

Result:

The first immutable candidate exposed a deterministic acceptance-helper defect. The helper repair is committed as `43bbe0edfe9bedfd75e162dcf439710cf3d7d088`; current Agent Harness records are being finalized before the next immutable-head full CI run.

Failures:

### CI #3050 — UI shard 2/2

- Job: `93094264820`.
- Android Chromium and iOS WebKit both returned `perimeterHits = [true, true, false, true]` for the Dictionary retry target, including retry.
- Size assertions had already passed; the failure was only the lower viewport-relative hit point.
- All other applicable frontend/backend/security/visual/a11y/performance/PWA jobs before the aggregate gate were green.
- The aggregate frontend job failed because UI shard 2 failed; container builds were therefore skipped.

Classification: deterministic acceptance-harness defect.

Root cause:

`scrollIntoViewIfNeeded()` guarantees visibility of the painted element, not normalization of the larger transparent pseudo target used by `elementFromPoint`. The helper also omitted the border-box normalization already used by canonical Issue #74 touch-target suites. The production CSS/runtime was not changed in response to this failure because the artifact did not demonstrate a product defect.

Regression protection:

`frontend/e2e/system-state-touch-targets.spec.ts` now uses the same fail-closed effective-target normalization pattern as the already-proven Phrases/Active Lesson suites while retaining all original assertions.

Tool-selection recovery:

One read-only `fetch_issue_comments` call was rejected before any repository write because the wrong argument key (`repository_full_name` instead of `repo_full_name`) was supplied. Repository state was immediately re-read, `main` remained unchanged, the exact action schema was reloaded from the GitHub connector, and the subsequent read succeeded. No ref, file, Issue or PR state changed as a result of the rejected read.

Fallback:

If the repaired cross-browser hit evidence fails again, inspect the exact final-head trace/result geometry and hit owner before changing runtime CSS. Do not increase visible button geometry, weaken the 48px assertion, skip a browser, inflate a timeout or update visual baselines without product evidence.

Limitations:

Automated browser and Stage evidence cannot replace the final real physical-device acceptance required to close Issue #74.

Reusable lesson:

Shared reusable state components need their own bounded target owner and collected acceptance; route-level accessibility fixes do not prove dynamically rendered recovery controls. Viewport-relative hit probes must normalize the full effective target, not only the painted element.
