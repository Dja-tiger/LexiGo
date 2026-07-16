package redis

import (
	"context"
	"fmt"
	"time"

	"github.com/Dja-tiger/New-project/backend/internal/config"
	redisclient "github.com/redis/go-redis/v9"
)

func Open(ctx context.Context, cfg config.Redis) (*redisclient.Client, error) {
	client := redisclient.NewClient(&redisclient.Options{
		Addr:         cfg.Addr,
		Password:     cfg.Password,
		DB:           cfg.DB,
		DialTimeout:  5 * time.Second,
		ReadTimeout:  2 * time.Second,
		WriteTimeout: 2 * time.Second,
		PoolSize:     20,
		MinIdleConns: 2,
	})
	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	if err := client.Ping(pingCtx).Err(); err != nil {
		_ = client.Close()
		return nil, fmt.Errorf("ping redis: %w", err)
	}
	return client, nil
}
