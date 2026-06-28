---
layout: page
title: Guias
---

# Guias / Guides

How-to guides for setting up, developing, and deploying the Banking Challenges project.

## Quick Start

```bash
# Clone
git clone https://github.com/mateussiqueira/banking-stack.git
cd banking-stack

# Start infrastructure
docker compose up -d

# Install dependencies
pnpm install

# Start all services
make dev
```

## Guias Disponíveis

| Guia | Descrição | Link |
|------|-----------|------|
| **Como Rodar** | Quick start com Docker Compose | [Getting Started](/guides/getting-started) |
| **Contribuir** | Workflow de desenvolvimento e padrões | [Contribution](/guides/contribution) |
| **Testes** | Estratégia e padrões de teste | [Testing](/guides/testing) |
| **Deploy** | VPS, Kubernetes e Vercel | [Deployment](/guides/deployment) |

## Comandos Disponíveis

| Comando | Descrição |
|---------|-----------|
| `make dev` | Inicia todos os serviços em dev |
| `make infra-up` | Sobe containers (Mongo, Redis, Postgres, MinIO) |
| `make infra-down` | Para containers |
| `make build` | Compila todos os pacotes |
| `make test` | Roda todos os testes |
| `make lint` | Roda linter em todos os pacotes |
| `make docs` | Inicia servidor de docs |
| `make docs-build` | Compila site de docs |
| `make setup` | Executa script de setup |
| `make clean` | Limpa artefatos de build |

## Estrutura do Projeto

```
banking-stack/
├── apps/                    # Desafios (serviços)
│   ├── ledger/              # 01 - Ledger GraphQL
│   ├── spi-simulator-go/    # 02 - SPI Simulator (Go)
│   ├── dict-simulator-go/   # 03 - DICT Simulator (Go)
│   ├── iso8583/             # 04 - ISO 8583
│   ├── workflow-engine/     # 05 - Workflow Engine
│   ├── open-finance/        # 06 - Open Finance
│   ├── nfse/                # 07 - NFS-e
│   ├── report-system/       # 08 - Report System
│   ├── leaky-bucket/        # 09 - Leaky Bucket
│   ├── landing-page/        # 10 - Landing Page
│   └── kyc-system/          # 11 - KYC System
├── packages/                # Pacotes compartilhados
│   ├── docs/                # VitePress documentation
│   └── shared/              # Código compartilhado
├── services/                # Serviços auxiliares
├── scripts/                 # Scripts de automação
├── docker-compose.yml       # Infraestrutura local
├── turbo.json               # Config Turborepo
├── Makefile                 # Comandos unificados
└── pnpm-workspace.yaml      # Workspace config
```

## Stack Tecnológico

| Camada | Tecnologia | Desafios |
|--------|------------|----------|
| **Backend** | TypeScript (Koa, Fastify) + Go (Gin) | Todos |
| **Frontend** | Next.js 14, Vite + React | 10, 11 |
| **Database** | MongoDB 7, PostgreSQL 16, Redis 7 | Todos |
| **Storage** | MinIO (S3-compatible) | 08 |
| **Infra** | Docker, Turborepo, Proxmox | 12 |
| **CI/CD** | GitHub Actions / GitLab CI | 13 |
| **Docs** | VitePress com i18n PT/EN | Todos |

## Pré-requisitos

| Ferramenta | Versão Mínima | Instalação |
|------------|---------------|------------|
| **Node.js** | 20+ | `nvm install 20` |
| **pnpm** | 9+ | `npm i -g pnpm` |
| **Go** | 1.22+ | `brew install go` |
| **Docker** | 24+ | `brew install --cask docker` |
| **Docker Compose** | v2+ | Incluído no Docker |
| **Make** | 4.0+ | `xcode-select --install` (macOS) |

## Variáveis de Ambiente

```bash
# Docker Infrastructure
MONGO_URI=mongodb://localhost:27017/banking
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/banking
MINIO_ENDPOINT=localhost:9000

# Services
PORT=3001
NODE_ENV=development
LOG_LEVEL=debug
```
