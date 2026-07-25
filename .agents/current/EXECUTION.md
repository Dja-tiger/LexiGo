# Current Task Execution

## Task

- Branch: `feat/issue-196-scenario-lessons-ui`
- Base SHA: `d7dc76c9139beff75d331c2b904f743f381f243d`
- Head SHA: resolve from live branch ref
- PR: pending Draft PR

## Skills used

### GitHub repository production workflow

Purpose: restore authoritative repository state, isolate an atomic branch, inspect runtime/test owners, and enforce final-head CI/squash/post-merge evidence.

Instruction source: repository `AGENTS.md`, `.agents/AGENTS.md`, `.agents/AGENTS.base.md`, `.agents/SKILLS.md`, `docs/agent-harness.md` and GitHub connector contract.

Version or verification date: live `main` verified 2026-07-25 18:29 Europe/Berlin.

Inputs: repository `Dja-tiger/LexiGo`, Issues #196/#24, merged PRs #216/#218/#219/#220, stage Issue #12.

Files inspected: mandatory harness files, current/task templates, navigation, route bootstrapping, focused lesson presentation/CSS, session request helpers, Scenario OpenAPI/model/migrations, package scripts and UI/axe/visual/bundle tests.

Actions performed: reconciled stale repository memory in PRs #219/#220, verified their full CI and squash merges, re-read current main, created the product branch from exact base and wrote the bounded task checkpoint.

Commands or procedures: exact-ref GitHub reads; issue/PR/check/stage inspection; branch creation with expected base SHA; sequential file writes followed by explicit branch readback and main-ref verification.

Artifacts produced: merged repository-memory PRs #219/#220; branch `feat/issue-196-scenario-lessons-ui`; `.agents/current/TASK.md` and `.agents/current/PROGRESS.md`.

Result: product implementation may start from a clean, current and auditable base with no parallel PR.

Failures: one repository-memory field recorded `Main SHA` as indefinitely current and became stale after its own documentation merge.

Root cause: a mutable branch ref was persisted as timeless state instead of a timestamped observation.

Fallback: corrective one-file PR #220 replaced the field with an explicit live-resolution rule and preserved timestamped evidence.

Limitations: GitHub connector writes replace whole UTF-8 files; large legacy files should be avoided unless ownership requires them. The local container cannot resolve external GitHub hosts, so executable validation is delegated to repository CI after source-contract review.

Reusable lesson: never encode a mutable ref as an indefinitely current repository fact; persist immutable evidence and require live ref resolution before writes.

### Figma design-to-code

Purpose: retrieve approved Scenario states and map their hierarchy, spacing, typography, responsive behavior and semantic status colors to production React/CSS.

Instruction source: `skills://plugins/figma/figma-design-to-code/skill.md` and Figma connector design-context contract.

Version or verification date: nodes retrieved 2026-07-25 before product writes.

Inputs: Figma file `3xXmBWnf38jbvLjtziwber`; nodes `76:100`, `76:127`, `76:219`; client stack React 19, Next.js 16, TypeScript and plain CSS.

Files inspected: `frontend/app/design-tokens.css`, `frontend/app/active-lesson.css`, `frontend/components/active-lesson-presentation.tsx`, route chrome/layout files.

Actions performed: retrieved design context with screenshots and forced reference code for compact Light, compact Dark and desktop Dark states; mapped Figma variables to existing `--ak-*` semantic tokens.

Commands or procedures: `Figma.get_design_context` for each exact node; comparison against production component/CSS conventions; no Figma write operation.

Artifacts produced: verified implementation specification for focused topbar, progress, scenario metadata, answer editor, objective feedback, criteria, primary/secondary actions and responsive columns.

Result: implementation will use project CSS/tokens and approved Figma hierarchy without Tailwind or copied absolute-position code.

Failures: none.

Root cause: not applicable.

Fallback: not applicable.

Limitations: Figma sample copy includes presentation-only audience/payment text not present in the server model. Production must render only server-owned fields and approved semantic hierarchy, not invent missing data.

Reusable lesson: treat Figma sample content as visual evidence and API payload as semantic truth; preserve hierarchy while refusing to synthesize server-owned facts.

### Scenario API contract analysis

Purpose: preserve the server ownership boundary established by PRs #216/#218.

Instruction source: `api/openapi-scenarios.json`, backend Scenario model/store/service code and PR #218 acceptance evidence.

Version or verification date: current `main` at product base.

Inputs: seven authenticated Scenario routes, Scenario/Attempt/Submit schemas, optimistic attempt version and idempotent submission contract.

Files inspected: `api/openapi-scenarios.json`, `backend/internal/scenarios/model.go`, Scenario migrations/seeds and relevant integration contracts.

Actions performed: enumerated exact request/response fields, lifecycle states, conflict behavior and forbidden client-owned evidence.

Commands or procedures: exact-file reads from immutable branch base and schema-to-UI state mapping.

Artifacts produced: task invariants and planned runtime validators/draft idempotency rules.

Result: UI scope is bounded to presentation, local draft ownership and request orchestration; judgement/review/scheduling remain server-owned.

Failures: none.

Root cause: not applicable.

Fallback: not applicable.

Limitations: Progress/recommendation integration for Scenario completion has no approved frontend/API contract in this slice and remains outside scope.

Reusable lesson: a client may cache user-authored evidence for recovery, but must not cache or recreate authoritative judgement when the server already owns it.
