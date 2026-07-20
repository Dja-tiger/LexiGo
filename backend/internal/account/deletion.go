package account

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
)

func (r *PostgresRepository) Delete(
	ctx context.Context,
	userID,
	expectedPasswordHash string,
) error {
	var deletedID string
	err := r.pool.QueryRow(ctx, `
		delete from users
		where id = $1::uuid
		  and password_hash = $2
		returning id::text
	`, userID, expectedPasswordHash).Scan(&deletedID)
	if errors.Is(err, pgx.ErrNoRows) {
		return ErrAccountChanged
	}
	if err != nil {
		return fmt.Errorf("delete account: %w", err)
	}
	return nil
}
