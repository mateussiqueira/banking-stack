# Changelog

Histórico de versões do banking-stack.

## v1.0.0 (2026-06-26)

### Features

- **SPI Simulator (Go)** — ISO 20022, transações Pix em tempo real
- **DICT Simulator (Go)** — Registro e consulta de chaves Pix
- **ISO 8583 Simulator** — Mensagens financeiras binárias
- **Workflow Engine** — Automação de processos com directed graphs
- **Open Finance Simulator** — OAuth 2.0, consents, contas
- **NFS-e Integration** — Nota fiscal de serviços eletrônica
- **Report System** — Geração de relatórios com MinIO
- **Leaky Bucket** — Rate limiting com Redis e GraphQL
- **Ledger** — CRUD bancário com GraphQL e Relay
- **Landing Page** — Next.js 14, Radix UI, Storybook
- **KYC System** — Vite, React, Zod, Zustand
- **Documentation** — VitePress, PT/EN, API Reference

### Infrastructure

- Docker Compose para todos os serviços
- MongoDB, PostgreSQL, Redis, MinIO
- GitHub Actions CI/CD
- Vercel para docs e frontend

### Decisions

- Go para serviços financeiros críticos (SPI, DICT)
- TypeScript para lógica de negócio e prototipagem
- MongoDB para dados flexíveis (Ledger, DICT)
- PostgreSQL para dados estruturados (Reports)
- Redis para cache e rate limiting

---

## v0.1.0 (2026-06-01)

### Initial release

- Scaffold dos 14 desafios
- Docker Compose para infraestrutura
- Documentação básica
