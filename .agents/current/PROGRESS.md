# Current Task Progress

## 2026-07-25 22:44 Europe/Berlin

### Verified

- Live `main` is `591322c4a55b362402eab0b4936cd4e4f0347c3a`.
- Open pull requests: none before this slice.
- Stage run `30173542601` deployed the exact live `main` SHA; deploy, public smoke and 12/12 public browser checks succeeded.
- Issue #24 leaves Scenario catalog/discovery, `/progress` completion evidence and server-owned recommendations open.
- Feature branch was created from the exact base and compared as identical before the first write.
- Mandatory repository harness, architecture and skill documentation were read from live `main`.
- Figma nodes `76:6`, `76:53` and `76:154` define the existing Progress next-action surface; Scenario nodes `76:100`, `76:127` and `76:219` confirm the focused Scenario presentation contract.

### Finding

Scenario steps already persist ordinary schema-v2 Recall review events and completed attempts already have authoritative `completed_at`, but `/api/v1/progress` exposes neither Scenario completion activity nor a Scenario next action. The current completed Scenario state only routes back to learning.

### Root cause

The Scenario backend/content foundation and focused UI were intentionally delivered before a cross-layer Progress/recommendation contract. The remaining integration requires a read-only projection over `scenarios` and `scenario_attempts`; no migration or new scheduler is needed.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`

### Checks passed

- Live GitHub pre-flight and branch identity verification.
- Exact Figma design-context inspection for Progress and Scenario production nodes.

### Checks failed

- None.

### Current branch head

Resolve from live branch ref after this write.

### Next action

Implement the additive backend model and deterministic Scenario-progress query, then extend integration and bounded OpenAPI contracts before frontend consumption.