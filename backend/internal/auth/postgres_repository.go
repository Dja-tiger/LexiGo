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

const refreshRotationGrace = 10 * time.Second

type PostgresRepository struct {
	pool *pgxpool.Pool
	now  func() time.Time
}

func NewPostgresRepository(pool *pgxpool.Pool) *PostgresRepository {
	return &PostgresRepository{pool: pool, now: time.Now}
}

func (r *PostgresRepository) Create(ctx context.Context, email, passwordHash, displayName string) (User, error) {
	var user User
	err := r.pool.QueryRow(ctx, `
		insert into users(email, password_hash, display_name)
		values ($1, $2, $3)
		returning id::text, email, display_name, password_hash, auth_version, created_at
	`, email, passwordHash, displayName).Scan(
		&user.ID, &user.Email, &user.DisplayName, &user.PasswordHash, &user.AuthVersion, &user.CreatedAt,
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
		select id::text, email, display_name, password_hash, auth_version, created_at
		from users where email = $1
	`, email)
}

func (r *PostgresRepository) ByID(ctx context.Context, id string) (User, error) {
	return r.readUser(ctx, `
		select id::text, email, display_name, password_hash, auth_version, created_at
		from users where id = $1::uuid
	`, id)
}

func (r *PostgresRepository) readUser(ctx context.Context, query string, arg any) (User, error) {
	var user User
	err := r.pool.QueryRow(ctx, query, arg).Scan(
		&user.ID, &user.Email, &user.DisplayName, &user.PasswordHash, &user.AuthVersion, &user.CreatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return User{}, ErrUserNotFound
	}
	if err != nil {
		return User{}, fmt.Errorf("read user: %w", err)
	}
	return user, nil
}

func (r *PostgresRepository) AuthVersion(ctx context.Context, id string) (int64, error) {
	var version int64
	err := r.pool.QueryRow(ctx, `
		select auth_version
		from users
		where id = $1::uuid
	`, id).Scan(&version)
	if errors.Is(err, pgx.ErrNoRows) {
		return 0, ErrUserNotFound
	}
	if err != nil {
		return 0, fmt.Errorf("read user auth version: %w", err)
	}
	return version, nil
}

func (r *PostgresRepository) Store(
	ctx context.Context,
	userID string,
	authVersion int64,
	tokenHash []byte,
	expiresAt time.Time,
	userAgent,
	ip string,
) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin refresh token store: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var currentVersion int64
	err = tx.QueryRow(ctx, `
		select auth_version
		from users
		where id = $1::uuid
		for share
	`, userID).Scan(&currentVersion)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrInvalidRefresh
	}
	if err != nil {
		return fmt.Errorf("lock user auth version for refresh token store: %w", err)
	}
	if authVersion <= 0 || currentVersion != authVersion {
		return ErrInvalidRefresh
	}

	_, err = tx.Exec(ctx, `
		insert into refresh_tokens(
			user_id, family_id, auth_version, token_hash, expires_at, user_agent, ip_address
		)
		values ($1::uuid, gen_random_uuid(), $2, $3, $4, $5, nullif($6, '')::inet)
	`, userID, authVersion, tokenHash, expiresAt, userAgent, ip)
	if err != nil {
		return fmt.Errorf("store refresh token: %w", err)
	}
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit refresh token store: %w", err)
	}
	return nil
}

func (r *PostgresRepository) Rotate(
	ctx context.Context,
	oldHash,
	newHash []byte,
	newExpiresAt time.Time,
	userAgent,
	ip string,
) (string, int64, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return "", 0, fmt.Errorf("begin token rotation: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var userID string
	err = tx.QueryRow(ctx, `
		select user_id::text
		from refresh_tokens
		where token_hash = $1
	`, oldHash).Scan(&userID)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", 0, ErrInvalidRefresh
	}
	if err != nil {
		return "", 0, fmt.Errorf("resolve refresh token user: %w", err)
	}

	var currentAuthVersion int64
	err = tx.QueryRow(ctx, `
		select auth_version
		from users
		where id = $1::uuid
		for share
	`, userID).Scan(&currentAuthVersion)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", 0, ErrInvalidRefresh
	}
	if err != nil {
		return "", 0, fmt.Errorf("lock user auth version for rotation: %w", err)
	}

	var (
		tokenUserID    string
		familyID       string
		tokenVersion   int64
		expiresAt      time.Time
		revokedAt      *time.Time
		replacedByHash []byte
	)
	err = tx.QueryRow(ctx, `
		select user_id::text, family_id::text, auth_version, expires_at, revoked_at, replaced_by_hash
		from refresh_tokens
		where token_hash = $1
		for update
	`, oldHash).Scan(&tokenUserID, &familyID, &tokenVersion, &expiresAt, &revokedAt, &replacedByHash)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", 0, ErrInvalidRefresh
	}
	if err != nil {
		return "", 0, fmt.Errorf("read refresh token for rotation: %w", err)
	}

	now := r.now().UTC()
	if tokenUserID != userID || tokenVersion != currentAuthVersion {
		if _, err := tx.Exec(ctx, `
			update refresh_tokens
			set revoked_at = coalesce(revoked_at, $2)
			where family_id = $1::uuid
		`, familyID, now); err != nil {
			return "", 0, fmt.Errorf("revoke credential-version-mismatched refresh family: %w", err)
		}
		if err := tx.Commit(ctx); err != nil {
			return "", 0, fmt.Errorf("commit credential-version-mismatched refresh revocation: %w", err)
		}
		return "", 0, ErrInvalidRefresh
	}

	if revokedAt != nil {
		if len(replacedByHash) > 0 && revokedAt.UTC().After(now.Add(-refreshRotationGrace)) {
			return "", 0, ErrRefreshInProgress
		}
		if _, err := tx.Exec(ctx, `
			update refresh_tokens
			set revoked_at = coalesce(revoked_at, now()),
				reuse_detected_at = coalesce(reuse_detected_at, now())
			where family_id = $1::uuid
		`, familyID); err != nil {
			return "", 0, fmt.Errorf("revoke reused refresh token family: %w", err)
		}
		if err := tx.Commit(ctx); err != nil {
			return "", 0, fmt.Errorf("commit refresh token reuse revocation: %w", err)
		}
		return "", 0, ErrRefreshTokenReuse
	}

	if !expiresAt.After(now) {
		if _, err := tx.Exec(ctx, `
			update refresh_tokens
			set revoked_at = coalesce(revoked_at, now())
			where token_hash = $1
		`, oldHash); err != nil {
			return "", 0, fmt.Errorf("revoke expired refresh token: %w", err)
		}
		if err := tx.Commit(ctx); err != nil {
			return "", 0, fmt.Errorf("commit expired refresh token revocation: %w", err)
		}
		return "", 0, ErrInvalidRefresh
	}

	if _, err := tx.Exec(ctx, `
		update refresh_tokens
		set revoked_at = now(), replaced_by_hash = $2
		where token_hash = $1
	`, oldHash, newHash); err != nil {
		return "", 0, fmt.Errorf("revoke old refresh token: %w", err)
	}

	if _, err := tx.Exec(ctx, `
		insert into refresh_tokens(
			user_id, family_id, auth_version, token_hash, expires_at, user_agent, ip_address
		)
		values ($1::uuid, $2::uuid, $3, $4, $5, $6, nullif($7, '')::inet)
	`, userID, familyID, currentAuthVersion, newHash, newExpiresAt, userAgent, ip); err != nil {
		return "", 0, fmt.Errorf("insert rotated refresh token: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return "", 0, fmt.Errorf("commit token rotation: %w", err)
	}
	return userID, currentAuthVersion, nil
}

func (r *PostgresRepository) Revoke(ctx context.Context, tokenHash []byte) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin refresh family revocation: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var familyID string
	err = tx.QueryRow(ctx, `
		select family_id::text
		from refresh_tokens
		where token_hash = $1
		for update
	`, tokenHash).Scan(&familyID)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrInvalidRefresh
	}
	if err != nil {
		return fmt.Errorf("lock refresh token for family revocation: %w", err)
	}

	command, err := tx.Exec(ctx, `
		update refresh_tokens
		set revoked_at = coalesce(revoked_at, now())
		where family_id = $1::uuid
	`, familyID)
	if err != nil {
		return fmt.Errorf("revoke refresh token family: %w", err)
	}
	if command.RowsAffected() == 0 {
		return ErrInvalidRefresh
	}
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit refresh token family revocation: %w", err)
	}
	return nil
}

func (r *PostgresRepository) ReplacePasswordReset(
	ctx context.Context,
	userID string,
	tokenHash []byte,
	expiresAt time.Time,
	userAgent,
	ip string,
) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin password reset replacement: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if _, err := tx.Exec(ctx, `
		update password_reset_tokens
		set used_at = coalesce(used_at, now())
		where user_id = $1::uuid and used_at is null
	`, userID); err != nil {
		return fmt.Errorf("invalidate previous password reset tokens: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		insert into password_reset_tokens(user_id, token_hash, expires_at, user_agent, ip_address)
		values ($1::uuid, $2, $3, $4, nullif($5, '')::inet)
	`, userID, tokenHash, expiresAt, userAgent, ip); err != nil {
		return fmt.Errorf("insert password reset token: %w", err)
	}
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit password reset replacement: %w", err)
	}
	return nil
}

func (r *PostgresRepository) ConsumePasswordReset(
	ctx context.Context,
	tokenHash []byte,
	passwordHash string,
	now time.Time,
) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin password reset: %w", err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	var (
		userID    string
		expiresAt time.Time
		usedAt    *time.Time
	)
	err = tx.QueryRow(ctx, `
		select user_id::text, expires_at, used_at
		from password_reset_tokens
		where token_hash = $1
		for update
	`, tokenHash).Scan(&userID, &expiresAt, &usedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrInvalidPasswordReset
	}
	if err != nil {
		return fmt.Errorf("read password reset token: %w", err)
	}

	if usedAt != nil || !expiresAt.After(now) {
		return ErrInvalidPasswordReset
	}

	if _, err := tx.Exec(ctx, `
		update users
		set password_hash = $2,
			updated_at = $3,
			auth_version = auth_version + 1
		where id = $1::uuid
	`, userID, passwordHash, now); err != nil {
		return fmt.Errorf("update reset password and credential version: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		update password_reset_tokens
		set used_at = $2
		where user_id = $1::uuid and used_at is null
	`, userID, now); err != nil {
		return fmt.Errorf("consume password reset tokens: %w", err)
	}
	if _, err := tx.Exec(ctx, `
		update refresh_tokens
		set revoked_at = coalesce(revoked_at, $2)
		where user_id = $1::uuid
	`, userID, now); err != nil {
		return fmt.Errorf("revoke sessions after password reset: %w", err)
	}
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit password reset: %w", err)
	}
	return nil
}
