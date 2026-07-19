# Cloudflare HTTPS deployment

LexiGo uses Caddy with the Cloudflare DNS provider to obtain and renew public ACME certificates for both the frontend and API hostnames. Certificate state is stored in the persistent Caddy data volume and survives application redeployments.

## GitHub Environments

Configure these values separately under **Settings → Environments → stage** and **production**.

Environment secret:

- `CLOUDFLARE_API_TOKEN` — a scoped Cloudflare API token with `Zone:Zone:Read` and `Zone:DNS:Edit` for the `prooty-ty.com` zone.

Environment variables:

- `PUBLIC_URL` — frontend HTTPS origin without a trailing slash;
- `API_PUBLIC_URL` — API HTTPS origin without a trailing slash;
- `ACME_EMAIL` — operational email used by the ACME account;
- `DEPLOY_PATH` — existing deployment path below `/opt`.

Expected values:

| Environment | `PUBLIC_URL` | `API_PUBLIC_URL` |
| --- | --- | --- |
| `stage` | `https://lexigo-dev.prooty-ty.com` | `https://api.lexigo-dev.prooty-ty.com` |
| `production` | `https://lexigo.prooty-ty.com` | `https://api.lexigo.prooty-ty.com` |

The Cloudflare token must never be stored in an application `.env` file or committed to the repository. The deployment writes it only to a root-owned Caddy-specific environment file with mode `0600`.

## Certificate lifecycle

Caddy performs initial issuance and managed renewal through the DNS-01 challenge. The Compose stack preserves `/data` and `/config` in named volumes.

Each deployment also installs:

- `/usr/local/sbin/lexigo-certificate-health`;
- `lexigo-certificate-health@.service`;
- `lexigo-certificate-health@.timer`.

The timer runs twice daily. It validates both hostnames, confirms the certificate hostname and requires more than 21 days of remaining validity. If validation fails or expiry is near, it rebuilds/restarts only Caddy, waits for managed renewal and checks both endpoints again. Persistent failures are written to the system journal and produce a failed systemd unit.

Useful server commands:

```bash
systemctl status lexigo-certificate-health@stage.timer
systemctl status lexigo-certificate-health@prod.timer
systemctl start lexigo-certificate-health@stage.service
systemctl start lexigo-certificate-health@prod.service
journalctl -u lexigo-certificate-health@stage.service
journalctl -u lexigo-certificate-health@prod.service
```

After switching an installed iOS PWA from an IP/HTTP origin to the HTTPS hostname, remove the old home-screen shortcut and install it again from the HTTPS URL. Browser storage and cookies are scoped to the origin.
