# Current Task Execution

## Task

- Issue: #554
- Branch: `agent/issue-554-openpencil-self-host`
- Base SHA: `31f44c973de79d34b13cb68c8ef2f58a3be3be7d`
- Head SHA: resolve from live branch ref after this final task-state write
- PR: #555 (Draft until immutable-head gates complete)

## Instruction/harness boundary

Read before implementation writes:

- root `AGENTS.md`;
- `.agents/AGENTS.md` and every mandatory indexed `.agents/AGENTS*.md` rule;
- `.agents/SKILLS.md`;
- `.agents/PROJECT_STATE.md`;
- previous `.agents/current/**` #552 handoff;
- `docs/agent-harness.md`;
- repository `README.md` and `docs/architecture.md`;
- live Issue #554, refs, CI and Stage state;
- upstream ZSeven v0.8.2 README, Dockerfile/web-server mode, MCP HTTP/tool schemas and Cloudflare Caddy plugin token validation.

## Pre-flight record

Repository: `Dja-tiger/LexiGo`.

At task start:

- `main = 31f44c973de79d34b13cb68c8ef2f58a3be3be7d`;
- branch initially matched exact `main`;
- exact-main CI #3620 success;
- Deploy Stage #3470 success on exact base SHA;
- no open PR;
- Issue #554 was the only selected atomic slice.

Allowed/prohibited paths are recorded in `current/TASK.md`. Existing Stage/prod compose, product Caddy, product deploy workflows, frontend/backend/API, `.fig`, promoted `.op` and token source pair remained prohibited and were not modified.

## Upstream contract findings

1. v0.8.2 tagged releases publish `ghcr.io/zseven-w/openpencil-web:v0.8.2`.
2. Rust web image contains the editor web host/wasm/CanvasKit assets but not Codex/Claude/OpenCode CLI binaries.
3. Upstream Docker image serves Web on port 3100 without TLS and expects a reverse proxy for public/private HTTPS use.
4. `OPENPENCIL_WEB_ALLOWED_ORIGINS` is the exact browser-origin control.
5. Browser-entered provider credentials are localStorage-owned by default; server persistence remains disabled.
6. `op-host-web-server --mcp-http <port> <path>` is the file-backed HTTP MCP mode.
7. v0.8.2 source binds that MCP HTTP listener explicitly to `127.0.0.1:<port>`.
8. MCP `read_nodes` is active-page-scoped; the editability probe therefore selects `figma-page-21` before using `fig_6879`.
9. caddy-dns/cloudflare v0.2.4 accepts legacy 35–50 character tokens or `cfut_`/`cfat_` plus at least 32 token characters; CI uses a format-only fake token under `--network none` for Caddy provisioning validation.

## Implemented repository slice

- `deploy/openpencil/compose.yml`: standalone human/agent profiles, controlled worktree mounts, immutable v0.8.2 image, host-loopback raw Web, standalone Caddy and host-network MCP.
- `deploy/openpencil/Caddyfile`: TLS, Basic Auth, hardened browser headers, Web-only reverse proxy; no MCP route.
- `deploy/openpencil/openpencil.env.example`: non-secret host configuration with immutable image pin.
- `deploy/openpencil/container-entrypoint.sh`: atomic shared writer lock and bounded checksummed pre-start backups.
- `deploy/openpencil/session.sh`: non-main worktree preflight, start/stop/status and explicit stale-lock recovery.
- `deploy/openpencil/self-test.sh`: source/security, Web loopback, lock-conflict, MCP loopback/read/write, backup rotation and recovery smoke on a disposable copy.
- `.github/workflows/openpencil-self-host-check.yml`: path-scoped registry/runtime/Caddy/pin acceptance.
- `docs/figma/openpencil-self-host.md`: host preparation, TLS/auth, SSH-tunnel MCP, write lifecycle and rollback.

## Immutable registry identity

Authoritative workflow inspection resolved and the repository now pins:

`ghcr.io/zseven-w/openpencil-web:v0.8.2@sha256:e13982f18ba3f87ef422c84738be261a337ceccd877aff6ea69a16354fce9775`

Observed linux/amd64 child manifest:

`sha256:6553c22078f198852a1fc778af7a886e5d941bb5c83f6c1865febf52cb9c7403`

## Failure-driven corrections

The acceptance workflow was kept fail-closed and exposed three concrete assumptions that were corrected without weakening the security model:

1. Initial runtime evidence was insufficient on failure, so `self-test.sh` now always exports Compose status/log diagnostics before cleanup.
2. `read_nodes(fig_6879)` initially returned no node because the tool is active-page-scoped. The probe now discovers the 23-page list, selects `figma-page-21`, verifies `Mobile Route Label -> fig_6879`, then performs the reversible write.
3. Caddy provisioning initially rejected the short `ci-placeholder` Cloudflare token before network access. Upstream v0.2.4 token regex was inspected; CI now supplies a valid-shaped fake `cfut_...` token with the container on `--network none`.

## Authoritative accepted run

OpenPencil self-host workflow #7 / run `31926560509` is success on branch head `af4cb70d97ab3f3f7ba23477434b47e71f376949`.

Accepted runtime evidence from that pipeline:

- registry digest resolution: success;
- shell/source security contract: success;
- isolated Web/MCP smoke: success;
- Caddy Cloudflare build: success;
- authenticated Caddy configuration validation: success;
- immutable image pin comparison: success.

The MCP smoke itself reports:

- Home node: `fig_2287`;
- variables: `92`;
- pages: `23`;
- write probe page: `figma-page-21`;
- write probe node: `fig_6879`;
- disposable text mutation: restored.

Evidence artifact:

- ID `9258022406`;
- digest `sha256:026004b1af33684f93117b33a88ac2b8fd8ae8ad3c7e5df3f27650b203e757b2`.

## Final validation ladder

This EXECUTION update is the last planned developer-authored repository write for #555. After its read-back/ref check:

1. freeze the resulting branch SHA;
2. require OpenPencil self-host check green on that exact head;
3. require full repository CI green on that exact head;
4. re-run changed-path, review and unresolved-thread audit;
5. update PR metadata only if needed (no source write);
6. mark PR #555 Ready;
7. squash merge with expected-head guard;
8. verify exact-main self-host workflow and full CI after merge.

## External environment boundary

Repository implementation does not constitute a live Internet deployment. With available tools there is no authenticated design-host/VPS session, so no DNS record, Cloudflare host token, Basic Auth host secret, certificate issuance or outside-host browser verification is claimed.

Issue #554 stays open after repository merge until a real design host supplies evidence for:

- controlled non-main worktree provisioning;
- dedicated DNS and trusted TLS;
- authenticated browser access from outside the host;
- Codex access only through SSH tunneling to the host-loopback MCP endpoint.

## Rollback

Remove/stop only `deploy/openpencil` standalone services and restore the controlled design worktree from Git/backup. Product Stage/prod services are unaffected by construction.
