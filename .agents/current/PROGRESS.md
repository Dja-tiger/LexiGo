# Current Task Progress

## 2026-08-16 Europe/Moscow

### Identity

- Issue: #554.
- Branch: `agent/issue-554-openpencil-self-host`.
- Base SHA: `31f44c973de79d34b13cb68c8ef2f58a3be3be7d`.
- PR: #555 (Draft).
- Product runtime is out of scope.

### Verified baseline

- PR #553 merged OpenPencil source promotion into `main` at `31f44c973de79d34b13cb68c8ef2f58a3be3be7d`.
- Exact-main CI #3620 is success.
- Deploy Stage run #3470 is success on the same SHA.
- Active `.op` SHA-256: `5380a0468d4e369d91ac190b829e01f60ff43493f6a76c9300c6b58d0b34d664`.
- Active token sidecar SHA-256: `e603d86f3d4ef470c39fd72c31433e6a124bb9371da6f333567cd3aa796ae05c`.

### Upstream self-host contract verified

Pinned product version remains `ZSeven-W/openpencil` v0.8.2.

Verified from upstream v0.8.2 source/release contract:

- tagged release publishes `ghcr.io/zseven-w/openpencil-web:v0.8.2`;
- image contains Rust web host + wasm/CanvasKit assets, not Codex/Claude/OpenCode CLI binaries;
- Web host uses port `3100` and requires an external TLS/auth boundary for an Internet-reachable deployment;
- exact browser origins are configured with `OPENPENCIL_WEB_ALLOWED_ORIGINS`;
- server-side persistence of browser-entered provider credentials is optional and is disabled in the LexiGo stack;
- `op-host-web-server --mcp-http <port> <path>` runs a file-backed MCP service;
- v0.8.2 `run_http` explicitly binds `127.0.0.1:<port>`;
- `read_nodes` is active-page-scoped, so the disposable write probe must select `figma-page-21` before reading/writing `fig_6879`.

### Immutable image identity

Authoritative GHCR inspection resolved:

- OCI index: `sha256:e13982f18ba3f87ef422c84738be261a337ceccd877aff6ea69a16354fce9775`;
- linux/amd64 manifest: `sha256:6553c22078f198852a1fc778af7a886e5d941bb5c83f6c1865febf52cb9c7403`.

Both `deploy/openpencil/compose.yml` and `deploy/openpencil/openpencil.env.example` now pin the OCI index as:

`ghcr.io/zseven-w/openpencil-web:v0.8.2@sha256:e13982f18ba3f87ef422c84738be261a337ceccd877aff6ea69a16354fce9775`

### Repository implementation completed

- Standalone `deploy/openpencil/**`; existing Stage/prod Compose and product Caddy are unchanged.
- Human Web raw port is host-loopback only; public browser path exists only through standalone Caddy TLS + Basic Auth.
- Agent MCP uses host networking solely to preserve upstream host-loopback binding; no Docker port or Caddy MCP route exists.
- Shared atomic writer lock blocks concurrent human/agent sessions even if an operator bypasses the wrapper and calls Compose directly.
- Every writer session creates a checksummed backup before OpenPencil starts; rotation is bounded and keep count must be >=1.
- Operator wrapper requires a non-main Git worktree, immutable image pin and explicit stale-lock recovery.
- Documentation defines SSH tunnel MCP access and the normal branch/PR review lifecycle.

### Authoritative acceptance

OpenPencil self-host workflow #7, run `31926560509`, is fully green on branch head `af4cb70d97ab3f3f7ba23477434b47e71f376949`.

It proves:

- shell/source security checks pass;
- Compose parses and product deployment remains isolated;
- Web starts through raw host loopback only;
- concurrent second writer is rejected;
- MCP binds host `127.0.0.1` only;
- Home node `fig_2287` is readable;
- exactly 92 runtime variables are visible;
- 23 pages are visible;
- active page switches to `figma-page-21`;
- `fig_6879` can be changed to `ОБУЧЕНИЕ · MCP SMOKE`, verified and restored on a disposable worktree copy;
- canonical source hashes remain unchanged;
- backup rotation and stale-lock recovery pass;
- Cloudflare-enabled Caddy image builds successfully;
- the real Caddy configuration provisions successfully with Basic Auth and a valid-shaped format-only Cloudflare token under `--network none`;
- checked-in image pin equals the registry-resolved immutable digest.

Run #7 evidence artifact:

- artifact ID: `9258022406`;
- artifact digest: `sha256:026004b1af33684f93117b33a88ac2b8fd8ae8ad3c7e5df3f27650b203e757b2`.

### Remaining repository gates

1. Finish factual `.agents/current/**` update and stop writes.
2. Require OpenPencil self-host workflow green again on the final developer-authored head.
3. Require full repository CI green on the same final head.
4. Re-run changed-path/review/thread audit.
5. Mark PR #555 Ready and squash merge with expected-head guard.
6. Verify exact-main self-host workflow + repository CI.

### External host boundary

A real host has not been provisioned through the available tools. Do not claim live deployment yet. After repository merge, Issue #554 remains open for environment evidence:

- dedicated design host/worktree provisioned;
- DNS + Cloudflare token configured out-of-repo;
- trusted TLS issued;
- Basic Auth verified from outside the host;
- Codex reaches MCP only through the approved SSH tunnel to host loopback.
