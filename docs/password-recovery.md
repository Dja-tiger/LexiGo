# Password recovery

LexiGo password recovery uses a one-time bearer token delivered outside the browser session.

## Public flow

1. The client sends `POST /api/v1/auth/password-reset/request` with an email address.
2. The API always returns `202 {"accepted":true}` for a valid JSON request, regardless of whether the account exists or delivery succeeds. This prevents account enumeration.
3. For an existing account, the API generates 32 random bytes, encodes them with base64url and stores only the SHA-256 digest in PostgreSQL.
4. The raw token is placed in the URL fragment as `#reset_token=...` and delivered by SMTP. Fragments are not sent in HTTP requests or Referer headers.
5. The client submits the token and new password to `POST /api/v1/auth/password-reset/confirm`.
6. PostgreSQL locks and consumes the token, updates the bcrypt password hash, invalidates every unused reset token for that user and revokes all refresh-token families in one transaction.
7. The user signs in again with the new password.

## Security properties

- reset tokens are single-use and expire after `PASSWORD_RESET_TTL`;
- only token digests are persisted;
- an issued token replaces all previous unused tokens for the account;
- successful reset revokes sessions on every device;
- request and confirm endpoints are rate-limited independently by source IP;
- request responses do not reveal account existence;
- reset responses use stable error codes and optional field metadata;
- the frontend reads the token from the URL fragment into component memory and immediately removes fragment/query credentials with `history.replaceState`; legacy query links remain readable for rollout compatibility;
- after success the token is removed from browser history with `replaceState`;
- production requires SMTP delivery; logging the bearer URL is allowed only in local/test environments.

## Configuration

Required outside local/test:

- `PASSWORD_RESET_DELIVERY=smtp`;
- `PASSWORD_RESET_TTL`, normally `30m`;
- `SMTP_HOST` and `SMTP_PORT`;
- optional `SMTP_USERNAME` and `SMTP_PASSWORD`, configured together;
- `SMTP_FROM` with a valid mailbox;
- `SMTP_TIMEOUT`.

The SMTP implementation expects a submission server that supports STARTTLS. Credentials and reset URLs must not be written to application logs.

The public request endpoint intentionally remains `202 Accepted` when SMTP delivery fails. Operators must detect delivery incidents through structured server logs and SMTP monitoring rather than exposing account existence or delivery status to the caller.

## Operations

Monitor:

- reset request count and `429 rate_limited` responses;
- SMTP connection, TLS and authentication failures;
- reset confirmation failures by stable error code;
- reset completion count;
- unexpected growth of expired unused rows.

Expired rows may be deleted by a periodic maintenance task after a retention period suitable for security investigation. Active token validation does not depend on cleanup timing.
