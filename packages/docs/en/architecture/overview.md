# System Architecture / Arquitetura do Sistema

## Overview

Banking Challenges is a monorepo managed by **Turborepo** with **pnpm workspaces**. The architecture follows a microservice pattern where each challenge is an independent package that can be developed, tested, and deployed separately.

### Architectural Principles

- **Independence**: Each package has its own lifecycle and minimal dependencies.
- **Realistic Simulation**: Simulators replicate real financial systems behavior (SPI, DICT, ISO 20022).
- **Local Infrastructure**: All infrastructure runs via Docker Compose — MongoDB, PostgreSQL, Redis, and MinIO.
- **Go for Critical Paths**: SPI and DICT reimplemented in Go for performance and deterministic memory.
- **Financial Standards**: Implementation of ISO standards (20022, 8583) and Brazilian regulatory patterns.

```
┌─────────────────────────────────────────────────────────────────┐
│                      Clients / Consumers                        │
│  GraphQL Playground │ REST Clients │ Web Browser │ Postman      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                      API Gateway (optional)                      │
│                  Routing, authentication, rate-limit              │
└──┬──────────┬──────────┬──────────┬──────────┬─────────────────┘
   │          │          │          │          │
┌──▼──┐  ┌────▼────┐ ┌──▼──┐  ┌───▼───┐  ┌───▼───┐
│Ledger│  │SPI/ICOM│ │DICT  │  │ISO8583│  │Workflow│
│      │  │        │ │      │  │       │  │Engine  │
│ Koa  │  │ Gin    │ │ Gin  │  │TCP    │  │Fastify │
│GraphQl│  │ISO20022│ │REST  │  │Server │  │Redis   │
│MongoDB│  │XML     │ │JSON  │  │Binary │  │Graph   │
└──┬───┘  └───┬────┘ └──┬───┘  └───┬───┘  └───┬───┘
   │          │         │          │          │
   │     ┌────▼────┐ ┌──▼───┐  ┌──▼───┐  ┌───▼───┐
   │     │Open Fin │ │NFS-e │  │Report│  │Leaky  │
   │     │Fastify  │ │Fastify│  │Fastify│  │Bucket │
   │     │REST+FAPI│ │SOAP  │  │PG+MinIO│  │Redis  │
   └─────┴─────────┴──┴─────┴──┴──────┴──┴───────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    Shared Infrastructure                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ MongoDB  │  │  Redis   │  │PostgreSQL│  │  MinIO   │        │
│  │  (7)     │  │ (7-alpine)│  │(16-alpine)│  │(S3-comp) │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack per Challenge

| Challenge | Backend | Database | Protocol | Status |
|-----------|---------|----------|----------|--------|
| 01 — Ledger | Koa + GraphQL | MongoDB | GraphQL (Relay) | ✅ |
| 02 — SPI | Gin (Go) | In-memory | ISO 20022 XML | ✅ |
| 03 — DICT | Gin (Go) | In-memory | REST JSON | ✅ |
| 04 — ISO 8583 | TCP Server | PostgreSQL | Binary | ✅ |
| 05 — Workflow | Fastify | Redis | REST + WebSockets | ✅ |
| 06 — Open Finance | Fastify | — | OAuth 2.0 + FAPI | ✅ |
| 07 — NFS-e | Fastify | — | SOAP/XML | ✅ |
| 08 — Report | Fastify | PostgreSQL + MinIO | REST | ✅ |
| 09 — Leaky Bucket | Fastify | Redis | REST + Lua | ✅ |
| 10 — Landing Page | Next.js 14 | — | SSR + Tailwind | ✅ |
| 11 — KYC | Vite + React | — | REST/Fetch | ✅ |
| 12 — Proxmox | Terraform + Ansible | — | Shell/API | ✅ |
| 13 — CI/CD | GitHub Actions | — | YAML | ✅ |
| 14 — RFC | Markdown | — | Documentation | ✅ |

---

## Service Communication Model

```
┌──────────────────────────────────────────────────────────────────┐
│                    Service Communication Model                    │
│                                                                  │
│  ┌─────────┐        ┌──────────┐        ┌──────────┐           │
│  │ Ledger  │◄──────►│ SPI Sim  │◄──────►│ DICT Sim │           │
│  │(GraphQL)│  HTTP   │(Go/ISO20022)│  HTTP   │ (Go/REST) │           │
│  └────┬────┘        └──────────┘        └──────────┘           │
│       │                                                          │
│  ┌────▼────┐        ┌──────────┐        ┌──────────┐           │
│  │ Mongo   │        │  Redis   │        │  MinIO   │           │
│  │(Replica)│        │  (Cache) │        │  (S3)    │           │
│  └─────────┘        └──────────┘        └──────────┘           │
│                                                                  │
│  Frontend ◄────HTTP/GraphQL────► Backend ◄────TCP────► ISO 8583│
└──────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### Pix Payment Flow (SPI)

```
Payer                    Ledger                   SPI Simulator          Payee
  │                        │                         │                   │
  │  sendPayment()         │                         │                   │
  │ ──────────────────────►│  createTransaction()     │                   │
  │                        │ ───────────────────────►│  pacs.008 (XML)   │
  │                        │                         │ ────────────────►│
  │                        │                         │                   │
  │                        │  pacs.002 (status)      │                   │
  │                        │ ◄───────────────────────│                   │
  │                        │                         │                   │
  │  status=CONFIRMED      │                         │                   │
  │ ◄──────────────────────│                         │                   │
  │                        │                         │                   │
  │              Settlement (intraday)                │                   │
  │                        │                         │                   │
  │  Return Flow:          │                         │                   │
  │                        │  returnPayment()        │                   │
  │                        │ ───────────────────────►│  pacs.004 (XML)   │
  │                        │                         │ ────────────────►│
```

### Ledger Transaction (MongoDB Transaction)

```
Client                    Koa/GraphQL               MongoDB
  │                         │                         │
  │ createTransaction()     │                         │
  │ ───────────────────────►│                         │
  │                         │ startSession()          │
  │                         │ ───────────────────────►│
  │                         │                         │
  │                         │ validateAccounts()      │
  │                         │ ───────────────────────►│
  │                         │                         │
  │                         │ balanceCheck()          │
  │                         │ ◄───────────────────────│
  │                         │                         │
  │                         │ debitSender()           │
  │                         │ ───────────────────────►│
  │                         │                         │
  │                         │ creditReceiver()        │
  │                         │ ───────────────────────►│
  │                         │                         │
  │                         │ commitTransaction()     │
  │                         │ ───────────────────────►│
  │                         │                         │
  │ { transaction, status } │                         │
  │ ◄───────────────────────│                         │
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      GitHub / Bitbucket                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │   Push   │  │    PR    │  │  Lint    │  │  Tests   │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│         │                                                       │
│  ┌──────▼─────────────────────────────────────────────────────┐ │
│  │                    CI/CD Pipeline                           │ │
│  │  pnpm install → pnpm lint → pnpm typecheck → pnpm test    │ │
│  │  → pnpm build → Build Docker Image → Push to Registry     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                         │                                       │
└─────────────────────────│───────────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────────┐
│                    Proxmox VE / VPS                              │
│  ┌────────────────────────────────────────────────────────┐     │
│  │                   Docker Host                           │     │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │     │
│  │  │ MongoDB  │ │  Redis   │ │PostgreSQL│ │  MinIO   │  │     │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │     │
│  │  ┌──────────────────────────────────────────────────┐  │     │
│  │  │               App Containers                     │  │     │
│  │  │  Ledger │ SPI │ DICT │ ISO8583 │ WF │ OF │ NFS-e │  │     │
│  │  └──────────────────────────────────────────────────┘  │     │
│  └────────────────────────────────────────────────────────┘     │
│                         │                                       │
│  ┌──────────────────────▼────────────────────────────────┐     │
│  │              Nginx / Traefik (Reverse Proxy)           │     │
│  └───────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Makefile Commands

| Command | Description |
|---------|-------------|
| `make infra-up` | Start Docker services |
| `make infra-down` | Stop Docker services |
| `make dev` | Start full dev environment |
| `make build` | Build all packages |
| `make test` | Run all tests |
| `make lint` | Run all linters |
| `make docs` | Start VitePress dev server |
| `make docs-build` | Build docs site |
| `make setup` | Run setup script |
| `make clean` | Clean all artifacts |
