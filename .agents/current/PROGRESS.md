# Current Task Progress

## 2026-08-16 Europe/Moscow

### Verified

- Repository: `Dja-tiger/LexiGo`.
- Issue: #550.
- Branch: `agent/issue-550-openpencil-compat`.
- Base SHA after reconciliation: `27f13b665af27a29d464cebba7e2cf3db54a8dd9` (PR #549 merged after the initial pre-flight).
- Native `.fig`: `design/figma/LexiGo Design System.fig`, SHA-256 `cb123c20cd341b0ada2caeff249c1fbba933c7b31affe365ea05ad3057b2c423`, size `1191055`.
- Selected upstream: `ZSeven-W/openpencil` v0.8.2.
- Upstream Linux x86_64 CLI asset SHA-256: `aeffb1114857e7b810e66cd9ec927fa883dde0cb3ebf0a6ee26891e2888d20a2`.
- Upstream v0.8.2 CLI source defines `op import:figma <file.fig> [--out output.op]` as a standalone conversion path and writes a JSON `.op` document.

### Finding

The AI-first architecture is a better fit than native `.fig` round-trip as the primary requirement: keep the `.fig` immutable for migration/archive, validate conversion, then promote a reviewed Git-friendly `.op` in a later slice. Human web canvas and external Codex/MCP control are separate deployment concerns in the current Rust release line.

### Root cause

The original #550 draft targeted the similarly named `open-pencil/open-pencil`. The user clarified that day-to-day design work will be AI-driven, so the project choice was intentionally changed to `ZSeven-W/openpencil` before a PR was opened.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `scripts/figma/openpencil-ai-import.sh`
- `.github/workflows/openpencil-ai-import.yml`
- `docs/figma/openpencil-ai-workflow.md`

### Checks passed

- Exact upstream release/tag and CLI asset digest verified from the v0.8.2 GitHub release metadata.
- Exact upstream `figma_cli.rs` contract inspected at tag v0.8.2.
- New script is fail-closed on Git LFS pointer content, source identity drift and CLI archive digest drift.
- New workflow explicitly enables Git LFS and uploads generated `.op` plus machine-readable evidence.
- Repository writes are isolated to the task branch; the obsolete first-project probe commit was discarded when the branch was reset to the new live `main` after PR #549 merged.

### Checks failed

None yet. Authoritative import execution and full repository CI require the Draft PR workflow run.

### Current branch head

Resolve from live branch ref after this documentation write.

### Next action

Compare the branch against `main`, open Draft PR, inspect the dedicated OpenPencil import job and normal CI, then classify/fix any failures before Ready/merge.
