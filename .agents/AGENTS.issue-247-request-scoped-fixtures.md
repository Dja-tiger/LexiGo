# Request-scoped failure fixtures

## Scope

This rule applies to browser fixtures that intentionally fail one request or one application state after a successful baseline render.

## Confirmed failure

On 2026-07-27, PR #248 CI #2068/run `30251200141` failed in `frontend/e2e/system-states.spec.ts` on `ios-webkit`.

The correlated Dictionary error fixture returned HTTP 503 for every `/api/v1/words` request. The initial unfiltered catalog load and the later `query=durable` search both failed. The initial error remount raced with Playwright `fill()`, so the controlled search value was reset before the intended assertion.

Production runtime was not defective: frontend core, Content Security, service-worker, visual and other browser gates were green, and the trace showed the fixture applying the failure outside the requested search state.

## Mandatory rule

An intentionally failing fixture must identify the exact request that owns the failure.

1. Allow the prerequisite baseline request to complete successfully.
2. Match the target request by stable semantics such as HTTP method, pathname and relevant query/body fields.
3. Arm the failure only for that exact request.
4. Before interacting with a controlled input, wait for the successful baseline owner to become ready.
5. For retry scenarios, change only the target request outcome; preserve the request identity and user-entered state.
6. Do not use a broad path-only interceptor when initial load and user action share the same endpoint.

## Regression gate

For the Dictionary correlated-error scenario:

- the initial `/api/v1/words` request without `query=durable` returns a successful catalog page;
- the first request with `query=durable` returns HTTP 503 and correlation ID `dictionary-system-state-503`;
- the searchbox retains `durable` through the error state;
- retry sends the same semantic search and returns the `durable` item;
- the scenario passes in Chromium and WebKit, including `ios-webkit`.

## Reusable lesson

Failure fixtures are request-state contracts, not endpoint-wide switches. When baseline and action use the same endpoint, scope the failure to the action's distinguishing request fields.
