# Immediate access-token revocation

## Security invariant

Every access token contains the user's positive `auth_version`. Signature and expiry checks are necessary but not sufficient: before a protected handler runs, the API reads the authoritative version from PostgreSQL and requires an exact match. A deleted user or a mismatched version returns `401`; an unavailable PostgreSQL lookup returns fail-closed `503 authentication_unavailable` with `Retry-After: 1`. Protected application code is never called in either case.

The first rollout intentionally has no in-process or Redis version cache. A TTL cache would create a window in which a revoked token remained usable, while distributed invalidation would add another availability and ordering dependency. The structured access log records the authoritative lookup separately as `auth_validation_duration`, so its latency and contribution to total request time are measurable. A future cache is acceptable only if it preserves read-after-write invalidation across every API replica and has a fail-closed miss/error path.

## Credential transitions

The following transactions increment `users.auth_version`:

- password change;
- confirmed password reset;
- confirmed email change;
- revoking all other session families.

Password change and `revoke-others` preserve the current refresh-token family. All rows in that family are advanced to the new version, other families are revoked, and the response returns a replacement access token carrying the new version. The access token used to authorize the mutation and every token on another device become invalid as soon as the transaction commits.

Password reset and email confirmation revoke every refresh family. Account deletion removes the authoritative version row, so all subsequent bearer checks fail.

## Refresh-token race safety

Refresh-token rows carry the credential version under which the family was created. Store and rotation take a PostgreSQL row lock on the user before inserting a token. Critical credential transactions take the user lock before touching refresh families. This lock order prevents a concurrent login or refresh from publishing a usable old-credential family after revocation.

Rotation returns its locked credential version, and the service always signs the response with that version rather than a newer value observed after commit. If a credential transaction wins the race, the returned access token is immediately stale and cannot escape revocation. The rotated cookie still reaches a preserved current family so it can refresh once more at the new version; reset/email-change transactions revoke that family, so the same retry fails closed.

## Compatibility and operations

Access tokens issued before this migration do not contain `auth_version` and are rejected. Their normal 15-minute lifetime bounds the rollout impact; a still-valid refresh cookie obtains a versioned token through the existing session restore flow.

Operational signals:

- `401 unauthorized`: invalid signature/expiry, missing or stale version, or deleted account;
- `503 authentication_unavailable`: authoritative version lookup failed;
- `auth_validation_duration` in the structured access log measures the authoritative lookup independently from total request duration;
- repeated `503` responses require PostgreSQL health investigation, not bypassing the version check.
