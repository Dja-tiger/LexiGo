# Указания для агентов и разработчиков LexiGo

Этот файл является обязательным индексом нормативных инструкций проекта. Перед любой write-операцией прочитайте документы в указанном порядке.

## Обязательное чтение

1. [`AGENTS.base.md`](./AGENTS.base.md) — полный production-safe регламент, pre-flight, testing ladder и журнал подтверждённых категорий ошибок.
2. [`AGENTS.progress-pr214.md`](./AGENTS.progress-pr214.md) — route islands, focus/scroll restoration, accessibility snapshots, lesson recovery, reduced motion, Linux visual artifacts и temporary workflow lifecycle.
3. [`AGENTS.progress-pr214-ci1732.md`](./AGENTS.progress-pr214-ci1732.md) — обязательная нормализация progressive disclosure перед browser interactions.
4. [`AGENTS.issue-19-completion.md`](./AGENTS.issue-19-completion.md) — сквозной downstream-consumer audit для новых API fields и acceptance criteria.
5. [`AGENTS.issue-241-calendar-boundaries.md`](./AGENTS.issue-241-calendar-boundaries.md) — обязательные границы календарных buckets для time-dependent fixtures и запрет fixed-duration approximation.
6. [`AGENTS.issue-247-request-scoped-fixtures.md`](./AGENTS.issue-247-request-scoped-fixtures.md) — request-scoped failure fixtures, разделение baseline load и целевого падающего запроса.
7. [`AGENTS.issue-199-phrases.md`](./AGENTS.issue-199-phrases.md) — semantic route-boundary names, shell smoke class-token matching и controlled Phrases visual/performance evidence.
8. [`AGENTS.issue-115-architecture-docs.md`](./AGENTS.issue-115-architecture-docs.md) — executable synchronization public architecture documentation с фактическим route-owner inventory.
9. [`AGENTS.issue-70-compatibility-reachability.md`](./AGENTS.issue-70-compatibility-reachability.md) — обязательный guest/auth reachability и shared-domain audit перед удалением compatibility code/CSS.
10. [`AGENTS.tool-selection.md`](./AGENTS.tool-selection.md) — обязательная сверка intent/function/schema перед repository write и recovery после отклонённого или misrouted вызова.
11. [`AGENTS.issue-261-css-specificity.md`](./AGENTS.issue-261-css-specificity.md) — обязательный computed-cascade audit при удалении или консолидации CSS owners.
12. [`AGENTS.issue-132-openapi-structure.md`](./AGENTS.issue-132-openapi-structure.md) — обязательная структурная проверка OpenAPI после изменений YAML.
13. [`AGENTS.issue-132-pg-array-snapshots.md`](./AGENTS.issue-132-pg-array-snapshots.md) — non-null snapshot semantics для пустых PostgreSQL arrays.
14. [`AGENTS.issue-132-dictionary-input-sync.md`](./AGENTS.issue-132-dictionary-input-sync.md) — controlled-input synchronization без stale initial frame.
15. [`AGENTS.issue-74-browser-zoom-collection.md`](./AGENTS.issue-74-browser-zoom-collection.md) — authoritative Playwright collection boundary, fail-closed ownership contract и browser-owned zoom evidence.
16. [`AGENTS.issue-74-scroll-normalized-geometry.md`](./AGENTS.issue-74-scroll-normalized-geometry.md) — единый coordinate frame для cross-target geometry внутри scrollable owners и запрет сравнения stale viewport rectangles.
17. [`SKILLS.md`](./SKILLS.md) — реестр проверенных skills и воспроизводимых project procedures.
18. [`PROJECT_STATE.md`](./PROJECT_STATE.md) — последнее проверенное состояние проекта, roadmap, validation gaps и update protocol.
19. [`current/TASK.md`](./current/TASK.md) — текущий atomic slice, scope, non-goals и invariants.
20. [`current/PROGRESS.md`](./current/PROGRESS.md) — короткий проверяемый журнал фактов.
21. [`current/EXECUTION.md`](./current/EXECUTION.md) — фактически применённые skills и результаты.
22. [`../docs/agent-harness.md`](../docs/agent-harness.md) — архитектура repository memory и полный delivery loop.
23. [`../README.md`](../README.md) и [`../docs/architecture.md`](../docs/architecture.md) — production entrypoints и системные boundaries.

Все специализированные `.agents/AGENTS.*.md` обязательны и применяются совместно. При конфликте более конкретное подтверждённое правило специализированного документа имеет приоритет в своей предметной области. Существующие записи об ошибках нельзя удалять, сокращать до общих формулировок или заменять новым handoff.

## Приоритет источников истины

1. Живой GitHub: фактический `main`, refs, Issues, PR, checks, artifacts и deployment status.
2. Код, migrations, tests и source contracts в актуальном `main`.
3. Точные production Figma nodes, variables, states и screenshots.
4. Нормативные `AGENTS` rules.
5. `.agents/PROJECT_STATE.md`.
6. Текущий Issue и его acceptance criteria.
7. Старые chat handoff и внешние summary.

Старый chat handoff является discovery-подсказкой, но не доказательством текущего состояния. Любое расхождение сначала разрешается чтением live GitHub и фактических repository files.
