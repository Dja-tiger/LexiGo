# Issue #118: iOS renderer crash during scrolling

## Confirmed gap in the previous verification

The live browser smoke test performed one programmatic jump to the bottom of a guest page. It did not reproduce a kinetic scroll burst, did not scroll back to the top, and did not assert browser renderer termination.

## Source-level root cause

The persistent application component subscribed to every `scroll` event and scheduled `history.replaceState` on the next animation frame. During kinetic scrolling this could produce dozens of structured-clone and session-history writes per second. All iOS browsers use WebKit, so the resulting renderer pressure can terminate the page without reaching the React error boundary.

## Corrective action

- coalesce the entire scroll burst into one trailing snapshot write;
- flush the final position on `pagehide` and when the document becomes hidden;
- record explicit Playwright `page.crash` events;
- exercise repeated top/bottom scrolling rather than one synthetic jump;
- assert that history writes stay bounded during an authenticated route test.

The temporary patch workflow is removed before merge.
