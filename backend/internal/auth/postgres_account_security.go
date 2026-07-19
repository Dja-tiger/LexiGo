package auth

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
)

func (r *PostgresRepository) ActiveSessions(
	ctx context.Context,
	userID string,
	currentTokenHash []byte,
	now time.Time,
) ([]AccountSession, error) {
	currentFamilyID, err := r.currentActiveFamily(ctx, r.pool, userID, currentTokenHash, now, false)
	if err != nil {
		return nil, err
	}

	rows, err := r.pool.Query(ctx, `
		with active_tokens as (
			select family_id, created_at, expires_at, user_agent, ip_address
			from refresh_tokens
			where user_id = $1::uuid
			  and revoked_at is null
			  and expires_at > $2
		), family_summary as (
			select
				family_id,
				min(created_at) as created_at,
				max(created_at) as last_seen_at,
				max(expires_at) as expires_at
			from active_tokens
			group by family_id
		), latest_device as (
			select distinct on (family_id)
				family_id,
				user_agent,
				coalesce(ip_address::text, '') as ip_address
			from active_tokens
			order by family_id, created_at desc
		)
		select
			family_summary.family_id::text,
			family_summary.family_id = $3::uuid as current,
			latest_device.user_agent,
			latest_device.ip_address,
			family_summary.created_at,
			family_summary.last_seen_at,
			family_summary.expires_at
		from family_summary
		join latest_device using (family_id)
		order by current desc, family_summary.last_seen_at desc
	`, userID, now, currentFamilyID)
	if err != nil {
		return nil, fmt.Errorf("query active account sessions: %w", err)
	}
	defer rows.Close()

	sessions := make([]AccountSession, 0, 4)
	for rows.Next() {
		var session AccountSession
		if err := rows.Scan(
			&session.ID,
			&session.Current,
			&session.UserAgent,
			&session.IPAddress,
			&session.CreatedAt,
			&session.LastSeenAt,
			&session.ExpiresAt,
		); err != nil {
			return nil, fmt.Errorf("scan active account session: %w", err)
		}
		sessions = append(sessions, session)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate active account sessions: %w", err)
	}
	return sessions, nil
}

func (r *PostgresRepository) ChangePasswordAndRevokeOtherSessions(
	ctx context.Context,
	userID string,
	currentTokenHash []byte,
	passwordHash string,
	now time.Time,
	userAgent,
	ip string,
) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin password change: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	currentFamilyID, err := r.currentActiveFamily(ctx, tx, userID, currentTokenHash, now, true)
	if err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `
		update users
		set password_hash = $2, updated_at = $3
		where id = $1::uuid
	`, userID, passwordHash, now); err != nil {
		return fmt.Errorf("update account password: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		update password_reset_tokens
		set used_at = coalesce(used_at, $2)
		where user_id = $1::uuid and used_at is null
	`, userID, now); err != nil {
		return fmt.Errorf("invalidate password reset tokens after password change: %w", err)
	}
	revoked, err := tx.Exec(ctx, `
		update refresh_tokens
		set revoked_at = coalesce(revoked_at, $3)
		where user_id = $1::uuid
		  and family_id <> $2::uuid
		  and revoked_at is null
	`, userID, currentFamilyID, now)
	if err != nil {
		return fmt.Errorf("revoke other sessions after password change: %w", err)
	}
	if err := r.insertAccountAudit(
		ctx,
		tx,
		userID,
		AuditPasswordChanged,
		userAgent,
		ip,
		map[string]any{"revokedRefreshTokens": revoked.RowsAffected()},
		now,
	); err != nil {
		return err
	}
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit password change: %w", err)
	}
	return nil
}

func (r *PostgresRepository) RevokeOtherSessions(
	ctx context.Context,
	userID string,
	currentTokenHash []byte,
	now time.Time,
	userAgent,
	ip string,
) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin other-session revocation: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	currentFamilyID, err := r.currentActiveFamily(ctx, tx, userID, currentTokenHash, now, true)
	if err != nil {
		return err
	}
	revoked, err := tx.Exec(ctx, `
		update refresh_tokens
		set revoked_at = coalesce(revoked_at, $3)
		where user_id = $1::uuid
		  and family_id <> $2::uuid
		  and revoked_at is null
	`, userID, currentFamilyID, now)
	if err != nil {
		return fmt.Errorf("revoke other account sessions: %w", err)
	}
	if err := r.insertAccountAudit(
		ctx,
		tx,
		userID,
		AuditOtherSessionsRevoked,
		userAgent,
		ip,
		map[string]any{"revokedRefreshTokens": revoked.RowsAffected()},
		now,
	); err != nil {
		return err
	}
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit other-session revocation: %w", err)
	}
	return nil
}

func (r *PostgresRepository) RecentAccountAudit(
	ctx context.Context,
	userID string,
	limit int,
) ([]AccountAuditEvent, error) {
	rows, err := r.pool.Query(ctx, `
		select
			id,
			event_type,
			user_agent,
			coalesce(ip_address::text, ''),
			metadata::text,
			created_at
		from account_audit_events
		where user_id = $1::uuid
		order by created_at desc, id desc
		limit $2
	`, userID, limit)
	if err != nil {
		return nil, fmt.Errorf("query account audit events: %w", err)
	}
	defer rows.Close()

	events := make([]AccountAuditEvent, 0, limit)
	for rows.Next() {
		var (
			event       AccountAuditEvent
			metadataRaw string
		)
		if err := rows.Scan(
			&event.ID,
			&event.Type,
			&event.UserAgent,
			&event.IPAddress,
			&metadataRaw,
			&event.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan account audit event: %w", err)
		}
		event.Metadata = map[string]string{}
		var generic map[string]any
		if err := json.Unmarshal([]byte(metadataRaw), &generic); err != nil {
			return nil, fmt.Errorf("decode account audit metadata: %w", err)
		}
		for key, value := range generic {
			event.Metadata[key] = fmt.Sprint(value)
		}
		events = append(events, event)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterate account audit events: %w", err)
	}
	return events, nil
}

type accountSecurityQuerier interface {
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
}

func (r *PostgresRepository) currentActiveFamily(
	ctx context.Context,
	querier accountSecurityQuerier,
	userID string,
	currentTokenHash []byte,
	now time.Time,
	lock bool,
) (string, error) {
	query := `
		select family_id::text
		from refresh_tokens
		where user_id = $1::uuid
		  and token_hash = $2
		  and revoked_at is null
		  and expires_at > $3
	`
	if lock {
		query += " for update"
	}
	var familyID string
	err := querier.QueryRow(ctx, query, userID, currentTokenHash, now).Scan(&familyID)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrCurrentSessionNotFound
	}
	if err != nil {
		return "", fmt.Errorf("resolve current refresh-token family: %w", err)
	}
	return familyID, nil
}

func (r *PostgresRepository) insertAccountAudit(
	ctx context.Context,
	tx pgx.Tx,
	userID,
	eventType,
	userAgent,
	ip string,
	metadata map[string]any,
	createdAt time.Time,
) error {
	encodedMetadata, err := json.Marshal(metadata)
	if err != nil {
		return fmt.Errorf("encode account audit metadata: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		insert into account_audit_events(
			user_id,
			event_type,
			user_agent,
			ip_address,
			metadata,
			created_at
		)
		values ($1::uuid, $2, $3, nullif($4, '')::inet, $5::jsonb, $6)
	`, userID, eventType, userAgent, ip, string(encodedMetadata), createdAt); err != nil {
		return fmt.Errorf("insert account audit event: %w", err)
	}
	return nil
}
