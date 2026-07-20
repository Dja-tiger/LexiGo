# Issue #118: iOS renderer crash during scrolling

## Confirmed gap in the previous verification

The live browser smoke test performed one programmatic jump to the bottom of a guest page. It did not reproduce repeated top/bottom scroll bursts, did not exercise authenticated application state, and did not assert browser renderer termination.

## Source-level defect addressed

The persistent application component subscribed to every `scroll` event and scheduled `history.replaceState` on the next animation frame. During kinetic scrolling this could produce dozens of structured-clone and session-history writes per second. This is unnecessary browser-main-thread and session-history pressure, and it is the leading source-level cause for the reported WebKit page termination.

The code-level defect and its regression protection are verified automatically. Final causal confirmation still requires the corrected build to pass the same scenario on the physical iPhone that reproduced the incident.

## Corrective action

- coalesce the entire scroll burst into one trailing snapshot write;
- flush the final position on `pagehide` and when the document becomes hidden;
- verify exact coalescing, flush and cancellation behavior in deterministic unit tests;
- record explicit Playwright `page.crash` events;
- exercise repeated bounded top/bottom scroll bursts in isolated authenticated Chromium and iOS WebKit pages;
- repeat the same bounded pattern against the deployed public stage routes.

The incident remains open until CI, stage rollout, live browser smoke and physical-device verification have all completed successfully.
