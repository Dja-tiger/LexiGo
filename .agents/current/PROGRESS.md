# Current Task Progress

## 2026-08-04 19:41 Europe/Moscow

### Verified

- Repository: `Dja-tiger/LexiGo`.
- Live `main`: `cda65e39ba65cd00651be3ae7e39da651cc57f1c`.
- Latest deployed product SHA: `9ee68f15d623bc7d0e001967b94eff3946b246b3`.
- Issue #74 remains open after the completed connectivity-action slice.
- Open PRs #304, #305 and #306 are Dependabot-only and do not overlap this product scope.
- Branch `agent/issue-74-header-profile-touch-target` was created from the exact live `main` SHA.
- Mandatory Agent Harness documents and Issue comments were read before writes.

### Finding

The live interactive header button with accessible name `Открыть профиль` is present across canonical route islands. Its base painted box is 44×44 px on desktop, while `mobile-pwa-fixes.css` reduces it to 42×42 px on compact viewports. The compact live control therefore fails both the 44px fine-pointer and 48px coarse-pointer target contract.

The Profile route also uses `.lx-avatar` for a decorative `span[aria-hidden="true"]`; any remediation must use an exact interactive button selector and must not affect this decorative owner.

### Root cause

The visual avatar dimensions were treated as the complete interaction rectangle. Compact presentation reduced the button to 42×42 px, and no semantic hit-area owner restored the minimum pointer target independently of painted geometry.

### Changed files

- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`

### Checks passed

- Live main, open PR and deployment-state verification.
- Exact route-source and CSS-owner inspection.
- Branch creation and TASK read-back.

### Checks failed

- None. Local clone validation is unavailable because the isolated execution environment cannot resolve `github.com`; connector and authoritative CI evidence will be used.

### Current branch head

Resolve from live branch ref after each write. Latest known commit after TASK write: `17aef8732615c3a18149336ea87275b91ca4678f`.

### Next action

Record execution procedure, add the exact button-scoped paint-inert target owner, source contract and multi-browser perimeter proof, then compare the branch against live `main` before opening a Draft PR.
