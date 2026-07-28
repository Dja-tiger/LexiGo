# Stale-frame-safe controlled input synchronization

## Scope

This rule applies when a controlled input initializes from route, URL, storage or server state and later must follow external navigation changes.

## Confirmed failure

On 2026-07-28, post-merge CI run `30335497860` failed the Dictionary truthful-empty-state journey in UI shard 2 on `ios-webkit`.

The Playwright trace showed `fill("nonexistent term")` completing with the expected DOM value. During the immediately following Enter submit, the value became empty before the mocked search response.

## Root cause

`DictionaryCatalog` scheduled `requestAnimationFrame(() => setSearchInput(filters.query))` on initial mount. The frame captured the initial empty route query and could run after the first user input, overwriting the newer controlled value.

## Why it escaped

The immutable PR head passed the same browser matrix, so the timing window did not occur there. Source validation protected query retention states but did not distinguish initial state initialization from later external route synchronization.

## Mandatory prevention

1. Initialize controlled input state synchronously from its canonical source.
2. Do not schedule a mount-time frame that reapplies that same initial value.
3. Track the last synchronized external value and schedule synchronization only after the external value actually changes.
4. Keep later Back/Forward and route-driven changes synchronized.
5. Do not add a test-only wait, timeout or retry to hide this race.
6. Keep one React state owner; reading the DOM during submit is not a substitute for correct controlled-state synchronization.

## Regression gate

- `frontend/components/dictionary-search-source.test.ts` requires an initial-value ref guard before the deferred synchronization frame.
- The Dictionary empty/error journeys in `frontend/e2e/system-states.spec.ts` retain the submitted query.
- The focused truthful-empty-state journey must pass repeatedly in `ios-webkit` and once in all configured Chromium/WebKit projects.

## Reusable lesson

Synchronous state initialization and later external synchronization are different lifecycle events. A deferred initial write can become stale as soon as the user interacts.
