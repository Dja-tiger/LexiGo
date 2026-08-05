# Current Task Progress

## 2026-08-05 13:20 Europe/Moscow

### Verified

- live `main` and branch base are `e46881b9fc9def630343e3ee69425492bc0aefe7`;
- only unrelated Dependabot PRs #304–#306 are open;
- five confirmed route runtimes render a live `button.lx-streak` for authenticated progress navigation;
- the streak is intentionally hidden below 720px for non-Dictionary route islands;
- the shared painted owner uses content height plus `10px 11px` padding and does not guarantee the required fine/coarse target height;
- the adjacent profile button already has a dedicated 44/48px target owner.

### Finding

The visible streak button is horizontally wide enough but its height depends on text metrics and padding. It therefore needs an interaction-only block-axis expansion while preserving the existing inline gap to the profile target.

### Root cause

The shared presentation layer predates the Issue #74 minimum-target contract. It styles the control visually but has no input-modality-aware effective hit-surface owner.

### Changed files

- `.agents/current/TASK.md`;
- `.agents/current/PROGRESS.md`;
- `frontend/app/header-streak-touch-targets.css`;
- `frontend/app/layout.tsx`;
- `frontend/components/header-streak-touch-target-source.test.ts`;
- `frontend/e2e/header-streak-touch-targets.spec.ts`;
- `frontend/package.json`.

### Checks passed

- all writes were read back from `fix/issue-74-header-streak-target`;
- `main` remained unchanged after every write;
- import order places the new interaction owner after the profile target owner and before queued-state overrides;
- source inspection confirms no painted geometry or phone-width visibility owner was modified;
- focused proof is registered exactly once in both blocking UI and accessibility commands.

### Checks failed

- none yet;
- no local validation is claimed because the current environment cannot resolve GitHub for a local clone.

### Current branch head

- implementation head before this progress update: `92c774260054c86726468799c5e67649bb976f0f`;
- resolve the current head from the live branch ref after this record commit.

### Next action

Read back the execution record, compare the complete branch diff against the allowed paths, open a Draft PR and use authoritative CI as the validation source.