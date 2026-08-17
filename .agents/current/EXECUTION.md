# Current Task Execution

## Task

- Issue: #584
- Branch: `test/issue-584-system-state-renderer-fingerprint`
- Base SHA: `cadcdf434ed80628e326507c8ee849b55a427020`
- Head SHA: resolve from live branch ref
- PR: pending

## Skills used

### GitHub repository / CI root-cause classification

Purpose:

Restore a red exact-main visual gate without weakening the visual contract or changing production behavior.

Instruction source:

- `AGENTS.md`
- `.agents/AGENTS.md` and mandatory specialty rules
- `.agents/SKILLS.md`
- `.agents/PROJECT_STATE.md`
- `docs/agent-harness.md`
- connected GitHub / CI-fix skills

Inputs:

- Exact-main CI #3751 / run `32067797979`.
- Visual job `95504348349`.
- Exact-main artifact `9300795503`.
- Prior PR #582 diagnostic artifact `9299858153`.
- Existing `compact-empty-light` exact renderer-equivalent allow-list.

Actions performed:

- Confirmed the failure is isolated to `compact Dictionary empty light`; all other frontend and backend required groups passed before the aggregate gate.
- Downloaded exact-main artifact `9300795503` and verified its GitHub digest/provenance.
- Located both exact-main failed captures and confirmed byte-identical SHA `63d3af378194f420b97c95a6c25829801aa27052cfc174516c102a0a986c731c`.
- Located the same SHA and the previously accepted `bc8a3d915e7a800dd9beeb9bc4f95bcde79cdcfab438ab7d329377d78c005578` in the prior diagnostic artifact.
- Compared the two `390×844` PNGs at pixel level: four pixels differ out of 329160; maximum RGB delta is one LSB.
- Classified the result as renderer-specific antialias variation rather than product, CSS, state, fixture or geometry drift.
- Created Issue #584 and an isolated branch from exact live main.
- Added only `63d3af...` to the exact renderer-equivalent allow-list for Figma node `79:93`; no numerical tolerance or other baseline was changed.

Changed paths:

- `frontend/e2e/system-states-visual.spec.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

Validation plan:

- Read every changed file back from the branch and verify branch/main refs.
- Compare branch against live main and require only the four allow-listed paths.
- Create Draft PR.
- Require authoritative Linux Visual regression and full immutable-head CI on the final developer-authored head.
- Audit reviews/threads/comments and main drift.
- Squash merge with expected head SHA only after green CI.
- Require exact-main CI; Stage deploy must skip because no runtime file changes.

Restrictions preserved:

- Primary Figma-approved SHA is unchanged.
- Exact fingerprints remain fail-closed.
- No snapshot update mode, tolerance increase, runtime/CSS/API/Figma/workflow changes.
- No blind retry is used as defect classification.

Rollback:

Revert the scoped exact renderer-equivalent hash and task-local harness records.
