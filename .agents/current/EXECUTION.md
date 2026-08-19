# Current Task Execution

## Task

- Issue: #617
- Branch: `test/issue-617-route-history-parity`
- Base SHA: `d305300c0d22cbb8ed2744e568a5eab7583c3923`
- Head SHA: resolve from live branch ref
- PR: pending

## Skills used

### GitHub repository operations

Purpose:
Execute Issue #617 as an isolated test/evidence slice with live-main drift checks, per-write readback, immutable-head CI and guarded merge.

Instruction source:
`AGENTS.md`, `.agents/AGENTS.base.md`, mandatory indexed Agent notes, `.agents/SKILLS.md`, `docs/agent-harness.md`.

Version or verification date:
Repository sources and live GitHub inspected on 2026-08-19 from `main@d305300c0d22cbb8ed2744e568a5eab7583c3923`.

Inputs:
Parent #205, completed #614, existing route/history tests, current package navigation collection and deterministic quality-gate fixtures.

Files inspected:
`frontend/e2e/app-router-routes.spec.ts`, `frontend/e2e/support/active-lesson-fixture.ts`, `frontend/e2e/support/quality-gates.ts`, `frontend/package.json`, Agent Harness sources and clean `.agents/current/**` templates.

Actions performed:
Created Issue #617 and branch `test/issue-617-route-history-parity`; authored a consolidated history owner and fail-closed source contract; added the owner to blocking navigation CI; updated task/progress evidence.

Commands or procedures:
Live connector search/fetch/compare/write/readback. No local execution claim; GitHub Actions is authoritative.

Artifacts produced:
- `frontend/e2e/route-history-parity.spec.ts`
- `frontend/components/route-history-collection-contract.test.ts`
- `frontend/package.json` navigation collection update
- `.agents/current/**` task evidence

Result:
Implementation is ready for first executable CI validation; runtime/router/OpenPencil sources remain untouched.

Failures:
None before CI.

Root cause:
N/A.

Fallback:
If CI exposes a source/fixture mistake, repair only the audit owner/fixture boundary. If it exposes an actual route-history product defect, create a separate atomic runtime Issue/PR and keep this audit fail-closed.

Limitations:
The consolidated matrix does not replace specialized route-specific filter/search/scroll restoration contracts; those remain independent owners.

Reusable lesson:
For a route-history parity gate, use native `reload`, `goBack` and `goForward` with exact URL + semantic owner assertions; synthetic popstate tests cannot establish browser-owned history behavior.

### Frontend route-history acceptance

Purpose:
Prove the #205 direct-entry/reload/Back-Forward dimension for every canonical route across desktop Chromium and compact iOS WebKit in Light/Dark.

Instruction source:
Existing `frontend/e2e/app-router-routes.spec.ts`, route-island tests, Agent Harness rule against synthetic history shortcuts.

Inputs:
10 canonical route contracts; 1440×1024 desktop Chromium; 390×844 iOS WebKit; explicit Light/Dark; deterministic authenticated API fixture.

Actions performed:
- Each state performs direct entry and exact semantic readiness proof.
- Reload preserves exact URL and route owner.
- A real second entry is created (`/profile`, or `/learn` when auditing profile).
- Native Back restores original route and exact URL.
- Native Forward restores the second entry and exact URL.
- Active Lesson uses a narrow valid active-session API override and accepts BFCache/cold-reload presentation before requiring active prompt state.
- Onboarding uses a narrow in-progress API override.
- Detail routes verify exact word/phrase heading identity.
- Appearance ownership and runtime errors are verified throughout.
- Machine-readable per-state JSON evidence is attached.

Collection contract:
- Exactly 10 route markers.
- Explicit desktop Chromium/iOS WebKit surfaces and Light/Dark.
- Requires real `page.reload()`, `page.goBack()`, `page.goForward()`.
- Forbids `history.pushState`, `history.replaceState`, `popstate`, `waitForTimeout`.
- Requires valid Active Lesson/Onboarding fixture markers.
- Requires exact URL restoration assertions and runtime evidence.
- Blocking `test:e2e:navigation` explicitly includes the owner.

Validation status:
Pending first immutable GitHub Actions run.

Design-source note:
Active design/handoff source is repository-owned OpenPencil. Figma Cloud/MCP/node IDs are archival provenance only and are not prerequisites or blockers.
