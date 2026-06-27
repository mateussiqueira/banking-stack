# 13 — CI/CD Challenge

**🇧🇷** Pipeline de Integração e Deploy Contínuos  
**🇬🇧** Continuous Integration and Deployment Pipeline

---

## Descrição do Desafio

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

## Why CI/CD Matters for a Banking Stack

When I first started working on this banking monorepo, my "deploy process" was SSH-ing into the server and typing commands. It worked. For about two weeks.

Then I pushed a commit that broke the ledger service. I didn't notice until a simulated transaction failed. I spent three hours debugging a bug that a typecheck would've caught in 30 seconds. That's when I decided: never again.

A proper CI/CD pipeline isn't just automation — it's a safety net. It catches mistakes before they reach production. It documents your deploy process (because it's code). It makes deployment boring, which is exactly what you want. Boring means predictable. Predictable means reliable.

For a financial system, reliability isn't optional. A failed deploy that takes down the ledger for 10 minutes could mean lost transactions, reconciliation nightmares, and angry users. The CI/CD pipeline is your first line of defense.

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

This is the simplest view. The reality is more nuanced. Let me break down how each stage works and why I made the choices I did.

### CI Pipeline: The Gatekeeper

Every pull request goes through CI. If lint, typecheck, or tests fail, the PR cannot be merged. This is enforced via GitHub branch protection rules:

```yaml
# Branch protection rules (configured in GitHub UI, but documented here)
# Settings → Branches → Add rule
# Branch: main
# Require status checks:
#   - Lint (required)
#   - Type Check (required)
#   - Test (required)
#   - Build (required)
# Require pull request reviews: 1
# Dismiss stale reviews: true
# Require up-to-date branches: true
```

The `Require up-to-date branches` setting is critical. Without it, someone could merge a PR that was passing CI when created but conflicts with new changes on `main`. With it, they must merge `main` into their branch first and re-run CI.

### CD Pipeline: The Deployer

The CD pipeline runs only on two triggers:
1. Push to `main` (deploys to staging)
2. Push a tag matching `v*` (deploys to production)

I separate these because I want a manual gate between staging and production. Pushing to `main` runs all tests and deploys to staging. If staging looks good, I create a tag and push it for production:

```bash
# Deploy to production
git tag v1.2.3
git push origin v1.2.3
```

This gives me a clear audit trail: every production deploy corresponds to a Git tag. I can look at a tag and know exactly what code is running in production.

### Deploy Pipeline Detail

Here's the full CD flow with the actual services:

```
                            ┌──────────┐
                            │  Commit   │
                            │  to main  │
                            └────┬─────┘
                                 │
                            ┌────▼─────┐
                            │  CI Run  │
                            │ (passes) │
                            └────┬─────┘
                                 │
                            ┌────▼─────┐
                            │   Build  │
                            │  Images  │
                            └────┬─────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
              ┌─────▼────┐ ┌────▼────┐ ┌────▼────┐
              │  Ledger  │ │   SPI   │ │   DICT  │
              │  :latest │ │ :latest │ │ :latest │
              └─────┬────┘ └────┬────┘ └────┬────┘
                    │            │            │
                    └────────────┼────────────┘
                                 │
                            ┌────▼─────┐
                            │   Push   │
                            │ to Reg.  │
                            └────┬─────┘
                                 │
                            ┌────▼─────┐
                            │   SSH    │
                            │  Deploy  │
                            └────┬─────┘
                                 │
                            ┌────▼─────┐
                            │  Health  │
                            │  Check   │
                            └────┬─────┘
                                 │
                            ┌────▼─────┐
                            │  Notify  │
                            │  Slack   │
                            └──────────┘
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

### Why Separate Jobs?

You might look at my CI workflow and wonder: why not put lint, typecheck, test, and build in a single job with multiple steps?

Two reasons:

1. **Parallelism.** Lint, typecheck, and test don't depend on each other. Running them in parallel cuts CI time from ~8 minutes to ~3 minutes. The build job waits for all three, so it starts about 3 minutes in rather than 5+ minutes in.

2. **Clarity**. If the test job fails, I see a red "Test" badge. If lint fails, I see "Lint" red. In a single job, I'd have to expand it and scroll through logs to find which step failed. Separate jobs mean I know immediately where the problem is.

The trade-off is that dependencies must be installed four times (once per job). That's where caching comes in.

### Caching Strategy

```yaml
- name: Cache pnpm store
  uses: actions/cache@v4
  with:
    path: |
      ~/.local/share/pnpm/store
      node_modules
      .turbo
      **/*/dist
    key: pnpm-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}
    restore-keys: |
      pnpm-${{ runner.os }}-
```

However, there's a subtlety: `actions/setup-node@v4` has built-in pnpm caching with `cache: 'pnpm'`. This caches only the pnpm store, not `node_modules`. The `pnpm install` still needs to link everything into `node_modules`.

For Turborepo specifically, I cache the `.turbo` directory. This means if a task has already been run with the same inputs, Turborepo can skip it entirely:

```yaml
- name: Cache Turborepo
  uses: actions/cache@v4
  with:
    path: .turbo
    key: turbo-${{ runner.os }}-${{ github.sha }}
    restore-keys: |
      turbo-${{ runner.os }}-
```

Combined, this reduces CI time from ~12 minutes to ~3-4 minutes for most pushes.

### Matrix Builds for Multiple Node Versions

If you want to be more thorough, use a matrix to test against multiple Node versions:

```yaml
test:
  name: Test (Node ${{ matrix.node-version }})
  runs-on: ubuntu-latest
  strategy:
    matrix:
      node-version: [18, 20, 22]
    fail-fast: false  # Don't cancel other versions if one fails
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v2
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'pnpm'
    - name: Install and test
      run: |
        pnpm install --frozen-lockfile
        pnpm test
```

The `fail-fast: false` is important. If Node 22 has a regression, I want to know that Node 18 and 20 still pass. Without it, GitHub cancels all matrix jobs as soon as one fails.

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

### Tag-Based Production Deploy

For production deploys, I use tags instead of branches:

```yaml
deploy-production:
  name: Deploy to Production
  runs-on: ubuntu-latest
  if: startsWith(github.ref, 'refs/tags/v')
  needs: [build-and-push]
  steps:
    - uses: actions/checkout@v4
    
    - name: Deploy via SSH
      uses: appleboy/ssh-action@v1
      with:
        host: ${{ secrets.PROD_HOST }}
        username: ${{ secrets.PROD_USERNAME }}
        key: ${{ secrets.PROD_SSH_KEY }}
        script: |
          cd /opt/banking-stack
          git checkout ${{ github.ref_name }}
          docker compose -f docker-compose.prod.yml pull
          docker compose -f docker-compose.prod.yml up -d
          docker compose -f docker-compose.prod.yml exec -T ledger npm run migrate
```

By checking out the tag, I guarantee the exact code that was reviewed and tested is what gets deployed. No ambiguity about "which commit was this branch on."

---

## Dockerfile Examples

The CI/CD pipeline is meaningless without proper Dockerfiles. Here are the ones I use:

### Backend Service (Node.js)

```dockerfile
# packages/backend/ledger/Dockerfile
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml ./
COPY package.json ./
RUN pnpm fetch --frozen-lockfile

FROM deps AS build
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @banking/ledger build

FROM base AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 ledger

COPY --from=build /app/packages/backend/ledger/dist ./dist
COPY --from=build /app/packages/backend/ledger/package.json ./
COPY --from=build /app/node_modules ./node_modules

USER ledger
EXPOSE 3002

ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
```

Key points about this Dockerfile:
- **Multi-stage build**: The final image contains only the compiled JS and production dependencies. No TypeScript, no source maps, no dev dependencies. This reduces the image from ~1.2GB to ~120MB.
- **Alpine base**: Alpine is a fraction of the size of the full Node image.
- **Non-root user**: The container runs as `ledger`, not `root`. This is critical for security — if someone exploits a vulnerability in the app, they're in a sandboxed user.
- **`corepack enable`**: Needed for pnpm to work inside the container.

### Frontend (Next.js)

```dockerfile
# packages/frontend/banking/Dockerfile
FROM node:20-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml ./
COPY package.json ./
RUN pnpm fetch --frozen-lockfile

FROM deps AS build
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @banking/web build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=build /app/packages/frontend/banking/public ./public
COPY --from=build /app/packages/frontend/banking/.next/standalone ./
COPY --from=build /app/packages/frontend/banking/.next/static ./.next/static
COPY --from=build /app/packages/frontend/banking/next.config.js ./

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
```

The `.next/standalone` directory is a Next.js feature that creates a self-contained build including all dependencies. Enable it in `next.config.js`:

```javascript
// next.config.js
module.exports = {
  output: 'standalone',
  // ...
};
```

This eliminates the need to copy `node_modules` into the final image. The standalone output includes only what's needed.

### Docker Compose for Production

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: banking
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  mongodb:
    image: mongo:7
    volumes:
      - mongodata:/data/db
    environment:
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh --quiet
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  ledger:
    image: ${DOCKER_USERNAME}/banking-ledger:latest
    ports:
      - "3002:3002"
    environment:
      NODE_ENV: production
      POSTGRES_URI: postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/banking
      MONGODB_URI: mongodb://banking:${MONGO_PASSWORD}@mongodb:27017/banking
      REDIS_URI: redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      mongodb:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped

  spi-simulator:
    image: ${DOCKER_USERNAME}/banking-spi-simulator:latest
    ports:
      - "3003:3003"
    environment:
      NODE_ENV: production
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - ledger
      - spi-simulator
    restart: unless-stopped

volumes:
  pgdata:
  mongodata:
  redisdata:
```

The `condition: service_healthy` ensures that `ledger` only starts after PostgreSQL is actually ready (not just the container, but the process itself). Without this, your app might start and fail because the database isn't accepting connections yet.

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

### How Caching Works

Every time Turborepo runs a task, it:
1. Hashes all input files (source code + dependencies)
2. Checks if a cached output exists for that hash
3. If yes: restores from cache (usually < 1 second)
4. If no: runs the task, saves the output to cache

The cache key includes:
- File contents of all source files in the package
- File contents of all dependency packages
- Environment variables (if configured)
- The command itself

This means: if I change only the frontend code, the `build` task for `packages/backend/ledger` is skipped entirely. It's restored from cache in about 500ms instead of taking 30 seconds.

### Remote Caching with Vercel

For GitHub Actions, local caching isn't enough — each runner is ephemeral. I use Vercel's Remote Caching:

```bash
# Enable remote caching
npx turbo login
npx turbo link
```

This stores the cache on Vercel's servers. Every CI run can access it:

```
CI Run 1: Build ledger (30s) → Cache stored on Vercel
CI Run 2: Build ledger (0.5s) → Restored from Vercel cache
```

The speedup is dramatic. A full rebuild of all packages takes ~3 minutes. With remote caching, the same build takes 10-15 seconds on subsequent runs.

### Cache Invalidation Gotchas

Remote caching can sometimes be too good. If you change a build tool or Node version, the old cache might still be valid. Force a cache bust:

```bash
# Force no cache
turbo build --force

# Or set a cache version in CI
# In the workflow YAML:
env:
  TURBO_CACHE_VERSION: ${{ github.run_id }}
```

I only use the `--force` flag when I know something fundamental changed (like an ESLint plugin version). For normal development, the automatic cache invalidation works great.

---

## Environment Configuration

| Environment | Branch | Auto-deploy | Health Check |
|-------------|--------|-------------|--------------|
| Development | `develop` | On push | Skip |
| Staging | `main` | On PR merge | Required |
| Production | `main` | Manual gate | Required |

### Environment-Specific Configuration

Each environment has its own configuration files and deployment behavior.

**Development**: Deploys from the `develop` branch. Health checks are skipped — if a dev deploy breaks, the team notices quickly and fixes it. Speed over safety.

**Staging**: Deploys from `main` after a PR merge. Full health checks required. This is where QA happens. If staging passes, we tag for production.

**Production**: Manual gate via Git tags. Before deploying, I run:

```bash
# Pre-deploy checklist
gh run list --workflow deploy.yml --branch main --limit 3    # Last 3 deploys succeeded?
gh run list --workflow ci.yml --branch main --limit 1        # Last CI passed?
curl -f https://staging.banking.local/health                  # Staging is healthy?
git log --oneline main --since="24 hours ago" | wc -l         # How many commits?
```

If the last CI run failed, or staging is unhealthy, I don't deploy. The manual gate prevents automation from making things worse.

### Environment Variables per Stage

```yaml
# In the deploy workflow
deploy-staging:
  environment: staging
  steps:
    - name: Deploy
      run: |
        docker compose -f docker-compose.yml up -d
      env:
        NODE_ENV: staging
        LOG_LEVEL: debug
        API_URL: https://staging.banking.local/api

deploy-production:
  environment: production
  steps:
    - name: Deploy
      run: |
        docker compose -f docker-compose.prod.yml up -d
      env:
        NODE_ENV: production
        LOG_LEVEL: warn
        API_URL: https://banking.local/api
```

GitHub Environments let me add approval gates:

```yaml
# .github/workflows/deploy.yml
deploy-production:
  environment:
    name: production
    url: https://banking.local
```

Then in GitHub UI: Settings → Environments → Production → **Required reviewers** → Add yourself. Now every production deploy needs manual approval, even though the workflow is automated.

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

### Secret Management Best Practices

Never put secrets in your repository. Ever. I use GitHub Secrets:

```bash
# Set secrets via CLI
gh secret set DOCKER_USERNAME --body "$(cat docker-username.txt)"
gh secret set DOCKER_PASSWORD --body "$(cat docker-password.txt)"
gh secret set VPS_SSH_KEY --body "$(cat ~/.ssh/id_ecdsa_deploy)"

# For environment-specific secrets
gh secret set --env production POSTGRES_PASSWORD --body "$(prod-password)"
gh secret set --env staging POSTGRES_PASSWORD --body "$(staging-password)"
```

Environment-scoped secrets are only available to workflows that target that environment. A staging deploy can't access production database credentials.

### SSH Key Management

The deploy SSH key needs special handling. I create a dedicated deploy key:

```bash
# On the VPS
ssh-keygen -t ecdsa -b 521 -f ~/.ssh/deploy-key -N ""
cat ~/.ssh/deploy-key.pub >> ~/.ssh/authorized_keys

# Restrict the key to only what's needed
# In ~/.ssh/authorized_keys:
command="/opt/banking-stack/deploy-wrapper.sh",no-agent-forwarding,no-port-forwarding,no-pty,no-user-rc,no-X11-forwarding ecdsa-sha2-nistp521 AAAAE2VjZHNh...
```

The `command=` restriction forces any SSH session using this key to run only the `deploy-wrapper.sh` script:

```bash
#!/bin/bash
# /opt/banking-stack/deploy-wrapper.sh
case "$SSH_ORIGINAL_COMMAND" in
  "deploy")
    cd /opt/banking-stack
    git pull
    docker compose pull
    docker compose up -d
    docker compose exec -T ledger npm run migrate
    echo "Deploy successful"
    ;;
  "status")
    docker compose ps
    ;;
  "rollback")
    docker compose pull
    docker compose up -d
    echo "Rolled back"
    ;;
  *)
    echo "Unknown command"
    exit 1
    ;;
esac
```

This limits the blast radius if the key is compromised. Even with the key, an attacker can only run one of three predefined commands.

---

## Deployment Strategies

### Rolling Update (Current)

My current deploy is a simple rolling update:

```bash
docker compose pull
docker compose up -d --remove-orphans
```

This works because Docker Compose replaces containers one at a time. If a service fails to start, the old container is still running. The `--remove-orphans` flag cleans up any services that were removed from the compose file.

### Blue/Green Deployment

For zero-downtime deploys, I'd use a blue/green strategy. The idea: two identical environments (blue and green). One serves traffic, the other gets the new version. Switch traffic when ready.

```yaml
# docker-compose.bluegreen.yml
services:
  ledger-blue:
    image: ${DOCKER_USERNAME}/banking-ledger:${BLUE_TAG:-latest}
    ports:
      - "3002:3002"
    networks:
      - banking

  ledger-green:
    image: ${DOCKER_USERNAME}/banking-ledger:${GREEN_TAG:-latest}
    ports:
      - "3003:3003"
    networks:
      - banking
```

The Nginx config routes traffic to the active color:

```nginx
upstream ledger {
    server 127.0.0.1:3002;  # blue
    # server 127.0.0.1:3003;  # green (commented out during deploy)
}
```

To switch:

```bash
# Deploy green
export GREEN_TAG=v1.2.3
docker compose -f docker-compose.bluegreen.yml up -d ledger-green

# Wait for green to be healthy
curl -f http://localhost:3003/health

# Update Nginx to route to green
# Replace the upstream block, reload Nginx
nginx -s reload

# Take down blue
docker compose -f docker-compose.bluegreen.yml stop ledger-blue
```

The advantage: if green has issues, I switch back to blue in seconds by reloading Nginx. The downside: double the resources (two instances of each service).

### Database Migrations

Database migrations are the trickiest part of any deploy. Schema changes must be backward-compatible:

```bash
# migration-runner.sh
# Phase 1: Expand (add new columns/tables, don't remove old ones)
docker compose exec -T ledger npm run migrate:up

# Phase 2: Deploy new code (reads new columns, writes to old AND new)
# ... deploy happens here ...

# Phase 3: Contract (remove old columns/tables after verification)
# Run this hours/days later, after confirming new code works
# docker compose exec -T ledger npm run migrate:cleanup
```

The key rule: **never make a schema change that breaks the old code.** The `migrate:up` script only adds columns or tables. It never drops or renames anything. The `migrate:cleanup` script (run hours later) removes old columns that are no longer used.

---

## Failure Notifications

### Slack Notification Detail

My notification setup sends different messages depending on the outcome:

```yaml
- name: Notify success
  if: success()
  uses: 8398a7/action-slack@v3
  with:
    status: success
    text: |
      ✅ *Deploy succeeded*
      *Service:* Banking Stack
      *Branch:* ${{ github.ref_name }}
      *Commit:* ${{ github.sha }}
      *Deploy URL:* https://banking.local
    channel: '#deployments'

- name: Notify failure
  if: failure()
  uses: 8398a7/action-slack@v3
  with:
    status: failure
    text: |
      ❌ *Deploy FAILED*
      *Service:* Banking Stack
      *Branch:* ${{ github.ref_name }}
      *Failed job:* ${{ github.job }}
      *Run URL:* ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
    channel: '#alerts'
```

The failure notification includes a direct link to the GitHub Actions run. Anyone in the channel can click it and see what went wrong.

### Email Notifications for Production

For production deploys, I add email notifications:

```yaml
- name: Email on production deploy
  if: success() && startsWith(github.ref, 'refs/tags/v')
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.gmail.com
    server_port: 465
    username: ${{ secrets.EMAIL_USERNAME }}
    password: ${{ secrets.EMAIL_PASSWORD }}
    subject: 'Production Deploy: Banking Stack ${{ github.ref_name }}'
    to: team@banking.local
    from: CI/CD Pipeline
    body: |
      Production deploy completed successfully.
      Version: ${{ github.ref_name }}
      Deployed at: ${{ github.event.head_commit.timestamp }}
      Commit: ${{ github.sha }}
```

### Webhook for External Monitoring

I also ping an external monitoring service after each deploy:

```yaml
- name: Ping healthchecks.io
  if: always()
  run: |
    curl -fsS -m 10 --retry 5 \
      "https://hc-ping.com/${{ secrets.HEALTHCHECKS_UUID }}/${{ job.status }}"
```

If the pipeline fails to ping, healthchecks.io sends an alert. This catches the case where the notification itself fails.

---

## Rollback Strategy

### Automated Rollback

If the health check fails, I automatically roll back:

```yaml
- name: Health check
  id: health
  run: |
    for i in $(seq 1 10); do
      if curl -sf http://localhost:3002/health > /dev/null; then
        echo "healthy=true" >> $GITHUB_OUTPUT
        exit 0
      fi
      sleep 5
    done
    echo "healthy=false" >> $GITHUB_OUTPUT
    exit 1

- name: Rollback on failure
  if: steps.health.outputs.healthy != 'true'
  run: |
    echo "Health check failed. Rolling back..."
    docker compose pull
    docker compose up -d
    echo "Rollback complete. Previous images restored."

- name: Notify rollback
  if: steps.health.outputs.healthy != 'true'
  run: |
    curl -X POST -H 'Content-type: application/json' \
      --data '{"text":"⛔ Deploy rolled back! Health check failed."}' \
      ${{ secrets.SLACK_WEBHOOK_URL }}
```

The rollback does: `docker compose pull` (which gets the previous images since they were tagged with `latest` before the new push) and `docker compose up -d` (which restarts services). This takes about 10 seconds.

### Manual Rollback via SSH

If the automated rollback fails, I have a manual script:

```bash
#!/bin/bash
# /opt/banking-stack/rollback.sh

if [ -z "$1" ]; then
  echo "Usage: $0 <commit-hash>"
  exit 1
fi

echo "Rolling back to $1..."
cd /opt/banking-stack

# Stash any local changes
git stash

# Checkout the previous commit
git checkout $1

# Rebuild and restart
docker compose down
docker compose build
docker compose up -d

# Verify
sleep 10
curl -f http://localhost:3002/health

if [ $? -eq 0 ]; then
  echo "Rollback successful"
else
  echo "Rollback failed — manual intervention required"
  exit 1
fi
```

Run it:

```bash
ssh deploy@vps /opt/banking-stack/rollback.sh abc123def
```

---

## Monitoring Pipeline

```bash
# List workflow runs
gh run list

# View specific run
gh run view 12345

# Download artifacts
gh run download 12345
```

### Pipeline Metrics

I track these pipeline metrics to identify issues before they become problems:

| Metric | Target | Warning |
|--------|--------|---------|
| CI duration | <5 min | >10 min |
| CD duration | <3 min | >5 min |
| Test pass rate | >95% | <90% |
| Deploy success rate | >99% | <95% |
| Time to restore | <30 min | >60 min |

If CI duration exceeds 10 minutes consistently, I look into caching issues or unnecessary test runs. If deploy success rate drops below 95%, I check for environment inconsistencies.

### Pipeline Health Dashboard

I visualize these metrics in Grafana using the GitHub API:

```typescript
// Collect pipeline metrics
const [owner, repo] = context.repo.split('/');
const workflow = context.workflow;

// Send to InfluxDB
const metrics = {
  measurement: 'ci_cd_metrics',
  tags: { workflow, repo },
  fields: {
    duration: context.payload.workflow_run.run_duration,
    conclusion: context.payload.workflow_run.conclusion,
    attempts: context.payload.workflow_run.run_attempt,
  },
  timestamp: Date.now(),
};

// HTTP POST to InfluxDB
fetch(process.env.INFLUXDB_URL!, {
  method: 'POST',
  body: JSON.stringify(metrics),
  headers: { 'Authorization': `Token ${process.env.INFLUXDB_TOKEN}` }
});
```

This gives me a historical view: "How has our deploy time changed over the last month?" "What day of the week has the most failures?"

---

## Incident Response Integration

### Create GitHub Issue on Failure

When a deploy fails, I automatically create a tracking issue:

```yaml
- name: Create incident issue
  if: failure()
  uses: actions/github-script@v6
  with:
    script: |
      const { data: issue } = await github.rest.issues.create({
        owner: context.repo.owner,
        repo: context.repo.repo,
        title: `Deploy Failed: ${new Date().toISOString()}`,
        body: `## Deploy Failure

**Workflow:** ${context.workflow}
**Run ID:** ${context.runId}
**Branch:** ${context.ref}
**Commit:** ${context.sha}

## Error

${process.env.FAILURE_REASON}

## Investigation

- [ ] Check deploy logs
- [ ] Verify database migrations
- [ ] Check service health
- [ ] Review recent commits
- [ ] Rollback if needed

## Resolution

- [ ] Fix root cause
- [ ] Verify fix in staging
- [ ] Deploy to production
`,
        labels: ['incident', 'deploy-failure']
      });
      console.log(`Created issue: ${issue.html_url}`);
```

This creates a structured incident document that the team can use for post-mortem analysis.

---

## CI/CD Pipeline Design Principles

After building and rebuilding this pipeline several times, these are the principles I follow:

1. **Fail fast.** Run the cheapest checks first. Lint (<30s) before build (~2min) before deploy. Catch common mistakes immediately.

2. **Cache everything.** `node_modules`, `.turbo`, Docker layers. The time you spend configuring caching pays for itself a hundred times over.

3. **Pipeline as documentation.** Anyone on the team can read the workflow files and understand exactly how a deploy works. No tribal knowledge required.

4. **Idempotent deploys.** Running the deploy twice should produce the same result. No "first deploy creates the table, second deploy fails" nonsense.

5. **Tag all the things.** Git tags for code, Docker tags for images, deployment logs with version numbers. Every artifact should be traceable.

6. **Notifications or it didn't happen.** If the pipeline fails and nobody knows, did it really fail? Yes, and the bug is in production. Notify aggressively.

7. **Self-healing where possible, manual where necessary.** Automated rollback for health check failures. Manual approval for production deploys. Know the difference.

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **GitHub Actions** | CI/CD runner |
| **Docker** | Container build |
| **Docker Compose** | Multi-container deploy |
| **Turborepo** | Build caching |
| **SSH** | Remote deploy |
| **Nginx** | Reverse proxy / blue-green switch |
| **Slack** | Notifications |
| **Docker Hub** | Container registry |

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

# Deploy to production
git tag v1.0.0
git push origin v1.0.0

# Monitor
gh run list --workflow ci.yml --branch main
gh run list --workflow deploy.yml --branch main

# Rollback (if needed)
ssh deploy@vps /opt/banking-stack/rollback.sh <previous-commit>
```

The CI/CD pipeline is your safety harness. It catches mistakes, documents your process, and makes deployment boring. And boring is beautiful.
