#!/usr/bin/env sh
set -eu

ENVIRONMENT="${1:?environment is required: stage or prod}"
IMAGE_TAG="${2:?image tag is required}"

case "$ENVIRONMENT" in
  stage) COMPOSE_FILE="deploy/compose/docker-compose.stage.yml" ;;
  prod) COMPOSE_FILE="deploy/compose/docker-compose.prod.yml" ;;
  *) echo "unsupported environment: $ENVIRONMENT" >&2; exit 2 ;;
esac

export IMAGE_TAG
docker compose -f "$COMPOSE_FILE" pull
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans
docker image prune -f
