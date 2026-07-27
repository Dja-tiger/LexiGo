# Current Task Progress

## 2026-07-27 12:48 Europe/Berlin

### Verified

- Live `main` is `2d8347d61ffeee173f5eab02b9c2bea29f1fe7b4`.
- Issue #250 is open; no product PR was open at pre-flight.
- Branch `perf/issue-250-home-island` resolves from the exact base even though branch search did not list it.
- Mandatory Agent Harness, architecture, Home Figma handoff, Progress island lessons, bundle budget contracts and live Issue/PR state were read before writes.
- Stage runtime remains exact product SHA `a617dfce331700d0b3e911726d52a2683f18d526`, run `30256018000`, with deploy/public smoke/public browser success and 12/12 checks.

### Finding

Home was still rendered inside `LexigoPremiumApp`. Primary navigation to `/` therefore used the monolithic popstate graph, and starting/resuming from a future Home island would otherwise expose the existing saved-lesson confirmation gate.

### Root cause

The bootstrap route graph distinguished only Dictionary versus Product. Home had no dedicated dynamic entry, no Home-aware graph handoff and no narrowly scoped transient intent to invoke the existing Active Lesson resume action.

### Changed files

Implementation prepared for the first atomic branch commit:

- dedicated `LexigoHomeApp`;
- Home/dictionary/product graph selection and canonical handoff;
- transient `resume=1` unit contract and existing-action bridge;
- source ownership and Playwright route-island contracts;
- production-root and architecture documentation;
- current task memory.

### Checks passed

- Exact source review against `main` and branch refs.
- Local TypeScript/TSX syntax transpilation for every changed source and test file.
- Static ownership marker verification for Home, bootstrap and one-time intent boundaries.

### Checks failed

- Local repository clone/download is unavailable because the isolated execution container cannot resolve `github.com`; no repository mutation resulted.
- Full frontend commands cannot run locally without the repository dependency tree. GitHub Actions will be the authoritative executable environment.

### Current branch head

Resolve from the live branch after the current task memory commit sequence completes.

### Next action

Read every changed path back, compare `main...perf/issue-250-home-island`, open a Draft PR and use its first performance artifact to set the exact Home baseline and permanent ceiling.
