# Current Task Execution

## Task

- Branch: `test/issue-581-desktop-route-parity`
- Base SHA: `d073fcf21707deb73fda6b54b969fcb937673f9f`
- Head SHA: resolve from live branch ref
- PR: #582

## Skills used

### GitHub repository / Agent Harness execution

Purpose:

Deliver Issue #581 as an atomic test/evidence slice under #205 using live repository state, fail-closed Linux visual review and repository-owned delivery rules.

Instruction source:

- `AGENTS.md`
- `.agents/AGENTS.md`
- mandatory `.agents/AGENTS.*.md` specialty guidance
- `.agents/SKILLS.md`
- `.agents/PROJECT_STATE.md`
- `docs/agent-harness.md`
- connected GitHub skill/tools

Version or verification date:

2026-08-17 Europe/Berlin; task base `d073fcf21707deb73fda6b54b969fcb937673f9f`.

Inputs:

- Parent Issue #205 acceptance matrix.
- Child Issue #581.
- Existing consolidated tablet owner `frontend/e2e/route-tablet-parity.spec.ts`.
- Existing Linux visual config `frontend/playwright.visual.config.ts`.
- Existing deterministic quality-gate, Active Lesson and Word Detail fixtures.
- Diagnostic CI #3746 / run `32065112367` exact artifact.

Files inspected:

- `frontend/e2e/route-tablet-parity.spec.ts`
- `frontend/playwright.visual.config.ts`
- `.agents/current/**`
- Issue #205 / #581 and PR #582.
- Playwright HTML/JSON report and exact PNG evidence from artifact #9299858153.

Actions performed:

- Completed #579 runtime delivery and #580 Agent Harness reconciliation before starting new product work.
- Confirmed no duplicate open 1440×1024 parity child, created #581 and isolated branch from verified main.
- Reused the existing ten-route parity fixtures instead of creating a parallel route fixture stack.
- Added a desktop-only matrix under `visual-desktop`, setting an actual page viewport of `1440×1024` without adding a global Playwright project.
- Added canonical owner, focused/RouteChrome, reduced-motion, geometry/overflow/focus, desktop-only legacy compatibility and runtime-error assertions before the exact visual gate.
- Kept all 20 new fingerprints fail-closed as `REVIEW_REQUIRED` for diagnostic CI.
- Downloaded artifact #9299858153 and independently verified ZIP digest `sha256:ce2451443302b3de5e1a6ed7aeee3a94b9124e2985b4ace32fb3a8e881499e87`.
- Parsed the structured Playwright report: exactly 20 #581 unexpected states, each failed only at the intended review gate on both attempts; all 20 retry PNG pairs were byte-stable.
- Classified the single non-#581 flaky as the pre-existing compact Dictionary empty system-state renderer variant; retry passed an already accepted exact hash, so no baseline or runtime change was made for it.
- Manually reviewed all 20 exact Linux PNGs in Light/Dark route pairs before approval.
- Replaced only the desktop `REVIEW_REQUIRED` records with reviewed exact width/height/SHA-256 values sourced from diagnostic head `244a71b6202b3f22e51e46c9fccc7cc385cf92ad`.
- Restored the unchanged onboarding fixture token and scoped the new legacy compatibility assertion to desktop only, preserving existing tablet #568 semantics and fingerprints.

Commands or procedures:

- Live GitHub branch/PR/Issue/Actions inspection through the connected GitHub app.
- Exact branch creation from verified main SHA.
- GitHub Contents API writes only on the task branch.
- GitHub Actions artifact retrieval and digest verification.
- Local artifact unzip/report parsing, SHA-256 recomputation and contact-sheet/manual visual review of exact evidence.
- Full immutable-head CI after reviewed fingerprint approval; exact-main validation after merge.

Artifacts produced:

- Issue #581.
- Draft PR #582.
- Diagnostic Linux Visual artifact #9299858153, digest `sha256:ce2451443302b3de5e1a6ed7aeee3a94b9124e2985b4ace32fb3a8e881499e87`.
- 20 reviewed content-addressed `1440×1024` route/theme fingerprints in the consolidated parity spec.
- Updated current Agent Harness execution records.

Result:

Diagnostic evidence is reviewed and approved; no runtime defect was discovered. Final immutable-head CI is the next delivery gate.

Failures:

- CI #3746 Visual failed deliberately on 20 `REVIEW_REQUIRED` states.
- One unrelated System State visual attempt emitted unapproved renderer SHA `63d3af378194f420b97c95a6c25829801aa27052cfc174516c102a0a986c731c`; retry emitted already accepted SHA `bc8a3d915e7a800dd9beeb9bc4f95bcde79cdcfab438ab7d329377d78c005578` and passed.

Root cause:

- The 20 #581 failures were intentional fail-closed approval gates.
- The isolated System State failure is renderer variability in an unrelated pre-existing test, not a reproduced change in #581.

Fallback:

If the final immutable-head run exposes any #581 structural or exact-hash mismatch, do not weaken tolerances or regenerate broadly. Inspect the exact failing artifact and either repair the evidence contract or split a reproduced runtime defect into a separate Issue/PR.

Limitations:

The GitHub connector has no local browser runtime. Exact approval screenshots are therefore generated in immutable GitHub Actions Linux, downloaded, hash-verified and manually reviewed; this is also the repository's authoritative visual approval environment.

Reusable lesson:

A missing viewport acceptance matrix should extend the existing deterministic route-fixture owner, use a locally scoped viewport inside the target visual project, and separate diagnostic REVIEW_REQUIRED evidence from reviewed fingerprint approval. Existing viewport acceptance semantics should remain unchanged unless that viewport is explicitly in scope.
