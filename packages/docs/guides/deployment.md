# Guia de Deploy / Deployment Guide

## 🇧🇷 Opções de Deploy

- **GitHub Pages**: Documentação VitePress
- **VPS (Proxmox)**: Serviços backend e frontend
- **Docker Compose**: Infraestrutura completa

## 🇬🇧 Deployment Options

- **GitHub Pages**: VitePress documentation
- **VPS (Proxmox)**: Backend and frontend services
- **Docker Compose**: Complete infrastructure

---

## Documentation / Documentação (GitHub Pages)

The VitePress docs site can be deployed to GitHub Pages:

### Automated (GitHub Actions)

Create `.github/workflows/docs.yml`:

```yaml
name: Deploy Docs
on:
  push:
    branches: [main]
    paths: ['packages/docs/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm docs:build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: packages/docs/src/.vitepress/dist
```

### Manual

```bash
pnpm docs:build
# Output in packages/docs/src/.vitepress/dist
```

---

## Backend Services / Serviços Backend (VPS)

### Prerequisites

- Docker and Docker Compose on the VPS
- Domain pointing to the VPS
- Nginx or Traefik for reverse proxy

### Steps

```bash
# 1. Clone on the VPS
git clone https://github.com/your-org/banking-stack.git
cd banking-stack

# 2. Configure environment
cp .env.example .env
# Edit .env with production values

# 3. Build and start
make infra-up
make build

# 4. Start individual services as needed
pnpm --filter @banking/ledger start
```

### Docker Compose Production

```yaml
version: '3.8'
services:
  ledger:
    build: ./packages/backend/ledger
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/banking-ledger
    depends_on:
      - mongodb
```

---

## Database Backups / Backup de Banco

```bash
# MongoDB
docker compose exec mongodb mongodump \
  --username admin \
  --password mongo_secret_2024 \
  --out /backups/$(date +%Y%m%d)

# PostgreSQL
docker compose exec postgres pg_dump \
  -U banking banking_challenges > backup_$(date +%Y%m%d).sql
```

---

## Monitoring / Monitoramento

- Health checks at `/health` endpoints
- Docker container health checks
- Logs with `make infra-logs`
- Resource monitoring via Proxmox
