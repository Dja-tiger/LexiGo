# Current Task Progress

## 2026-08-05 00:55 Europe/Moscow

### Verified

- Live `main` is `6a8c885a6a7950c25cada8374b2d71dcf253b34e`.
- No open product PR conflicts with this slice; open PRs #304–#306 are unrelated Dependabot work.
- Last product stage run `30937320392` succeeded, including public endpoints and public browser validation, for product SHA `29151758bae0b4220ee48213d0fc49a2290ba20a`.
- Issue #74 remains open and explicitly retains remaining live-control touch-target coverage.
- Current `/learn` source contains no live `Все режимы` control; that wording is stale.
- The live mobile disclosure owner exposes `Настроить урок` when collapsed and `Ручная настройка` when expanded.
- Figma source is file `3xXmBWnf38jbvLjtziwber`: collapsed node `202:81` is 318×42 and expanded summary node `203:57` is 358×58.

### Finding

The existing adaptive presentation guarantees only a 44px minimum for the disclosure controls and has no explicit 48px coarse-pointer contract. The approved painted geometry must not be enlarged or re-baselined.

### Root cause

The progressive Lesson Composer predates the Issue #74 fine/coarse target ownership pattern later established for connectivity and profile controls. Its presentation stylesheet owns visible geometry but no dedicated input-modality target variable or browser hit-test proof.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`

### Checks passed

- Agent Harness mandatory-document read and live GitHub reconciliation.
- Exact Figma metadata and design-context inspection for both disclosure states.
- Allowed-path and non-goal pre-flight.

### Checks failed

- None.

### Current branch head

Resolve from live branch after each write; latest write commit is `5de3cdf7f1f8c88bafdc4c2ae89b685e6f35088b` before this progress update.

### Next action

Record execution evidence, then add the narrow CSS owner, source contract and focused browser proof without changing runtime components or painted presentation.
