# Current Task Progress

## 2026-08-17 Europe/Berlin

### Verified

- Live `main` is `ad404b84cd26f063fa189abac3fd4a8ca10ab4e6`.
- Runtime Stage remains healthy on `faa62cc2ea023d8e52aecc5d97c8cabe97748daf` with public browser 12/12 green.
- Audit PR #564 remains Draft/test-only on `fafec6e19f9195b73b79eb0d75a69ffd09d74b30`.
- Audit CI #3686 is green everywhere except deterministic First Use desktop visual hashes.
- Exact Linux visual artifact #9270206798 reproduced the structural desktop Resume mismatch against OpenPencil `n378/n550`.
- Issue #565 was created as the separate runtime defect required by #563.
- Branch `fix/first-use-desktop-parity` was created from exact `main`.
- Existing `first-use-route-contract.test.ts` protects First Use Light foreground WCAG AA, so Guest primary token changes are outside this defect.

### Finding

Desktop diagnostic runtime uses the compact-oriented single-panel hierarchy: progress track + title/copy + nested term card. Approved desktop diagnostic states use a separate step/title intro followed by one diagnostic surface with the prompt and controls directly inside it.

`DiagnosticPrompt` has no example-sentence field, so the OpenPencil demonstration sentence cannot be copied into production. Server-owned `topic` remains the truthful dynamic context.

### Root cause

The runtime implementation correctly delivered the #18 state machine but reused one presentation hierarchy across compact and desktop. The original runtime visual approval proved deterministic rendering but did not establish exact route-level OpenPencil structural parity at canonical 1440×900; #563 exposed the mismatch.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`

### Checks passed

- Pre-flight and repository harness read completed.
- Branch/ref isolation verified.
- `main` remained unchanged after first branch write.
- Existing accessibility token source contract reviewed.

### Checks failed

- No #565 implementation checks run yet.
- #564 CI #3686 Visual regression remains intentionally red pending the separate runtime fix and later audit rebase.

### Current branch head

Resolve from live branch ref after each write; latest verified before this log update: `50a3f32ecceae624159140d50dc5b2f9b0639a1a`.

### Next action

Implement the smallest desktop diagnostic DOM/CSS hierarchy change, strengthen the existing First Use source contract, then run immutable-head CI and inspect its exact Linux visual artifact before any fingerprint change.
