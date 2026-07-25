# Указания для агентов и разработчиков LexiGo

Этот файл является обязательным индексом нормативных инструкций проекта. Перед любой write-операцией прочитайте документы в указанном порядке.

## Обязательное чтение

1. [`AGENTS.base.md`](./AGENTS.base.md) — полный production-safe регламент, pre-flight, testing ladder и журнал подтверждённых категорий ошибок.
2. [`AGENTS.progress-pr214.md`](./AGENTS.progress-pr214.md) — route islands, focus/scroll restoration, accessibility snapshots, lesson recovery, reduced motion, Linux visual artifacts и temporary workflow lifecycle.
3. [`AGENTS.progress-pr214-ci1732.md`](./AGENTS.progress-pr214-ci1732.md) — обязательная нормализация progressive disclosure перед browser interactions.
4. [`AGENTS.issue-19-completion.md`](./AGENTS.issue-19-completion.md) — сквозной downstream-consumer audit для новых API fields и acceptance criteria.
5. [`SKILLS.md`](./SKILLS.md) — реестр проверенных skills и воспроизводимых project procedures.
6. [`PROJECT_STATE.md`](./PROJECT_STATE.md) — последнее проверенное состояние проекта, roadmap, validation gaps и update protocol.
7. [`current/TASK.md`](./current/TASK.md) — текущий atomic slice, scope, non-goals и invariants.
8. [`current/PROGRESS.md`](./current/PROGRESS.md) — короткий проверяемый журнал фактов.
9. [`current/EXECUTION.md`](./current/EXECUTION.md) — фактически применённые skills и результаты.
10. [`../docs/agent-harness.md`](../docs/agent-harness.md) — архитектура repository memory и полный delivery loop.
11. [`../README.md`](../README.md) и [`../docs/architecture.md`](../docs/architecture.md) — production entrypoints и системные boundaries.

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
