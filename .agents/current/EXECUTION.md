# Execution

## Pre-flight

- Repository: `Dja-tiger/LexiGo`
- Base branch: `main`
- Verified base SHA: `e1980c973d524048d2fb079d79d51b8bfd50f0a4`
- Branch: `feat/issue-18-adaptive-queue`
- Required `.agents` governance files read before write.
- No specialist `AGENTS.issue-18*` file exists.
- Local GitHub clone is unavailable in this runtime because outbound DNS to github.com is blocked; repository CI is the authoritative execution environment.

## Production-safety plan

- Keep ranking truth server-owned inside the same repeatable-read candidate snapshot.
- Use existing objective review evidence; do not introduce heuristic browser state.
- Keep migration additive and backwards compatible.
- Preserve explicit manual `wordIds` ordering.
- Persist reasons so resume is deterministic even if learner state changes later.
- Do not merge on partial checks; use immutable-head CI and expected-head squash merge.

## Intended validation

- Backend formatting/static analysis.
- Learning package unit tests, including new adaptive queue contracts.
- PostgreSQL integration/migration tests.
- Race tests.
- Full repository CI required by scope classification.
- Exact-SHA main CI + Stage/public gates after merge.
