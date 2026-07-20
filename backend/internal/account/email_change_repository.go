package account

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
)

func (r *PostgresRepository) ReplaceEmailChange(
	ctx context.Context,
	userID,
	oldEmail,
	newEmail string,
	tokenHash []byte,
	createdAt,
	expiresAt time.Time,
	userAgent,
	ip string,
) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin email change request: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var targetExists bool
	if err := tx.QueryRow(ctx, `
		select exists (
			select 1
			from users
			where email = $2
			  and id <> $1::uuid
		)
	`, userID, newEmail).Scan(&targetExists); err != nil {
		return fmt.Errorf("check email change target: %w", err)
	}
	if targetExists {
		return ErrEmailTaken
	}

	if _, err := tx.Exec(ctx, `
		update account_email_change_tokens
		set used_at = coalesce(used_at, $2)
		where user_id = $1::uuid
		  and used_at is null
	`, userID, createdAt); err != nil {
		return fmt.Errorf("invalidate previous email change tokens: %w", err)
	}

	if _, err := tx.Exec(ctx, `
		insert into account_email_change_tokens(
			user_id,
			old_email,
			new_email,
			token_hash,
			expires_at,
			created_at,
			user_agent,
			ip_address
		)
		values (
			$1::uuid,
			$2,
			$3,
			$4,
			$5,
			$6,
			$7,
			nullif($8, '')::inet
		)
	`, userID, oldEmail, newEmail, tokenHash, expiresAt, createdAt, userAgent, ip); err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return ErrEmailTaken
		}
		return fmt.Errorf("insert email change token: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit email change request: %w", err)
	}
	return nil
}

func (r *PostgresRepository) CancelEmailChange(
	ctx context.Context,
	tokenHash []byte,
	cancelledAt time.Time,
) error {
	_, err := r.pool.Exec(ctx, `
		update account_email_change_tokens
		set used_at = coalesce(used_at, $2)
		where token_hash = $1
	`, tokenHash, cancelledAt)
	if err != nil {
		return fmt.Errorf("cancel email change token: %w", err)
	}
	return nil
}

func (r *PostgresRepository) ConsumeEmailChange(
	ctx context.Context,
	tokenHash []byte,
	confirmedAt time.Time,
	userAgent,
	ip string,
) (EmailChangeResult, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return EmailChangeResult{}, fmt.Errorf("begin email change confirmation: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var (
		result    EmailChangeResult
		expiresAt time.Time
		usedAt    *time.Time
	)
	err = tx.QueryRow(ctx, `
		select
			user_id::text,
			old_email,
			new_email,
			expires_at,
			used_at
		from account_email_change_tokens
		where token_hash = $1
		for update
	`, tokenHash).Scan(
		&result.UserID,
		&result.OldEmail,
		&result.NewEmail,
		&expiresAt,
		&usedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return EmailChangeResult{}, ErrInvalidEmailChange
	}
	if err != nil {
		return EmailChangeResult{}, fmt.Errorf("read email change token: %w", err)
	}
	if usedAt != nil || !expiresAt.After(confirmedAt) {
		return EmailChangeResult{}, ErrInvalidEmailChange
	}

	err = tx.QueryRow(ctx, `
		update users
		set email = $3,
			updated_at = $4
		where id = $1::uuid
		  and email = $2
		returning display_name
	`, result.UserID, result.OldEmail, result.NewEmail, confirmedAt).Scan(&result.DisplayName)
	if errors.Is(err, pgx.ErrNoRows) {
		return EmailChangeResult{}, ErrInvalidEmailChange
	}
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return EmailChangeResult{}, ErrEmailTaken
		}
		return EmailChangeResult{}, fmt.Errorf("update account email: %w", err)
	}

	if _, err := tx.Exec(ctx, `
		update account_email_change_tokens
		set used_at = coalesce(used_at, $2)
		where user_id = $1::uuid
		  and used_at is null
	`, result.UserID, confirmedAt); err != nil {
		return EmailChangeResult{}, fmt.Errorf("consume email change tokens: %w", err)
	}

	if _, err := tx.Exec(ctx, `
		update refresh_tokens
		set revoked_at = coalesce(revoked_at, $2)
		where user_id = $1::uuid
		  and revoked_at is null
	`, result.UserID, confirmedAt); err != nil {
		return EmailChangeResult{}, fmt.Errorf("revoke sessions after email change: %w", err)
	}

	metadata, err := json.Marshal(map[string]string{
		"oldEmail": result.OldEmail,
		"newEmail": result.NewEmail,
	})
	if err != nil {
		return EmailChangeResult{}, fmt.Errorf("encode email change audit metadata: %w", err)
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
		values (
			$1::uuid,
			'email_changed',
			$2,
			nullif($3, '')::inet,
			$4::jsonb,
			$5
		)
	`, result.UserID, userAgent, ip, string(metadata), confirmedAt); err != nil {
		return EmailChangeResult{}, fmt.Errorf("insert email change audit event: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return EmailChangeResult{}, fmt.Errorf("commit email change confirmation: %w", err)
	}
	return result, nil
}
