# Content Security Policy and browser security headers

## Security contract

LexiGo applies a per-response nonce CSP to every HTML document in stage and production. Next.js receives the enforcing policy on the internal request so it can attach the nonce to framework scripts and styles; the browser receives either `Content-Security-Policy-Report-Only` on stage or `Content-Security-Policy` in production. Static assets are not passed through the nonce middleware and retain their normal cache behavior.

The production policy contains these sources:

| Directive | Value and reason |
| --- | --- |
| `default-src` | `'self'` fallback |
| `script-src` | `'self'` plus the per-response nonce; no `unsafe-inline` or `unsafe-eval` |
| `script-src-attr` | `'none'` |
| `style-src`, `style-src-elem` | `'self'` plus the per-response nonce |
| `style-src-attr` | `'unsafe-inline'` only for React-owned dynamic style attributes such as progress widths; this is the sole inline exception |
| `connect-src` | `'self'` for the same-origin API and RUM endpoints |
| `img-src` | `'self' data: blob:` |
| `font-src` | `'self' data:` |
| `media-src` | `'self' blob:` for pronunciation audio |
| `worker-src` | `'self' blob:` for PWA workers |
| `manifest-src` | `'self'` |
| `frame-src`, `object-src` | `'none'` |
| `frame-ancestors` | `'none'` |
| `base-uri`, `form-action` | `'self'` |
| `report-uri` | `/api/v1/security/csp-report` |

The offline recovery page keeps its CSS and JavaScript in external same-origin files. No handwritten inline script or style is allowed. HTTPS navigation is enforced by Caddy and HSTS rather than `upgrade-insecure-requests`; this also keeps the strict policy testable on the loopback HTTP origin used by the browser suite.

Nonce generation makes every App Router document dynamically rendered and `Cache-Control: private, no-store`. Static JavaScript, CSS, icons, the manifest and service worker remain cacheable. CI performance budgets remain the regression guard for the dynamic-rendering cost.

## Edge headers

Caddy adds the same baseline to the frontend and direct API origins:

- `Strict-Transport-Security: max-age=<environment value>`;
- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy: strict-origin-when-cross-origin`;
- `Permissions-Policy: camera=(), geolocation=(), microphone=(), payment=(), usb=()`;
- `X-Frame-Options: DENY` as a compatibility companion to `frame-ancestors 'none'`;
- the `Server` response header is removed.

HSTS is intentionally conservative: stage uses one day (`86400`), production uses 180 days (`15552000`), and neither `includeSubDomains` nor `preload` is enabled. Those flags may be considered only after every affected subdomain has been HTTPS-only for a separate reviewed rollout.

## Report handling and privacy

`POST /api/v1/security/csp-report` accepts one `application/csp-report` or `application/json` report up to 16 KiB and returns `204 No Content`. Browsers may use an opaque `Origin: null` for CSP delivery, so this credential-free route is the only mutation endpoint outside the shared SameOrigin/CSRF-origin guard. The endpoint is rate-limited fail-closed to 60 requests per minute per limiter key; safelisted cross-site form media types are rejected with `415`. Unknown browser fields are tolerated, but a directive is required.

Logs contain only the directive, disposition, status, non-negative line/column numbers and sanitized origins/resource classes. Query strings, fragments and `script-sample` are never logged. Investigate the structured message `browser content security policy violation`; do not enable raw request-body logging for this endpoint.

## Rollout and promotion

1. Deploy stage with `CONTENT_SECURITY_POLICY_MODE=report-only` and `HSTS_MAX_AGE=86400`.
2. Run the public header smoke and Chromium/iOS WebKit journeys. Confirm login/registration, refresh-session restore, lesson navigation, Service Worker recovery, pronunciation audio and Apple/Google calendar flows.
3. Observe at least one stage release window, including real or scripted traffic, and classify every sanitized CSP report. Any unexplained report blocks promotion.
4. Promote production only with `CONTENT_SECURITY_POLICY_MODE=enforce` and `HSTS_MAX_AGE=15552000`; rerun the same public checks.
5. Keep `preload` and `includeSubDomains` absent until a dedicated domain-wide review approves them.

For a CSP incident, change stage back to `report-only` while diagnosing. A temporary production rollback from `enforce` requires incident approval and must preserve all Caddy headers; never add `unsafe-eval`. If a narrowly scoped source is unavoidable, add it to the policy builder with a regression test and document the exact consumer and removal condition here.

Playwright trace/screenshot/video recorders inject a transient inline stylesheet in Chromium and WebKit. Security-focused and public rollout projects disable those recorder features so the test harness does not create false CSP reports; application violations are still captured through browser console messages and `securitypolicyviolation` events.

The CI acceptance command is `npm run test:e2e:security`. It runs the enforcing production policy over auth, session restore, lesson, Service Worker, Google/Apple calendar and offline recovery journeys in desktop Chromium and iOS WebKit without recorder-generated telemetry.
