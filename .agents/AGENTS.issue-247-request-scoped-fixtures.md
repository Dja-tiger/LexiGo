# Request-scoped failure fixtures

## Scope

This rule applies to browser fixtures that intentionally fail one request or one application state after a successful baseline render, and to intercepted browser responses whose transport metadata is part of cross-browser acceptance.

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
7. When multiple Playwright route layers can observe one request, designate exactly one canonical fulfillment owner; fallback/interception layers must not be used as a place to attach response metadata that the actual fulfillment owner does not emit.
8. If WebKit validates an intercepted response through Fetch/CORS rules, browser-required response metadata must be emitted by the route that actually calls `fulfill`, derived from the intercepted request where possible. Do not use wildcard origins with credentialed requests.

## Regression gate

For the Dictionary correlated-error scenario:

- the initial `/api/v1/words` request without `query=durable` returns a successful catalog page;
- the first request with `query=durable` returns HTTP 503 and correlation ID `dictionary-system-state-503`;
- the searchbox retains `durable` through the error state;
- retry sends the same semantic search and returns the `durable` item;
- the scenario passes in Chromium and WebKit, including `ios-webkit`.

## 2026-08-20 — WebKit validated metadata from the canonical fulfillment owner

- **Симптом:** post-merge exact-main CI #3892/run `32324897382` failed both `learn` Light/Dark route-history cases on `ios-webkit`, including retries, with `pageerror: /127.0.0.1:3000/api/v1/lessons/preview due to access control checks.`
- **Первопричина:** PR #625 correctly removed duplicate page-level lesson-preview interception, but the remaining canonical `installQualityGateAPI(context)` fulfillment returned the synthetic HTTP 200 without CORS response metadata. An earlier experiment had attached those headers to a page route that called `fallback`; because that layer did not fulfill the response, WebKit never received the metadata from the actual response owner.
- **Почему ошибка не была обнаружена раньше:** exact-head CI #3891 passed the same matrix, so the transport timing/path did not reproduce there. The source contract proved single ownership but did not prove that the canonical owner's fulfilled response carried the browser-required metadata.
- **Профилактика:** preserve one canonical response owner and attach request-derived CORS metadata at the actual `route.fulfill` boundary. For credentialed intercepted requests use the exact request `Origin`, never `*`; keep preflight handling next to the same owner when the mocked endpoint can receive `OPTIONS`.
- **Обязательная проверка:** `frontend/components/route-history-collection-contract.test.ts` must prove page-level preview interception remains absent while `frontend/e2e/support/quality-gates.ts` owns exact-origin CORS metadata; full UI shard 2 must pass both `learn` Light/Dark cases on `ios-webkit` without runtime errors, followed by green exact-main CI.
- **Область действия:** Playwright context fixtures, Fetch/CORS-sensitive intercepted POST responses, route-history browser acceptance and iOS WebKit.

## Reusable lesson

Failure fixtures are request-state contracts, not endpoint-wide switches. When baseline and action use the same endpoint, scope the failure to the action's distinguishing request fields. Intercepted response metadata belongs to the route that actually fulfills the response, not to a fallback layer that merely observes or forwards the request.
