# Current Task

## Identity

- Issue: #201 — First Use: Guest Home, onboarding and diagnostics.
- Branch: `design/issue-201-first-use-openpencil`.
- Base SHA: `14558e726cb64c59b21437832bef3c6277c978b6`.
- PR: not opened yet.
- Primary design runtime: pinned ZSeven OpenPencil v0.8.2 on GitHub Actions Linux runners.

## Objective

Close the production design gap that blocks #201 implementation by extending the promoted OpenPencil source with canonical First Use states derived from the delivered #18 backend contract, registering stable OpenPencil node IDs, and keeping both migration provenance and active-source acceptance fail-closed.

## Proven inputs and promoted output

- Active editable source: `design/openpencil/LexiGo Design System.op`.
- Current reviewed active SHA-256: `6d73b785aaeb7dda35a53c9c5f16edfc9cbef1092dbce992183538f16505520e`.
- Current active size: `6,937,300` bytes; 23 pages; 7,983 recursive nodes; 92 runtime variables.
- Token provenance: `design/openpencil/LexiGo Design Tokens.json`, unchanged SHA `e603d86f3d4ef470c39fd72c31433e6a124bb9371da6f333567cd3aa796ae05c`.
- Figma `.fig` is immutable migration/archive input, not the day-to-day editor source.
- Immutable tokenized migration baseline remains SHA `5380a0468d4e369d91ac190b829e01f60ff43493f6a76c9300c6b58d0b34d664` / 6,446,726 bytes.
- Existing canonical onboarding source: Figma `79:46` / OpenPencil `fig_4282`.
- Existing First Use backend states from #18: `not_started`, `in_progress`, `completed`, `skipped`.
- Diagnostic item self-mark contract: `known`, `unsure`, `new` before translation reveal; up to 12 items; skip must not mutate scheduler state.

## Required production matrix

Completed in the active `.op` as a 40-state matrix:

1. Guest Home — mobile + desktop, dominant First Use CTA, no fake progress.
2. Onboarding role/context — existing mobile Light retained, desktop and Dark variants added.
3. Diagnostic pre-reveal — `Знаю / Не уверен / Новое`; answer hidden.
4. Diagnostic post-mark/reveal — selected mark visible; translation/context revealed; one Continue action.
5. Diagnostic in-progress/resume — position communicated without future answers.
6. Skip confirmation/result — maps to `skipped`, non-blocking, no scheduler mutation claim.
7. Completion/result — maps to `completed`, personal queue prepared, dominant lesson handoff.
8. Loading/error/retry/recovery — safe resume language.
9. Light/Dark and mobile/desktop coverage.

## Execution strategy

- Do not deploy OpenPencil to a VPS for this slice.
- GitHub Actions Linux runners remain the default AI design runtime.
- Discovery and preview happen on disposable copies through OpenPencil semantic MCP/CLI operations.
- Promote only the exact reviewed artifact after SHA/readback verification.
- Temporary write/inspection workflows must be removed before final CI.
- Final design source changes leave only through this branch and a reviewed PR.

## Allowed final paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `design/openpencil/LexiGo Design System.op`
- `docs/figma/openpencil-screen-map.json`
- `docs/figma/openpencil-ai-workflow.md`
- `.github/workflows/openpencil-visual-acceptance.yml`
- Issue/PR metadata and comments

Temporary `.github/workflows/openpencil-issue-201-*.yml` files were execution-only and must not remain in the final diff.

## Prohibited paths

- `design/figma/**`
- `frontend/**`
- `backend/**`
- `api/**`
- Stage/prod Compose, product Caddy or product deploy workflows
- token sidecar semantics unless a separately reviewed token migration is required

## Permanent acceptance architecture

- `screens` in Screen Map owns immutable Figma-derived migration mappings.
- `activeScreens` owns reviewed post-promotion OpenPencil-native mappings.
- CI must reproduce the old migration/token baseline exactly.
- CI must independently validate the committed active `.op` against `source.activeOpSha256`, `source.activeOpSize`, merged structural mappings, Linux renders, all 92 variables and an isolated editability probe.
- Active post-promotion design is intentionally not byte-equal to the historical Figma migration baseline.

## Stop conditions

Stop writes if `main` moves incompatibly, the branch loses its verified base, active source SHA/map identity diverges, semantic OpenPencil evidence is ambiguous, #18 interaction semantics are contradicted, visual evidence fails review, or the final diff leaves allowed paths.

## Acceptance gates

- Stable OpenPencil node IDs for all 40 First Use states are registered in `activeScreens`.
- Deterministic Linux screenshots were produced and reviewed; discovered layout defects were repaired before promotion.
- Migration provenance remains fail-closed and independent from active-source acceptance.
- No temporary workflow remains in final diff.
- Permanent OpenPencil acceptance and full required repository CI are green on the final developer-authored head.
- Draft PR review/thread/path audit is clean before Ready and squash merge.
