# Current Task Execution

## Task

- Issue: #552
- Branch: `agent/issue-552-openpencil-visual-acceptance`
- Base SHA: `e7d992ad6089aa6445017ea6ffff6280787b05d8`
- Head SHA: resolve from live branch ref
- PR: #553 (Draft until final immutable-head gates complete)

## Instruction/harness boundary

Read before writes:

- `AGENTS.md`
- `.agents/AGENTS.md`
- all mandatory `.agents/AGENTS*.md` documents
- `.agents/SKILLS.md`
- `.agents/PROJECT_STATE.md`
- `docs/agent-harness.md`
- repository README/architecture context

Issue #552 is isolated as design-tooling/evidence work. Product runtime, frontend/backend and existing visual baselines remain out of scope.

## 1. Baseline and Issue #550 closure

Live `main` at task start: `e7d992ad6089aa6445017ea6ffff6280787b05d8`.

Verified PR #551 exact-main evidence:

- deterministic `.fig -> .op` import green;
- exact-main full CI #3594 green;
- Issue #550 closed completed.

Native archive contract:

- `design/figma/LexiGo Design System.fig`
- SHA-256 `cb123c20cd341b0ada2caeff249c1fbba933c7b31affe365ea05ad3057b2c423`
- size `1,191,055`.

Original deterministic import candidate:

- SHA-256 `ca0f0492e235ebf3b159dd320cc3c4fb61f550f20e2a42f80140f1cfc30a639c`
- size `2,309,061`
- 23 pages
- 7,341 recursive nodes
- zero converter warnings.

## 2. Canonical OpenPencil node mapping

Added:

```text
docs/figma/openpencil-screen-map.json
```

The map establishes explicit Figma provenance -> OpenPencil `fig_*` identities using imported page/name/dimensions/matrix position. Examples:

- Home mobile Dark `196:223` -> `fig_2287`; desktop Light `194:249` -> `fig_2338`.
- Learn mobile recommended `202:6` -> `fig_6826`; desktop full `204:2` -> `fig_6621`.
- Dictionary mobile `78:54` -> `fig_4008`; desktop `78:193` -> `fig_3833`.
- Phrases mobile `255:10` -> `fig_7281`; desktop `255:81` -> `fig_7099`.
- Profile mobile `79:6` -> `fig_4305`; desktop `79:129` -> `fig_4157`.

Legacy Figma IDs remain provenance only; the AI/editor side uses `fig_*` IDs.

## 3. ZSeven headless/render/editability acceptance

Added:

- `scripts/figma/openpencil-visual-acceptance.sh`
- `.github/workflows/openpencil-visual-acceptance.yml`

Pinned ZSeven v0.8.2 assets:

- CLI `op-cli-linux-x86_64.tar.gz`: SHA-256 `aeffb1114857e7b810e66cd9ec927fa883dde0cb3ebf0a6ee26891e2888d20a2`.
- Desktop/headless `openpencil-desktop-linux-x86_64.tar.gz`: SHA-256 `6edc33060611b9a2a432a4716f3d2e0e92537e7698a965e5d7a580f36b02c822`.

Observed/fixed execution defects:

1. Initial readiness check treated `op status` exit code as readiness although JSON contained `running:false`; fixed to require `running:true`.
2. Standalone CLI does not contain editor runtime; upstream source/release contract showed `op start --headless` requires separate `openpencil-desktop` via `OPENPENCIL_DESKTOP_BIN`; pinned desktop asset added.
3. `op vars` returns `variable_count` and JSON-string payload fields; acceptance parser updated to read the actual envelope rather than infer zero variables.

Authoritative visual/editability evidence:

- run #14 / GitHub run `31923451381`
- artifact id `9257099175`
- artifact digest `sha256:8b3b4b60b05382327e5346a1c896f8e5d47c3f0a2081986c156abc2776187692`
- 32 mapped canonical screens structurally validated
- 20 Linux canonical screens rendered
- manual artifact review completed
- real text update/readback/persistence probe passed on disposable copy
- candidate source remained unchanged.

The manual review does not claim new live-Figma screenshot parity; it validates this exact Linux OpenPencil artifact and repository-owned canonical mapping.

## 4. Native Figma variable recovery

Upstream ZSeven v0.8.2 importer source explicitly constructs imported document with `themes: None` / `variables: None`; inspected v0.8.4 retains the same gap. This was treated as a semantic blocker rather than ignored.

Used `open-pencil/open-pencil` only as a read-only extractor via published `@open-pencil/core@0.13.2` `parseFigFile()`.

Added:

```text
scripts/figma/extract-figma-variables.mjs
```

Pinned extractor environment:

- npm integrity `sha512-/EIOMDUlpWtTneuwMj7DQfz39i6pOnPlQB5UIOIiEZZ2TLZIiRkKQQVeAsMjs3aFbyA/oYmc1pRhC8PEAl6Kow==`
- container digest `mcr.microsoft.com/playwright@sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e`.

Authoritative extraction result:

- 6 collections
- 92 variables
- 43 COLOR
- 48 FLOAT
- 1 STRING
- 40 alias references
- 0 unresolved aliases
- 0 incomplete mode values
- native extraction evidence SHA `438f494f892dfe8df0606e31557e30b5936b988b1a7a4f8ae4a0ea9d97308a2a`.

Collections:

- Motion Duration — Standard / Reduced
- Primitives — Value
- Radius — Value
- Semantic Colors — Light / Dark
- Spacing — Value
- Typography Primitives — Value

An extractor module-resolution failure occurred in an earlier run because dependencies were installed in `/extractor` while the script was executed from `/workspace`; fixed by copying the read-only script into the isolated npm workspace.

## 5. Lossless token bridge

Added:

- `scripts/figma/compile-openpencil-tokens.py`
- `scripts/figma/openpencil-token-migration.sh`

Compiler behavior:

- globally unique `<collection-slug>/<figma-variable-name>` runtime keys;
- multi-mode collections -> ZSeven theme axes;
- single-mode collections -> scalar variables;
- cycle/collision/ambiguous-mode rejection;
- Figma aliases resolved for runtime values;
- original collection/mode/alias graph retained losslessly in sidecar.

ZSeven v0.8.2 has no variable-to-variable alias scalar, therefore the sidecar is required to preserve alias semantics. ZSeven v0.8.2 also does not preserve imported node->variable bindings; existing imported elements keep concrete values. These limitations are explicitly documented and not hidden by the migration.

Official token application uses only:

- `op themes:set ... --replace`
- `op vars:set ... --replace`
- reopen/readback verification.

Accepted compile output identities:

- runtime variables SHA `eba703b954a816f5e31088f28b0a0084e728c49cd02761fd221b4bb4c6ac800a`
- runtime themes SHA `a8bb73693413bd7d978cbc8935b6a8733bbbc8e58f5903e9fab2732492561726`
- lossless token sidecar SHA `e603d86f3d4ef470c39fd72c31433e6a124bb9371da6f333567cd3aa796ae05c`.

## 6. OpenPencil persistence normalization

The first token round-trip comparator used exact deep JSON equality and failed after official ZSeven save.

Full diff inspection proved:

- 186 differences total;
- all 186 were numeric serialization normalization;
- maximum absolute drift `2.8610229518832853e-08`;
- no ID/name/type/text/order/child changes.

The gate was corrected to semantic tree equality with numeric tolerance `1e-7`; exact rendered PNG hashes remain the stronger visual guard.

## 7. Accepted tokenized source

Run #14 completed the entire pipeline:

- native import
- original 20-screen render
- native variable extraction
- token compilation
- official ZSeven token write/readback
- tokenized 20-screen render
- exact original/tokenized render hash comparison.

Accepted active `.op`:

- SHA-256 `5380a0468d4e369d91ac190b829e01f60ff43493f6a76c9300c6b58d0b34d664`
- size `6,446,726`
- 92 runtime variables
- 2 theme axes
- exact render hash equivalence for all 20 screens.

Accepted token sidecar:

- SHA-256 `e603d86f3d4ef470c39fd72c31433e6a124bb9371da6f333567cd3aa796ae05c`
- size `82,487`.

## 8. Reviewed-source promotion

The accepted `.op` is too large for a practical inline Contents API write. A temporary owner-only branch workflow was authorized in the task contract to reproduce and commit only the exact accepted source identities.

One-shot promotion controls:

- PR number/head repository/head branch/user/actor guards;
- exact authorization marker;
- exact Git blob SHA checks for all four executed scripts;
- exact native `.fig` SHA;
- exact npm package integrity;
- exact base import, compiler output, token sidecar and tokenized `.op` SHA/size checks.

Promotion workflow run:

- GitHub run `31923693670`
- conclusion success
- source-pair commit `5f2c663d32ff9abb492bbf0c30f8ee13525c9482`.

Committed paths:

```text
design/openpencil/LexiGo Design System.op
design/openpencil/LexiGo Design Tokens.json
```

Immediately after promotion:

- temporary `.github/workflows/openpencil-source-promotion.yml` deleted;
- temporary `docs/figma/openpencil-source-promotion.request` deleted;
- PR changed-file inventory rechecked and contains neither temporary file.

## 9. Permanent fail-closed drift contract

Permanent `.github/workflows/openpencil-visual-acceptance.yml` now requires:

1. exact native archive identity;
2. deterministic base import;
3. original canonical render acceptance;
4. exact 92-native-variable recovery;
5. deterministic token compilation;
6. official ZSeven token application/readback;
7. tokenized canonical re-render;
8. exact 20-screen original/tokenized width/height/SHA equality;
9. committed `.op` accepted SHA/size;
10. committed sidecar accepted SHA/size;
11. committed `.op` byte equality with regenerated tokenized `.op`;
12. committed sidecar byte equality with regenerated provenance sidecar;
13. absence of the temporary write-enabled bootstrap/marker.

Manual review attestation is tied to artifact `9257099175` / digest `sha256:8b3b4b60b05382327e5346a1c896f8e5d47c3f0a2081986c156abc2776187692`.

## 10. Documentation/source hierarchy

`docs/figma/openpencil-ai-workflow.md` now defines:

1. `design/openpencil/LexiGo Design System.op` — active visual/editor source;
2. `design/openpencil/LexiGo Design Tokens.json` — active lossless token/provenance source;
3. native `.fig` — immutable migration archive;
4. Figma Cloud — historical/reference source while retained.

Self-host OpenPencil Web + external `op`/MCP/Codex control plane remains a separate follow-up after this PR.

## Process interruption/recovery

One earlier connector safety rejection occurred while updating `PROGRESS.md`; no repository write was made. Per harness, writes were stopped, live `main` and target file were re-read, exact connector schema reloaded, then work resumed successfully.

## Remaining completion gates

Before PR #553 merge:

- dedicated OpenPencil visual acceptance green on final immutable head;
- full repository CI green on the same final immutable head;
- no unresolved review threads/blocking reviews;
- final changed-path audit;
- mark PR Ready;
- merge with `expected_head_sha` guard;
- verify exact-main post-merge acceptance/CI before closing #552 and starting self-host/MCP follow-up.
