# Current Task Progress

## 2026-08-20 05:20 Europe/Moscow

### Verified

- Exact-main SHA `639e177ec7362544e42c7d0b77a5c7432bca8401` CI run `32285020880` failed in generic UI shards.
- Controlled rerun on the same SHA made shard 1 green; shard 2 reproduced the WebKit lesson-preview CORS pageerror.
- PR #625 exact-head run `32319950680` (`#3886`) on SHA `826dc12fcf11684b5e2a814c4a31952820da0032` passed Frontend core quality but failed `UI tests (2/2)` again.
- The `#3886` Playwright trace proves the browser wrapper changed `Sec-Fetch-Mode` to `same-origin`, while WebKit still sent `Origin: http://127.0.0.1:3000`; the canonical context fixture fulfilled the request with HTTP 200, yet WebKit still emitted the access-control pageerror.
- `main` remains `639e177ec7362544e42c7d0b77a5c7432bca8401`; no rebase is currently required.
- PR #625 has no reviews or review threads.

### Finding

Header normalization and Fetch-mode normalization are insufficient. The remaining distinguishing factor is the extra page-level interception boundary layered in front of the canonical context fixture.

### Root cause

The Issue #617 audit duplicated interception ownership for `POST /api/v1/lessons/preview`: a page route intercepted/fell through while `installQualityGateAPI(context)` fulfilled the response. WebKit preserves access-control state across that interception chain and reports a CORS pageerror even though the URL is same-origin and the synthetic response is HTTP 200.

### Changed files

- `frontend/e2e/route-history-parity.spec.ts`
- `frontend/components/route-history-collection-contract.test.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Checks passed

- Trace/root-cause analysis for exact-head run `#3886`.
- Previous exact-head Frontend core quality on SHA `826dc12fcf11684b5e2a814c4a31952820da0032`.
- Source-contract design now forbids page-level lesson-preview interception.

### Checks failed

- `UI tests (2/2)` in run `32319950680` (`#3886`) failed before the canonical-context-only fix.

### Current branch head

Resolve from live branch ref after Agent Harness documentation commits.

### Next action

Run full exact-head CI with the page-level lesson-preview route completely removed. If all required checks are green, mark PR #625 ready, squash merge, then verify exact-main CI before resuming production dependency PR #621.
