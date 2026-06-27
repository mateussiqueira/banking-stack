# Arquitetura do Sistema / System Architecture

## 🇧🇷 Visão Geral

O Banking Challenges é um monorepo gerenciado pelo **Turborepo** com **pnpm workspaces**. A arquitetura segue o padrão de microsserviços, onde cada desafio é um pacote independente que pode ser desenvolvido, testado e implantado separadamente.

### Princípios Arquiteturais

- **Independência**: Cada pacote tem seu próprio ciclo de vida e dependências mínimas.
- **Simulação Realista**: Os simuladores replicam comportamentos de sistemas financeiros reais (SPI, DICT, ISO 20022).
- **Infraestrutura Local**: Toda a infraestrutura roda via Docker Compose — MongoDB, PostgreSQL, Redis e MinIO.
- **TypeScript Nativo**: 100% TypeScript, da infraestrutura ao frontend.
- **Padrões Financeiros**: Implementação de padrões ISO (20022, 8583) e regulatórios brasileiros.

```
┌─────────────────────────────────────────────────────────────────┐
│                      Clientes / Consumers                       │
│  GraphQL Playground │ REST Clients │ Web Browser │ Postman      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                      API Gateway (opcional)                     │
│                  Roteamento, autenticação, rate-limit            │
└──┬──────────┬──────────┬──────────┬──────────┬─────────────────┘
   │          │          │          │          │
┌──▼──┐  ┌────▼────┐ ┌──▼──┐  ┌───▼───┐  ┌───▼───┐
│Ledger│  │SPI/ICOM│ │DICT  │  │ISO8583│  │Workflow│
│      │  │        │ │      │  │       │  │Engine  │
│ Koa  │  │Fastify │ │Express│  │TCP    │  │Redis   │
│GraphQl│  │ISO20022│ │REST  │  │Server │  │Graph   │
│MongoDB│  │XML     │ │JSON  │  │Binário│  │DAG     │
└──┬───┘  └───┬────┘ └──┬───┘  └───┬───┘  └───┬───┘
   │          │         │          │          │
   │     ┌────▼────┐ ┌──▼───┐  ┌──▼───┐  ┌───▼───┐
   │     │Open Fin │ │NFS-e │  │Report│  │Leaky  │
   │     │OAuth2   │ │SOAP  │  │MinIO │  │Bucket │
   │     │REST     │ │XML   │  │PG    │  │Redis  │
   └─────┴─────────┴──┴─────┴──┴──────┴──┴───────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                    Infraestrutura Compartilhada                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ MongoDB  │  │  Redis   │  │PostgreSQL│  │  MinIO   │        │
│  │  (7)     │  │ (7-alpine)│  │(16-alpine)│  │(S3-comp) │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🇬🇧 Overview

Banking Challenges is a monorepo managed by **Turborepo** with **pnpm workspaces**. The architecture follows a microservice pattern where each challenge is an independent package that can be developed, tested, and deployed separately.

### Architectural Principles

- **Independence**: Each package has its own lifecycle and minimal dependencies.
- **Realistic Simulation**: Simulators replicate real financial systems behavior (SPI, DICT, ISO 20022).
- **Local Infrastructure**: All infrastructure runs via Docker Compose — MongoDB, PostgreSQL, Redis, and MinIO.
- **Native TypeScript**: 100% TypeScript, from infrastructure to frontend.
- **Financial Standards**: Implementation of ISO standards (20022, 8583) and Brazilian regulatory patterns.

---

## Tech Stack per Challenge / Pilha por Desafio

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

## Communication Between Services / Comunicação entre Serviços

```
┌──────────────────────────────────────────────────────────────────┐
│                    Service Communication Model                    │
│                                                                  │
│  ┌─────────┐        ┌──────────┐        ┌──────────┐           │
│  │ Ledger  │◄──────►│ SPI Sim  │◄──────►│ DICT Sim │           │
│  │(GraphQL)│  HTTP   │(ISO20022)│  HTTP   │ (REST)   │           │
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

## Data Flow Diagrams / Diagramas de Fluxo

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

## Deployment Architecture / Arquitetura de Deploy

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

## Makefile Commands / Comandos Makefile

| Command | Description | Descrição |
|---------|-------------|-----------|
| `make infra-up` | Start Docker services | Iniciar serviços Docker |
| `make infra-down` | Stop Docker services | Parar serviços Docker |
| `make dev` | Start full dev environment | Iniciar ambiente dev completo |
| `make build` | Build all packages | Compilar todos os pacotes |
| `make test` | Run all tests | Executar todos os testes |
| `make lint` | Run all linters | Executar linters |
| `make docs` | Start VitePress dev server | Iniciar servidor de documentação |
| `make docs-build` | Build docs site | Compilar site de documentação |
| `make setup` | Run setup script | Executar script de setup |
| `make clean` | Clean all artifacts | Limpar artefatos de build |
