package auth

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PostgresRepository struct {
	pool *pgxpool.Pool
}

func NewPostgresRepository(pool *pgxpool.Pool) *PostgresRepository {
	return &PostgresRepository{pool: pool}
}

func (r *PostgresRepository) Create(ctx context.Context, email, passwordHash, displayName string) (User, error) {
	var user User
	err := r.pool.QueryRow(ctx, `
		insert into users(email, password_hash, display_name)
		values ($1, $2, $3)
		returning id::text, email, display_name, password_hash, created_at
	`, email, passwordHash, displayName).Scan(
		&user.ID, &user.Email, &user.DisplayName, &user.PasswordHash, &user.CreatedAt,
	)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return User{}, ErrEmailTaken
		}
		return User{}, fmt.Errorf("insert user: %w", err)
	}
	return user, nil
}

func (r *PostgresRepository) ByEmail(ctx context.Context, email string) (User, error) {
	return r.readUser(ctx, `
		select id::text, email, display_name, password_hash, created_at
		from users where email = $1
	`, email)
}

func (r *PostgresRepository) ByID(ctx context.Context, id string) (User, error) {
	return r.readUser(ctx, `
		select id::text, email, display_name, password_hash, created_at
		from users where id = $1::uuid
	`, id)
}

func (r *PostgresRepository) readUser(ctx context.Context, query string, arg any) (User, error) {
	var user User
	err := r.pool.QueryRow(ctx, query, arg).Scan(
		&user.ID, &user.Email, &user.DisplayName, &user.PasswordHash, &user.CreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return User{}, ErrUserNotFound
	}
	if err != nil {
		return User{}, fmt.Errorf("read user: %w", err)
	}
	return user, nil
}

func (r *PostgresRepository) Store(ctx context.Context, userID string, tokenHash []byte, expiresAt time.Time, userAgent, ip string) error {
	_, err := r.pool.Exec(ctx, `
		insert into refresh_tokens(user_id, family_id, token_hash, expires_at, user_agent, ip_address)
		values ($1::uuid, gen_random_uuid(), $2, $3, $4, nullif($5, '')::inet)
	`, userID, tokenHash, expiresAt, userAgent, ip)
	if err != nil {
		return fmt.Errorf("store refresh token: %w", err)
	}
	return nil
}

func (r *PostgresRepository) Rotate(ctx context.Context, oldHash, newHash []byte, newExpiresAt time.Time, userAgent, ip string) (string, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return "", fmt.Errorf("begin token rotation: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var (
		userID    string
		familyID  string
		expiresAt time.Time
		revokedAt *time.Time
	)
	err = tx.QueryRow(ctx, `
		select user_id::text, family_id::text, expires_at, revoked_at
		from refresh_tokens
		where token_hash = $1
		for update
	`, oldHash).Scan(&userID, &familyID, &expiresAt, &revokedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrInvalidRefresh
	}
	if err != nil {
		return "", fmt.Errorf("read refresh token for rotation: %w", err)
	}

	if revokedAt != nil {
		if _, err := tx.Exec(ctx, `
			update refresh_tokens
			set revoked_at = coalesce(revoked_at, now()),
				reuse_detected_at = coalesce(reuse_detected_at, now())
			where family_id = $1::uuid
		`, familyID); err != nil {
			return "", fmt.Errorf("revoke reused refresh token family: %w", err)
		}
		if err := tx.Commit(ctx); err != nil {
			return "", fmt.Errorf("commit refresh token reuse revocation: %w", err)
		}
		return "", ErrRefreshTokenReuse
	}

	if !expiresAt.After(time.Now().UTC()) {
		if _, err := tx.Exec(ctx, `
			update refresh_tokens
			set revoked_at = coalesce(revoked_at, now())
			where token_hash = $1
		`, oldHash); err != nil {
			return "", fmt.Errorf("revoke expired refresh token: %w", err)
		}
		if err := tx.Commit(ctx); err != nil {
			return "", fmt.Errorf("commit expired refresh token revocation: %w", err)
		}
		return "", ErrInvalidRefresh
	}

	if _, err := tx.Exec(ctx, `
		update refresh_tokens
		set revoked_at = now(), replaced_by_hash = $2
		where token_hash = $1
	`, oldHash, newHash); err != nil {
		return "", fmt.Errorf("revoke old refresh token: %w", err)
	}

	if _, err := tx.Exec(ctx, `
		insert into refresh_tokens(user_id, family_id, token_hash, expires_at, user_agent, ip_address)
		values ($1::uuid, $2::uuid, $3, $4, $5, nullif($6, '')::inet)
	`, userID, familyID, newHash, newExpiresAt, userAgent, ip); err != nil {
		return "", fmt.Errorf("insert rotated refresh token: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return "", fmt.Errorf("commit token rotation: %w", err)
	}
	return userID, nil
}

func (r *PostgresRepository) Revoke(ctx context.Context, tokenHash []byte) error {
	command, err := r.pool.Exec(ctx, `
		update refresh_tokens
		set revoked_at = coalesce(revoked_at, now())
		where family_id = (
			select family_id
			from refresh_tokens
			where token_hash = $1
		)
	`, tokenHash)
	if err != nil {
		return fmt.Errorf("revoke refresh token family: %w", err)
	}
	if command.RowsAffected() == 0 {
		return ErrInvalidRefresh
	}
	return nil
}
