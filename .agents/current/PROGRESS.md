# Current Task Progress

## 2026-08-06 01:20 Europe/Moscow

### Verified

- Live `main` is `ecbb16dd42cd0567f3a9c760f2ea938aede8bb6b`.
- No product PR is active; open PRs #304, #305 and #403 are unrelated Dependabot maintenance.
- Issue #74 remains open after completed PR #409 and Agent Docs reconciliation #410.
- Canonical `/words/[id]` is owned by `LexigoDictionaryApp` and `WordDetailPresentation`.
- `.lx-word-detail-back` is a live native button in loading, error and ready states.
- Its painted minimum height is 42px; desktop accessible name is `Словарь`, compact accessible name is `Слово`.
- The adjacent status chip is non-interactive and the route header provides sufficient vertical clearance for block-axis-only expansion.
- Existing Word Detail content-addressed Linux baselines cover compact/desktop Light/Dark and must remain unchanged.

### Finding

The canonical Word Detail Back action does not meet the Issue #74 44px fine-pointer / 48px coarse-pointer target-height contract. Its existing width is sufficient, so no inline expansion or painted geometry change is necessary.

### Root cause

`frontend/app/word-detail.css` owns a 42px minimum painted height but no separate interaction-only hit surface for the text-only Back action.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`

### Checks passed

- Mandatory Agent Harness and specialized rules read from exact `main`.
- Live repository, Issue #74, open PRs and current project state reconciled.
- Runtime visibility, semantic owner, CSS owner, responsive accessible names and existing visual evidence verified.
- Isolated branch `agent/issue-74-word-detail-back-target` created from exact base SHA.

### Checks failed

- None.

### Current branch head

- Resolve from live branch ref after this commit; previous verified head `e1ba9f834526833e9da86a4ed904ae7d7c1434ed`.

### Next action

Add the route-scoped block-axis interaction layer, source contract and cross-browser proof, then register the proof in blocking commands and run targeted validation.
