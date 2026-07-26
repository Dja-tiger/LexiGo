# Current Task Progress

## 2026-07-27 00:40 Europe/Berlin

### Verified

- Live `main` is `d906cacf21f5a25dc52a380ab8ce681177831532`; no open PR existed before branch creation.
- Reconciliation SHA is deployed on stage with successful public smoke and 12/12 public browser checks.
- Issue #202 has exact Figma nodes `79:69`, `79:93`, `79:117`, `79:194` and `75:57`; Issue #170 supplies the existing offline runtime contract.
- `ReviewOutboxRuntime` already owns IndexedDB persistence, retry on online/visibility/session restore, session lifecycle and global sync status.
- Full offline lesson progression is intentionally unsupported; the server owns the next lesson position.
- `AsyncStatePanel` and `AsyncSkeletonGrid` are the existing shared loading/empty/error owners.
- Dictionary already preserves URL-owned filters and local search input across empty/error/retry states.

### Finding

- Current shared async states use the older dark glass presentation rather than the approved semantic Figma hierarchy.
- Bootstrap loading replaces product content with a generic centered LexiGo mark instead of a stable route-aware skeleton.
- The global outbox status is a compact fixed toast and does not expose truthful queue details or a persistent restored-connection acknowledgement.
- Offline/retryable lesson reviews are durable, but Active Lesson only receives a synthetic 503 and presents the local-save evidence through the generic action error; confidence controls become available again and allow a duplicate submission attempt.
- Existing Dictionary empty CTA is real and safe (`Сбросить фильтры`); the Figma `Добавить термин` action cannot be shipped before Issue #25.

### Root cause

The durable offline runtime and shared async semantics were implemented before the production system-state Figma slice. Presentation and local queued-review feedback were not yet connected to the existing runtime owner.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`

### Checks passed

- Mandatory harness documents and exact live GitHub state re-read.
- Exact Figma design context fetched for all five Issue #202 nodes.
- Existing runtime, state components, tests, CSS imports and product invariants inspected at immutable base SHA.
- No conflicting `system` or `offline` branch found.

### Checks failed

- Figma variable-def lookup on page node `79:2` returned a connector selection error; exact node design-context responses already include the required semantic variable bindings.
- Local clone is unavailable because the isolated container cannot resolve GitHub DNS; exact-ref connector reads/writes remain authoritative.

### Current branch head

Resolve from live branch ref after this commit.

### Next action

Implement the shared semantic state layer, extend the existing outbox runtime, connect queued-review evidence to Active Lesson, then add bounded tests and documentation before opening the Draft PR.
