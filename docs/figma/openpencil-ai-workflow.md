# LexiGo AI design workflow with ZSeven OpenPencil

Status: promoted AI-native design workflow under Issue #552 / PR #553.

## Decision

LexiGo uses [`ZSeven-W/openpencil`](https://github.com/ZSeven-W/openpencil) as the day-to-day AI-first design editor/control surface.

The validated editor/import toolchain is pinned to OpenPencil `v0.8.2`. The similarly named `open-pencil/open-pencil` project is **not** the primary editor; its published `@open-pencil/core@0.13.2` parser is used only as a read-only native `.fig` variable extractor because ZSeven v0.8.2 does not import Figma variables.

The primary operating requirement is agent-driven design work through `op`/MCP with Git review, not continued dependence on Figma Cloud or Figma MCP quota.

## Source-of-truth hierarchy

### 1. Active visual/editor source

```text
design/openpencil/LexiGo Design System.op
```

Accepted identity:

- SHA-256: `5380a0468d4e369d91ac190b829e01f60ff43493f6a76c9300c6b58d0b34d664`
- Size: `6,446,726` bytes
- 23 pages
- 7,341 recursive design nodes
- 83 imported nodes marked reusable
- 92 OpenPencil runtime variables
- 2 OpenPencil theme axes

This is the file that OpenPencil Web, `op` CLI and the future MCP/Codex control plane should edit.

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

### 3. Immutable migration archive

```text
design/figma/LexiGo Design System.fig
```

- SHA-256: `cb123c20cd341b0ada2caeff249c1fbba933c7b31affe365ea05ad3057b2c423`
- Size: `1,191,055` bytes
- Git LFS managed
- Figma Cloud file key: `3xXmBWnf38jbvLjtziwber`

The `.fig` is no longer the day-to-day editable owner after promotion. It remains the immutable migration/archive input used by fail-closed regeneration CI and as historical Figma provenance.

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

The acceptance workflow validates exact page/name/type/geometry mapping and renders 20 representative Linux canonical screens covering Home, Learn, Active Lesson, Progress, Dictionary, Word Detail, Phrases, Phrase Detail, Profile and shared states.

It also performs a real `op update` on a disposable document copy and requires readback plus persisted file modification while the reviewed source remains unchanged.

The authoritative pre-promotion acceptance artifact was:

- workflow run: OpenPencil visual acceptance run #14
- artifact id: `9257099175`
- artifact digest: `sha256:8b3b4b60b05382327e5346a1c896f8e5d47c3f0a2081986c156abc2776187692`
- rendered canonical screens: 20
- manual review: completed

Manual review applies to this exact Linux artifact. It is not a new live-Figma screenshot comparison and must not be described as such.

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

It uses `op themes:set` / `op vars:set`, reopens the saved `.op` and requires 92 variables and 2 theme axes.

OpenPencil save normalizes some floating-point serialization. The accepted migration recorded 186 numeric normalizations with maximum absolute drift `2.8610229518832853e-08`. Semantic tree comparison allows numeric normalization only within `1e-7`; non-numeric identity/name/type/text/order changes fail.

## Permanent fail-closed CI

Owner:

```text
.github/workflows/openpencil-visual-acceptance.yml
```

The workflow:

1. resolves and verifies the archived Git LFS `.fig`;
2. reproduces the exact base ZSeven import;
3. renders the original canonical screen set;
4. extracts all 92 native Figma variables read-only;
5. compiles the lossless token graph/runtime layer;
6. applies tokens through official ZSeven APIs;
7. reopens the tokenized document and requires 92 variables / 2 axes;
8. re-renders the same 20 screens;
9. requires exact original/tokenized PNG width, height and SHA-256 equality;
10. requires the committed `.op` to match the deterministic regenerated `.op` byte-for-byte;
11. requires the committed token sidecar to match the deterministic regenerated sidecar byte-for-byte;
12. rejects reintroduction of the temporary write-enabled promotion bootstrap.

This is deliberately stricter than checking only that the `.op` parses. Unexpected regeneration drift fails CI.

## Important semantic limitation

ZSeven v0.8.2 does not preserve imported Figma node-to-variable bindings. Existing imported layers retain their concrete visual values; the recovered 92-variable layer is available to AI/manual editing for new and intentionally updated elements.

Therefore:

- do not claim that every existing imported layer is still bound to the same Figma variable;
- use the token sidecar/compiler when changing token semantics;
- when AI edits an existing element, prefer the recovered OpenPencil variable names instead of introducing arbitrary duplicate literal values;
- a future dedicated binding-reconstruction slice may rebind selected components where that provides practical value.

## Day-to-day AI workflow

After self-host/MCP deployment, the intended cycle is:

```text
Git branch/worktree
       |
       v
LexiGo Design System.op + Design Tokens.json
       |
       +--> OpenPencil Web           human review/edit
       |
       +--> op CLI / MCP ----------> Codex / AI
       |
       v
reviewed design changes
       |
       v
OpenPencil CI acceptance + Git PR
```

AI should operate through OpenPencil semantic tools where available rather than performing ad-hoc raw JSON edits.

Any intentional change to the active `.op`/token pair must update the expected acceptance identities through a reviewed migration/acceptance change; simply replacing the committed artifacts until CI becomes green is not acceptable.

## Self-host architecture follow-up

The human canvas and agent control plane remain separate services.

```text
                         GitHub / Git
                              |
                active .op + token sidecar
                              |
              +---------------+---------------+
              |                               |
              v                               v
     OpenPencil web host                op CLI / MCP
     browser canvas/editor             AI control plane
              |                               |
              |                         Codex / other agent
              +---------------+---------------+
                              |
                        reviewed Git PR
```

### Human-facing web host

Validated deployment target remains the ZSeven OpenPencil web release line, initially pinned to the accepted version unless a deliberate upgrade passes the same compatibility gates.

The web service should be deployed on a separate authenticated/private origin. It must not be merged into LexiGo application containers merely because both are web applications.

### AI control plane

The web image does not imply that Codex/Claude/OpenCode CLI is embedded in the container. Agent control remains an external host/service using approved `op`/MCP integration against the Git-tracked design source.

## Security requirements for self-hosting

Before exposure outside localhost/private networking, define and validate:

- authenticated access to the canvas origin;
- TLS termination;
- exact allowed browser origins;
- no provider credentials committed to Git or baked into images;
- provider credentials separated from application configuration;
- explicit network policy for custom/internal AI providers;
- backup/versioning for `.op` and token sidecar;
- a single-writer/locking policy to prevent concurrent browser/agent file corruption;
- authenticated/non-public MCP write access.

Self-host/MCP deployment is intentionally a separate follow-up after Issue #552 promotion is merged.
