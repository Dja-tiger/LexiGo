# PWA reusable lessons

Normative source: [`../AGENTS.base.md`](../AGENTS.base.md) and [`../AGENTS.progress-pr214.md`](../AGENTS.progress-pr214.md).

- Persistent session bootstrap, refresh coordination, durable review synchronization and service-worker lifecycle have one owner; route islands must not duplicate them.
- Validate direct entry, reload, stale build markers, Back/Forward, network recovery and installed iOS/Android behavior.
- A public-runtime or service-worker browser failure is a stage validation failure even when deployment and HTTP smoke succeed.
- Retryable review requests must preserve durable idempotency.
- Regression gates: service-worker contracts, public browser smoke, iOS WebKit, Android Chromium and recovery suites.
