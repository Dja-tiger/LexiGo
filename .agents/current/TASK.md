# Current Task

## Identity

- Issue: #201 — First Use: Guest Home, onboarding and diagnostics.
- Branch: `design/issue-201-first-use-openpencil`.
- Base SHA: `14558e726cb64c59b21437832bef3c6277c978b6`.
- PR: not opened yet.
- Primary design runtime: pinned ZSeven OpenPencil v0.8.2 on GitHub Actions Linux runners.

## Objective

Close the production design gap that blocks #201 implementation by extending the promoted OpenPencil source with canonical First Use states derived from the delivered #18 backend contract, then register stable OpenPencil node IDs and review deterministic Linux renders before any frontend implementation.

## Proven inputs

- Active editable source: `design/openpencil/LexiGo Design System.op`.
- Token provenance: `design/openpencil/LexiGo Design Tokens.json`.
- Figma `.fig` is immutable migration/archive input, not the day-to-day editor source.
- Existing canonical onboarding source: Figma `79:46` / OpenPencil imported counterpart to be resolved from the live `.op` before writes.
- Existing First Use backend states from #18: `not_started`, `in_progress`, `completed`, `skipped`.
- Diagnostic item self-mark contract: `known`, `unsure`, `new` before translation reveal; up to 12 items; skip must not mutate scheduler state.
- OpenPencil v0.8.2 MCP supports semantic reads/writes including page selection, node reads, copy/update/batch operations and screenshots.

## Required production matrix

1. Guest Home — mobile + desktop, one dominant First Use CTA, no fake progress.
2. Onboarding role/context — retain/promote existing mobile composition; add desktop coverage.
3. Diagnostic pre-reveal — exactly `Знаю / Не уверен / Новое`; answer remains hidden.
4. Diagnostic post-mark/reveal — selected mark remains visible; translation/context revealed; one Continue action.
5. Diagnostic in-progress/resume — communicates position without future answers.
6. Skip confirmation/result — maps to `skipped`, non-blocking, no scheduler mutation claim.
7. Completion/result — maps to `completed`, personal queue prepared, one dominant Home/Learn handoff.
8. Loading/error/retry/recovery — preserve current selection where applicable.
9. Light/Dark and mobile/desktop coverage, using semantic tokens rather than ad-hoc literals.

## Execution strategy

- Do not deploy OpenPencil to a VPS for this slice.
- Use temporary branch-only GitHub Actions jobs to run the immutable OpenPencil v0.8.2 image against the branch `.op`.
- First perform inspection-only semantic reads and render evidence; do not guess node structure.
- Apply edits through OpenPencil semantic MCP/CLI operations, not direct raw JSON surgery.
- Temporary write/inspection workflows must be minimal, branch-guarded and removed before final CI.
- Final design source changes leave only through this branch and a reviewed PR.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `design/openpencil/LexiGo Design System.op`
- `docs/figma/openpencil-screen-map.json`
- `docs/figma/openpencil-ai-workflow.md` only for a minimal durable contract update if required
- Issue/PR metadata and comments
- temporary `.github/workflows/openpencil-issue-201-*.yml` only during the branch execution phase; none may remain in final diff
- temporary `.tmp/**` is artifact-only and must not be committed

## Prohibited paths

- `design/figma/**`
- `frontend/**`
- `backend/**`
- `api/**`
- Stage/prod Compose, product Caddy or product deploy workflows
- token sidecar semantics unless the design change explicitly requires a separately reviewed token migration

## Stop conditions

Stop writes and reconstruct context if `main` moves unexpectedly, the branch loses its verified base, the exact existing onboarding node cannot be resolved, semantic OpenPencil read/write evidence is ambiguous, a required state conflicts with #18, visual evidence cannot be reviewed, or the diff leaves allowed paths.

## Acceptance gates

- Stable OpenPencil node IDs exist for the new canonical states and are registered in Screen Map.
- Deterministic Linux screenshots are produced and reviewed for the production matrix.
- Existing source/visual/token acceptance remains fail-closed.
- No temporary workflow remains in the final diff.
- Full required repository CI is green on the final developer-authored head.
- Draft PR review/thread/path audit is clean before Ready and squash merge.
