# Guia de Introdução / Getting Started Guide

## 🇧🇷 Pré-requisitos

- **Node.js** >= 20.0.0
- **pnpm** >= 9.1.0
- **Docker** + **Docker Compose** (para infraestrutura)
- **Make** (para comandos automatizados)

## 🇬🇧 Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 9.1.0
- **Docker** + **Docker Compose** (for infrastructure)
- **Make** (for automated commands)

---

## Setup / Configuração

### 1. Clone

```bash
git clone https://github.com/mateussiqueira/banking-stack.git
cd banking-stack
```

### 2. Install dependencies / Instalar dependências

```bash
pnpm install
```

### 3. Configure environment / Configurar ambiente

```bash
cp .env.example .env
# Edit .env if needed (defaults work for local dev)
```

### 4. Run setup script / Executar script de setup

```bash
make setup
# or manually: bash scripts/setup.sh
```

### 5. Start infrastructure / Iniciar infraestrutura

```bash
make infra-up
```

This starts MongoDB 7 (Replica Set), Redis 7, PostgreSQL 16, and MinIO.

### 6. Start development / Iniciar desenvolvimento

```bash
make dev
```

This starts all services in dev mode with hot-reload.

---

## Running Individual Services / Executando Serviços Individuais

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

## Available Commands / Comandos Disponíveis

| Command | Description | Descrição |
|---------|-------------|-----------|
| `pnpm dev` | Start all services | Iniciar todos os serviços |
| `pnpm build` | Build all packages | Compilar todos os pacotes |
| `pnpm test` | Run all tests | Executar todos os testes |
| `pnpm lint` | Run all linters | Executar linters |
| `pnpm typecheck` | TypeScript check | Verificação de tipos |
| `pnpm format` | Format code | Formatar código |
| `pnpm clean` | Clean builds | Limpar builds |

### Infrastructure / Infraestrutura

| Command | Description | Descrição |
|---------|-------------|-----------|
| `make infra-up` | Start services | Iniciar serviços |
| `make infra-down` | Stop services | Parar serviços |
| `make infra-logs` | View logs | Ver logs |
| `make infra-ps` | List services | Listar serviços |
| `make db-reset` | Reset databases | Resetar bancos |

### Database Shells / Terminais de Banco

```bash
make db-shell-mongo     # MongoDB shell
make db-shell-postgres  # PostgreSQL shell
make db-shell-redis     # Redis CLI
```

### Documentation / Documentação

| Command | Description | Descrição |
|---------|-------------|-----------|
| `make docs` | Start VitePress | Iniciar servidor de docs |
| `make docs-build` | Build docs | Compilar documentação |
| `make docs-preview` | Preview build | Visualizar build |

---

## Environment Variables / Variáveis de Ambiente

See `.env.example` for all available variables. Defaults are pre-configured for local development.

Key variables:
- `MONGODB_URI` — MongoDB connection string
- `REDIS_URI` — Redis connection string
- `POSTGRES_URI` — PostgreSQL connection string
- `MINIO_ENDPOINT` — MinIO S3 endpoint
- `LEDGER_PORT`, `SPI_SIMULATOR_PORT`, etc. — Service ports

---

## Troubleshooting / Solução de Problemas

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
