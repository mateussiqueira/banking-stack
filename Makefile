.PHONY: infra-up infra-down dev build test lint clean setup docs

# ─── Infrastructure ───────────────────────────────────────────────────

infra-up:
	docker compose up -d --wait

infra-down:
	docker compose down -v

infra-logs:
	docker compose logs -f

infra-ps:
	docker compose ps

infra-restart:
	docker compose restart

# ─── Development ──────────────────────────────────────────────────────

dev:
	@echo "Starting development environment..."
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build --wait
	pnpm dev

dev-down:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v

dev-logs:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

# ─── Build ────────────────────────────────────────────────────────────

build:
	pnpm build

build-packages:
	pnpm turbo build

build-docker:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml build

# ─── Test ─────────────────────────────────────────────────────────────

test:
	pnpm test

test-coverage:
	pnpm test -- --coverage

test-watch:
	pnpm test -- --watch

# ─── Lint ─────────────────────────────────────────────────────────────

lint:
	pnpm lint

lint-fix:
	pnpm lint -- --fix

typecheck:
	pnpm typecheck

format:
	pnpm format

# ─── Clean ────────────────────────────────────────────────────────────

clean:
	pnpm clean
	rm -rf node_modules
	rm -rf packages/*/*/node_modules
	rm -rf packages/*/*/dist
	rm -rf packages/*/*/.turbo
	rm -rf packages/*/*/.next

clean-all: clean
	docker compose down -v
	docker system prune -f --volumes

# ─── Setup ────────────────────────────────────────────────────────────

setup:
	@bash scripts/setup.sh

install:
	pnpm install --frozen-lockfile

reinstall:
	rm -rf node_modules packages/*/*/node_modules
	pnpm install

# ─── Docs ─────────────────────────────────────────────────────────────

docs:
	pnpm docs:dev

docs-build:
	pnpm docs:build

docs-preview:
	pnpm docs:preview

# ─── Database ─────────────────────────────────────────────────────────

db-shell-mongo:
	docker compose exec mongodb mongosh banking_challenges

db-shell-postgres:
	docker compose exec postgres psql -U banking -d banking_challenges

db-shell-redis:
	docker compose exec redis redis-cli -a redis_secret_2024

db-reset:
	docker compose down -v
	docker compose up -d --wait

# ─── MinIO ────────────────────────────────────────────────────────────

minio-console:
	@echo "MinIO Console: http://localhost:9001"
	@echo "User: minioadmin"
	@echo "Pass: minio_secret_2024"

minio-create-bucket:
	docker compose exec minio mc mb local/banking-reports || true

# ─── Release ──────────────────────────────────────────────────────────

changeset:
	pnpm changeset

version:
	pnpm version-packages

release:
	pnpm release
