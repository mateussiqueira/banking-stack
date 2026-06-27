# Post 6: Full Stack Infra — From Docker to K8s

## Hook
Infraestrutura de produção não começa com Kubernetes. Começa com Docker Compose e cresce.

## Body

O Banking Challenges tem uma stack de infra completa:

**Local Development:**
- Docker Compose (Mongo, Redis, Postgres, MinIO)
- Makefile com 14+ comandos
- Turborepo para build paralelo

**CI/CD:**
- GitHub Actions (ci.yml + deploy.yml)
- Tekton Pipelines (produção + staging)
- Scripts de setup automatizado

**Proxmox (Home Lab):**
- Ansible playbooks (proxmox-setup, databases, k8s-cluster)
- Terraform (infra as code)
- K8s monitoring (Grafana, Prometheus, Loki)

**Deploy:**
- VitePress docs → Vercel
- Landing Page → Vercel
- Backend → Docker containers
- Go services → Binary deployment

**O que aprendi:**
1. Comece simples (Docker Compose)
2. Automatize cedo (Makefile)
3. CI/CD desde o dia 1
4. Monitoring é feature, não overhead
5. Home lab é laboratório de aprendizado

Não precisa de cluster K8s para começar. Precisa de disciplina.

#devops #docker #kubernetes #terraform #ansible #cicd