# Frontend reusable lessons

Normative source: [`../AGENTS.base.md`](../AGENTS.base.md) and [`../AGENTS.progress-pr214.md`](../AGENTS.progress-pr214.md).

- Build a full route/state/browser contract before implementation; do not test only a desktop happy path.
- Route islands must preserve focus, scroll, live announcements, Back/Forward and per-tab state across island boundaries.
- Never synchronize React lifecycle with global DOM mutation or a global `MutationObserver`; use React-owned/cancellable scheduling.
- Read the accessibility snapshot before constructing exact locators. Visible text may be only part of the accessible name.
- Normalize owning `<details>`/progressive disclosure before interacting with nested controls.
- Controlled Recall inputs must be validated in Chromium and WebKit with native input behavior.
- Treat audited route-island enumerators as closed-world ownership contracts: add the new island and assert its single bootstrap/API/dialog owner instead of merely extending a filename list.
- Next App Router client navigation may render the canonical not-found boundary with HTTP 200; browser contracts must assert semantic 404 UI and absence of the feature runtime rather than relying only on response status.
- A persistent client route predicate does not create an App Router route. Every focused client island needs a canonical `app/**/page.tsx` owner; otherwise the island can mount over the server not-found subtree, producing duplicate landmarks and pointer interception even when client content is visible. Protect route-page existence with a source contract and verify one live application `main` in accessibility/browser gates.
- Browser-history tests must wait for the destination semantic route owner, not only for the URL, before invoking Back/Forward; App Router can expose the new pathname while the previous transition is still committing.
- Regression gates: lint, typecheck, unit, production build, Chromium, WebKit, Android, iOS, history/recovery and route-bundle checks.
