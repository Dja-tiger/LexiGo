# Current Task Progress

## 2026-08-05 01:43 Europe/Moscow

### Verified

- Live `main` is docs reconciliation SHA `b42f540f240883cfd4b23ce6e248512ac1f21316`; latest deployed product SHA remains `0535f6641b6624b5f07266137942c3c5ae73c167`.
- Issue #74 remains open after completed PRs #387, #389 and #391.
- Open PRs #304–#306 are unrelated Dependabot maintenance work.
- Expanded mobile `/learn` exposes three live radiogroups: `Режим обучения`, `Раздел обучения` and `Размер урока`.
- Current mobile presentation sets every direct radio button in these groups to at least 44px but has no coarse-pointer 48px owner.
- Existing visual gap between adjacent options is 6px.
- Figma file `3xXmBWnf38jbvLjtziwber`, expanded Learn node `203:5`, defines mode node `203:66` at 32px painted height, material node `203:77` at 45px and size node `203:92` at 32px, all with 6px spacing.

### Finding

The live radio controls already satisfy the fine-pointer 44px runtime floor but do not expose an explicit 48px coarse-pointer event-surface contract. Increasing painted geometry would diverge from Figma and create unnecessary visual churn.

### Root cause

The adaptive Lesson Composer presentation predates the Issue #74 input-modality interaction owners. It supplies responsive layout and 44px minimum heights but does not separate painted geometry from effective coarse-pointer target geometry.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`

### Checks passed

- Live GitHub, stage, Issue and open-PR reconciliation.
- Mandatory Agent Harness and current-state read.
- Runtime visibility, accessibility-tree semantics, computed source ownership and exact Figma-node inspection.
- Atomic allowed-path and rollback pre-flight.

### Checks failed

- None.

### Current branch head

Resolve from the live branch after each write; first task-record commit is `93b5a1d7c9223b469cb6c330d1f1979b489d8a6f`.

### Next action

Record execution evidence, then add one interaction-only CSS owner plus source and browser contracts without modifying runtime components or adaptive presentation.
