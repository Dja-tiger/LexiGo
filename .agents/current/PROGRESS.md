# Current Task Progress

## 2026-07-31 21:35 Europe/Moscow

### Verified

- Live `main` before the slice: `31c1f9cd9432bc5fd75a81c76e7f65d96e430e8b`.
- Latest deployed product SHA remains `cbb9bc9c50e76a93c887736319047fd5d98bc35a`.
- Issue #70 remains open.
- PR #324 proved source-level fallback ownership and canonical Learn CSS consumption.
- README and `production-app-entry.test.ts` already protect the production entry chain, ownership documentation and retired alternative application roots.
- `route-bundle-budget.spec.ts` measures real production JavaScript resources for all canonical route islands but does not yet prove fallback chunk isolation.
- `LexigoPremiumApp` renders `.lx-app`, providing a stable readiness marker for a controlled unknown/product-route probe.

### Selected slice

Add runtime bundle-isolation evidence by measuring a compatibility probe and asserting that its exclusive production JavaScript assets are absent from every canonical route measurement.

### Allowed files

- `frontend/e2e/route-bundle-budget.spec.ts`
- `frontend/docs/compatibility-cleanup.md`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Process evidence

- Two rejected calls before this task used `create_file` while branch creation was intended. Both returned 404 and created no refs or paths. The failure is recorded in PROJECT_STATE and the exact `create_branch` schema was reloaded.
- PR #327 changed PROJECT_STATE semantics so docs-only merges no longer trigger recursive reconciliation.

### Next action

Populate EXECUTION, read back task memory, then modify only the route bundle test. Run full authoritative CI before documentation completion or merge.
