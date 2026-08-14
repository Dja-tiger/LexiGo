# Current Task Progress

## 2026-08-14 17:22 Europe/Moscow

### Verified

- Live `main`: `c13cf3bae514c03d1d54a237add7dacedf4573e5`.
- Issue #515 is open and defines canonical Progress parity at `390×844` and `1440×1024` in Light/Dark.
- Canonical known Figma Progress nodes: `76:6` mobile Light, `76:53` mobile Dark, `76:154` desktop; Screen Map `82:3`.
- Live Figma MCP calls are currently blocked by the connected Starter-plan tool-call quota, so no new canvas/screenshot approval is claimed.
- `frontend/playwright.config.ts` has no explicit `testMatch`; normal `*.spec.ts` owners are collected across desktop Chromium/WebKit and Android/iOS projects.
- `frontend/e2e/progress-route-island.spec.ts` already owns direct Progress entry, dedicated route-island semantics, persistent session bootstrap and primary-navigation transitions.
- Existing `progress-evidence.spec.ts` already covers server evidence plus some compact Dark/reflow behavior; duplicating its fixture is unnecessary for #515.
- Existing approved Progress Linux PNGs remain under `visual-regression.spec.ts`; they must not be updated without manual Linux-actual/Figma review.

### Finding

The smallest authoritative owner for #515 is `progress-route-island.spec.ts`, not a new standalone test and not the large Progress data-evidence suite. The missing contract is a symmetric canonical viewport/appearance geometry + route-shell matrix and explicit Browser Back/Forward/reload evidence.

### Root cause

Progress acceptance is currently distributed across visual screenshots, evidence/reflow tests and route-island navigation. No single executable route-shell contract binds both canonical viewports to explicit Light/Dark appearance while also protecting history/reload and horizontal geometry.

### Changed files

- `.agents/current/TASK.md` — pre-flight and narrowed test owner only.

### Checks passed

- Mandatory AGENTS/SKILLS/harness pre-flight completed.
- Branch `test/issue-515-progress-figma-parity` created from exact `main` and read back.
- After each harness write, branch head was read back and `main` remained unchanged.
- Normal Playwright collection boundary verified.
- Existing geometry/visual rules from PR #214 and Issue #74 re-verified.

### Checks failed

- Live Figma `use_figma` / screenshot inspection cannot run because the connected Starter-plan tool-call quota is exhausted. This is an external design-tool limitation, not a product/CI failure.

### Current branch head

Resolve from live branch ref; latest verified branch head before this progress write was `95adaf9ad7a32d556835a5f38315b75f2003ff0b`.

### Next action

Implement the test-only canonical Progress parity matrix and real Back/Forward journey in `frontend/e2e/progress-route-island.spec.ts`, then run immutable-head full CI without changing production CSS or PNG baselines unless a reproducible product defect is proven.