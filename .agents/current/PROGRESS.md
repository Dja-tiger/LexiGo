# Current Task Progress

## 2026-08-19 21:45 Europe/Moscow

### Verified

- Exact-main SHA `639e177ec7362544e42c7d0b77a5c7432bca8401` CI run `32285020880` failed in generic UI shards.
- Controlled rerun on the same SHA made shard 1 green; shard 2 reproduced the WebKit lesson-preview CORS pageerror.
- Latest trace shows same-origin POST `/api/v1/lessons/preview`, a fulfilled 200 response and CORS headers already present.
- The initial Dictionary system-state failure did not reproduce and is out of scope.

### Finding

The remaining blocker is deterministic Playwright/WebKit interception behavior in the route-history audit, not the merged Go dependency or LexiGo production runtime.

### Root cause

The page-level route fulfills a same-origin preview request that carries a browser-generated `Origin`; WebKit applies CORS validation to that intercepted response. The canonical context fixture should own the response instead.

### Changed files

- `frontend/e2e/route-history-parity.spec.ts`
- `frontend/components/route-history-collection-contract.test.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Checks passed

Pre-flight, trace/root-cause analysis, source-contract design.

### Checks failed

Exact-main CI `32285020880` remains red before this fix.

### Current branch head

Resolve from live branch ref.

### Next action

Open PR for #624 and run full exact-head CI; fix any deterministic failures before merge.
