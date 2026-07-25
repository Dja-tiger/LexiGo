# Frontend reusable lessons

Normative source: [`../AGENTS.base.md`](../AGENTS.base.md) and [`../AGENTS.progress-pr214.md`](../AGENTS.progress-pr214.md).

- Build a full route/state/browser contract before implementation; do not test only a desktop happy path.
- Route islands must preserve focus, scroll, live announcements, Back/Forward and per-tab state across island boundaries.
- Never synchronize React lifecycle with global DOM mutation or a global `MutationObserver`; use React-owned/cancellable scheduling.
- Read the accessibility snapshot before constructing exact locators. Visible text may be only part of the accessible name.
- Normalize owning `<details>`/progressive disclosure before interacting with nested controls.
- Controlled Recall inputs must be validated in Chromium and WebKit with native input behavior.
- Regression gates: lint, typecheck, unit, production build, Chromium, WebKit, Android, iOS, history/recovery and route-bundle checks.
