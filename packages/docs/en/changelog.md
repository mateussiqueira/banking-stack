# Changelog

History of banking-stack versions.

## v1.0.0 (2026-06-26)

### Features

- **SPI Simulator (Go)** — ISO 20022, real-time Pix transactions
- **DICT Simulator (Go)** — Pix key registration and lookup
- **ISO 8583 Simulator** — Binary financial messages
- **Workflow Engine** — Process automation with directed graphs
- **Open Finance Simulator** — OAuth 2.0, consents, accounts
- **NFS-e Integration** — Electronic service invoices
- **Report System** — Report generation with MinIO
- **Leaky Bucket** — Rate limiting with Redis and GraphQL
- **Ledger** — Bank CRUD with GraphQL and Relay
- **Landing Page** — Next.js 14, Radix UI, Storybook
- **KYC System** — Vite, React, Zod, Zustand
- **Documentation** — VitePress, PT/EN, API Reference

### Infrastructure

- Docker Compose for all services
- MongoDB, PostgreSQL, Redis, MinIO
- GitHub Actions CI/CD
- Vercel for docs and frontend

### Decisions

- Go for critical financial services (SPI, DICT)
- TypeScript for business logic and prototyping
- MongoDB for flexible data (Ledger, DICT)
- PostgreSQL for structured data (Reports)
- Redis for cache and rate limiting

---

## v0.1.0 (2026-06-01)

### Initial release

- Scaffold for 14 challenges
- Docker Compose for infrastructure
- Basic documentation
