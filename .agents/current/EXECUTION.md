# Current Task Execution

## Task

- Issue: #542 — [Figma][#205] Add canonical Profile parity contract
- Branch: `feat/issue-542-profile-parity`
- Base SHA: `11ad10835ad968b41f5f53b01e97d22dab08a1e9`
- Head SHA: resolve from live branch ref
- PR: pending

## GitHub repository operations

Purpose:

Create the next atomic #205 Figma parity slice after Phrase Detail, preserve existing Profile ownership boundaries and validate the new contract through repository-owned browser CI.

Instruction sources:

- `AGENTS.md`
- `.agents/AGENTS.md`
- `.agents/AGENTS.base.md`
- `.agents/AGENTS.tool-selection.md`
- `.agents/SKILLS.md`
- `.agents/PROJECT_STATE.md`
- installed GitHub plugin skill `github`

Verified date:

2026-08-15 live repository state.

Inputs and inspected owners:

- Umbrella Issue #205 and new atomic Issue #542.
- Exact task-start `main`: `11ad10835ad968b41f5f53b01e97d22dab08a1e9`.
- `frontend/docs/adaptive-knowledge-coach.md` and `.agents/PROJECT_STATE.md` for approved route order and Figma mapping.
- `frontend/e2e/profile-visual.spec.ts` for manually approved Profile hashes.
- `frontend/e2e/profile.spec.ts` for interaction/settings ownership.
- `frontend/e2e/profile-touch-targets.spec.ts` for touch/reflow ownership.
- `frontend/components/lexigo-profile-app.tsx` for semantic hierarchy.
- `frontend/lib/navigation.ts` for `viewTitle("profile")`.
- `frontend/e2e/support/quality-gates.ts` for deterministic account/progress data.

Actions performed:

- Waited for and verified post-merge CI #3571 `success` on exact previous merge SHA before starting the next slice.
- Created Issue #542 with exact approved Profile mapping and non-goals.
- Created branch `feat/issue-542-profile-parity` from exact `main`.
- Wrote the new task pre-flight before executable changes.
- Read the live Profile visual owner and preserved all existing baseline hashes/tests unchanged.
- Added a four-case canonical parity matrix to `frontend/e2e/profile-visual.spec.ts`:
  - mobile Light / node `79:6` / `390×844`;
  - mobile Dark token-derived / node `79:6` / `390×844`;
  - desktop Light / node `79:129` / `1440×1024`;
  - desktop Dark token-derived / node `79:129` / `1440×1024`.
- New assertions cover direct route/no query, single route island, semantic main, deterministic Profile hierarchy, appearance/canvas, RouteChrome ownership, horizontal containment, reload stability and runtime errors.
- No Profile settings are mutated; interaction and touch/reflow owners remain untouched.
- Read back the modified spec and compared branch against base; only task memory plus the authoritative visual spec changed at that checkpoint.

Artifacts produced:

- Issue #542.
- Branch `feat/issue-542-profile-parity`.
- Canonical runtime attachment contract `profile-canonical-runtime.json`.
- Four executable Profile route parity cases in the existing visual owner.

Result so far:

Source-level parity implementation is isolated and ready for Draft PR browser/Visual regression evidence. No product defect has been established and no production UI or approved visual baseline has changed.

## Figma design evidence

Source:

- File `3xXmBWnf38jbvLjtziwber`.
- Profile page `79:2`.
- Mobile canonical `79:6`.
- Desktop canonical `79:129`.
- Dark states are repository-approved token-derived states from the same geometry/semantics.

Fresh-cloud limitation:

The connected Figma MCP Starter-plan tool-call quota is exhausted. The previous `get_design_context` attempt was quota-blocked, so this task uses only the exact node mapping already reconciled in repository handoff. No adjacent frame or unrecorded state is inferred and no fresh synchronization claim is made.

## Validation plan

- Open Draft PR only after final pre-PR allow-list/ref verification.
- Use PR CI as the browser evidence gate because the connector environment has no local checkout/browser runner.
- Classify any failing locator/layout/state from completed job logs before modifying source.
- Never update approved visual hashes to make a failure pass.
- After source CI is green, synchronize final TASK/PROGRESS/EXECUTION, run complete CI again on the resulting immutable developer-authored head, audit reviews/threads, mark Ready and squash-merge with expected-head protection.
