# Current Task

## Identity

- Issue: #203
- Branch: `docs/issue-203-openpencil-source-of-truth`
- Base SHA: `7ccb027828f1a180dcb62b073ddf03b7d41cfc07`
- Head SHA: resolve from live branch ref
- PR: #636

## Objective

Remove the remaining repository-side ambiguity between historical Figma provenance and the active OpenPencil production source of truth. Make the canonical route handoff explicitly resolve route/state -> OpenPencil screen key/node -> delivered GitHub Issue/PR, and protect that contract with an executable root-level CI check.

## Scope

- Rewrite the Adaptive Knowledge Coach design handoff so OpenPencil is the only active design/handoff owner and Figma identifiers are archival provenance only.
- Add a machine-readable OpenPencil production handoff manifest for the canonical product routes/states, including Lesson Result frames recovered from the active repository-owned `.op`.
- Migrate the dedicated Lesson Result handoff away from its stale `Figma source of truth` wording while retaining legacy node IDs as provenance.
- Add a fail-closed repository contract that parses the active `.op`, the detailed screen map and the production handoff manifest and rejects missing/duplicate canonical sources or a return to active-Figma wording.
- Reconcile Issue #203 against the 2026-08-19 OpenPencil migration semantics.

## Non-goals

- No frontend runtime, CSS, API, database, navigation, PWA or deployment behavior changes.
- No mutation of `design/openpencil/LexiGo Design System.op`.
- No Figma Cloud/MCP work.
- No visual baseline changes.
- No deletion of historical Figma artifacts.

## Allowed paths

- `docs/figma/openpencil-production-handoff.json`
- `frontend/docs/adaptive-knowledge-coach.md`
- `frontend/docs/lesson-result-figma.md`
- `scripts/ci/agent_docs_scope_test.py`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- `frontend/app/**`
- `frontend/components/**`
- `backend/**`
- `api/**`
- `deploy/**`
- `.github/workflows/**`
- `design/openpencil/**`
- visual snapshots/baselines

## Runtime owners

Unchanged. Existing route islands and `LexigoBootstrappedApp` remain authoritative.

## Documentation/design owners

- `design/openpencil/LexiGo Design System.op` — active repository-owned editable design source, read-only in this slice.
- `docs/figma/openpencil-screen-map.json` — detailed imported/OpenPencil-native screen inventory, read-only in this slice.
- `docs/figma/openpencil-production-handoff.json` — canonical route/state selection and GitHub delivery mapping introduced by this slice.
- `frontend/docs/adaptive-knowledge-coach.md` — human-readable production handoff.
- `scripts/ci/agent_docs_scope_test.py` — root-checkout executable documentation/design contract.

## Invariants

- OpenPencil repository artifacts are the active design/handoff source.
- Figma file keys/node IDs remain provenance only and are never a delivery blocker.
- Every canonical route has one unambiguous mobile/desktop production source or a documented OpenPencil-native state matrix.
- Existing delivery/route/runtime ownership remains unchanged.
- Historical design artifacts are preserved.

## Acceptance criteria

- Handoff starts from OpenPencil rather than Figma and explicitly labels Figma as archival provenance.
- Canonical routes resolve to existing OpenPencil nodes or reviewed `firstuse.*` active-screen keys.
- Lesson Result resolves to the actual OpenPencil frames present in the active `.op`, not only legacy `217:*` provenance.
- Guest Home, Phrases and Lesson Result are not incorrectly marked as unresolved design gaps where delivery evidence already exists.
- Delivered Issue/PR status is explicit in the route/state manifest and human-readable handoff.
- Root-level CI contract fails closed on missing OpenPencil source keys/nodes, duplicate canonical ownership, geometry/name drift or active-Figma wording.
- Final diff remains within allowed paths and full required CI is green on the immutable developer head.

## Required checks

- `python3 scripts/ci/agent_docs_scope_test.py`
- JSON parse of the new handoff manifest and existing detailed screen map
- full GitHub CI because `frontend/docs/**` and `scripts/ci/**` are not pure Agent Docs
- clean review/thread audit
- exact-main CI after merge

## Risks

- A documentation-only rewrite could accidentally invent an OpenPencil mapping not present in the repository design source.
- A brittle contract could bind to paragraph formatting instead of semantic screen keys/nodes.
- Parsing the active `.op` adds a large but deterministic repository-local test input; the check must remain structural and avoid rendering.

## Rollback

Revert the documentation/manifest/contract commit(s); no runtime or data rollback is required.
