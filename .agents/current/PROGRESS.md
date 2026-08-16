# Current Task Progress

## 2026-08-16 Europe/Moscow

### Identity

- Issue: #554.
- Branch: `agent/issue-554-openpencil-self-host`.
- Base SHA: `31f44c973de79d34b13cb68c8ef2f58a3be3be7d`.
- PR: not opened yet.
- Product runtime is out of scope.

### Verified baseline

- PR #553 merged OpenPencil source promotion into `main` at `31f44c973de79d34b13cb68c8ef2f58a3be3be7d`.
- Exact-main CI #3620 is success.
- Deploy Stage run #3470 is success on the same SHA.
- No open PR existed at task start.
- Active `.op` SHA-256: `5380a0468d4e369d91ac190b829e01f60ff43493f6a76c9300c6b58d0b34d664`.
- Active token sidecar SHA-256: `e603d86f3d4ef470c39fd72c31433e6a124bb9371da6f333567cd3aa796ae05c`.

### Upstream self-host contract verified

Pinned product version remains `ZSeven-W/openpencil` v0.8.2.

Verified from upstream v0.8.2 source/release contract:

- tagged release publishes `ghcr.io/zseven-w/openpencil-web:v0.8.2`;
- image contains Rust web host + wasm/CanvasKit assets, not Codex/Claude/OpenCode CLI binaries;
- Web host uses port `3100` and requires an external TLS/auth boundary for an Internet-reachable deployment;
- exact browser origins are configured with `OPENPENCIL_WEB_ALLOWED_ORIGINS`;
- server-side persistence of browser-entered provider credentials is optional and must remain disabled for LexiGo by default;
- `op-host-web-server --mcp-http <port> <path>` runs a file-backed MCP service;
- v0.8.2 `run_http` explicitly binds `127.0.0.1:<port>`.

### Chosen architecture

- Standalone `deploy/openpencil/**`; no edit to existing Stage/prod compose or product Caddy.
- Dedicated design host/worktree; canonical `main` checkout is not edited in place.
- Human mode: OpenPencil Web + standalone Caddy; raw `3100` additionally host-loopback only for health diagnostics.
- Agent mode: same upstream image with `network_mode: host` so MCP's upstream `127.0.0.1` bind remains host-loopback-only.
- Human/agent modes are mutually exclusive through an operator session lock.
- A bounded backup is created before every write session.
- Design changes return through Git branch/PR; no automatic merge.

### Image digest status

The public v0.8.2 tag is verified, but the immutable GHCR manifest digest is not yet recorded. GitHub connector lacks `read:packages`; local container runtime/network access is unavailable. The path-scoped CI will therefore resolve the registry digest from the real runner, after which the deployment definition will be updated to the immutable digest before Ready.

### Next implementation steps

1. Add standalone Compose/Caddy/env example.
2. Add session-lock/backup/operator scripts.
3. Add source/security/runtime smoke and path-scoped workflow.
4. Open Draft PR to obtain authoritative GHCR digest and runtime evidence.
5. Pin digest, rerun immutable-head checks, then complete review/merge gates.
