# LexiGo AI design workflow with ZSeven OpenPencil

Status: candidate migration architecture under Issue #550. This document does not promote the generated `.op` file to production design source until import evidence and visual parity are reviewed.

## Decision

LexiGo evaluates [`ZSeven-W/openpencil`](https://github.com/ZSeven-W/openpencil) as the AI-first replacement for day-to-day Figma editing.

The selected probe is pinned to OpenPencil `v0.8.2`.

This is intentionally different from the similarly named `open-pencil/open-pencil` project. The primary requirement for LexiGo is agent-driven design work rather than native Figma round-trip as the dominant workflow.

## Why ZSeven OpenPencil fits the target workflow

OpenPencil v0.8.x provides the pieces needed for an AI-controlled design source:

- `.op` is JSON-based, human-readable and Git-friendly;
- `op` CLI can manipulate design documents from automation;
- `op start --headless --file design.op` provides a file-backed headless mode;
- the built-in MCP layer supports external agent workflows;
- Codex is a supported agent/skill target;
- the layered design workflow separates `design_skeleton`, `design_content` and `design_refine`;
- multi-page documents, design variables, components and code generation are first-class concepts;
- Figma `.fig` import is implemented by the Rust `op-figma` converter;
- v0.8.2 specifically expands Figma fidelity for component backing data, instance properties/overrides/swaps, authored geometry, masks, blend modes, image transforms/tiling, text metrics and page backgrounds.

The repository does not assume that these features imply pixel-perfect parity. Visual validation remains mandatory before source-of-truth promotion.

## Current source identities

### Figma archive

- Cloud file key: `3xXmBWnf38jbvLjtziwber`
- Repository file: `design/figma/LexiGo Design System.fig`
- Git LFS / SHA-256: `cb123c20cd341b0ada2caeff249c1fbba933c7b31affe365ea05ad3057b2c423`
- Size: `1,191,055` bytes

During Issue #550 this file is immutable migration input.

### OpenPencil toolchain

- Upstream: `ZSeven-W/openpencil`
- Release: `v0.8.2`
- Linux x86_64 CLI asset: `op-cli-linux-x86_64.tar.gz`
- Asset SHA-256: `aeffb1114857e7b810e66cd9ec927fa883dde0cb3ebf0a6ee26891e2888d20a2`

The compatibility script downloads this exact release asset and rejects any digest mismatch before running the binary.

## Migration phases

### Phase 1 — import evidence

Issue #550 owns this phase.

The CI gate:

1. checks out the real Git LFS `.fig` payload;
2. verifies source size and SHA-256;
3. downloads and cryptographically verifies the pinned `op` CLI;
4. copies the `.fig` into an isolated temporary workspace;
5. runs:

   ```bash
   op import:figma "LexiGo Design System.fig" --out "LexiGo Design System.op"
   ```

6. requires OpenPencil to report `ok: true` with non-zero page/node evidence;
7. parses the generated `.op` as JSON and counts its document structure;
8. verifies the repository `.fig` identity again;
9. uploads the generated `.op` and machine-readable evidence as a GitHub Actions artifact.

The generated `.op` is evidence, not yet the canonical editable source.

### Phase 2 — visual and semantic acceptance

A follow-up slice must inspect the generated `.op` against the existing approved LexiGo design evidence.

At minimum validate:

- canonical pages and route screens are present;
- Home, Learn, Active Lesson, Progress, Dictionary, Word Detail, Phrases, Phrase Detail and Profile remain identifiable;
- compact/mobile and desktop geometry did not materially drift;
- Light/Dark token relationships remain representable;
- typography, icons, image fills, masks and vectors render acceptably;
- components/instances that matter to the design system remain editable rather than flattened beyond practical use;
- critical production mappings are re-established in `.op` terms instead of assuming Figma node IDs survive conversion unchanged.

Do not copy existing Figma IDs into the new handoff without evidence that OpenPencil preserves them as stable identifiers.

### Phase 3 — promote `.op` to editable source

Only after Phase 2 passes should a dedicated PR commit the reviewed `.op`, for example under:

```text
design/openpencil/LexiGo Design System.op
```

At that point the project can explicitly change the design source hierarchy:

1. reviewed Git-tracked `.op` — active AI/editable source;
2. repository `.fig` — immutable migration archive;
3. historical Figma Cloud file — migration/reference source while retained.

Because `.op` is JSON, design changes can then participate in ordinary Git branches, diffs, reviews and merge conflict handling.

## Self-host architecture after promotion

The recommended deployment separates the human canvas from the agent control plane.

```text
                         GitHub / Git
                              |
                  reviewed LexiGo .op source
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
                         updated .op
```

### Human-facing web host

The current Rust release line publishes:

```text
ghcr.io/zseven-w/openpencil-web:v0.8.2
```

The web service should be deployed on a separate authenticated/private origin. It must not be merged into the LexiGo application containers merely because both are web applications.

### AI control plane

The Rust Docker web image does **not** bundle Claude/Codex/OpenCode/Copilot CLI executables. Agent control therefore remains a separate integration concern.

Preferred model:

- install the pinned/approved `op` CLI on the design/agent host;
- use OpenPencil's MCP/agent integration from Codex or another supported agent;
- keep the editable `.op` inside a Git checkout/worktree;
- let the agent modify the design through OpenPencil tools rather than raw ad-hoc JSON edits when semantic design operations are available;
- commit/review design changes exactly like code changes.

A private deployment may also use OpenPencil's built-in web API-key agent profiles, but that does not replace the external Codex/MCP workflow.

## Security requirements for the later deployment

The self-host slice must define these explicitly before exposure outside localhost/private networking:

- authenticated access to the canvas origin;
- exact allowed browser origins;
- TLS termination;
- no credentials committed into Git or baked into images;
- provider credentials separated from ordinary application configuration;
- explicit network policy for any internal/custom AI provider endpoints;
- backups/versioning for the active `.op` source;
- one clear writer/locking strategy to avoid concurrent file corruption between browser/manual and agent writes.

OpenPencil's current web-host security model keeps browser-entered provider credentials in same-origin storage by default. Server-side shared credential persistence is an explicit trusted-private-deployment choice, not the default architecture for LexiGo.

## CI owner

- Script: `scripts/figma/openpencil-ai-import.sh`
- Workflow: `.github/workflows/openpencil-ai-import.yml`
- Issue: #550

The CI import gate is intentionally independent of Figma Cloud and the connected Figma MCP quota.

## What Issue #550 proves

If the gate passes, it proves:

- the exact repository `.fig` can be decoded by pinned ZSeven OpenPencil v0.8.2;
- a syntactically valid, structurally non-empty `.op` can be produced;
- the source `.fig` is not mutated;
- the resulting `.op` is available for manual/visual review.

It does **not** prove:

- pixel-perfect parity with every Figma frame;
- stable preservation of existing Figma node IDs;
- complete prototype interaction parity;
- production readiness of the future self-host service;
- safe concurrent editing by several writers.
