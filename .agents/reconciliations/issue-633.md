# Issue #633 Delivery Reconciliation

## Delivery

- Issue: #633 — `fix(deploy): stop rebuilding custom Caddy on Stage/production hosts`
- PR: #634 — `fix(deploy): stop rebuilding custom Caddy on deployment hosts`
- Final developer head: `f22223a629f07fcc396e45416ea8d0828635009d`
- Final immutable-head full CI: #3926 / run `32415930055` — `success`
- Deployment scripts check: #201 / run `32415930029` — `success`
- Squash merge / delivered main: `3fe5636724c2d12f55de1224218ea236bbe04440`
- Exact-main CI: run `32427762951` — `success`
- Exact-SHA Stage: run `32428734890` — `success`
- Issue state after merge: closed/completed

## Root cause

Stage failed repeatedly before this delivery because the deployment host compiled custom Caddy during every deploy. Runs `32400258209` and `32404719471` both pulled the application and data-service images successfully, then exhausted host Docker/Go temporary storage during `xcaddy build` with `no space left on device`.

The application runtime was not the failure source. Compilation ownership was incorrectly coupled to Stage/production deployment rather than to the bounded CI environment that already owns deployable image builds.

## Delivered ownership boundary

The delivered deployment contract is now:

- custom Caddy remains pinned to Caddy `2.11.4` plus `github.com/caddy-dns/cloudflare@v0.2.4`;
- the canonical deployable image is `ghcr.io/dja-tiger/lexigo-caddy:2.11.4-cloudflare-v0.2.4`;
- successful `main` CI owns Caddy image availability/publication in a bounded Buildx job;
- Stage and production Compose are registry-only for Caddy and contain no local Caddy `build:` owner;
- `scripts/remote-deploy.sh` pulls Caddy with the other deployment images and verifies `dns.providers.cloudflare` before startup;
- application rollback remains owned by the previous API/Web `IMAGE_TAG` and does not require rebuilding or versioning Caddy per historical application SHA;
- no daemon-wide Docker prune or other destructive host cleanup was introduced.

## Immutable-head validation

Final head `f22223a629f07fcc396e45416ea8d0828635009d` passed the complete PR CI run `32415930055`, including backend unit/security and integration, frontend core quality, both generic UI shards, visual regression, accessibility, CSP, service worker, iOS PWA, performance budgets, lesson completion, dictionary smoke, frontend aggregate, and both application container builds.

Deployment scripts check run `32415930029` also passed the deployment-specific contract end to end: source ownership checks, Compose rendering, bounded custom Caddy build, Cloudflare DNS module verification, Caddyfile validation, systemd validation, runner resource ownership, and cleanup.

The `Publish deployment Caddy` job is intentionally main-only and therefore remained skipped in PR CI.

## Exact-main validation

The squash merge produced `main@3fe5636724c2d12f55de1224218ea236bbe04440`.

Exact-main CI run `32427762951` completed successfully. In addition to the full product matrix and API/Web container publication, the new deployment boundary executed for real:

- `Publish deployment Caddy`: job `96615550305` — `success`;
- GHCR login succeeded;
- the pinned Caddy image was resolved/built/published as required;
- `dns.providers.cloudflare` verification succeeded;
- owned Caddy builder/resources were cleaned up successfully.

This main-only result proves the image required by Stage exists before the Stage workflow_run trigger becomes eligible.

## Exact-SHA Stage validation

Deploy Stage run `32428734890` checked out exact SHA `3fe5636724c2d12f55de1224218ea236bbe04440` and completed successfully:

- deployment scope: success;
- deploy job `96615953384`: success;
- deploy: success;
- public smoke: success;
- public browser: success;
- public Playwright matrix: 12/12 passed across desktop Chromium and iOS WebKit.

The raw deploy log shows `caddy Pulling` / `caddy Pulled` and then starts `ghcr.io/dja-tiger/lexigo-caddy:2.11.4-cloudflare-v0.2.4`. There is no host-local `xcaddy build` or Compose Caddy build phase in the successful deployment path.

The exact application images are also pinned to the delivered SHA:

- `ghcr.io/dja-tiger/lexigo-api:3fe5636724c2d12f55de1224218ea236bbe04440`;
- `ghcr.io/dja-tiger/lexigo-web:3fe5636724c2d12f55de1224218ea236bbe04440`.

Post-start validation reported healthy postgres, redis, API and Web services, valid Caddy configuration, healthy public frontend/API endpoints, valid certificate health, and report-only CSP public smoke.

## Acceptance outcome

Issue #633 is fully delivered rather than merely merged:

- the repeatable Stage disk-exhaustion path is removed from deployment ownership;
- Caddy compilation is CI-owned and bounded;
- remote hosts consume a pinned, verified registry artifact;
- exact-main CI is green;
- exact-SHA Stage, public smoke, and public browser validation are green;
- the successful Stage log proves the host no longer acts as the Caddy compiler.

## Repository memory

`.agents/current/TASK.md`, `PROGRESS.md`, and `EXECUTION.md` are reset byte-for-byte to the canonical repository templates in the same reconciliation commit that adds this record.

`.agents/PROJECT_STATE.md` is intentionally not rewritten through a truncated connector response. This immutable reconciliation record preserves the verified Issue #633 delivery evidence without risking historical-state loss.

## Next work

After this pure Agent Docs reconciliation passes its fail-closed lightweight CI and merges, select the next engineering slice from the live open roadmap. Do not use manual-device QA tasks as a substitute for an implementable engineering issue, and do not reopen the remote Caddy compilation boundary unless the infrastructure version contract is intentionally redesigned.
