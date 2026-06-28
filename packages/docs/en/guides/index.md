---
layout: page
title: Guides
---

# Guides

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

## Available Guides

| Guide | Description | Link |
|-------|-------------|------|
| **Getting Started** | Quick start with Docker Compose | [Getting Started](/en/guides/getting-started) |
| **Contribution** | Development workflow and standards | [Contribution](/en/guides/contribution) |
| **Testing** | Testing strategy and patterns | [Testing](/en/guides/testing) |
| **Deployment** | VPS, Kubernetes, and Vercel | [Deployment](/en/guides/deployment) |

## Available Commands

| Command | Description |
|---------|-------------|
| `make dev` | Start all services in dev mode |
| `make infra-up` | Start Docker containers |
| `make infra-down` | Stop Docker containers |
| `make build` | Build all packages |
| `make test` | Run all tests |
| `make lint` | Run linter across all packages |
| `make docs` | Start docs dev server |
| `make docs-build` | Build docs site |
| `make setup` | Run setup script |
| `make clean` | Clean build artifacts |

## Project Structure

```
banking-stack/
├── apps/                    # Challenges (services)
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
├── packages/                # Shared packages
│   ├── docs/                # VitePress documentation
│   └── shared/              # Shared code
├── docker-compose.yml       # Local infrastructure
├── turbo.json               # Turborepo config
├── Makefile                 # Unified commands
└── pnpm-workspace.yaml      # Workspace config
```

## Tech Stack

| Layer | Technology | Challenges |
|-------|------------|------------|
| **Backend** | TypeScript (Koa, Fastify) + Go (Gin) | All |
| **Frontend** | Next.js 14, Vite + React | 10, 11 |
| **Database** | MongoDB 7, PostgreSQL 16, Redis 7 | All |
| **Storage** | MinIO (S3-compatible) | 08 |
| **Infra** | Docker, Turborepo, Proxmox | 12 |
| **CI/CD** | GitHub Actions / GitLab CI | 13 |
| **Docs** | VitePress with i18n PT/EN | All |

## Prerequisites

| Tool | Minimum Version | Install |
|------|-----------------|---------|
| **Node.js** | 20+ | `nvm install 20` |
| **pnpm** | 9+ | `npm i -g pnpm` |
| **Go** | 1.22+ | `brew install go` |
| **Docker** | 24+ | `brew install --cask docker` |
| **Docker Compose** | v2+ | Included with Docker |
| **Make** | 4.0+ | `xcode-select --install` (macOS) |

## Environment Variables

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
