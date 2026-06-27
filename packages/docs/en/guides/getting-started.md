# Getting Started

## Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 9.1.0
- **Docker** + **Docker Compose** (for infrastructure)
- **Make** (for automated commands)
- **Go** 1.23+ (optional, for Go services)

## Quick Start

### 1. Clone

```bash
git clone https://github.com/mateussiqueira/banking-stack.git
cd banking-stack
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env if needed (defaults work for local dev)
```

### 4. Run setup script

```bash
make setup
# or manually: bash scripts/setup.sh
```

### 5. Start infrastructure

```bash
make infra-up
```

This starts MongoDB 7 (Replica Set), Redis 7, PostgreSQL 16, and MinIO.

### 6. Start development

```bash
make dev
```

This starts all services in dev mode with hot-reload.

---

## Running Individual Services

You can run specific services instead of all:

```bash
# Ledger (GraphQL)
pnpm --filter @banking/ledger dev

# SPI Simulator
pnpm --filter @banking/spi-simulator dev

# Landing Page (Next.js)
pnpm --filter @banking/landing-page dev

# KYC System (Vite)
pnpm --filter @banking/kyc-system dev
```

---

## Available Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all services |
| `pnpm build` | Build all packages |
| `pnpm test` | Run all tests |
| `pnpm lint` | Run all linters |
| `pnpm typecheck` | TypeScript check |
| `pnpm format` | Format code |
| `pnpm clean` | Clean builds |

### Infrastructure

| Command | Description |
|---------|-------------|
| `make infra-up` | Start services |
| `make infra-down` | Stop services |
| `make infra-logs` | View logs |
| `make infra-ps` | List services |
| `make db-reset` | Reset databases |

### Database Shells

```bash
make db-shell-mongo     # MongoDB shell
make db-shell-postgres  # PostgreSQL shell
make db-shell-redis     # Redis CLI
```

### Documentation

| Command | Description |
|---------|-------------|
| `make docs` | Start VitePress |
| `make docs-build` | Build docs |
| `make docs-preview` | Preview build |

---

## Services

| Service | Port | Health Endpoint |
|---------|------|-----------------|
| SPI Simulator | 3002 | `/spi/health` |
| DICT Simulator | 3003 | `/dict/health` |
| ISO 8583 | 3004 | `/health` |
| Workflow Engine | 3005 | `/health` |
| Open Finance | 3006 | `/health` |
| NFS-e | 3007 | `/health` |
| Report System | 3008 | `/health` |
| Leaky Bucket | 3009 | `/health` |
| Ledger | 3010 | `/graphql` |
| Landing Page | 3000 | - |
| KYC System | 5173 | - |

## Environment Variables

See `.env.example` for all available variables. Defaults are pre-configured for local development.

Key variables:
- `MONGODB_URI` — MongoDB connection string
- `REDIS_URI` — Redis connection string
- `POSTGRES_URI` — PostgreSQL connection string
- `MINIO_ENDPOINT` — MinIO S3 endpoint
- `LEDGER_PORT`, `SPI_SIMULATOR_PORT`, etc. — Service ports

---

## Troubleshooting

### MongoDB Replica Set

If MongoDB transactions fail, ensure the replica set is initialized:

```bash
docker compose exec mongodb mongosh --eval "rs.status()"
```

### Port Conflicts

Check if default ports are available:
- 27017 (MongoDB)
- 6379 (Redis)
- 5432 (PostgreSQL)
- 9000 (MinIO API)
- 9001 (MinIO Console)

### pnpm Issues

```bash
# Clean install
make reinstall

# Or manually
rm -rf node_modules packages/*/*/node_modules
pnpm install
```
