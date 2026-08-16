# Current Task Execution

## Task

- Branch: fix/first-use-desktop-parity
- Base SHA: ad404b84cd26f063fa189abac3fd4a8ca10ab4e6
- Head SHA: resolve from live branch ref
- PR: pending

## Skills used

### GitHub repository engineering

Purpose:

Safely isolate Issue #565 from the ongoing #563 audit, preserve branch/main invariants and deliver one atomic runtime presentation slice.

Instruction source:

- `AGENTS.md`
- `.agents/AGENTS.md`
- `.agents/AGENTS.base.md`
- applicable specialized `.agents/AGENTS.*` rules
- `.agents/SKILLS.md`
- `docs/agent-harness.md`
- connected GitHub plugin skill

Version or verification date:

2026-08-17 live repository verification.

Inputs:

- Issue #563 / Draft PR #564 exact CI and Linux artifact evidence.
- Issue #201 and PR #558 delivered First Use contract.
- Live `main` and Stage status.

Files inspected:

- `frontend/components/lexigo-onboarding-app.tsx`
- `frontend/lib/onboarding.ts`
- `frontend/app/first-use.css`
- `frontend/components/first-use-route-contract.test.ts`
- `frontend/e2e/first-use-visual.spec.ts`
- `design/openpencil/LexiGo Design System.op` (read-only)
- `docs/figma/openpencil-screen-map.json` (read-only)
- repository Agent Harness sources

Actions performed:

- Classified #564 visual failure as a reproduced runtime desktop presentation defect after correcting the audit fixture state.
- Created separate Issue #565 because #563 forbids folding functional redesign/runtime repair into the audit PR.
- Created `fix/first-use-desktop-parity` from exact `main`.
- Defined allowed/prohibited paths and state/API/accessibility invariants.

Commands or procedures:

Connector-first live GitHub inspection, exact-head CI/job/artifact analysis, OpenPencil source/mapping inspection, source-contract inspection and branch-isolated writes.

Artifacts produced:

- Issue #565.
- Current task/pre-flight repository memory on the feature branch.

Result:

Ready for the smallest production DOM/CSS change. Backend/state-machine behavior is explicitly out of scope.

Failures:

Audit CI #3686 Visual regression is red only for the four First Use desktop hash assertions; all other completed gates passed.

Root cause:

Desktop diagnostic presentation reused the compact single-panel/nested-card layout instead of the approved desktop intro + single diagnostic surface hierarchy.

Fallback:

If the smallest desktop-only hierarchy change alters compact behavior or fails accessibility, revert the runtime write and reduce the CSS/DOM scope further; do not change API/state or weaken tests.

Limitations:

The production API exposes `topic` but not the OpenPencil demo example sentence, so exact content parity must preserve truthful server data rather than fabricate design-fixture text.

Reusable lesson:

Pending delivery evidence. Do not promote a new normative lesson until the runtime fix and final visual/browser gates prove the failure category and prevention contract.
