# Banking CI/CD Pipelines

Tekton-based CI/CD with GitHub integration for automated testing, building, and deployment.

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        GitHub                                       │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Push develop ──► CI (lint → test → build → docker)         │  │
│  │ Push main    ──► CI (lint → test → build → docker)         │  │
│  │ Push tag v*  ──► CI + CD (deploy production)               │  │
│  └───────────────────────┬───────────────────────────────────────┘  │
│                          │ webhook                                  │
└──────────────────────────┼──────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│                    Tekton Triggers                                   │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ EventListener ──► Interceptor (validate + filter)            │  │
│  │                     │                                          │  │
│  │                     ├─ Push to develop ──► staging-pipeline   │  │
│  │                     ├─ PR opened      ──► staging-pipeline   │  │
│  │                     └─ Push tag v*    ──► production-pipeline│  │
│  └───────────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│                    Tekton Pipelines                                  │
│                                                                     │
│  staging-pipeline:                                                  │
│  ┌─────────┐  ┌──────┐  ┌───────┐  ┌───────┐  ┌──────────────┐   │
│  │ git-    │→│ lint │→│ test  │→│ build │→│ deploy-      │   │
│  │ clone   │  │      │  │       │  │       │  │ staging      │   │
│  └─────────┘  └──────┘  └───────┘  └───────┘  └──────────────┘   │
│                                                                     │
│  production-pipeline:                                               │
│  ┌─────────┐  ┌──────┐  ┌───────┐  ┌───────┐  ┌────────────────┐ │
│  │ git-    │→│ lint │→│ test  │→│ build │→│ deploy-        │ │
│  │ clone   │  │strict│  │       │  │       ││ production     │ │
│  └─────────┘  └──────┘  └───────┘  └───────┘  └────────────────┘ │
│                                                    │               │
│                                                    ▼               │
│                                           ┌────────────────┐      │
│                                           │ notify (slack) │      │
│                                           └────────────────┘      │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│                    Kubernetes                                        │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ namespace: cicd                                              │  │
│  │   - Tasks: git-clone, lint, test, build, deploy             │  │
│  │   - Pipelines: staging-pipeline, production-pipeline        │  │
│  │   - Triggers: github-push, github-tag                       │  │
│  │                                                               │  │
│  │ namespace: banking-staging                                      │  │
│  │   - Staging deployments                                      │  │
│  │                                                               │  │
│  │ namespace: banking                                              │  │
│  │   - Production deployments                                   │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Prerequisites

- Kubernetes cluster 1.28+
- `kubectl` configured with cluster access
- GitHub repository with admin access

## Setup

### 1. Install Tekton

```bash
bash scripts/setup-tekton.sh
```

This installs:
- Tekton Pipelines v0.58
- Tekton Triggers v0.27
- Tekton Dashboard v0.47
- CI/CD namespace (`cicd`)
- All tasks, pipelines, and triggers

### 2. Configure GitHub Webhook

```bash
bash scripts/create-github-secret.sh
```

Then add webhook to your GitHub repository:
- **Payload URL**: `https://webhook.banking.internal/github`
- **Content type**: `application/json`
- **Secret**: (generated by script)
- **Events**: Push, Pull requests, Tags

### 3. GitHub Actions

The CI/CD workflows in `github/actions/` serve as a fallback/alternative to Tekton:

| Workflow | Trigger | Action |
|----------|---------|--------|
| `ci.yml` | Push to any branch, PR | Lint, test (sharded), coverage, build, docker |
| `deploy.yml` | CI success on develop | Deploy to staging |
| `deploy.yml` | Push tag v* | Deploy to production |

## Tekton Pipelines

### Staging Pipeline

Triggered by push to `develop` branch:

| Task | Description |
|------|-------------|
| `git-clone` | Clone repository |
| `lint` | ESLint + Prettier + TypeScript check |
| `test` | Unit tests with coverage threshold (80%) |
| `build` | pnpm build + Docker image (Kaniko) |
| `deploy-staging` | Kustomize apply to banking-staging |

### Production Pipeline

Triggered by push to `main` or tag `v*`:

| Task | Description |
|------|-------------|
| `git-clone` | Clone repository |
| `lint` | Strict mode (zero warnings) |
| `test` | Tests + coverage |
| `build` | Build + push to registry |
| `deploy-production` | Kustomize apply to banking |
| `notify` | Slack notification |

## Custom Tasks

| Task | Description |
|------|-------------|
| `git-clone` | Clone with depth control, outputs commit SHA |
| `lint` | ESLint + Prettier + TypeScript, strict mode |
| `test` | Vitest/Jest with JUnit output, coverage check |
| `build` | pnpm/npm/yarn install + build + Docker via Kaniko |
| `deploy` | Kustomize build + kubectl apply + rollout + health check |

## Security

- Webhook secrets stored as Kubernetes Secrets
- GitHub OAuth for Grafana (staging environment)
- Production deploys require tag push (not branch push)
- Kubeconfigs stored as base64-encoded secrets
- Tekton service accounts scoped via RBAC

## Monitoring

- Tekton Dashboard: `kubectl proxy` → port 8001
- Pipeline runs: `kubectl get pipelineruns -n cicd`
- Task logs: `kubectl logs -n cicd $(kubectl get pods -n cicd -l tekton.dev/task= -o name)`

## Troubleshooting

```bash
# Check event listener logs
kubectl logs -n cicd -l eventlistener=github-event-listener

# View pipeline run details
tkn pipelinerun describe staging-pipeline-run

# List all tasks
tkn task list -n cicd

# Watch webhook events
kubectl get events -n cicd --watch
```
