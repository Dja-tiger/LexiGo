# Current Task

## Identity

- Issue: #550
- Branch: `agent/issue-550-openpencil-compat`
- Base SHA: `27f13b665af27a29d464cebba7e2cf3db54a8dd9`
- Head SHA: resolve from live branch ref
- PR: pending

## Objective

Validate `ZSeven-W/openpencil` v0.8.2 as the AI-first design environment for LexiGo by reproducibly importing the repository-owned native Figma source into a Git-friendly `.op` document without mutating the canonical `.fig`.

## Scope

- Add a deterministic compatibility/import script for Linux CI.
- Download the pinned OpenPencil v0.8.2 standalone `op` CLI asset and verify its upstream SHA-256 before execution.
- Resolve the real Git LFS `.fig` payload and verify the recorded source identity before and after import.
- Run `op import:figma <file.fig> --out <file.op>` in an isolated temporary workspace.
- Validate the CLI result and generated `.op` JSON structure.
- Add a path-scoped GitHub Actions workflow that uploads the generated `.op` and machine-readable evidence.
- Document the AI-first migration model and known validation gaps.
- Record task progress/execution in `.agents/current/**`.

## Non-goals

- Do not modify the canonical `.fig`.
- Do not commit/promote the generated `.op` as production design source in this slice.
- Do not change production React/CSS/backend/runtime.
- Do not mutate Figma Cloud or Screen Map nodes.
- Do not deploy the OpenPencil web host yet.
- Do not deploy LexiGo Stage/production.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `scripts/figma/openpencil-ai-import.sh`
- `.github/workflows/openpencil-ai-import.yml`
- `docs/figma/openpencil-ai-workflow.md`

## Prohibited paths

- `design/figma/LexiGo Design System.fig`
- `frontend/**`
- `backend/**`
- `deploy/**`
- existing visual baselines and snapshots

## Runtime owners

None changed. This is design tooling/CI only.

## Documentation owners

- `docs/figma/openpencil-ai-workflow.md` — migration, AI/MCP and source-of-truth contract.
- `.agents/current/**` — factual task state.

## Invariants

- Native Figma source remains byte-for-byte SHA-256 `cb123c20cd341b0ada2caeff249c1fbba933c7b31affe365ea05ad3057b2c423`, size `1191055`.
- OpenPencil implementation is `ZSeven-W/openpencil`, pinned to v0.8.2 for this probe.
- Linux x86_64 CLI archive SHA-256 is `aeffb1114857e7b810e66cd9ec927fa883dde0cb3ebf0a6ee26891e2888d20a2`.
- A generated `.op` is evidence only until structural and visual review explicitly promotes it.
- No Figma SaaS/MCP access is required by the compatibility gate.

## Acceptance criteria

- Git LFS checkout contains the native file, not a pointer.
- Source SHA-256 and size match before and after import.
- Pinned CLI archive is cryptographically verified before extraction/execution.
- `op import:figma` reports success with non-zero page/node evidence and produces a non-empty `.op`.
- Generated `.op` parses as JSON and exposes non-empty document/page/node structure.
- Workflow uploads import result, validation summary and generated `.op`.
- Documentation explicitly distinguishes archive `.fig`, candidate `.op`, and future self-host/MCP deployment.
- Immutable-head required CI and dedicated OpenPencil workflow are green before merge.

## Required checks

- Shell syntax/static sanity for the new script.
- Dedicated `OpenPencil AI import` workflow on Linux with Git LFS enabled.
- Normal repository CI for the final developer-authored head.
- Review/changed-path audit before Ready.

## Risks

- v0.8.2 is a prerelease and import fidelity is not equivalent to pixel-perfect Figma round-trip.
- Imported Figma node IDs may not remain suitable as long-term `.op` identifiers; do not assume identity preservation without evidence.
- Web-host Docker does not bundle Codex/Claude CLI agents in the current Rust release line; external MCP/native agent integration is a separate deployment concern.

## Rollback

Remove the new workflow/script/docs and reset `.agents/current/**`. The canonical `.fig` and product runtime are unchanged.
