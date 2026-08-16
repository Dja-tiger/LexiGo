# Current Task

## Identity

- Issue: #545 — [High][Figma][CI] Зафиксировать renderer equivalence для Dictionary Empty 79:93
- Branch: `test/issue-545-dictionary-empty-renderer-equivalence`
- Base SHA: `01fad069e74f1675f7ea6bddda6b0b9cbd9fe4d9`
- Head SHA: resolve from live branch ref
- PR:

## Objective

Remove the recurrent hosted-runner false negative for canonical Dictionary Empty Figma node `79:93` without changing product UI, refreshing the primary approved baseline or introducing broad pixel tolerance.

## Scope

- Keep primary approved SHA-256 `e140551792a87445af08658ed78439638918b174b4b1a0e3d36448ef1ce7dbdf`.
- Register `dd2d0c587d648a01c1fc2d851fcea21f881716acf743268779f6132d15322ff6` only as an independently reviewed exact renderer-equivalent fingerprint for `compact-empty-light`.
- Keep the existing semantic reminder-hydration, stable-layout and two-consecutive-identical-capture barriers.
- Reject any third raw SHA.
- Preserve every other System State/Figma fingerprint unchanged.
- Record exact CI/artifact evidence and validation in current task memory.

## Non-goals

- No Figma design or primary baseline refresh.
- No production React/CSS/runtime change.
- No arbitrary pixel tolerance, threshold or snapshot update mode.
- No global Chromium/Skia launch flags.
- No retry-policy weakening, skip or timeout inflation.
- No unrelated route parity work.

## Allowed paths

- `frontend/e2e/system-states-visual.spec.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- `frontend/components/**`
- `frontend/app/**/*.css`
- visual PNG baseline files
- backend/API code
- package/lockfiles
- Playwright config
- `.github/workflows/**`
- Figma canvas/source mutation

## Runtime owners

- `frontend/e2e/system-states-visual.spec.ts` is the authoritative raw-hash owner for System State Figma visual fingerprints.
- `RouteChrome` calendar-reminder summary owns the three host-dependent antialias pixels proven by the artifact comparison.
- Dictionary Empty product content and layout remain unchanged.

## Documentation owners

- Issue #545 is the atomic contract.
- Issue #518 / PR #520 is the previous stabilization attempt and historical evidence.
- Umbrella Issue #205 owns final Figma parity.
- Canonical Figma node: `79:93`, viewport `390x844`.

## Invariants

- `e140...` remains the primary canonical Figma-approved fingerprint.
- `dd2d...` is renderer-equivalent evidence, not a promoted canonical baseline.
- Exact raw hashes are used; no numerical comparison tolerance is added.
- Two consecutive captures inside one test attempt must have identical raw SHA before any approved/equivalent lookup occurs.
- Any unreviewed third SHA fails.
- Other System State fingerprints remain byte-for-byte unchanged.

## Acceptance criteria

- `compact-empty-light` accepts exactly `e140...` or `dd2d...` after consecutive-capture equality succeeds.
- All other states accept only their existing primary SHA.
- No production/runtime diff exists.
- Authoritative Visual suite passes on final head without Playwright flaky classification.
- A second same-head Visual execution on another hosted worker also passes without flaky classification.
- Full immutable-head CI is green.
- Review/comments/threads are clean before Ready.
- Squash merge uses expected-head protection.
- Exact-main CI is green after merge; no Stage redeploy is required for test/docs-only diff.

## Required checks

- Changed-file allow-list audit.
- Repository-owned PR CI, including authoritative Visual group.
- Second same-head Visual execution with zero flaky cases.
- Final-head review/thread audit.
- Exact-main CI after merge.

## Risks

- Treating an alternate raster as a second baseline would hide design drift; the implementation must distinguish primary canonical SHA from a narrowly scoped renderer-equivalent exact fingerprint.
- Broad tolerance would weaken future regression detection; it is prohibited.
- Figma MCP remains quota-blocked, so this slice relies only on previously approved `79:93` plus independently compared CI artifacts and does not claim fresh cloud synchronization.

## Rollback

Revert the test-contract registration and current task docs. Product runtime, canonical Figma design and primary approved SHA remain untouched.
