# Challenge 13 — CI/CD Pipeline

**🇺🇸** Continuous Integration and Deployment Pipeline

---

## Challenge Description

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

## Pipeline Architecture

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

---

## GitHub Actions: CI Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run ESLint
        run: pnpm lint

  typecheck:
    name: Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run TypeScript check
        run: pnpm typecheck

  test:
    name: Test
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:7
        ports:
          - 27017:27017
      redis:
        image: redis:7
        ports:
          - 6379:6379
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm test
        env:
          MONGODB_URI: mongodb://localhost:27017
          REDIS_URI: redis://localhost:6379
          POSTGRES_URI: postgresql://postgres:postgres@localhost:5432

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint, typecheck, test]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build all packages
        run: pnpm build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build
          path: |
            packages/*/dist
            packages/*/*/dist
```

---

## GitHub Actions: CD Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  build-and-push:
    name: Build & Push Docker Images
    runs-on: ubuntu-latest
    needs: [build]
    steps:
      - uses: actions/checkout@v4

      - name: Download build artifacts
        uses: actions/download-artifact@v4
        with:
          name: build

      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push backend images
        run: |
          for service in ledger spi-simulator dict-simulator; do
            docker build -t ${{ secrets.DOCKER_USERNAME }}/banking-$service:latest packages/backend/$service
            docker push ${{ secrets.DOCKER_USERNAME }}/banking-$service:latest
          done

  deploy-vps:
    name: Deploy to VPS
    runs-on: ubuntu-latest
    needs: [build-and-push]
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USERNAME }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/banking-stack
            git pull
            docker compose pull
            docker compose up -d
            docker compose exec -T ledger npm run migrate
            echo "Deploy completed successfully"

  health-check:
    name: Health Check
    runs-on: ubuntu-latest
    needs: [deploy-vps]
    steps:
      - name: Wait for services
        run: sleep 30

      - name: Check health endpoints
        run: |
          for port in 3002 3003 3004 3005; do
            curl -f http://localhost:$port/health || exit 1
          done

  notify:
    name: Notify
    runs-on: ubuntu-latest
    needs: [health-check]
    if: always()
    steps:
      - name: Slack notification
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

## Turborepo Cache Strategy

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["build"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

---

## Environment Configuration

| Environment | Branch | Auto-deploy | Health Check |
|-------------|--------|-------------|--------------|
| Development | `develop` | On push | Skip |
| Staging | `main` | On PR merge | Required |
| Production | `main` | Manual gate | Required |

---

## Secrets Configuration

```env
# Docker Registry
DOCKER_USERNAME=your-username
DOCKER_PASSWORD=your-password

# VPS Deployment
VPS_HOST=192.168.1.100
VPS_USERNAME=deploy
VPS_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----

# Notifications
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Database (staging)
STAGING_MONGODB_URI=mongodb://...
STAGING_REDIS_URI=redis://...

# Database (production)
PRODUCTION_MONGODB_URI=mongodb://...
PRODUCTION_REDIS_URI=redis://...
```

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **GitHub Actions** | CI/CD runner |
| **Docker** | Container build |
| **Docker Compose** | Multi-container deploy |
| **Turborepo** | Build caching |
| **SSH** | Remote deploy |

---

## How to Run

```bash
# Configure secrets in GitHub
gh secret set DOCKER_USERNAME -b "your-username"
gh secret set DOCKER_PASSWORD -b "your-password"
gh secret set VPS_HOST -b "192.168.1.100"
gh secret set VPS_USERNAME -b "deploy"
gh secret set VPS_SSH_KEY < ~/.ssh/id_rsa
gh secret set SLACK_WEBHOOK_URL -b "https://hooks.slack.com/..."

# Push to trigger pipeline
git push origin main
```

## Monitoring Pipeline

```bash
# List workflow runs
gh run list

# View specific run
gh run view 12345

# Download artifacts
gh run download 12345
```
