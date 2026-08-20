# Current Task Progress

## 2026-08-20 Europe/Berlin

### Verified

- Exact-main CI for merged PR #622 is green on `main@42e4a6ad82f5ae33e8e9c1c54e8fdb21ea266907`, Report CI run `32403633294`.
- Stage deployment failed twice with the same infrastructure signature: run `32400258209` on `eeffe2e65b5c855593b9c23a46465b3f17a62f6b` and run `32404719471` on current main `42e4a6ad82f5ae33e8e9c1c54e8fdb21ea266907`.
- Both failures occur after postgres/redis/api/web pulls, during host-local custom Caddy `xcaddy build`, with `no space left on device` under Docker/Go temporary build storage.
- Issue #633 and Draft PR #634 use branch `fix/stage-caddy-prebuilt-image`, based on exact current main and 0 behind at PR creation.
- Current Caddy contract is `2.11.4` + `caddy-dns/cloudflare@v0.2.4`.

### Finding

The deployment host owns an unnecessary heavyweight compiler boundary. Both Stage and production Compose declared a local Caddy `build:` block, and `scripts/remote-deploy.sh` explicitly rebuilt Caddy on every deploy even though CI already provides bounded Buildx ownership and GHCR publication for deployable images.

### Root cause

Custom Caddy compilation was coupled to every remote deploy instead of being a CI artifact. The repeated Go dependency graph build exhausts deployment-host Docker/temp storage before Compose startup; application images are not the failure source.

### Changed files

- `deploy/compose/docker-compose.stage.yml`: Caddy now uses pinned GHCR image; local build removed.
- `deploy/compose/docker-compose.prod.yml`: same registry-only Caddy ownership.
- `scripts/remote-deploy.sh`: canonical Caddy image tag, pull `caddy`, module verification against pulled image, no host-local build.
- `.github/workflows/ci.yml`: main-only `Publish deployment Caddy` gate after app container builds; PRs do not publish.
- `.github/workflows/deploy-scripts-check.yml`: fail-closed prebuilt-Caddy ownership/version/module/rollback source contracts; existing bounded PR Caddy build remains; only the exact documented OpenPencil placeholder is exempted from the token-like source scan.
- `scripts/ci/runner_policy_test.py`: configurable CI runner count updated from eight to nine for the new bounded Caddy job; all existing runner restrictions remain.
- `.agents/current/**`: active slice evidence and procedure.

### Checks passed

- Source read-back confirms both Compose Caddy services have no local `build:` block.
- Source read-back confirms remote deploy pulls Caddy and verifies `dns.providers.cloudflare` through `$CADDY_IMAGE`.
- CI workflow compare showed the existing workflow preserved with only the new Caddy publication job added before Agent Docs updates.
- Deployment check read-back confirms exact tag/version/plugin and no-host-build regression assertions.
- PR #634 Deployment scripts check runs `32415181203` and `32415432178`: Bash syntax, public-smoke tests, frontend-container tests, HTTP-readiness tests, runner cleanup tests and runner ownership invariants passed before validator defects were diagnosed.
- Run `32415432178` progressed through all new Caddy ownership assertions, including the literal-safe `tags: ${{ env.CADDY_IMAGE }}` source contract, before reaching the pre-existing broad Cloudflare token-like scan.
- On head `f8a15a354149d3602c0ac41bc9dd176ed3e6c557`, Deployment scripts check run `32415730457` passed deployment source contracts and Compose rendering, then entered the actual bounded custom Caddy build.

### Checks failed and repaired

- Baseline Stage runs `32400258209` and `32404719471`: infrastructure failure `no space left on device` during remote `xcaddy build`.
- PR #634 Deployment scripts check run `32415181203` failed because GitHub Actions interpolated the literal `${{ env.CADDY_IMAGE }}` inside a grep assertion. Repair: construct the exact source needle inside Python from separate string fragments; no assertion was removed or weakened.
- PR #634 Deployment scripts check run `32415432178`, job `96575385947`, exposed a pre-existing false positive: `deploy/openpencil/openpencil.env.example` intentionally contains `CLOUDFLARE_API_TOKEN=REPLACE_ON_HOST`. Repair: require that exact placeholder and exempt only that exact file/line-content shape; fail on every other token-like match.
- PR #634 full CI run `32415727101` on `f8a15a354149d3602c0ac41bc9dd176ed3e6c557` then failed in `Frontend core quality` at `Validate CI runner policy` before npm work. Exact policy source required `ci.yml` to contain eight configurable runner jobs; adding the bounded `Publish deployment Caddy` job correctly raises the count to nine. Repair: update only that regression count/message to nine; existing requirements for configurable hosted runners, no hard-coded self-hosted labels, unrestricted matrices and no shared-host cleanup remain unchanged.

### Current branch head

Resolve from live branch ref after the final `.agents/current/EXECUTION.md` write. That head is immutable for acceptance; any further implementation change requires a new full CI verdict.

### Next action

Run both full CI and Deployment scripts check on the final developer-authored head. Deployment scripts check must pass source contracts, Compose rendering, bounded custom Caddy build, Cloudflare module verification, Caddyfile validation and systemd validation. Full CI must pass runner policy plus the complete backend/frontend/browser/container matrix; the main-only Caddy publish job must remain skipped on PR. If both workflows are green, audit reviews/threads and fresh main, mark Ready, squash merge with expected head SHA, then require exact-main CI and exact-SHA Stage/public smoke/public browser success.
