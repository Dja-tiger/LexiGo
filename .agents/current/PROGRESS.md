# Current Task Progress

## 2026-08-16

### Started #201 design slice

- Verified `main` at `14558e726cb64c59b21437832bef3c6277c978b6` with no open PRs.
- Created `design/issue-201-first-use-openpencil` from exact `main`.
- Owner decision: continue operating OpenPencil v0.8.2 in GitHub Actions; persistent VPS deployment is not required for design work.
- Closed infrastructure Issue #554 as `not planned`; merged self-host tooling remains an optional fallback.

### Contract reconstructed

Backend #18 fixes the First Use interaction semantics: `not_started / in_progress / completed / skipped`, up to 12 diagnostic items, and `known / unsure / new` self-mark before reveal. Existing mobile Light onboarding is `fig_4282` / Figma `79:46`.

### OpenPencil inspection and design generation complete

- Inspection run `31942263196` passed and resolved exact existing node/page structure without mutating source.
- Preview run `31942476320` generated 40 First Use states on a disposable source using semantic OpenPencil operations.
- Visual review identified real overlap defects in mobile resume, desktop Guest Home and desktop onboarding.
- Repair run `31942692887` fixed those defects through semantic `update_node`; repaired screenshots were reviewed.
- Exact reviewed repair artifact `9262446242` has SHA `6d73b785aaeb7dda35a53c9c5f16edfc9cbef1092dbce992183538f16505520e`.

### Reviewed source promoted

- Commit workflow run `31942908405` passed.
- Bot commit `4cedeb541686e81d9c4a401378c4eaa8f0038b21` changed only `design/openpencil/LexiGo Design System.op`.
- Active source is now 6,937,300 bytes, 23 pages, 7,983 recursive nodes and 92 OpenPencil variables.
- Token sidecar remains unchanged.
- All 40 canonical First Use roots are registered under `activeScreens` in Screen Map; representative roots include `n2`, `n21`, `n42`, `n62`, `n299`, `n321`, `n378`, `n599`, plus existing `fig_4282`.

### Permanent CI contract corrected

The old acceptance required active `.op` byte equality with the initial Figma-derived tokenized migration forever. That contradicted the promoted OpenPencil day-to-day model.

The permanent workflow now separates:

- immutable migration/token provenance — still reproduced exactly from `.fig` at historical tokenized SHA `5380a0468d4e369d91ac190b829e01f60ff43493f6a76c9300c6b58d0b34d664`;
- current active-source acceptance — exact active SHA/size, combined Screen Map structure, selected Linux renders, 92 variables and isolated editability.

`docs/figma/openpencil-ai-workflow.md` now explicitly states GitHub Actions Linux runners are the default AI design runtime and self-hosting is optional.

### Remaining gate

Delete all temporary `openpencil-issue-201-*` execution workflows, verify final path diff, open Draft PR, run permanent OpenPencil acceptance plus full repository CI on a developer-authored head, inspect the active evidence artifact, then perform review/path/thread audit and merge if green.
