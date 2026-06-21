# 13 — CI/CD Challenge

**🇧🇷** Pipeline de Integração e Deploy Contínuos  
**🇬🇧** Continuous Integration and Deployment Pipeline

---

## 🇧🇷 Descrição do Desafio

Implementar pipelines de CI/CD para o monorepo Banking Challenges utilizando GitHub Actions e/ou Bitbucket Pipelines. O pipeline deve executar lint, testes, build e deploy automatizado.

Requisitos:
- Pipeline de CI (lint, typecheck, test)
- Pipeline de CD (build, docker image, deploy)
- Cache inteligente com Turborepo
- Deploy automático para VPS/Proxmox
- Notificações de falha
- Ambientes: dev, staging, production
- Docker image build e push para registry

---

## 🇬🇧 Challenge Description

Implement CI/CD pipelines for the Banking Challenges monorepo using GitHub Actions and/or Bitbucket Pipelines. The pipeline must run lint, tests, build, and automated deploy.

Requirements:
- CI pipeline (lint, typecheck, test)
- CD pipeline (build, docker image, deploy)
- Smart caching with Turborepo
- Auto deploy to VPS/Proxmox
- Failure notifications
- Environments: dev, staging, production
- Docker image build and push to registry

---

## Pipeline Architecture / Arquitetura do Pipeline

```
CI Pipeline (on PR / push to main)
┌─────────────────────────────────────────────────────────────┐
│  1. pnpm install --frozen-lockfile                          │
│  2. pnpm lint                                               │
│  3. pnpm typecheck                                          │
│  4. pnpm test                                               │
│  5. pnpm build                                              │
│                                                            │
│  Cache: node_modules, .turbo, dist                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
CD Pipeline (on push to main / tag)
┌─────────────────────────────────────────────────────────────┐
│  1. pnpm build                                              │
│  2. docker compose build                                    │
│  3. docker push registry.example.com/banking/backend:latest   │
│  4. SSH deploy to VPS                                       │
│  5. Health check                                            │
│  6. Slack notification                                      │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack (Proposed)

| Technology | Purpose |
|------------|---------|
| **GitHub Actions** | CI/CD runner |
| **Docker** | Container build |
| **Docker Compose** | Multi-container deploy |
| **SSH** | Remote deploy |

## CI Workflow Example / Exemplo de Workflow CI

```yaml
name: CI
on: [push, pull_request]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
```

## How to Run (Proposed)

Configure secrets in GitHub/Bitbucket:

```env
HOST=your-vps-ip
USERNAME=deploy
SSH_KEY=your-private-key
REGISTRY_URL=registry.example.com
```
