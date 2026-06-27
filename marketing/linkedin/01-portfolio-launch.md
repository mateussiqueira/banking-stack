# Post 1: Portfolio Launch

## Hook
Construí um sistema bancário completo do zero. 14 desafios. 11 backend services. 2 Go services. Tudo documentado.

## Body

Depois de meses mergulhado em arquitetura de pagamentos, decidi transformar tudo em um projeto open-source.

O Banking Challenges é um monorepo com 14 desafios técnicos reais de fintech:

**Backend (9 services + 2 Go):**
- Ledger com GraphQL + Relay + MongoDB
- SPI Simulator (ISO 20022 XML)
- DICT Simulator (chaves Pix)
- ISO 8583 (rede de cartões)
- Workflow Engine (DAG com WebSockets)
- Open Finance (OAuth 2.0)
- NFS-e (SOAP/XML)
- Report System (PDF/CSV/XLSX → MinIO)
- Leaky Bucket (rate limiting com Redis)
- 2 serviços em Go com Gin (SPI + DICT)

**Frontend:**
- Landing Page (Next.js 14 + Storybook + Radix UI)
- KYC System (Vite + React + Zustand)

**Infra:**
- Docker Compose (Mongo, Redis, Postgres, MinIO)
- Turborepo + pnpm workspaces
- CI/CD (GitHub Actions + Tekton)
- Proxmox (Ansible + Terraform + K8s)
- Documentação VitePress (PT/EN)

**Docs completas com:**
- 14descrições detalhadas de cada desafio
- 5 Architecture Decision Records
- 3 RFCs técnicas (Credit on Pix, Data Lake, Financial Monitoring)
- Guias de contribuição e testes
- Deploy em Vercel

Link: https://banking-docs.vercel.app

#buildinpublic #fintech #backend #golang #typescript #portfolio