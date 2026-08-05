# Current Task Progress

## 2026-08-05 13:26 Europe/Moscow

### Verified

- live `main` and branch base remain `e46881b9fc9def630343e3ee69425492bc0aefe7`;
- only unrelated Dependabot PRs #304–#306 are open outside Draft PR #395;
- Home, Learn, Active Lesson and compatibility runtimes render interactive `button.lx-streak` controls that navigate to Progress;
- Dictionary renders a decorative, non-interactive `span.lx-streak` and is intentionally excluded by the exact `button.lx-streak` selector;
- the interactive streak is intentionally hidden below 720px for applicable non-Dictionary route islands;
- the shared painted owner uses content height plus `10px 11px` padding and does not guarantee the required fine/coarse target height;
- the adjacent profile button already has a dedicated 44/48px target owner.

### Finding

The visible interactive streak buttons are horizontally wide enough but their height depends on text metrics and padding. They need an interaction-only block-axis expansion while preserving the existing inline gap to the profile target. The Dictionary streak is presentation-only and must not receive button semantics or hit-surface expansion.

### Root cause

The shared presentation layer predates the Issue #74 minimum-target contract. It styles both interactive and decorative streak variants visually but has no input-modality-aware effective hit-surface owner for the interactive buttons.

### Changed files

- `.agents/current/TASK.md`;
- `.agents/current/PROGRESS.md`;
- `.agents/current/EXECUTION.md`;
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
- the exact element-qualified selector excludes the decorative Dictionary span;
- focused proof is registered exactly once in both blocking UI and accessibility commands;
- CI #2787/run `30997037306` passed change classification, frontend lint and TypeScript before the source-contract failure;
- 97 existing Vitest files and 604 tests passed in the same run.

### Checks failed

- CI #2787/run `30997037306` failed one new Vitest assertion because the initial source inventory incorrectly required the decorative Dictionary span to contain the interactive Progress navigation callback;
- production build, browser and downstream frontend jobs were correctly skipped after the unit-test failure;
- no runtime CSS, TypeScript or existing test failed;
- no local validation is claimed because the current environment cannot resolve GitHub for a local clone.

### Current branch head

- corrected implementation head before this progress update: `b151639535afc60f8cce46aaebfe6fa9f3dc9719`;
- resolve the current head from the live branch ref after this record commit.

### Next action

Validate the corrected exact ownership contract on the new immutable PR head. Continue only after frontend core, focused cross-browser proof and the full authoritative CI matrix are green.