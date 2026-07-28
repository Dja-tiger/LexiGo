# Current Task

## Identity

- Issue: #199 — Phrases design and implementation gap
- Branch: `agent/issue-199-phrases-design-handoff`
- Base SHA: `72a1a621225ee08dbf6643d6c982396c77b85bd4`
- Head SHA: resolve from live branch ref
- PR: #270 (Draft)

## Objective

Promote exact production Phrases catalog/detail designs into the canonical Figma handoff and repository source-of-truth before the separate runtime implementation slice.

## Scope

- Canonical Figma page, wrapper, eight Light/Dark mobile/desktop screens and resilient-state hooks.
- Screen Map `82:3` entry with exact node IDs.
- Repository design handoff and project-state reconciliation.

## Non-goals

- No frontend runtime, CSS, API, route-island, browser-test, visual-baseline, dependency or deployment change.
- No deletion or archival of older concept matrices.
- No Phrases implementation in this documentation-only PR.

## Allowed paths

- `.agents/PROJECT_STATE.md`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `frontend/docs/adaptive-knowledge-coach.md`

## Prohibited paths

- `frontend/app/**`
- `frontend/components/**`
- `frontend/lib/**`
- `frontend/e2e/**`
- `backend/**`
- `.github/workflows/**`
- `deploy/**`

## Runtime owners

- Existing compatibility owner: `frontend/components/lexigo-premium-app.tsx`.
- Persistent session/route owner: `LexigoBootstrappedApp`.
- Existing typed phrase API and URL/history state remain unchanged.

## Documentation owners

- `frontend/docs/adaptive-knowledge-coach.md`
- `.agents/PROJECT_STATE.md`
- `.agents/current/**`
- Figma Product Screen Map `82:3`

## Invariants

- Figma page `253:2`, wrapper `253:3` and every published screen/state node remain present and visually reviewed.
- Search/topic/filter state is represented without inventing a new product graph.
- Existing production nodes and concept matrices are not destructively modified.
- Repository diff remains Agent Docs-only.

## Acceptance criteria

- Exact mobile/desktop and Light/Dark catalog/detail nodes are documented.
- Default, search/topic, empty, loading and error states are represented.
- Phrase Detail includes meaning, cloze, example, usage guidance and lesson handoff.
- Technical, daily and travel variants are represented.
- Screen Map `82:3` contains the exact handoff IDs.
- Agent Harness and Agent Docs scope validation pass.

## Required checks

- Visual inspection of every canonical screen and the Screen Map handoff block.
- Figma node/inventory readback.
- `bash scripts/ci/check-agent-harness.sh`
- `python3 -m unittest scripts.ci.agent_docs_scope_test`
- `git diff --check`
- Authoritative lightweight GitHub CI on the immutable PR head.

## Risks

- Long phrase copy can overflow fixed detail geometry.
- Explicit Light/Dark modes can expose mixed/raw text paints inherited from old matrices.
- Adding a Screen Map row can shrink an existing auto-layout card row.

## Rollback

Revert the repository documentation commit and remove only the new page `253:2` plus handoff row `261:2`; do not alter earlier production or concept nodes.
