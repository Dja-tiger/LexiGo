# Current Task

## Identity

- Issue: #584
- Branch: `test/issue-584-system-state-renderer-fingerprint`
- Base SHA: `cadcdf434ed80628e326507c8ee849b55a427020`
- Head SHA: resolve from live branch ref
- PR: pending

## Objective

Restore exact-main CI after the independently reproduced compact Dictionary empty Light Linux renderer variant by adding one reviewed exact renderer-equivalent SHA-256 to the existing fail-closed System State visual allow-list.

## Scope

- Update only `compact-empty-light` / Figma node `79:93` in `frontend/e2e/system-states-visual.spec.ts`.
- Preserve the primary Figma-approved fingerprint and all previously accepted exact renderer-equivalent fingerprints.
- Add exact-main run/artifact provenance and pixel-diff evidence for SHA `63d3af378194f420b97c95a6c25829801aa27052cfc174516c102a0a986c731c`.
- Validate the authoritative Linux Visual regression job and full immutable-head CI.

## Non-goals

- No runtime, CSS, API or Figma changes.
- No pixel/numerical tolerance.
- No other visual baseline updates.
- No workflow/deployment changes.
- No Agent Harness reconciliation for completed PR #582 inside this slice.

## Allowed paths

- `frontend/e2e/system-states-visual.spec.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- Frontend runtime/CSS/application files.
- Backend/API/migrations.
- `design/**` and archived Figma sources.
- `.github/workflows/**` and deploy topology.
- Any unrelated visual baseline.

## Evidence

- Failing exact-main CI: #3751 / run `32067797979` on `cadcdf434ed80628e326507c8ee849b55a427020`.
- Exact-main Visual artifact: `9300795503`, digest `sha256:aaf16e28f77404017f8d804c7cd8accb4afb1db67fdba7a205c2e18463c359a2`.
- The same new SHA appeared in PR #582 diagnostic artifact `9299858153`.
- Main first/retry captures are byte-identical at `63d3af...`.
- New and previously accepted `bc8a3d...` captures are both `390×844` and differ at 4 of 329160 pixels, maximum RGB delta 1 LSB.

## Invariants

- Exact SHA allow-list remains the acceptance mechanism; no tolerance is introduced.
- Primary Figma-approved SHA remains unchanged.
- Existing runtime, layout and state semantics remain unchanged.
- Any different future renderer output remains fail-closed until independently reviewed.

## Acceptance criteria

- `63d3af...` is accepted only for `compact-empty-light`.
- Authoritative Linux Visual regression passes on the final developer-authored head.
- Full required immutable-head CI passes.
- Review/thread/main-drift audit is clean before expected-head squash merge.
- Exact-main post-merge CI passes.
- Stage runtime deploy is skipped because this slice is test/evidence-only.

## Rollback

Revert the isolated exact renderer-equivalent fingerprint and task-local Agent Harness records. No runtime rollback is required.
