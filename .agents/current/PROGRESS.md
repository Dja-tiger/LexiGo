# Current Task Progress

## 2026-08-18 13:18 +03:00

### Verified

- Live `main` is `f1cfa074ffe25db6e253b60b6b3c5970ba8dda03`; #587 delivery/reconciliation is complete and no open PR remains.
- Issue #593 is open, High priority, parent #205, with no existing branch or PR.
- `appearance-preference.ts` already resolves Auto from `prefers-color-scheme` and applies both `data-lexigo-appearance` and `data-lexigo-resolved-appearance` synchronously/bootstrap and at runtime.
- `design-tokens.css` is Light-first and switches semantic `--ak-*` tokens under system Dark.
- `appearance.css` currently applies semantic `html/body` canvas only for explicit `data-lexigo-appearance="light|dark"`, leaving Auto/system-Light exposed to the legacy dark `globals.css` body gradient.
- `profile.css` uses semantic `--ak-*` tokens for current Profile surfaces but its legacy account/security Light compatibility selectors are explicit-Light-only.
- Existing canonical Profile visual tests cover explicit Light/Dark at 390×844 and 1440×1024, not the real 430px Auto/system state.

### Finding

The regression is an ownership mismatch, not a Profile component color bug: resolved semantic children can be Light while document and legacy compatibility owners still key off explicit preference.

### Root cause

CSS presentation selectors use `data-lexigo-appearance` where the runtime truth for rendered palette is `data-lexigo-resolved-appearance`.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

### Checks passed

- Live main/open-PR/branch preflight.
- Code-level ownership inspection for appearance runtime, document canvas, Profile CSS and existing visual contracts.

### Checks failed

None yet; implementation has not started.

### Current branch head

Resolve from live branch ref after harness initialization.

### Next action

Implement the smallest resolved-appearance CSS ownership repair, add source/browser regression contracts, then run fail-closed 430px visual evidence before approving any new fingerprint.
