# Current Task

## Identity

- Issue: #533
- Branch: `test/issue-533-word-detail-figma-parity`
- Base SHA: `e2f4a754cb5dab65d55af248d4e7e6359083c710`
- Head SHA: resolve from live branch ref
- PR:

## Objective

Зафиксировать executable canonical Figma parity для standalone Word Detail `/words/[id]` в рамках umbrella #205, переиспользуя существующий authoritative visual owner и не изменяя production UI или content-addressed baselines без доказанного дефекта.

## Scope

- расширить `frontend/e2e/word-detail-visual.spec.ts` четырьмя canonical cases: mobile/desktop × Dark/Light;
- Figma provenance: mobile Dark `78:99`, desktop Dark `78:274`; Light использует ту же утверждённую геометрию через semantic tokens;
- exact viewports: `390x844` и `1440x1024`;
- explicit appearance через `lexigo.appearance.v1`;
- доказать standalone direct-entry ownership внутри `data-route-client-island="dictionary"`;
- доказать semantic main `#lexigo-main-content[aria-label="Карточка слова"]`, `.lx-word-detail`, canonical heading/translation и primary learning action;
- доказать horizontal containment, отсутствие document x-overflow и reload stability;
- зафиксировать ровно один фактически видимый shared RouteChrome owner; mobile требует `mobile`, desktop variant сначала собирается как browser evidence и не выводится из generic breakpoint CSS;
- сохранить существующие content-addressed visual baselines, 200% text reflow, forced-colors и browser-owned zoom owners без изменений.

## Non-goals

- production React/CSS redesign;
- screenshot hash/baseline/tolerance refresh;
- новый `word-detail` client island;
- изменение Playwright global config, package collection, CI workflows, backend или dependencies;
- дублирование touch-target/history/zoom/a11y owners;
- изменение Figma canvas при недоступном live MCP.

## Allowed paths

- `frontend/e2e/word-detail-visual.spec.ts`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- production React/CSS;
- visual snapshot/baseline assets;
- `package.json` / lockfiles;
- Playwright global configs;
- `.github/workflows/**`;
- backend/runtime/dependencies;
- Figma mutation.

## Runtime owners

- `LexigoDictionaryApp` owns Dictionary/Word Detail client island state.
- `DictionaryCatalog` delegates active detail state to `WordDetailRoute`.
- `WordDetailRoute` / Word Detail presentation own `.lx-word-detail` and primary learning action.
- `RouteChrome` independently owns primary route navigation.
- Existing Word Detail visual spec owns deterministic Light/Dark baselines, reflow, forced-colors and browser-owned zoom evidence.

## Documentation owners

- `frontend/docs/adaptive-knowledge-coach.md` — repository-approved Figma handoff.
- `.agents/PROJECT_STATE.md` — project reconciliation after delivery, not changed in this product branch.
- `.agents/current/*` — current atomic task execution state.

## Invariants

- Mobile Figma node: `78:99`.
- Desktop Figma node: `78:274`.
- Mobile viewport: `390x844`.
- Desktop viewport: `1440x1024`.
- Light canvas: `#f4f7f5`.
- Dark canvas: `#10211d`.
- Word Detail remains inside `data-route-client-island="dictionary"`.
- Semantic main becomes `Карточка слова`.
- Existing baseline SHA-256 values remain unchanged.
- Generic RouteChrome breakpoint CSS is not sufficient evidence for desktop ownership.

## Acceptance criteria

- 4-case executable parity matrix with exact Figma annotations;
- canonical direct-entry Word Detail state, content and practice action visible;
- explicit semantic appearance deterministic before and after reload;
- exactly one visible RouteChrome owner, contained in viewport;
- mobile owner is `mobile`; desktop owner captured from authoritative browser runtime and stable across reload;
- no horizontal overflow/clipping;
- runtime errors empty;
- existing visual baseline/zoom/reflow/forced-colors tests remain intact;
- immutable-head PR CI green;
- clean review audit;
- expected-head squash merge;
- exact-main CI and Stage/public validation green.

## Required checks

- fail-closed scope classification;
- frontend core quality;
- authoritative Visual regression collection containing `word-detail-visual.spec.ts`;
- relevant UI/browser, accessibility, performance, security and PWA gates selected by repository scope;
- container gates selected by runtime scope;
- review threads/reviews audit;
- exact-main CI and Stage/public gate after merge.

## Risks

- desktop RouteChrome owner may differ from generic breakpoint CSS due downstream route/adaptive cascade;
- explicit semantic appearance could expose a real token/ownership defect;
- extending a content-addressed visual owner must not accidentally alter existing baseline setup or fixture determinism.

## Rollback

Revert the test-only parity commit/PR. No production runtime, CSS, baseline or dependency rollback is required unless CI proves an unrelated pre-existing issue.
