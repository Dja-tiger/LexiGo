# Request-scoped failure fixtures

## Scope

This rule applies to browser fixtures that intentionally fail one request or one application state after a successful baseline render, and to route acceptance whose next navigation can cancel an in-flight fixture-backed request.

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
7. A route is not semantically ready merely because its heading or outer island is visible when the route owns a debounced or deferred request whose cancellation can surface as a browser error.
8. Before the acceptance initiates reload, Back/Forward or another navigation, wait for a stable user-visible completion state owned by that request. Prefer an enabled CTA, resolved status or other semantic state; do not add fixed sleeps or timeout inflation.

## Regression gate

For the Dictionary correlated-error scenario:

- the initial `/api/v1/words` request without `query=durable` returns a successful catalog page;
- the first request with `query=durable` returns HTTP 503 and correlation ID `dictionary-system-state-503`;
- the searchbox retains `durable` through the error state;
- retry sends the same semantic search and returns the `durable` item;
- the scenario passes in Chromium and WebKit, including `ios-webkit`.

## 2026-08-20 — History acceptance navigated while Learn preview debounce was still pending

- **Симптом:** post-merge exact-main CI #3892/run `32324897382` and PR #627 exact-head CI #3896/run `32367998836` reported `pageerror: /127.0.0.1:3000/api/v1/lessons/preview due to access control checks.` on `ios-webkit` during the Issue #617 route-history matrix. Run #3896 finished with `learn light` failing on the initial run and retry and `profile dark` failing while its transit route was Learn.
- **Первопричина:** `LexigoLearnApp` intentionally debounces authenticated lesson-preview loading by 120 ms, while `expectSemanticReady` considered Learn ready as soon as its heading was visible. The test therefore initiated the next history operation before the preview lifecycle settled. Exact trace timing proves the relationship: `page.reload` at `358144.013` was followed by the WebKit pageerror at `358161.713`; `goto('/profile')` at `358867.853` by the same pageerror at `358893.779`; `goForward` at `360344.369` by the same pageerror at `360367.897`. None of those failed preview attempts produced a preview `resource-snapshot` or `Route.fulfill`, so adding CORS response metadata at the fixture could not affect them.
- **Почему ошибка не была обнаружена раньше:** the route-history contract waited for structural route readiness but not the asynchronous state that makes Learn safe to leave. Timing sometimes let the preview settle before the next action, so the same browser matrix could pass on another run.
- **Профилактика:** for Learn, semantic readiness includes a resolved preview. Wait for the responsive start CTA to become enabled — `Начать урок` on desktop or `Начать рекомендуемый урок` on compact layouts — before any reload or history transition. Keep strict runtime-error assertions; do not replace the semantic wait with `waitForTimeout`.
- **Обязательная проверка:** `frontend/components/route-history-collection-contract.test.ts` protects the responsive enabled-CTA readiness contract and the absence of sleeps; full UI shard 2 must pass the Learn and Profile history journeys on `ios-webkit` without preview pageerrors, followed by green exact-main CI.
- **Область действия:** debounced/deferred route-owned requests, route readiness, reload/Back/Forward acceptance, Playwright fixtures and iOS WebKit.

## Reusable lesson

Failure fixtures are request-state contracts, not endpoint-wide switches. When baseline and action use the same endpoint, scope the failure to the action's distinguishing request fields. When navigation can cancel a deferred request, define route readiness by the request's stable semantic completion state rather than by the first visible shell element.
