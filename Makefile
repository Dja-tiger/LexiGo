.PHONY: help up down logs backend-fmt backend-test backend-test-integration backend-cover frontend-install frontend-test frontend-build ci

help:
	@printf '%s\n' \
	  'make up                       - запустить локальный контур' \
	  'make down                     - остановить локальный контур' \
	  'make backend-test             - unit-тесты Go' \
	  'make backend-test-integration - integration-тесты Go' \
	  'make frontend-test            - тесты frontend' \
	  'make ci                       - локальный набор CI-проверок'

up:
	docker compose up --build

down:
	docker compose down --remove-orphans

logs:
	docker compose logs -f --tail=200

backend-fmt:
	cd backend && gofmt -w $$(find . -name '*.go' -type f)

backend-test:
	cd backend && GOTOOLCHAIN=local go test -race -count=1 ./...

backend-test-integration:
	cd backend && GOTOOLCHAIN=local go test -race -count=1 -tags=integration ./...

backend-cover:
	cd backend && GOTOOLCHAIN=local go test -coverprofile=coverage.out ./...

frontend-install:
	cd frontend && npm install --no-audit --no-fund

frontend-test:
	cd frontend && npm run test

frontend-build:
	cd frontend && npm run build

ci: backend-test frontend-test frontend-build
