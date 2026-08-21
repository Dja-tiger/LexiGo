# Current Task

## Identity

- Issue: #203
- Branch: `docs/issue-203-openpencil-source-of-truth`
- Base SHA: `7ccb027828f1a180dcb62b073ddf03b7d41cfc07`
- Head SHA: resolve from live branch ref
- PR: pending

## Objective

Remove the remaining repository-side ambiguity between historical Figma provenance and the active OpenPencil production source of truth. Make the canonical route handoff explicitly resolve route/state -> OpenPencil screen key/node -> delivered GitHub Issue/PR, and protect that contract with an executable root-level CI check.

## Scope

- Rewrite the design handoff so OpenPencil is the only active design/handoff owner and Figma identifiers are archival provenance only.
- Record canonical OpenPencil sources and delivered Issue/PR status for the ten canonical product routes plus Guest Home and Lesson Result state coverage.
- Add a fail-closed repository contract that parses the OpenPencil screen map and rejects missing/duplicate canonical route sources or a return to active-Figma wording.
- Reconcile Issue #203 against the 2026-08-19 OpenPencil migration semantics.

## Non-goals

- No frontend runtime, CSS, API, database, navigation, PWA or deployment behavior changes.
- No mutation of `design/openpencil/LexiGo Design System.op`.
- No Figma Cloud/MCP work.
- No visual baseline changes.
- No broad archive deletion of historical design files.

## Allowed paths

- `frontend/docs/adaptive-knowledge-coach.md`
- `scripts/ci/agent_docs_scope_test.py`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- `frontend/app/**`
- `frontend/components/**` except no changes are planned
- `backend/**`
- `api/**`
- `deploy/**`
- `.github/workflows/**`
- `design/openpencil/**`
- visual snapshots/baselines

## Runtime owners

Unchanged. Existing route islands and `LexigoBootstrappedApp` remain authoritative.

## Documentation owners

- `frontend/docs/adaptive-knowledge-coach.md`
- `docs/figma/openpencil-screen-map.json` as read-only active screen inventory
- `scripts/ci/agent_docs_scope_test.py` as root-checkout executable documentation contract

## Invariants

- OpenPencil repository artifacts are the active design/handoff source.
- Figma file keys/node IDs remain provenance only and are never a delivery blocker.
- Every canonical route has one unambiguous mobile/desktop production source or a documented OpenPencil-native state matrix.
- Existing delivery/route/runtime ownership remains unchanged.
- Historical design artifacts are preserved.

## Acceptance criteria

- Handoff starts from OpenPencil rather than Figma and explicitly labels Figma as archival provenance.
- All ten canonical routes resolve to existing `openPencilNode` entries or reviewed `firstuse.*` active-screen keys.
- Guest Home, Phrases and Lesson Result are not incorrectly marked as unresolved design gaps where delivery evidence already exists.
- Delivered Issue/PR status is explicit in the handoff.
- Root-level CI contract fails closed on missing OpenPencil source keys, duplicate canonical ownership or active-Figma wording.
- Final diff remains within allowed paths and full required CI is green on the immutable developer head.

## Required checks

- `python3 scripts/ci/agent_docs_scope_test.py`
- full GitHub CI because `frontend/docs/**` and `scripts/ci/**` are not pure Agent Docs
- clean review/thread audit
- exact-main CI after merge

## Risks

- A documentation-only rewrite could accidentally invent an OpenPencil mapping not present in the repository screen map.
- A brittle contract could bind to formatting instead of semantic screen keys.

## Rollback

Revert the documentation/contract commit(s); no runtime or data rollback is required.
