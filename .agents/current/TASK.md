# Current Task

## Identity

- Issue: #70
- Branch: `test/issue-70-prove-home-hero-css-orphaned`
- Base SHA: `df3cd097cbd159a4d441aea4ce783043dabe36ec`
- Head SHA: resolve from the live branch ref after each write
- PR: not opened yet

## Objective

Add checkout-level executable evidence for the legacy Home hero-decoration CSS family that remains in `frontend/app/premium-ui.css` after the compatibility `renderHome()` presentation was deleted.

This is a proof-only slice. It must not remove or modify production CSS. The proof must distinguish the orphan candidates from the canonical Home classes that remain live.

## Candidate family

The only deletion candidates in this slice are:

- `lx-hero-copy` — 5 selector-token occurrences in `premium-ui.css`;
- `lx-glow` — 1 occurrence;
- `lx-floating-card` — 4 occurrences;
- `lx-book-base` — 6 occurrences;
- `lx-orbit` — 3 occurrences.

Total bounded inventory: 19 selector-token occurrences, all expected to be owned only by `frontend/app/premium-ui.css`.

## Explicitly preserved live Home owners

- `lx-hero-card` remains executable canonical Home markup.
- `lx-hero-art` remains executable canonical Home markup and contains the live word preview.
- `lx-word-preview`, `lx-home-next-action` and `lx-home-next-action-copy` remain canonical Home presentation owners.
- `lx-progress-panel` remains part of the canonical Home summary.
- `lx-resume-strip` remains a live compatibility Lesson owner.
- `lx-auth-card` remains a live guest authentication/recovery owner.

## Scope

- Add one Vitest source contract that scans executable TypeScript/TSX from the actual frontend checkout.
- Exclude test/spec files and strip source comments before consumer analysis.
- Prove zero executable consumers for every candidate class.
- Prove that every candidate CSS occurrence is confined to `premium-ui.css` and matches the exact bounded count.
- Protect the canonical Home and compatibility owners listed above.
- Record execution and validation evidence in `.agents/current/**`.

## Non-goals

- No production CSS deletion or declaration change.
- No runtime TypeScript/TSX, route, navigation, session, API, backend or database change.
- No CSS import-order change.
- No visual snapshot or route-budget ceiling update.
- No deletion of `lx-hero-card`, `lx-hero-art`, `lx-word-preview`, `lx-progress-panel`, `lx-resume-strip` or `lx-auth-card`.
- No README, architecture, workflow, dependency, Figma or Issue-state change.

## Allowed paths

- `frontend/components/home-hero-orphan-source.test.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

Every path not listed above, especially:

- `frontend/app/*.css`
- production TypeScript/TSX
- snapshots and `frontend/bundle-budgets.json`
- workflows and dependencies
- backend/API/database files
- README, architecture and Figma artifacts

## Invariants

- `LexigoHomeApp` remains the canonical owner for `/` before the compatibility fallback.
- The live `.lx-hero-card` and `.lx-hero-art` computed cascade must remain unchanged.
- Guest authentication/recovery, Library, Lesson, unknown-route and shared account/session runtime remain live.
- Indexed GitHub search is discovery only; the final claim comes from the actual-checkout source contract and full CI.
- Production CSS, Linux visual hashes and performance ceilings remain byte-for-byte unchanged.

## Acceptance criteria

- Every candidate class has zero executable TypeScript/TSX consumers.
- Every candidate class is present only in `premium-ui.css` with its exact expected count.
- The contract protects live canonical Home classes and live compatibility `lx-resume-strip` / `lx-auth-card` consumers.
- The final diff contains only the four allowed paths.
- Full required CI passes on the final immutable developer-authored head.
- Linux visual regression and route-performance budgets pass unchanged.
- Comments, reviews and unresolved review threads are empty before Ready.
- Expected-head squash merge and exact-SHA main/stage validation complete before reconciliation.

## Required checks

- New source-level Vitest contract.
- Frontend lint, typecheck, complete unit suite, production build and dependency audit.
- Backend unit/security/integration.
- Full browser matrix, accessibility, CSP, service worker, Lesson completion and Dictionary smoke.
- Authoritative Linux visual regression and route-performance budgets without updates.
- Web and API container builds.
- Exact-SHA stage deploy, public smoke and public browser validation.

## Rollback

Revert the proof-only PR. No production CSS, runtime, schema, data or API rollback is required.
