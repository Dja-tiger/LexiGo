# LexiGo Skills Registry

This registry contains stable, verified engineering procedures. Task-specific history belongs in `current/EXECUTION.md`, PR discussion and CI artifacts.

## GitHub repository operations

### Purpose

Safely inspect and change Issues, branches, commits, PRs, checks and post-merge state.

### Instruction source

- `AGENTS.md`
- `.agents/AGENTS.base.md`
- `.agents/AGENTS.progress-pr214.md`
- `docs/agent-harness.md`

### Last verified

2026-07-25

### When to use

Every task that reads or writes repository state.

### Prerequisites

Repository identity, current `main` SHA, explicit branch, Issue/PR scope, allowed paths and write permission.

### Required procedure

1. Read live `main`, open PRs, branches, latest merge, required checks and deployment status.
2. Create a branch from the verified `main`; never write to `main`.
3. Pass branch explicitly to every path/ref write.
4. Read every changed path back, verify blob SHA and branch head, and check that `main` did not move unexpectedly.
5. Compare branch with `main` before PR and before merge.
6. Create Draft PR; close review threads and validate final-head CI.
7. Mark Ready only after required gates pass; squash merge with expected head SHA.
8. Validate new `main`, stage and repository memory.

### Commands or tools

GitHub connector/API for Issues, refs, file reads/writes, compare, checks, artifacts, Ready and squash merge. Local `git`/`gh` may be used only when available and consistent with connector state.

### Expected artifacts

Pre-flight record, isolated branch, focused commits, Draft PR, CI evidence, merge SHA and updated project state.

### Restrictions

No default-branch writes, no temporary workflow in final diff, no merge on stale head, no blind retries.

### Fallback

If a connector search is stale, read exact paths/refs or use Git Data API. Stop on ambiguous branch ownership.

### Regression gates

Allowed-path compare, unresolved-thread check, final-head required CI, post-merge `main` compare and stage status.

## Figma inspection

### Purpose

Implement exact approved production design rather than inferred or neighboring screens.

### Instruction source

`.agents/AGENTS.base.md`, `.agents/AGENTS.progress-pr214.md`, Issue-specific Figma handoff.

### Last verified

2026-07-25

### When to use

Any UI, layout, responsive, appearance, motion or visual-baseline task.

### Prerequisites

Exact file key and node IDs, approved production status, mobile/desktop and Light/Dark states.

### Required procedure

Read exact nodes, variables and screenshots; inspect states and owners; compare Linux actual screenshots manually against Figma.

### Commands or tools

Figma design context, screenshots, variables; Linux Playwright artifacts.

### Expected artifacts

Node inventory, state matrix, approved actual screenshots, dimensions and SHA-256 for imported baselines.

### Restrictions

Do not implement from memory, a neighboring route or a chat screenshot. Do not update snapshots without reviewing Linux actual.

### Fallback

Stop implementation and open/complete a Figma handoff gap.

### Regression gates

Responsive visual suite, Light/Dark, 200% zoom, reduced motion and exact allow-listed Linux PNG paths.

## Backend validation

### Purpose

Protect Go API, PostgreSQL, migrations and durable learning contracts.

### Instruction source

`.agents/AGENTS.base.md`, architecture and Issue contract.

### Last verified

2026-07-25

### When to use

Go, SQL, migrations, API, scheduling, idempotency or timezone changes.

### Prerequisites

Producer/consumer matrix, transaction boundaries, migration plan and rollback.

### Required procedure

Run formatting, static analysis, unit, race, integration, migration and API contract tests. Add deterministic timezone/week-transition tests where applicable.

### Commands or tools

`gofmt`, `go test`, race detector, integration containers, migration checks, OpenAPI/source contracts.

### Expected artifacts

Formatted code, deterministic tests, migration evidence and API compatibility record.

### Restrictions

No type-only completion for cross-layer criteria; no non-atomic review/scheduler writes; no silent schema drift.

### Fallback

Reduce to a smaller backend contract slice and preserve compatibility.

### Regression gates

Backend unit/race/integration, migration up/down policy, vulnerability audit and source-contract checks.

## Frontend validation

### Purpose

Protect runtime, responsive presentation, accessibility, history and PWA behavior.

### Instruction source

`.agents/AGENTS.base.md`, `.agents/AGENTS.progress-pr214*.md`.

### Last verified

2026-07-25

### When to use

Next.js, React, CSS, routes, browser state, mocks or visual changes.

### Prerequisites

Runtime/presentation/state/API/CSS owners and full browser/state matrix.

### Required procedure

Run lint, typecheck, unit and production build, then Chromium, WebKit, Android, iOS, keyboard, axe, reduced motion, 200% zoom, history/recovery/offline and Linux visual checks.

### Commands or tools

Repository scripts, Playwright projects, accessibility snapshots, traces and Linux container gate.

### Expected artifacts

Passing test reports, traces for classified failures and reviewed screenshots when visual changes exist.

### Restrictions

No desktop-only selector assumptions, `.first()` ambiguity, global DOM mutation, hidden-control interaction before disclosure normalization or blind snapshot updates.

### Fallback

Use the smallest route/state reproduction and inspect accessibility/runtime artifacts before changing production code.

### Regression gates

All browser, accessibility, visual, bundle, performance, CSP and service-worker required checks.

## CI debugging

### Purpose

Diagnose the real failure category before changing code or tests.

### Instruction source

`.agents/AGENTS.base.md`, `.agents/AGENTS.progress-pr214.md`.

### Last verified

2026-07-25

### When to use

Any failed, cancelled or flaky required check.

### Prerequisites

Final head SHA, run/job IDs, logs, artifacts and local/targeted reproduction when possible.

### Required procedure

Classify as production defect, stale test, stale fixture, browser-specific behavior, flake, runner/infrastructure or external transient failure. Fix root cause, add regression protection, rerun targeted then full CI.

### Commands or tools

Workflow jobs/logs/artifacts, Playwright traces, source search, targeted scripts.

### Expected artifacts

Failure classification, root cause, changed contract, regression gate and green final-head run.

### Restrictions

No timeout inflation, blind retry, gate weakening, skipped browser, arbitrary snapshot update or bot-authored final workflow commit.

### Fallback

If infrastructure/transient, preserve evidence and rerun only the affected job once the condition is understood.

### Regression gates

Final developer-authored head, full required CI and no unresolved review threads.

## Visual artifact validation

### Purpose

Approve deterministic Linux-rendered visual baselines.

### Instruction source

`.agents/AGENTS.progress-pr214.md`.

### Last verified

2026-07-25

### When to use

Any canonical visual state or snapshot change.

### Prerequisites

Exact Figma nodes and specific Linux artifact ID.

### Required procedure

Inspect actual images, verify PNG dimensions and SHA-256, use an exact path allow-list, import only reviewed files, then run comparison without update mode.

### Commands or tools

Linux Playwright artifact, SHA-256, PNG metadata and branch compare.

### Expected artifacts

Reviewed screenshots and recorded hashes/dimensions.

### Restrictions

Linux only for approval; no macOS-generated baseline; no blind `--update-snapshots`.

### Fallback

Keep existing baseline and block merge until a valid Linux artifact is available.

### Regression gates

Visual comparison on final head and clean allow-listed diff.

## Documentation and state maintenance

### Purpose

Keep repository memory current without turning it into an unverified chat transcript.

### Instruction source

`docs/agent-harness.md` and `.agents/templates/**`.

### Last verified

2026-07-25

### When to use

At task start, material findings, PR publication, merge, deployment and context reset.

### Prerequisites

Live GitHub verification and evidence links/IDs.

### Required procedure

Maintain `PROJECT_STATE`, `TASK`, `PROGRESS` and `EXECUTION`; promote stable procedures to this registry and new failure categories to AGENTS/lessons; reset current context after merge.

### Commands or tools

Exact repository file reads/writes and `scripts/ci/check-agent-harness.sh`.

### Expected artifacts

Current verified state, reproducible execution record and clean templates for the next task.

### Restrictions

No private chain of thought, hidden prompts, secrets, tokens, cookies, signed URLs, raw oversized logs or personal data.

### Fallback

Mark unknown/pending explicitly and defer to live GitHub.

### Regression gates

Harness source contract, relative-link check, secret-pattern scan and post-merge state review.
