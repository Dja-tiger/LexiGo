# Current Task Execution

## Task

- Issue: #201.
- Branch: `design/issue-201-first-use-openpencil`.
- Base SHA: `14558e726cb64c59b21437832bef3c6277c978b6`.
- Runtime: ZSeven OpenPencil v0.8.2 in GitHub Actions Linux runners.

## Pre-flight

Read and reconciled before implementation writes:

- root `AGENTS.md`;
- `.agents/AGENTS.md` and base rules;
- `.agents/SKILLS.md`;
- `docs/agent-harness.md`;
- live `main`, open PR state, Issue #201 and its design/backend comments;
- promoted OpenPencil source contract and screen map;
- merged OpenPencil v0.8.2 MCP/self-test implementation;
- upstream v0.8.2 MCP schemas for semantic copy/update/batch/screenshot operations.

At task start:

- `main = 14558e726cb64c59b21437832bef3c6277c978b6`;
- no open PRs;
- branch was created from exact `main`;
- #554 persistent self-host deployment was closed `not planned` after owner decision to continue CI-native OpenPencil operation;
- #201 is the only selected atomic product-design slice.

## Issue contract

The design follows delivered backend #18 semantics: `not_started`, `in_progress`, `completed`, `skipped`; self-mark `known / unsure / new` occurs before reveal; diagnostic selection is bounded to 12; skip does not mutate scheduler state.

Existing Figma-derived mobile onboarding Light remains `fig_4282` on `figma-page-17`. The missing production states were added as OpenPencil-native roots on the same page.

## CI-native OpenPencil execution evidence

### Inspection

- workflow run `31942263196` passed;
- artifact `9262334442`, digest `sha256:d90f3a0246f99bc296055bc1f0c9f02cdba54985528f4addbb3fbaf14035b908`;
- resolved `fig_4282` onboarding, `fig_4258` Home loading, `fig_4222` error, `fig_4157` desktop profile, `fig_4104` desktop offline and supporting First Use pattern nodes;
- source remained byte-identical to pre-edit SHA.

### Preview

- workflow run `31942476320` passed;
- artifact `9262389740`;
- OpenPencil semantic `insert_node` created 40 canonical mobile/desktop Light/Dark First Use states on a disposable copy;
- generated preview SHA `14093098dc988c59f351390bcef0dd23e45df91a9ca473d7e54759856ed76ec8`;
- visual review found actual layout defects in mobile Diagnostic Resume plus desktop Guest Home and desktop onboarding.

### Repair

- workflow run `31942692887` passed;
- artifact `9262446242`, digest `sha256:6de5d637269f7445d857e15b271b75ec35188372061c5c7d7aa968bfefd6baf0`;
- semantic `update_node` repaired the identified layout defects;
- repaired exact `.op` SHA `6d73b785aaeb7dda35a53c9c5f16edfc9cbef1092dbce992183538f16505520e`;
- repaired screenshots were manually reviewed before promotion.

### Promotion

Two fail-closed promotion attempts stopped before commit on workflow mechanics only: one missing cross-step Compose env and one whitespace-unsafe path check. Both had already reopened the exact reviewed design through real OpenPencil v0.8.2 and verified representative new nodes.

Final commit workflow run `31942908405` passed and committed only `design/openpencil/LexiGo Design System.op` as bot commit `4cedeb541686e81d9c4a401378c4eaa8f0038b21`.

Current active design identity:

- SHA `6d73b785aaeb7dda35a53c9c5f16edfc9cbef1092dbce992183538f16505520e`;
- 6,937,300 bytes;
- 23 pages;
- 7,983 recursive nodes;
- 92 OpenPencil variables;
- token sidecar unchanged.

## Stable First Use node inventory

All 40 roots are recorded in `docs/figma/openpencil-screen-map.json` under `activeScreens`. Representative stable IDs:

- imported onboarding Mobile Light: `fig_4282`;
- Guest Home Mobile Light: `n2`;
- Diagnostic pre-reveal Mobile Light: `n21`;
- Diagnostic reveal Mobile Light: `n42`;
- Diagnostic resume Mobile Light: `n62`;
- Skip confirm Mobile Light: `n85`;
- Complete Mobile Light: `n105`;
- Onboarding Desktop Light: `n299`;
- Guest Home Desktop Light: `n321`;
- Diagnostic resume Desktop Light: `n378`;
- Complete Desktop Dark: `n599`;
- Loading Desktop Dark: `n614`.

## Permanent acceptance correction

The previous permanent workflow incorrectly required the committed active `.op` to stay byte-equal to the initial tokenized Figma migration output forever. That would make legitimate post-promotion OpenPencil edits impossible.

The corrected fail-closed contract keeps both guarantees:

1. reproduce the immutable Figma/tokenized migration baseline at SHA `5380a0468d4e369d91ac190b829e01f60ff43493f6a76c9300c6b58d0b34d664` and keep token sidecar regeneration exact;
2. independently validate the committed active `.op` against its reviewed SHA/size, combined `screens + activeScreens` structure, Linux renders, 92 variables and isolated editability probe.

No migration evidence is weakened and CI cannot silently replace the active source from Figma.

## Validation ladder remaining

remove temporary branch-only workflows → open Draft PR → permanent OpenPencil acceptance + full repository CI → inspect final active evidence artifact → review/path/thread audit → Ready/squash merge → exact-main verification and harness reconciliation.
