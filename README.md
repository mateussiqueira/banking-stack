
<h1 align="center">Banking Challenges</h1>

<p align="center">
  <strong>Monorepo de desafios técnicos full-stack para fintechs</strong><br />
  <strong>Full-stack fintech technical challenges monorepo</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/build-turborepo-red?style=flat-square" alt="Build" />
  <img src="https://img.shields.io/badge/tests-jest-blue?style=flat-square" alt="Tests" />
  <img src="https://img.shields.io/badge/license-MIT-green?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/pnpm-9.1.0-orange?style=flat-square" alt="pnpm" />
  <img src="https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen?style=flat-square" alt="Node" />
  <img src="https://img.shields.io/badge/typescript-5.4-blue?style=flat-square" alt="TypeScript" />
</p>

---

## 🇧🇷 Descrição

**Banking Challenges** é um monorepo contendo 14 desafios técnicos que simulam problemas reais do mercado financeiro brasileiro. O projeto foi construído para demonstrar proficiência em arquitetura de sistemas financeiros, incluindo:

- Simulação do **SPI (Sistema de Pagamentos Instantâneos)** do Banco Central do Brasil
- **DICT (Diretório de Identificadores de Contas Transacionais)** — o diretório do Pix
- **Ledger bancário** com GraphQL e Relay
- **ISO 8583** — padrão de mensagens financeiras
- **Open Finance** — simulação do ecossistema de dados abertos
- **NFS-e** — integração com nota fiscal de serviços eletrônica
- **Workflow Engine** — automação de processos
- **KYC** — sistema de verificação de identidade
- E outros sistemas auxiliares

## 🇬🇧 Description

**Banking Challenges** is a monorepo containing 14 technical challenges that simulate real-world Brazilian financial market problems. The project was built to demonstrate proficiency in financial systems architecture, including:

- **SPI (Instant Payment System)** simulation from Brazilian Central Bank
- **DICT (Directory of Transactional Account Identifiers)** — Pix directory
- **Bank Ledger** with GraphQL and Relay
- **ISO 8583** — financial messaging standard
- **Open Finance** — open data ecosystem simulation
- **NFS-e** — electronic service invoice integration
- **Workflow Engine** — process automation
- **KYC** — identity verification system
- And other auxiliary systems

---

## 📐 Architecture Overview / Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Banking Challenges Monorepo                         │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                          Infrastructure                              │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐             │  │
│  │  │ MongoDB  │  │  Redis   │  │PostgreSQL│  │  MinIO   │             │  │
│  │  │  (7)     │  │ (7-alpine)│  │(16-alpine)│  │(S3-compat)│             │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         Backend Services                             │  │
│  │                                                                       │  │
│  │  ┌────────────┐  ┌──────────────┐  ┌──────────────┐                  │  │
│  │  │  Ledger    │  │ SPI Simulator│  │DICT Simulator│                  │  │
│  │  │ (GraphQL)  │  │(ISO 20022)   │  │  (REST)      │                  │  │
│  │  ├────────────┤  ├──────────────┤  ├──────────────┤                  │  │
│  │  │ ISO 8583   │  │   Workflow   │  │Open Finance  │                  │  │
│  │  │ Simulator  │  │   Engine     │  │  Simulator   │                  │  │
│  │  ├────────────┤  ├──────────────┤  ├──────────────┤                  │  │
│  │  │   NFS-e    │  │    Report    │  │ Leaky Bucket │                  │  │
│  │  │ Integration│  │    System    │  │(Rate Limiter)│                  │  │
│  │  └────────────┘  └──────────────┘  └──────────────┘                  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         Frontend Applications                         │  │
│  │  ┌─────────────────────┐  ┌─────────────────────┐                    │  │
│  │  │    Landing Page     │  │     KYC System      │                    │  │
│  │  │   (Next.js 14)      │  │    (Vite + React)   │                    │  │
│  │  │   + Storybook       │  │    + Zustand        │                    │  │
│  │  └─────────────────────┘  └─────────────────────┘                    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      Documentation (VitePress)                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         DevOps / Infra                                │  │
│  │  ┌──────────────────┐  ┌──────────────────┐                          │  │
│  │  │   CI/CD (GH/Bit)  │  │   Proxmox        │                          │  │
│  │  └──────────────────┘  └──────────────────┘                          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack / Pilha Tecnológica

| Category / Categoria | Technologies / Tecnologias |
|----------------------|---------------------------|
| **Monorepo** | Turborepo, pnpm, TypeScript |
| **Backend** | Node.js 20+, Koa, Fastify, Express |
| **GraphQL** | graphql-js, graphql-relay, DataLoader |
| **Frontend** | Next.js 14, React 18, Vite, TailwindCSS |
| **Design System** | Radix UI, Storybook, CVA, Tailwind Merge |
| **Database** | MongoDB 7 (Replica Set), PostgreSQL 16, Redis 7 |
| **Storage** | MinIO (S3-compatible) |
| **Messaging** | ISO 20022 (XML), ISO 8583 (binary) |
| **Testing** | Jest, Vitest, Testing Library |
| **CI/CD** | GitHub Actions / Bitbucket Pipelines |
| **Virtualization** | Proxmox, Docker, Docker Compose |
| **Documentation** | VitePress, Markdown, Mermaid |

---

## 🚀 Quick Start / Início Rápido

```bash
# Clone / Clonar
git clone https://github.com/your-org/banking-stack.git
cd banking-stack

# Install dependencies / Instalar dependências
pnpm install

# Setup environment / Configurar ambiente
cp .env.example .env
make setup

# Start infrastructure / Iniciar infraestrutura
make infra-up

# Start development / Iniciar desenvolvimento
make dev

# Run tests / Executar testes
make test

# Build all packages / Compilar todos os pacotes
make build

# Lint & typecheck
make lint
make typecheck
```

---

## 📂 Project Structure / Estrutura do Projeto

```
banking-stack/
├── package.json                  # Root package.json with scripts
├── pnpm-workspace.yaml           # pnpm workspace config
├── turbo.json                    # Turborepo pipeline
├── tsconfig.json                 # Root TypeScript config
├── Makefile                      # Automation commands
├── docker-compose.yml            # Infrastructure services
├── docker-compose.dev.yml        # Dev overrides
├── .env.example                  # Environment variables template
│
├── packages/
│   ├── backend/
│   │   ├── ledger/               # CRUD Bank GraphQL Relay
│   │   ├── spi-simulator/        # SPI/ICOM Simulator (ISO 20022)
│   │   ├── dict-simulator/       # DICT Simulator
│   │   ├── iso8583/              # ISO 8583 Simulator
│   │   ├── workflow-engine/      # Mini n8n/zapier
│   │   ├── open-finance/         # Open Finance Simulator
│   │   ├── nfse/                 # NFS-e Integration
│   │   ├── report-system/        # Report System
│   │   └── leaky-bucket/         # Leaky Bucket Rate Limiter
│   │
│   ├── frontend/
│   │   ├── landing-page/         # Landing Page + Design System
│   │   ├── kyc-system/           # KYC System
│   │   └── shared-ui/            # Shared UI Components
│   │
│   ├── devops/
│   │   ├── cicd/                 # CI/CD Challenge
│   │   └── proxmox/              # DevOps Proxmox
│   │
│   └── docs/                     # VitePress documentation
│       ├── src/
│       │   ├── index.md
│       │   ├── architecture/
│       │   ├── challenges/
│       │   └── guides/
│       └── rfc/
│
├── services/
│   ├── mongodb/                  # MongoDB init scripts
│   ├── postgres/                 # PostgreSQL init scripts
│   └── redis/                    # Redis config
│
└── scripts/
    └── setup.sh                  # Setup script
```

---

## 🧩 Challenges / Desafios

| # | Challenge (PT) | Challenge (EN) | Status | Stack | Doc |
|---|---|---|---|---|---|
| 01 | **Ledger Bancário CRUD** | **CRUD Bank GraphQL Relay** | ✅ Implemented | Koa, GraphQL, Relay, MongoDB | [docs](./packages/docs/src/challenges/01-ledger.md) |
| 02 | **Simulador SPI/ICOM** | **SPI/ICOM Simulator** | ✅ Implemented | Fastify, ISO 20022, XML | [docs](./packages/docs/src/challenges/02-spi.md) |
| 03 | **Simulador DICT** | **DICT Simulator** | ✅ Implemented | Fastify, REST, MongoDB | [docs](./packages/docs/src/challenges/03-dict.md) |
| 04 | **Simulador ISO 8583** | **ISO 8583 Simulator** | ✅ Implemented | Fastify, JSON/Raw, TCP | [docs](./packages/docs/src/challenges/04-iso8583.md) |
| 05 | **Workflow Engine** | **Mini n8n/zapier** | ✅ Implemented | Fastify, WebSocket, Redis | [docs](./packages/docs/src/challenges/05-workflow.md) |
| 06 | **Open Finance** | **Open Finance Simulator** | ✅ Implemented | Fastify, OAuth 2.0, REST | [docs](./packages/docs/src/challenges/06-open-finance.md) |
| 07 | **NFS-e** | **NFS-e Integration** | ✅ Implemented | Fastify, SOAP/XML | [docs](./packages/docs/src/challenges/07-nfse.md) |
| 08 | **Sistema de Relatórios** | **Report System** | ✅ Implemented | Fastify, PostgreSQL, MinIO | [docs](./packages/docs/src/challenges/08-report.md) |
| 09 | **Leaky Bucket** | **Leaky Bucket** | ✅ Implemented | Fastify, GraphQL, Redis | [docs](./packages/docs/src/challenges/09-leaky-bucket.md) |
| 10 | **Landing Page + DS** | **Landing Page + Design System** | ✅ Implemented | Next.js 14, Radix, Storybook | [docs](./packages/docs/src/challenges/10-landing-page.md) |
| 11 | **Sistema KYC** | **KYC System** | ✅ Implemented | Vite, React, Zod, Zustand | [docs](./packages/docs/src/challenges/11-kyc.md) |
| 12 | **DevOps Proxmox** | **DevOps Proxmox** | ✅ Implemented | Proxmox VE, LXC, Docker | [docs](./packages/docs/src/challenges/12-proxmox.md) |
| 13 | **CI/CD** | **CI/CD Challenge** | ✅ Implemented | GitHub Actions, Turbo | [docs](./packages/docs/src/challenges/13-cicd.md) |
| 14 | **Arquitetura RFC** | **RFC Architecture** | ✅ Implemented | ADRs, Mermaid, VitePress | [docs](./packages/docs/src/challenges/14-rfc.md) |

---

## 📚 Documentation / Documentação

Full documentation is available at VitePress:

- [Architecture Overview](./packages/docs/src/architecture/overview.md)
- [Architecture Decision Log](./packages/docs/src/architecture/decision-log.md)
- [Getting Started Guide](./packages/docs/src/guides/getting-started.md)
- [Contributing Guide](./packages/docs/src/guides/contribution.md)
- [Deployment Guide](./packages/docs/src/guides/deployment.md)
- [Testing Strategy](./packages/docs/src/guides/testing.md)

### RFC Documents

- [Credit on top of Pix](./packages/docs/rfc/credit-on-pix.md)
- [Data Lake for Fintech](./packages/docs/rfc/data-lake.md)
- [Financial Monitoring System](./packages/docs/rfc/financial-monitoring.md)

---

## 📄 License / Licença

MIT © Banking Challenges
