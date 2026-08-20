# Current Task

## Identity

- Issue: #633 — fix(deploy): stop rebuilding custom Caddy on Stage/production hosts
- Branch: `fix/stage-caddy-prebuilt-image`
- Base SHA: `42e4a6ad82f5ae33e8e9c1c54e8fdb21ea266907`
- Head SHA: resolve from live branch ref
- PR: pending

## Objective

Move the custom Caddy build off Stage/production hosts. CI owns compilation and GHCR publication of the exact Caddy 2.11.4 + Cloudflare DNS plugin v0.2.4 image; deployment hosts only pull and verify that image.

## Scope

- Publish/verify a pinned custom Caddy image from successful main CI before Deploy Stage can run.
- Make Stage/production Compose registry-only for Caddy.
- Make remote deployment pull and verify Caddy instead of running `xcaddy`/Compose build.
- Add fail-closed deployment source contracts.
- Preserve application image rollback semantics.

## Non-goals

- No application, API, frontend, design or database changes.
- No Caddyfile, CSP or security-header changes.
- No Caddy/plugin version upgrades.
- No daemon-wide Docker prune or destructive host cleanup.
- No production deployment redesign beyond Caddy image ownership.

## Allowed paths

- `.github/workflows/ci.yml`
- `.github/workflows/deploy-scripts-check.yml`
- `deploy/compose/docker-compose.stage.yml`
- `deploy/compose/docker-compose.prod.yml`
- `scripts/remote-deploy.sh`
- `.agents/current/TASK.md`
- `.agents/current/PROGRESS.md`
- `.agents/current/EXECUTION.md`

## Prohibited paths

- Application/backend/frontend runtime and tests unrelated to deployment.
- `deploy/Caddyfile` and `deploy/caddy/Dockerfile` content/version changes.
- Secrets/environment credentials.
- Host-wide Docker cleanup commands.

## Runtime owners

- `.github/workflows/ci.yml` owns main CI image availability before the Stage workflow_run trigger.
- `deploy/compose/docker-compose.stage.yml` and `docker-compose.prod.yml` own registry image selection.
- `scripts/remote-deploy.sh` owns remote pull, module verification, Compose startup and app-image rollback.

## Documentation owners

- `.agents/current/**` records this atomic delivery slice.

## Invariants

- Custom Caddy remains exactly 2.11.4 with `caddy-dns/cloudflare@v0.2.4`.
- Deploy host never compiles Caddy.
- App `IMAGE_TAG` stays immutable per deployment; rollback changes only app api/web tag.
- Caddy registry tag is independent from historical app SHAs.
- Existing Cloudflare/CSP/TLS/readiness behavior remains unchanged.
- No destructive Docker cleanup is introduced.

## Acceptance criteria

- PR deployment check builds custom Caddy in bounded CI and verifies `dns.providers.cloudflare`.
- Main CI guarantees `ghcr.io/dja-tiger/lexigo-caddy:2.11.4-cloudflare-v0.2.4` exists and verifies the module before CI completes.
- Stage/prod Compose contain no local `build:` owner.
- Remote deployment pulls `caddy` and contains no `build --pull caddy`/`xcaddy build`.
- Deployment source contracts reject regression to host-local build ownership.
- Full immutable-head CI and deployment scripts check are green.
- Review/thread audit is clean; squash merge uses expected head SHA.
- Exact-main CI is green.
- Exact-SHA Stage deploy, public smoke and public browser checks pass with no host-local Caddy build.

## Required checks

- Deployment scripts check, including Compose render and custom Caddy module/Caddyfile validation.
- Full repository CI on immutable PR head.
- Exact-main CI after merge.
- Exact-main Stage/public smoke/public browser validation.

## Risks

- GHCR permissions/tag availability could block Stage before any remote service change.
- A workflow dependency mistake could let Stage race the initial Caddy publication.
- Compose/remote tag drift could make module verification inspect a different image than deployment.

## Rollback

Revert this slice to the previous host-local Caddy build ownership only as an emergency repository rollback after preserving failure evidence; do not compensate with host-wide prune. Application rollback continues to use the existing previous `IMAGE_TAG` path.
