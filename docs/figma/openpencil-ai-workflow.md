# LexiGo AI design workflow with ZSeven OpenPencil

Status: promoted AI-native design workflow under Issue #552 / PR #553; CI-native day-to-day editing confirmed by owner decision on 2026-08-16.

## Decision

LexiGo uses [`ZSeven-W/openpencil`](https://github.com/ZSeven-W/openpencil) as the day-to-day AI-first design editor/control surface.

The validated editor/import toolchain is pinned to OpenPencil `v0.8.2`. The similarly named `open-pencil/open-pencil` project is **not** the primary editor; its published `@open-pencil/core@0.13.2` parser is used only as a read-only native `.fig` variable extractor because ZSeven v0.8.2 does not import Figma variables.

The primary operating requirement is agent-driven design work through `op`/MCP with Git review, not continued dependence on Figma Cloud or Figma MCP quota. Persistent self-hosting is optional: the accepted default execution environment for AI design sessions is an ephemeral GitHub Actions Linux runner using the pinned OpenPencil image/toolchain.

## Source-of-truth hierarchy

### 1. Active visual/editor source

```text
design/openpencil/LexiGo Design System.op
```

Current reviewed identity after Issue #201 First Use design work:

- SHA-256: `6d73b785aaeb7dda35a53c9c5f16edfc9cbef1092dbce992183538f16505520e`
- Size: `6,937,300` bytes
- 23 pages
- 7,983 recursive design nodes
- 83 imported nodes marked reusable
- 92 OpenPencil runtime variables
- 2 OpenPencil theme axes

This is the file that OpenPencil Web, `op` CLI and MCP/Codex edit. Its accepted identity is tracked in `docs/figma/openpencil-screen-map.json` and must move only with reviewed active-source evidence.

### 2. Active token semantics/provenance source

```text
design/openpencil/LexiGo Design Tokens.json
```

Accepted identity:

- SHA-256: `e603d86f3d4ef470c39fd72c31433e6a124bb9371da6f333567cd3aa796ae05c`
- Size: `82,487` bytes
- 6 native Figma collections
- 92 variables: 43 COLOR, 48 FLOAT, 1 STRING
- 40 Figma variable-alias references
- 0 unresolved aliases
- 0 incomplete mode values

This sidecar is intentionally separate from `.op`. ZSeven v0.8.2 can persist typed/themed runtime variables but cannot represent a variable value as another variable alias. The sidecar therefore preserves the original alias graph losslessly while the `.op` contains deterministic resolved runtime values.

For token changes, the sidecar semantics and compiler contract are authoritative. Do not delete alias provenance merely because the current ZSeven runtime resolves the same value numerically.

### 3. Immutable migration archive and baseline

```text
design/figma/LexiGo Design System.fig
```

- SHA-256: `cb123c20cd341b0ada2caeff249c1fbba933c7b31affe365ea05ad3057b2c423`
- Size: `1,191,055` bytes
- Git LFS managed
- Figma Cloud file key: `3xXmBWnf38jbvLjtziwber`

The `.fig` is no longer the day-to-day editable owner after promotion. It remains the immutable migration/archive input used by fail-closed regeneration CI and as historical Figma provenance.

The deterministic tokenized migration baseline remains:

- SHA-256: `5380a0468d4e369d91ac190b829e01f60ff43493f6a76c9300c6b58d0b34d664`
- Size: `6,446,726` bytes

That identity is deliberately separate from the active `.op`. Post-promotion OpenPencil-native design work must not be forced back to byte equality with the historical Figma migration baseline.

### 4. Figma Cloud

The historical Figma Cloud file remains a reference while retained, but it is not required for ordinary AI design editing or CI. Current Figma MCP quota limitations therefore do not block the OpenPencil workflow.

## Validated migration and acceptance evidence

### Phase 1 — deterministic Figma import

Issue #550 / PR #551 established the pinned `.fig -> .op` import.

Original import candidate:

- SHA-256: `ca0f0492e235ebf3b159dd320cc3c4fb61f550f20e2a42f80140f1cfc30a639c`
- Size: `2,309,061` bytes
- 23 pages
- 7,341 recursive nodes
- zero converter warnings
- source `.fig` unchanged

Owner:

- `scripts/figma/openpencil-ai-import.sh`
- `.github/workflows/openpencil-ai-import.yml`

### Phase 2 — visual/editability acceptance

Issue #552 maps existing Figma provenance to stable imported OpenPencil `fig_*` node IDs in:

```text
docs/figma/openpencil-screen-map.json
```

`screen-map.json` now has two inventories:

- `screens`: Figma-derived migration-baseline mappings that must remain reproducible from the archive;
- `activeScreens`: reviewed OpenPencil-native/post-promotion screens that exist only in the current active `.op`.

The acceptance workflow validates exact page/name/type/geometry mapping and deterministic Linux renders. It also performs a real OpenPencil update on a disposable document copy and requires readback plus persisted file modification while the reviewed source remains unchanged.

The authoritative pre-promotion migration artifact was:

- workflow run: OpenPencil visual acceptance run #14
- artifact id: `9257099175`
- artifact digest: `sha256:8b3b4b60b05382327e5346a1c896f8e5d47c3f0a2081986c156abc2776187692`
- rendered canonical migration screens: 20
- manual review: completed

Manual review applies to that exact Linux migration artifact. Later active-source design slices carry their own Linux render evidence and must not be described as a new live-Figma screenshot comparison.

### Phase 3 — native token recovery and ZSeven compilation

ZSeven v0.8.2's Figma importer explicitly creates the imported document without Figma `themes`/`variables`. The same limitation remains in the inspected newer v0.8.4 importer, so changing versions solely to hide this gap was rejected.

Native tokens are recovered read-only from the immutable `.fig` with:

```text
scripts/figma/extract-figma-variables.mjs
```

Parser/toolchain:

- package: `@open-pencil/core@0.13.2`
- npm dist integrity: `sha512-/EIOMDUlpWtTneuwMj7DQfz39i6pOnPlQB5UIOIiEZZ2TLZIiRkKQQVeAsMjs3aFbyA/oYmc1pRhC8PEAl6Kow==`
- extraction container: `mcr.microsoft.com/playwright@sha256:dcc5531e97840b9b5e794f2814476b21571c5124a3fca2267d73041f56e7580e`

Recovered collections:

- Motion Duration — Standard / Reduced
- Primitives — Value
- Radius — Value
- Semantic Colors — Light / Dark
- Spacing — Value
- Typography Primitives — Value

The deterministic compiler is:

```text
scripts/figma/compile-openpencil-tokens.py
```

Compilation rules:

- OpenPencil variables use globally unique `<collection-slug>/<figma-variable-name>` keys;
- Figma multi-mode collections become OpenPencil theme axes;
- single-mode collections compile to scalar runtime variables;
- aliases are cycle/collision/mode checked and resolved to runtime values;
- the original alias graph remains losslessly recorded in `LexiGo Design Tokens.json`.

Token application is performed only through supported OpenPencil APIs:

```text
scripts/figma/openpencil-token-migration.sh
```

It uses `op themes:set` / `op vars:set`, reopens the saved migration candidate and requires 92 variables and 2 theme axes.

OpenPencil save normalizes some floating-point serialization. The accepted migration recorded 186 numeric normalizations with maximum absolute drift `2.8610229518832853e-08`. Semantic tree comparison allows numeric normalization only within `1e-7`; non-numeric identity/name/type/text/order changes fail.

## Permanent fail-closed CI

Owner:

```text
.github/workflows/openpencil-visual-acceptance.yml
```

The workflow now validates two independent contracts.

Migration contract:

1. resolves and verifies the archived Git LFS `.fig`;
2. reproduces the exact base ZSeven import;
3. renders the original migration screen set;
4. extracts all 92 native Figma variables read-only;
5. compiles the lossless token graph/runtime layer;
6. applies tokens through official ZSeven APIs;
7. reopens the tokenized migration document and requires 92 variables / 2 axes;
8. re-renders the same migration screens;
9. requires exact original/tokenized PNG width, height and SHA-256 equality;
10. requires the regenerated tokenized migration document to retain the accepted historical SHA/size;
11. requires the committed token sidecar to match deterministic regeneration byte-for-byte.

Active-source contract:

1. reads the reviewed active SHA/size from Screen Map;
2. merges migration `screens` with `activeScreens` for structural validation only against the committed active `.op`;
3. requires every mapped active node to exist on the expected page with exact name/type/geometry;
4. renders the selected active Linux evidence set;
5. requires all 92 OpenPencil runtime variables to remain visible;
6. repeats the isolated editability probe on a disposable copy;
7. requires the committed active source to remain byte-identical through the read/render probe.

This separation is intentional. The migration baseline proves provenance; active-source acceptance proves that reviewed OpenPencil-native development remains structurally valid and editable. CI must never silently replace the active source with a newly regenerated Figma baseline.

## Issue #201 First Use production slice

The first post-promotion AI-native production design slice is Issue #201. It adds a 40-state First Use matrix under `activeScreens`:

- Guest Home;
- role/context onboarding;
- diagnostic pre-reveal;
- diagnostic mark + reveal;
- diagnostic resume/in-progress;
- skip confirmation and skipped result;
- completion result;
- loading;
- error/retry;
- mobile/desktop and Light/Dark variants.

The existing imported `Mobile / Onboarding / Light` frame remains stable at `fig_4282`. New OpenPencil-native root IDs are stable `n*` IDs recorded in Screen Map. The diagnostic interaction follows the delivered #18 backend contract: `known / unsure / new` is selected before answer reveal, diagnostic progress can resume, and skip does not claim scheduler mutation.

## Important semantic limitation

ZSeven v0.8.2 does not preserve imported Figma node-to-variable bindings. Existing imported layers retain their concrete visual values; the recovered 92-variable layer is available to AI/manual editing for new and intentionally updated elements.

Therefore:

- do not claim that every existing imported layer is still bound to the same Figma variable;
- use the token sidecar/compiler when changing token semantics;
- when AI edits an existing element, prefer the recovered OpenPencil variable names instead of introducing arbitrary duplicate literal values;
- a future dedicated binding-reconstruction slice may rebind selected components where that provides practical value.

## Day-to-day AI workflow

The default cycle does not require a persistent design VPS:

```text
Git branch
   |
   v
GitHub Actions Linux runner
   |
   v
pinned OpenPencil v0.8.2
   |
   +--> op CLI / MCP semantic reads/writes
   +--> deterministic Linux screenshots
   |
   v
reviewed .op + Screen Map
   |
   v
permanent OpenPencil acceptance + Git PR
```

Use disposable/read-only runner sessions for discovery and preview. For a design mutation, generate the candidate on a disposable copy, review Linux render evidence, then promote exactly that reviewed artifact to the feature branch with explicit source SHA/path guards. Temporary writer workflows must be deleted before final PR acceptance.

AI should operate through OpenPencil semantic tools where available rather than performing ad-hoc raw JSON edits.

Any intentional active `.op` change must update `source.activeOpSha256`, `source.activeOpSize`, stable mapped node IDs and reviewed visual evidence. Token-sidecar identities move only when token semantics actually change. The immutable Figma migration baseline remains separately reproducible.

## Optional self-host architecture

The hardened self-host stack merged under #555 remains an optional fallback for a persistent human canvas or long-lived MCP session. It is not required for normal AI development after the owner decision to continue with CI-native OpenPencil execution.

If self-hosting is enabled later, preserve the same constraints: authenticated browser access, TLS, exact origins, no provider credentials in Git, backups, single-writer locking and non-public MCP access. Self-hosting must not replace Git/PR review or the permanent CI acceptance contracts.
