# Current Task Progress

## 2026-08-16 Europe/Moscow

### Identity

- Issue: #552.
- Draft PR: #553.
- Branch: `agent/issue-552-openpencil-visual-acceptance`.
- Exact base/main SHA at task start: `e7d992ad6089aa6445017ea6ffff6280787b05d8`.
- Issue #550 / PR #551 are complete and provide the deterministic native `.fig -> .op` import boundary.

### Promoted source identities

Active visual/editor source:

- `design/openpencil/LexiGo Design System.op`
- SHA-256 `5380a0468d4e369d91ac190b829e01f60ff43493f6a76c9300c6b58d0b34d664`
- size `6,446,726`
- 23 pages
- 7,341 recursive nodes
- 83 nodes marked reusable
- 92 OpenPencil runtime variables
- 2 theme axes

Active lossless token/provenance source:

- `design/openpencil/LexiGo Design Tokens.json`
- SHA-256 `e603d86f3d4ef470c39fd72c31433e6a124bb9371da6f333567cd3aa796ae05c`
- size `82,487`
- 6 Figma collections
- 92 variables: 43 COLOR / 48 FLOAT / 1 STRING
- 40 alias references
- 0 unresolved aliases
- 0 incomplete mode values

Archive source remains unchanged:

- `design/figma/LexiGo Design System.fig`
- SHA-256 `cb123c20cd341b0ada2caeff249c1fbba933c7b31affe365ea05ad3057b2c423`
- size `1,191,055`

### Canonical OpenPencil mapping

`docs/figma/openpencil-screen-map.json` records production Figma provenance -> imported OpenPencil `fig_*` identities for Home, Learn, Active Lesson, Progress, Dictionary, Word Detail, Phrases, Phrase Detail, Profile and system states.

Representative examples:

- Home mobile Dark `196:223` -> `fig_2287`; desktop Light `194:249` -> `fig_2338`.
- Learn recommended mobile `202:6` -> `fig_6826`; desktop full `204:2` -> `fig_6621`.
- Dictionary mobile `78:54` -> `fig_4008`; desktop `78:193` -> `fig_3833`.
- Profile mobile `79:6` -> `fig_4305`; desktop `79:129` -> `fig_4157`.
- Dictionary Empty `79:93` -> `fig_4234`; desktop Offline `79:194` -> `fig_4104`.

Legacy Figma IDs are provenance only. OpenPencil-side AI work uses `fig_*` nodes.

### Visual/editability acceptance

Authoritative pre-promotion evidence:

- OpenPencil visual acceptance run #14 / run `31923451381`.
- artifact id `9257099175`.
- artifact digest `sha256:8b3b4b60b05382327e5346a1c896f8e5d47c3f0a2081986c156abc2776187692`.
- 32 mapped canonical screens validated structurally.
- 20 allow-listed Linux canonical screens rendered.
- tokenized/original render inventory exact match.
- exact width/height/SHA-256 match for all 20 rendered screens.
- manual review of this specific Linux artifact completed; expected LexiGo Home/Learn/Lesson/Progress/Dictionary/Word/Phrases/Profile/system-state layouts are visually coherent.
- editability probe passed: text node changed/read back/persisted on a disposable `.op` copy while the candidate remained unchanged.

This is not a new live-Figma screenshot comparison; Figma Cloud/MCP remains outside the acceptance path.

### Native token recovery and limitations

ZSeven v0.8.2 Figma import intentionally produces no imported `themes`/`variables`; inspected v0.8.4 has the same importer gap. The native token layer is recovered read-only using published `@open-pencil/core@0.13.2`.

Pinned extractor evidence:

- npm dist integrity `sha512-/EIOMDUlpWtTneuwMj7DQfz39i6pOnPlQB5UIOIiEZZ2TLZIiRkKQQVeAsMjs3aFbyA/oYmc1pRhC8PEAl6Kow==`.
- container `mcr.microsoft.com/playwright@sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e`.
- native extraction evidence SHA `438f494f892dfe8df0606e31557e30b5936b988b1a7a4f8ae4a0ea9d97308a2a`.

`compile-openpencil-tokens.py` compiles globally unique collection-namespaced runtime variables and two theme axes. ZSeven v0.8.2 cannot store variable-to-variable aliases, so aliases are resolved for runtime while the full alias graph remains lossless in `LexiGo Design Tokens.json`.

ZSeven v0.8.2 also does not preserve imported node->variable bindings. Existing imported nodes therefore keep concrete visual values; the recovered token layer is available to AI/new edits. No stronger claim is made.

### Token migration acceptance

Official ZSeven `themes:set` / `vars:set` APIs successfully persist the compiled layer.

Accepted tokenized `.op` facts:

- 92 variable readback.
- 2 theme-axis readback.
- semantic page tree unchanged.
- OpenPencil save normalized 186 floating-point values only.
- maximum absolute numeric drift `2.8610229518832853e-08`, below fail-closed tolerance `1e-7`.
- no non-numeric ID/name/type/text/order drift found.
- 20 tokenized render hashes exactly equal original accepted render hashes.

### Source promotion

A temporary owner-only promotion bootstrap was used because the accepted `.op` is 6.45 MB and impractical to send inline through the Contents API.

Promotion run:

- workflow run `31923693670`.
- one-shot authorization, executable script blob identities, native `.fig`, npm integrity and all generated output SHA/size gates passed.
- exact reviewed source pair was committed by GitHub Actions at branch commit `5f2c663d32ff9abb492bbf0c30f8ee13525c9482`.

The temporary write-enabled workflow and authorization marker were deleted immediately afterward. They are absent from the current PR changed-file list and permanent acceptance CI explicitly rejects their reintroduction.

### Permanent fail-closed CI

`.github/workflows/openpencil-visual-acceptance.yml` now:

1. regenerates the base `.op` from the immutable `.fig`;
2. renders original canonical screens;
3. extracts all 92 native variables read-only;
4. compiles/apply the lossless token bridge through official ZSeven APIs;
5. re-renders tokenized canonical screens and requires exact 20-screen hashes;
6. requires committed `.op` and token sidecar accepted SHA/size;
7. requires committed `.op` byte-equal regenerated tokenized `.op`;
8. requires committed token sidecar byte-equal regenerated provenance output;
9. rejects any temporary promotion bootstrap/marker.

### Documentation

`docs/figma/openpencil-ai-workflow.md` now defines the source hierarchy:

1. `.op` — active visual/editor source;
2. token sidecar — active lossless token/provenance source;
3. `.fig` — immutable migration archive;
4. Figma Cloud — historical/reference source while retained.

### Process interruption and recovery

One earlier progress-file write was rejected by connector safety before any repository change. Writes were stopped, `main`/target file re-read, exact schema reloaded, and the retry succeeded. No repository corruption occurred.

### Current validation state

Promotion evidence is complete. The branch still needs final immutable-head validation after documentation/CI changes:

- dedicated OpenPencil visual acceptance must be green on final head;
- full repository CI must be green on the same final head;
- PR review/thread audit must show no unresolved blocker;
- then PR #553 may be marked Ready and merged with expected-head guard.
