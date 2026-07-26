# Current Task Progress

## 2026-07-27 01:35 Europe/Berlin

### Verified

- Live `main` remains `d906cacf21f5a25dc52a380ab8ce681177831532`; the feature branch is 21 commits ahead and 0 behind with the exact base as merge base.
- Issue #202 has exact Figma nodes `79:69`, `79:93`, `79:117`, `79:194` and `75:57`; Issue #170 supplies the existing offline runtime contract.
- `ReviewOutboxRuntime` remains the sole browser owner for connectivity, IndexedDB persistence, retry and session adoption.
- Full offline lesson progression remains intentionally unsupported; the server owns the next lesson position.
- Dictionary retains URL-owned filters and local search input across loading, empty, error and retry states.

### Finding

- Shared async states required semantic Figma presentation, stable skeleton geometry, focus settlement and correlation evidence.
- The existing outbox toast did not expose real queue details or a persistent restored-connection acknowledgement.
- Offline/retryable lesson reviews were durable, but Active Lesson re-enabled confidence controls after the synthetic queued response and did not show an inline local-save state.
- Figma `Добавить термин` and representative cached-item counts cannot be shipped because those capabilities are not owned by the current runtime.

### Root cause

The durable offline runtime and shared async semantics predated the approved production system-state slice. Presentation and local queued-review feedback were not yet connected to the existing owner contracts.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `docs/offline-review-outbox.md`
- `frontend/app/layout.tsx`
- `frontend/app/system-states.css`
- `frontend/app/system-states-lesson.css`
- `frontend/components/async-state.tsx`
- `frontend/components/review-outbox-runtime.tsx`
- `frontend/components/active-lesson-presentation.tsx`
- `frontend/components/system-states-contract.test.ts`
- `frontend/e2e/offline-review-outbox.spec.ts`
- `frontend/e2e/system-states.spec.ts`
- `frontend/e2e/system-states-visual.spec.ts`
- `frontend/package.json`
- `frontend/playwright.visual.config.ts`

### Checks passed

- Mandatory harness and exact live GitHub/Figma pre-flight.
- Exact-base branch isolation; compare contains only bounded Issue #202 paths.
- Read-back verification after implementation writes.
- Source contracts encode semantic token use, reduced motion, forced colors, durable-write-before-send, stable idempotency, no token persistence, queued-review ownership and absence of unsupported CTAs.
- Browser contracts cover physical offline, retryable `5xx`, response loss, same-key replay, connection restoration, Dictionary loading/empty/error/retry, query retention and reduced motion.
- Five Linux visual scenarios are wired to exact Figma node metadata and attach deterministic screenshots for manual review.

### Checks failed

- Figma variable-def lookup on page node `79:2` returned a connector selection error; exact node design contexts already include semantic variable bindings.
- Local clone/build remains unavailable because the isolated container cannot resolve GitHub DNS.
- Visual hashes intentionally remain `PENDING_MANUAL_REVIEW`; the first visual CI is expected to produce actuals for inspection and promotion.
- No repository CI has run on the implementation head yet.

### Current branch head

Resolve from the Draft PR after this commit.

### Next action

Open the Draft PR, run the full repository matrix, fix all functional/type/lint/browser failures, inspect attached Linux visual actuals against the five Figma nodes, promote only approved hashes, then rerun immutable-head CI.
