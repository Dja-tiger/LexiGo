# Current Task Progress

## 2026-08-20 Europe/Berlin

### Verified

- Exact-main CI for merged PR #622 is green on `main@42e4a6ad82f5ae33e8e9c1c54e8fdb21ea266907`, Report CI run `32403633294`.
- Stage deployment failed twice with the same infrastructure signature: run `32400258209` on `eeffe2e65b5c855593b9c23a46465b3f17a62f6b` and run `32404719471` on current main `42e4a6ad82f5ae33e8e9c1c54e8fdb21ea266907`.
- Both failures occur after postgres/redis/api/web pulls, during host-local custom Caddy `xcaddy build`, with `no space left on device` under Docker/Go temporary build storage.
- Issue #633 and branch `fix/stage-caddy-prebuilt-image` exist; the branch started byte-identical to current main and remains 0 behind.
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
- `.github/workflows/deploy-scripts-check.yml`: fail-closed prebuilt-Caddy ownership/version/module/rollback source contracts; existing bounded PR Caddy build remains.
- `.agents/current/**`: active slice evidence and procedure.

### Checks passed

- Source read-back confirms both Compose Caddy services have no local `build:` block.
- Source read-back confirms remote deploy pulls Caddy and verifies `dns.providers.cloudflare` through `$CADDY_IMAGE`.
- CI workflow compare showed the existing workflow preserved with only the new Caddy publication job added before Agent Docs updates.
- Deployment check read-back confirms exact tag/version/plugin and no-host-build regression assertions.

### Checks failed

- Baseline Stage runs `32400258209` and `32404719471`: infrastructure failure `no space left on device` during remote `xcaddy build`.
- No branch CI result yet; PR not opened yet.

### Current branch head

Resolve from live branch ref after final current-context write.

### Next action

Finish `.agents/current/EXECUTION.md`, verify branch diff/allowed paths and main freshness, open Draft PR, then require both full CI and Deployment scripts check on the immutable final head. Classify any workflow/source-contract failure before further code changes.
