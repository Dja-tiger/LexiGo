# Current Task

## Identity

- Issue: #552
- Branch: `agent/issue-552-openpencil-visual-acceptance`
- Base SHA: `e7d992ad6089aa6445017ea6ffff6280787b05d8`
- Head SHA: resolve from live branch ref after each write
- PR: #553 (Draft)

## Objective

Visually and semantically validate the deterministic `ZSeven-W/openpencil` v0.8.2 conversion of the repository-owned Figma archive and promote the reviewed AI-native design sources only if the acceptance evidence passes.

## Scope

- Reproduce the exact #550 candidate `.op` and require SHA-256 `ca0f0492e235ebf3b159dd320cc3c4fb61f550f20e2a42f80140f1cfc30a639c` before review.
- Establish an explicit canonical Figma-node -> OpenPencil `fig_*` mapping for production-relevant screens.
- Start the pinned OpenPencil file-backed headless server and export representative canonical nodes to Linux PNG evidence.
- Validate exported PNG dimensions, hashes and semantic node metadata.
- Verify practical editability on an isolated copy; never mutate the archived `.fig` or the review candidate while probing.
- Recover the native Figma variable collections, modes, aliases and complete `valuesByMode` through a read-only parser because ZSeven v0.8.2 intentionally imports `themes: None` / `variables: None`.
- Require exactly 92 native variables, matching the repository handoff.
- Compile those native definitions into 92 namespaced ZSeven runtime variables plus the required multi-mode theme axes.
- Preserve the lossless Figma collection/mode/alias graph in a Git-tracked token sidecar because ZSeven v0.8.2 does not support variable-to-variable aliases.
- Apply the compiled token layer to a disposable `.op` through the official `op themes:set` / `op vars:set` APIs, reopen it, require 92 variables, and prove its page tree and rendered canonical screens are unchanged.
- Upload machine-readable acceptance, token migration and native-variable evidence from CI.
- Manually inspect the specific Linux artifact before any source-of-truth promotion.
- If acceptance passes, promote the exact reviewed pair:
  - `design/openpencil/LexiGo Design System.op` — active visual/editor source;
  - `design/openpencil/LexiGo Design Tokens.json` — active lossless token graph/provenance source.
- Because the reviewed `.op` is 6.45 MB, a temporary owner-only branch workflow may be used to reproduce and commit the exact accepted artifacts. It must be removed before merge and must never land on `main`.
- Update design source hierarchy and add fail-closed drift contracts.
- Record factual progress in `.agents/current/**`.

## Non-goals

- No LexiGo production React/CSS/backend/runtime change.
- No Stage/prod deployment.
- No public OpenPencil deployment or MCP exposure yet.
- No mutation of `design/figma/LexiGo Design System.fig`.
- No blind snapshot/baseline refresh.
- No ZSeven OpenPencil version upgrade in this slice; v0.8.2 remains the validated editor/migration toolchain.
- `open-pencil/open-pencil` is permitted only as a read-only native `.fig` variable extractor; it does not replace ZSeven as the selected AI-first editor.
- No claim that ZSeven v0.8.2 natively preserves Figma variable aliases or imported node→variable bindings; unsupported relationships must remain explicit in the token sidecar/workflow rather than be silently flattened.
- No completion claim for Onboarding/First Use, whose canonical design coverage is still incomplete.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `.agents/PROJECT_STATE.md` only after promotion evidence is complete
- `scripts/figma/openpencil-visual-acceptance.sh`
- `scripts/figma/extract-figma-variables.mjs`
- `scripts/figma/compile-openpencil-tokens.py`
- `scripts/figma/openpencil-token-migration.sh`
- `.github/workflows/openpencil-visual-acceptance.yml`
- `.github/workflows/openpencil-source-promotion.yml` TEMPORARY only; must be deleted before merge
- `docs/figma/openpencil-source-promotion.request` TEMPORARY only; must be deleted before merge
- `docs/figma/openpencil-ai-workflow.md`
- `docs/figma/openpencil-screen-map.json`
- `design/openpencil/LexiGo Design System.op` only after manual acceptance
- `design/openpencil/LexiGo Design Tokens.json` only after token acceptance

## Prohibited paths

- `design/figma/LexiGo Design System.fig`
- `frontend/**`
- `backend/**`
- `deploy/**`
- existing visual baselines/snapshots

## Canonical acceptance inventory

- Home: mobile Dark Figma `196:223` -> OpenPencil `fig_2287`; desktop Light `194:249` -> `fig_2338`.
- Learn Composer production slice: mobile recommended `202:6` -> `fig_6826`; mobile manual `203:5` -> `fig_6749`; desktop full `204:2` -> `fig_6621`.
- Active Lesson: mobile Recall/Default `75:6` -> `fig_3247`; Recall/Correct `75:30` -> `fig_3220`; Recall/Offline `75:57` -> `fig_3193`; Choice/Incorrect `75:89` -> `fig_3162`; desktop Study/Light `75:120` -> `fig_3132`; Recall/Correct `75:150` -> `fig_3104`.
- Progress: mobile Light `76:6` -> `fig_3730`; mobile Dark `76:53` -> `fig_3683`; desktop Light `76:154` -> `fig_3564`.
- Dictionary: mobile Light `78:54` -> `fig_4008`; desktop Light `78:193` -> `fig_3833`.
- Word Detail: mobile Dark `78:99` -> `fig_3982`; desktop Dark `78:274` -> `fig_3780`.
- Phrases: `255:10` -> `fig_7281`; `257:2` -> `fig_7210`; `255:81` -> `fig_7099`; `257:74` -> `fig_6985`.
- Phrase Detail: `255:55` -> `fig_7255`; `257:47` -> `fig_7184`; `255:162` -> `fig_7046`; `257:159` -> `fig_6932`.
- Profile: mobile Light `79:6` -> `fig_4305`; desktop Light `79:129` -> `fig_4157`.
- System states: Home Loading `79:69` -> `fig_4258`; Dictionary Empty `79:93` -> `fig_4234`; Error `79:117` -> `fig_4222`; desktop Offline `79:194` -> `fig_4104`.
- Foundations wrapper `fig_858`; Components wrapper `fig_1083`; Interaction Components wrapper `fig_1175`.

The mapping is based on the repository canonical page/node handoff plus exact imported page, frame name, dimensions and matrix ordering. Legacy Figma IDs are provenance only; `fig_*` becomes the OpenPencil-side address after promotion.

## Invariants

- Archived `.fig` remains SHA-256 `cb123c20cd341b0ada2caeff249c1fbba933c7b31affe365ea05ad3057b2c423`, size `1,191,055`.
- Original deterministic candidate `.op` remains SHA-256 `ca0f0492e235ebf3b159dd320cc3c4fb61f550f20e2a42f80140f1cfc30a639c`, size `2,309,061`.
- Accepted tokenized `.op` is SHA-256 `5380a0468d4e369d91ac190b829e01f60ff43493f6a76c9300c6b58d0b34d664`, size `6,446,726`.
- Accepted lossless token sidecar is SHA-256 `e603d86f3d4ef470c39fd72c31433e6a124bb9371da6f333567cd3aa796ae05c`, size `82,487`.
- ZSeven OpenPencil is pinned to v0.8.2 and the verified Linux CLI/desktop assets used by the successful acceptance run.
- Native Figma variable extraction is read-only and pinned to published `@open-pencil/core@0.13.2`; npm dist integrity is `sha512-/EIOMDUlpWtTneuwMj7DQfz39i6pOnPlQB5UIOIiEZZ2TLZIiRkKQQVeAsMjs3aFbyA/oYmc1pRhC8PEAl6Kow==`.
- Native token inventory is exactly 6 collections / 92 variables: 43 COLOR, 48 FLOAT, 1 STRING; 40 alias references; 0 unresolved aliases; 0 incomplete mode values.
- ZSeven runtime variables use globally unique collection-namespaced keys; Figma alias relationships remain losslessly recorded in `LexiGo Design Tokens.json` and compile to resolved ZSeven scalar/themed values.
- Token-layer application may normalize floating-point serialization only within `1e-7`; accepted run #14 observed 186 numeric normalizations with maximum drift `2.8610229518832853e-08` and no non-numeric semantic difference.
- Token-layer application must preserve the accepted 20 render hashes exactly.
- Linux-rendered evidence must come from a specific artifact and be manually reviewed before promotion. Run #14 / artifact `9257099175` was manually reviewed and accepted.
- Temporary promotion workflow/marker must be absent from the final PR head.
- Any material visual/semantic drift blocks promotion rather than being normalized by changing evidence.

## Required checks

- Candidate identity and 23-page structural validation.
- OpenPencil headless server readiness.
- Canonical `fig_*` node inventory/name/type/dimensions.
- Linux PNG exports for representative mobile and desktop canonical states.
- PNG magic, IHDR dimensions and SHA-256 evidence manifest.
- Isolated-copy editability probe with source candidate unchanged.
- Native `.fig` variable extraction: 6 collections, 92 variables, complete modes/values, 40 resolved alias links.
- Deterministic token compiler with cycle/collision/ambiguous-mode rejection.
- Official ZSeven `themes:set` / `vars:set` application and reopen validation: 92 variables, expected axes.
- Tokenized `.op` semantic page-tree equality against the original candidate (`1e-7` numeric tolerance only).
- Tokenized vs original 20-screen render-hash equality.
- Committed `.op` and token sidecar must byte-match deterministic regenerated outputs in permanent CI.
- Dedicated path-scoped CI artifact.
- Full immutable-head repository CI before merge.
- Review/thread audit and expected-head merge guard.

## Rollback

If promotion or final immutable-head validation fails, remove the promoted `.op`/sidecar from the branch, preserve the immutable `.fig`, #550 import gate and factual failure evidence, and keep PR #553 Draft until the blocking discrepancy is resolved.
