# Backend reusable lessons

Normative source: [`../AGENTS.base.md`](../AGENTS.base.md) and [`../AGENTS.issue-19-completion.md`](../AGENTS.issue-19-completion.md).

- A new API field is incomplete until producer, SQL aggregation, serializer, runtime validator, fallback, presentation, user action, mocks, tests and OpenAPI consumers are reconciled.
- Learning submissions that affect review evidence must remain atomic and idempotent.
- Timezone and week-boundary behavior requires deterministic transition tests, not only current-date examples.
- Persistence/resume contracts must be tested across reload and concurrent/version-conflict paths.
- Regression gates: formatting, static analysis, unit, race, integration, migrations, API/source contracts and vulnerability audit.
