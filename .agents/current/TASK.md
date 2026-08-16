# Current Task

## Identity

- Issue: #552
- Branch: `agent/issue-552-openpencil-visual-acceptance`
- Base SHA: `e7d992ad6089aa6445017ea6ffff6280787b05d8`
- Head SHA: resolve from live branch ref after each write
- PR: pending

## Objective

Visually and semantically validate the deterministic `ZSeven-W/openpencil` v0.8.2 conversion of the repository-owned Figma archive and promote the reviewed `.op` as the active AI-native design source only if the acceptance evidence passes.

## Scope

- Reproduce the exact #550 candidate `.op` and require SHA-256 `ca0f0492e235ebf3b159dd320cc3c4fb61f550f20e2a42f80140f1cfc30a639c` before review.
- Establish an explicit canonical Figma-node -> OpenPencil `fig_*` mapping for production-relevant screens.
- Start the pinned OpenPencil file-backed headless server and export representative canonical nodes to Linux PNG evidence.
- Validate exported PNG dimensions, hashes and semantic node metadata.
- Verify practical editability on an isolated copy; never mutate the archived `.fig` or the review candidate while probing.
- Upload a machine-readable acceptance manifest and rendered evidence from CI.
- Manually inspect the specific Linux artifact before any source-of-truth promotion.
- If acceptance passes, add `design/openpencil/LexiGo Design System.op`, update the design source hierarchy and add a fail-closed drift contract.
- Record factual progress in `.agents/current/**`.

## Non-goals

- No LexiGo production React/CSS/backend/runtime change.
- No Stage/prod deployment.
- No public OpenPencil deployment or MCP exposure yet.
- No mutation of `design/figma/LexiGo Design System.fig`.
- No blind snapshot/baseline refresh.
- No OpenPencil version upgrade in this slice; v0.8.2 remains the validated migration toolchain.
- No completion claim for Onboarding/First Use, whose canonical design coverage is still incomplete.

## Allowed paths

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`
- `.agents/PROJECT_STATE.md` only after promotion evidence is complete
- `scripts/figma/openpencil-visual-acceptance.sh`
- `.github/workflows/openpencil-visual-acceptance.yml`
- `docs/figma/openpencil-ai-workflow.md`
- `docs/figma/openpencil-screen-map.json`
- `design/openpencil/LexiGo Design System.op` only after manual acceptance

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
- Candidate `.op` before any review/edit probe remains SHA-256 `ca0f0492e235ebf3b159dd320cc3c4fb61f550f20e2a42f80140f1cfc30a639c`, size `2,309,061`.
- OpenPencil is pinned to `ZSeven-W/openpencil` v0.8.2 and the Linux x86_64 CLI archive digest from #550.
- Linux-rendered evidence must come from a specific artifact and be manually reviewed before promotion.
- Any material visual/semantic drift blocks promotion rather than being normalized by changing evidence.

## Required checks

- Candidate identity and 23-page structural validation.
- OpenPencil headless server readiness.
- Canonical `fig_*` node inventory/name/type/dimensions.
- Linux PNG exports for representative mobile and desktop canonical states.
- PNG magic, IHDR dimensions and SHA-256 evidence manifest.
- Isolated-copy editability probe with source candidate unchanged.
- Dedicated path-scoped CI artifact.
- Full immutable-head repository CI before merge.
- Review/thread audit and expected-head merge guard.

## Rollback

If render/editability acceptance fails, do not commit or promote the `.op`. Preserve the immutable `.fig`, the #550 import gate and the factual failure evidence, then reassess OpenPencil/version/migration strategy in a separate slice.
