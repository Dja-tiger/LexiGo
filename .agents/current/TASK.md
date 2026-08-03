# Current Task

## Identity

- Issue: #70
- Branch: `style/issue-70-remove-home-hero-decorations`
- Base SHA: `16b6c6967e8295767be9877a8e1b4b9d28311290`
- PR: #358 — Draft
- Published head before PR-context reconciliation: `2b2a2f283d1eba71c63242e0da364deb16b380f2`
- Final head: resolve from live PR after the current-context commits complete

## Objective

Delete only the proven-orphaned legacy Home hero-decoration CSS families from `frontend/app/premium-ui.css` while preserving every live canonical Home, Lesson and guest-auth owner.

Candidate families:

- `lx-hero-copy` — 5 former selector-token occurrences;
- `lx-glow` — 1;
- `lx-floating-card` — 4;
- `lx-book-base` — 6;
- `lx-orbit` — 3.

Total bounded deletion inventory: 19 selector-token occurrences.

## Scope

- Remove only declarations owned by the five candidate families from `premium-ui.css`.
- Convert `home-hero-orphan-source.test.ts` from bounded-presence proof to physical-absence proof.
- Retain actual-checkout zero-consumer evidence.
- Positively protect live canonical Home shell and compact/adaptive CSS owners.
- Positively protect compatibility Lesson and guest authentication owners.
- Record execution evidence in `.agents/current/**`.

## Non-goals

- No production TypeScript/TSX, route, API, backend, database or session change.
- No deletion or modification of `.lx-hero-card`, `.lx-hero-art`, `.lx-word-preview`, `.lx-home-next-action-copy`, `.lx-progress-panel`, `.lx-resume-strip`, `.lx-auth-card` or `.lx-hero-actions`.
- No CSS import-order change.
- No visual snapshot or route-budget ceiling update.
- No workflow, dependency, README, architecture, Figma or Issue-state change.

## Allowed paths

- `frontend/app/premium-ui.css`
- `frontend/components/home-hero-orphan-source.test.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

Every path not listed above, especially production runtime, snapshots, `frontend/bundle-budgets.json`, workflows, dependencies, backend/API/database files, `.agents/PROJECT_STATE.md`, README and architecture.

## Invariants

- All five candidate class names remain absent from executable TypeScript/TSX.
- All five candidate class names become physically absent from all CSS owners.
- Canonical Home `.lx-hero-card` and `.lx-hero-art` computed cascade remains unchanged.
- Compact/adaptive Home overrides remain unchanged.
- `.lx-hero-actions` remains live for detail/empty/auth presentations and is not part of the deletion.
- Compatibility `lx-resume-strip` and guest-auth `lx-auth-card` remain live.
- Stylesheet order remains `premium-ui.css` → `compact-home.css` → `adaptive-knowledge-coach-home.css`.
- Authoritative Linux visual hashes and route-performance budgets remain unchanged.

## Acceptance criteria

- Production CSS diff is deletion-only.
- Exactly the 19 candidate selector tokens are removed; no live selector or declaration value changes.
- Source contract fails closed on executable or CSS reintroduction.
- Final diff contains only the five allowed paths.
- Full immutable-head CI passes, including unchanged visual and performance gates.
- Review surface is empty before Ready.
- Expected-head squash merge and exact-SHA main/stage validation complete before reconciliation.

## Rollback

Revert the product PR. No schema, data, API or migration rollback is required.
