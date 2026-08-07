# Current Task Execution

## Task

- Branch: `feat/issue-74-phrases-browser-zoom`
- Base SHA: `0a120092d89f7fffcb63b010acb2cb71ea615740`
- Head SHA: resolve from live branch ref
- PR: pending Draft creation after the first complete developer-authored test slice

## Skills used

### GitHub repository workflow

Purpose:

Read live repository state, obey the repository harness, inspect exact source contracts, create an isolated branch, publish bounded changes and later audit CI/reviews/merge/deployment.

Instruction source:

- `skills://plugins/github/github/skill.md`
- repository `AGENTS.md`
- `.agents/AGENTS.md` and referenced mandatory documents
- `docs/agent-harness.md`

Version or verification date:

Verified against live GitHub state on 2026-08-07 Europe/Moscow.

Inputs:

- Issue #74 acceptance criteria and comments;
- PR #425 reconciliation evidence;
- exact main SHA `0a120092d89f7fffcb63b010acb2cb71ea615740`;
- exact source files from that SHA;
- Issue #199 approved Phrases Figma node mapping.

Files inspected:

- `frontend/playwright.visual.config.ts`
- `frontend/package.json`
- `frontend/e2e/home-browser-zoom.spec.ts`
- `frontend/e2e/learn-browser-zoom.spec.ts`
- `frontend/e2e/active-lesson-browser-zoom.spec.ts`
- `frontend/e2e/word-detail-visual.spec.ts`
- `frontend/e2e/phrases-visual.spec.ts`
- `frontend/components/lexigo-phrases-app.tsx`
- `frontend/components/phrases-catalog.tsx`
- representative source-contract unit tests under `frontend/components/**`
- repository harness/state documents.

Actions performed:

- reconciled and merged PR #425 with expected head;
- verified post-merge exact-SHA CI #2966 success;
- created `feat/issue-74-phrases-browser-zoom` from exact main;
- populated active task/progress/execution evidence;
- established a no-runtime/no-baseline default scope until authoritative CI proves an actual defect.

Commands or procedures:

- GitHub connector reads/writes only; no local checkout was available for this repository in the execution environment;
- every repository write uses an explicit branch and is followed by read-back, branch-head verification and main-drift verification;
- final validation will use repository CI as the authoritative execution environment.

Artifacts produced:

- active Issue #74 task specification and evidence records;
- forthcoming visual collection fix, source contract and Phrases true-browser-zoom acceptance test.

Result:

In progress. Root cause and exact bounded implementation path are confirmed.

Failures:

The previously merged Home/Learn/Active browser-zoom specs were dormant in authoritative visual CI because explicit `testMatch` omitted them.

Root cause:

Explicit Playwright visual allow-list was not coupled to a fail-closed ownership contract when new standalone zoom specs were added.

Fallback:

If newly collected specs fail, classify exact CI logs first. Expand runtime/CSS scope only for a reproduced product defect, then update TASK/PROGRESS before that write.

Limitations:

Physical-device acceptance required by Issue #74 cannot be manufactured from desktop CI evidence; it remains separate until performed on real hardware.

Reusable lesson:

A merged test file is not acceptance evidence. For explicitly allow-listed Playwright suites, every new acceptance owner must be coupled to a source-level collection contract and authoritative CI log evidence before completion is claimed.
