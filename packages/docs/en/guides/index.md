---
layout: page
title: Guides
---

# Guides

How-to guides for setting up, developing, and deploying the Banking Challenges project.

## Getting Started

- [Getting Started](/en/guides/getting-started) — Quick start with Docker Compose
- [Contribute](/en/guides/contribution) — Development workflow and standards
- [Testing](/en/guides/testing) — Testing strategy and patterns

## Deployment

- [Deployment](/en/guides/deployment) — VPS, Kubernetes, and Vercel deployment

## Quick Start

```bash
# Clone the repo
git clone https://github.com/mateussiqueira/banking-stack.git

# Start infrastructure
docker compose up -d

# Install dependencies
pnpm install

# Start all services
make dev
```

## Available Commands

| Command | Description |
|---------|-------------|
| `make dev` | Start all services in development mode |
| `make infra` | Start infrastructure containers (Mongo, Redis, Postgres, MinIO) |
| `make test` | Run all tests |
| `make build` | Build all packages |
| `make docs` | Start docs dev server |
| `make lint` | Run linter across all packages |
