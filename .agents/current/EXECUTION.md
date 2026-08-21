# Current Task Execution

## Task

- Issue: #647
- Branch: `fix/issue-647-first-use-desktop-state-hierarchy`
- Base SHA: `564bc24ab2b7f47e9f8d6e82989cbfd1df51adce`
- Head SHA: resolve from live branch ref after task-local docs commit
- PR: #648

## Skills used

### GitHub repository operations

Purpose: preserve isolated branch ownership, exact-head CI provenance, focused diff and protected merge lifecycle.

Instruction source: `AGENTS.md`, `.agents/AGENTS.base.md`, `.agents/AGENTS.tool-selection.md`, `docs/agent-harness.md`.

Version or verification date: repository rules verified from current `main` on 2026-08-21.

Inputs: live `main`, Issue #647, Draft PR #648, related #642/#641/#205, current branch refs and CI runs.

Files inspected: `AGENTS.md`, `.agents/AGENTS.md`, applicable specialized rules, `.agents/PROJECT_STATE.md`, `.agents/SKILLS.md`, `.agents/current/**`, First Use runtime/CSS/tests and OpenPencil screen map.

Actions performed: created an isolated repair branch, maintained task scope, opened Draft PR #648, compared branch against `main`, read every changed production/test path back, and monitored immutable-head CI.

Commands or procedures: GitHub branch/file/Git Data operations, PR compare, workflow jobs/logs and exact-head status checks.

Artifacts produced: Draft PR #648 and task-local Agent Harness records.

Result: atomic repair remains isolated and full CI #3964 succeeded on repaired head `d2b76106f6a0fdd787201578f60111503f7a9039`.

Failures: while preparing the final task-local docs commit, a `create_file` action was accidentally selected instead of the intended Git Data blob operation. The request targeted a nonexistent branch/path and GitHub rejected it with HTTP 404.

Root cause: operation intent was not rechecked against the selected function name immediately before the write boundary.

Fallback: stopped writes; verified `main` unchanged, PR head unchanged and accidental path absent; reloaded the exact `create_blob` schema before resuming. No repository ref or file changed from the rejected call.

Limitations: final merge requires a fresh immutable-head CI after the task-local docs commit plus review/main-drift audit.

Reusable lesson: apply the existing `.agents/AGENTS.tool-selection.md` rule literally at every write boundary; a rejected write remains a process incident even when GitHub protects the repository from mutation.

### Frontend validation

Purpose: restore desktop First Use loading/error hierarchy without changing mobile or onboarding behavior.

Instruction source: `.agents/AGENTS.base.md`, `.agents/AGENTS.progress-pr214.md`, Issue #647.

Inputs: runtime `frontend/components/lexigo-onboarding-app.tsx`, presentation `frontend/app/first-use.css`, source contracts and active OpenPencil state evidence.

Actions performed: added desktop-only intro ownership to initial loading and generic recoverable error; separated compact/mobile content; aligned desktop loading skeleton/note and recoverable-error spacing; preserved `aria-busy`, `role=alert`, retry/back and API/state-machine behavior; added focused source contracts.

Commands or procedures: source-contract → lint/typecheck/unit/build → full browser/accessibility/security/visual/performance CI ladder.

Artifacts produced: immutable CI run `32490753893` / #3964.

Result: frontend core, UI shards, accessibility, security, service worker, performance, iOS PWA, lesson completion and Linux Visual regression all succeeded.

Failures: initial run `32490479463` exposed one stale source assertion in `system-state-openpencil-contract.test.ts`.

Root cause: the downstream test bound error ownership to a literal static class string, while the repair intentionally adds a recoverable-state modifier dynamically.

Fallback: changed only the downstream source contract to assert semantic alert ownership and the exact recoverable modifier; no runtime behavior was weakened.

Limitations: #648 does not approve new First Use loading/error hashes. Exact eight-state fingerprint evidence remains owned by #645 after runtime delivery.

Reusable lesson: source contracts should protect semantic state ownership and required modifiers rather than incidental serialized class literals when state-specific class composition is intentional.

### Visual artifact validation

Purpose: repair against repository-owned OpenPencil rather than infer layout from historical Figma or stale browser output.

Instruction source: `.agents/SKILLS.md`, `.agents/AGENTS.progress-pr214.md`, Issue #647.

Inputs: active `.op` SHA `6d73b785aaeb7dda35a53c9c5f16edfc9cbef1092dbce992183538f16505520e`; OpenPencil evidence run `32486519368`, artifact `9448087269`; target nodes `n442/n456/n614/n628`.

Actions performed: inspected exact desktop reference renders and matched the runtime hierarchy/geometry intent while leaving OpenPencil, screen map and visual fingerprints untouched.

Result: authoritative Linux Visual regression on repaired runtime succeeded and existing approved baselines remained unchanged.

Limitations: target loading/error states are intentionally not promoted to approved fingerprints in this repair PR; #645 must rerun fail-closed after Stage validation.

Reusable lesson: a runtime repair and baseline approval are separate evidence stages. Do not turn a product defect repair into a blind snapshot acceptance.

### CI debugging

Purpose: classify failures before changing code or tests.

Instruction source: `.agents/AGENTS.base.md`, `.agents/SKILLS.md`.

Inputs: first PR run `32490479463`, failing Frontend core job diagnostics, repaired run `32490753893`.

Actions performed: identified the first failure as stale source contract, applied the narrow test-owner correction, and reran full immutable CI.

Result: CI #3964 succeeded across all required groups and container builds.

Reusable lesson: when an intended semantic class modifier invalidates a literal source assertion while lint/typecheck and runtime ownership remain valid, repair the downstream contract rather than reverting correct product structure.
