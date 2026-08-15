# Current Task Execution

## Task

- Branch: `test/issue-531-dictionary-figma-parity`
- Base SHA: `e3cf4054068867012e01f6ccba528dc04498686f`
- Head SHA: resolve from live branch ref
- PR:

## Skills used

### github

Purpose:

Repository/Issue/branch/file/CI inspection and guarded writes under the LexiGo Agent Harness for Issue #531.

Instruction source:

`skills://plugins/github/github/skill.md`, `skills://plugins/github/gh-fix-ci/skill.md`, root `AGENTS.md`, `.agents/AGENTS.md`, `.agents/AGENTS.base.md`, task-specific `.agents/*` guidance and `docs/agent-harness.md`.

Version or verification date:

Verified for this task on 2026-08-15 Europe/Moscow.

Inputs:

Issue #531, umbrella #205, exact base main SHA `e3cf4054068867012e01f6ccba528dc04498686f`, repository-side Figma handoff `78:54` / `78:193`, existing Dictionary route-island owner, shared route-navigation CSS and authoritative UI collection.

Files inspected:

- Agent Harness/root guidance and specialized contracts;
- `.agents/PROJECT_STATE.md`;
- `frontend/docs/adaptive-knowledge-coach.md`;
- `frontend/e2e/dictionary-route-island.spec.ts` before and after mutation;
- `frontend/e2e/learn-route-island.spec.ts` as the approved #205 parity pattern;
- `frontend/components/lexigo-dictionary-app.tsx` for direct route/main ownership;
- `frontend/components/route-primary-navigation.tsx` and `frontend/app/route-navigation.css` for viewport navigation ownership;
- `frontend/app/dictionary-catalog.css` for catalog layout/semantic appearance ownership;
- `frontend/package.json` for authoritative test collection.

Actions performed:

- completed PR #529 Active Lesson delivery, exact-main CI #3536 and Stage #3385;
- reconciled Agent Docs through PR #530, exact-main CI #3538 and skipped docs-only Stage deploy #3387;
- verified fresh main and absence of open PRs;
- created Issue #531 and branch `test/issue-531-dictionary-figma-parity` from exact fresh main;
- documented live Figma Starter-plan quota limitation without claiming fresh canvas approval;
- constrained scope to existing Dictionary route-island owner and excluded catalog behavior/PWA/touch/zoom/state/Word Detail owners;
- preserved the original session/bootstrap/history test byte-for-byte in behavior and assertions;
- added a four-case canonical matrix: mobile/desktop × Light/Dark;
- encoded exact `390x844` and `1440x1024` viewport contracts;
- added exact `figma` annotations for `78:54` and `78:193`;
- added semantic appearance initialization through existing `lexigo.appearance.v1` runtime contract;
- asserted direct route-island, semantic main, catalog heading/list, appearance and reload stability;
- asserted shared primary-navigation ownership (`mobile` at 390px, `header` at 1440px);
- asserted island/main/catalog horizontal containment and no document/body x-overflow;
- limited canonical geometry measurement to Chromium while leaving existing cross-browser behavioral owner independent;
- read back guarded writes and verified `main` remained unchanged.

Commands or procedures:

GitHub connector-first workflow. Every contents mutation uses the current blob SHA and explicit task branch, followed by read-back and live `main` SHA verification. No direct main writes, visual baseline updates, production React/CSS changes or Figma canvas mutations are allowed in this slice.

Artifacts produced:

Issue #531, task branch, extended `frontend/e2e/dictionary-route-island.spec.ts`, and current Agent Harness task/progress/execution evidence.

Result:

Implementation candidate is test-only and adds executable canonical Dictionary route provenance without production UI, visual baseline, package, Playwright config, workflow, backend or dependency changes.

Failures:

Live Figma screenshot/canvas access remains unavailable because the connected Figma MCP has reached the Starter-plan tool-call limit.

Root cause:

External Figma plan quota; the existing Dictionary route-island suite also predates the final #205 canonical node/viewport parity matrix.

Fallback:

Use only repository-approved Figma mapping from `frontend/docs/adaptive-knowledge-coach.md`; validate route-level parity through deterministic quality-gate API fixtures and authoritative repository CI. Do not invent or refresh visual baselines.

Limitations:

This slice proves executable parity against approved repository-side handoff but cannot claim new screenshot-versus-live-canvas approval while Figma MCP is quota-blocked.

Reusable lesson:

For shared `RouteChrome`, derive navigation ownership from the actual responsive CSS instead of copying another route's parity assertion: Dictionary expects `mobile` at 390px and `header` at 1440px, while the intermediate `rail` owner only applies from 720–1099px.
