<h1 align="center">🏦 Banking Challenges Monorepo</h1>

<p align="center">
  <strong>Technical challenges simulating real-world Brazilian financial market problems</strong><br />
  <em>Clean Architecture • Domain-Driven Design • High Performance</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/build-Turborepo-EF4444?style=flat-square&logo=turborepo&logoColor=white" alt="Build" />
  <img src="https://img.shields.io/badge/package--manager-pnpm-F69220?style=flat-square&logo=pnpm&logoColor=white" alt="pnpm" />
  <img src="https://img.shields.io/badge/runtime-Node.js%2020%2B-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node" />
  <img src="https://img.shields.io/badge/language-TypeScript%205.4-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/test-Jest%20%2F%20Vitest-C21325?style=flat-square&logo=jest&logoColor=white" alt="Tests" />
  <img src="https://img.shields.io/badge/license-MIT-4EAA25?style=flat-square" alt="License" />
</p>

---

## 🇧🇷 Descrição / 🇬🇧 Description

### 🇧🇷
**Banking Challenges** é um monorepo contendo 14 desafios técnicos que simulam problemas reais e complexos do mercado financeiro brasileiro. Este projeto foi desenhado sob os mais rígidos padrões de **Clean Architecture** (desacoplamento total de frameworks nas camadas de negócio) e **Domain-Driven Design (DDD)** para demonstrar proficiência em engenharia financeira moderna:

*   **SPI (Sistema de Pagamentos Instantâneos)**: Simulação do fluxo de liquidação do Banco Central (padrão ISO 20022 / XML).
*   **DICT (Diretório de Identificadores)**: Diretório do Pix para registro e resolução de chaves em tempo real.
*   **ISO 8583**: Motor de empacotamento/desempacotamento de mensagens de cartões de crédito/débito.
*   **Ledger Bancário**: Livro-razão financeiro de partidas dobradas integrado a GraphQL e Relay.
*   **Open Finance**: Motor de consentimento baseado em OAuth 2.0.
*   **Workflow Engine**: Automação básica de tarefas distribuídas (estilo n8n/Zapier) integrada via WebSockets.

### 🇬🇧
**Banking Challenges** is a production-ready monorepo containing 14 technical challenges simulating real-world Brazilian fintech problems. Built with a strict focus on **Clean Architecture** (full framework decoupling in core business layers) and **Domain-Driven Design (DDD)**:

*   **SPI (Instant Payments System)**: Central Bank settlement simulator utilizing ISO 20022 XML standards.
*   **DICT (Directory of Account Identifiers)**: Real-time Pix directory key registration and lookup engine.
*   **ISO 8583**: Credit/debit card financial network messaging packer and unpacker.
*   **Bank Ledger**: Transactional double-entry ledger with GraphQL and Relay interfaces.
*   **Open Finance**: Consent engine utilizing OAuth 2.0 protocols.
*   **Workflow Engine**: Distributed task automator (like n8n/Zapier) running via WebSockets.

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
│  │  Provides RFCs, Architecture Decision Records (ADRs) and diagrams    │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack / Pilha Tecnológica

| Category | Technologies | Focus |
|---|---|---|
| **Monorepo** | Turborepo, pnpm workspaces, TypeScript 5.4 | Project isolation & parallel builds |
| **Backend Frameworks** | Node.js (20+), Koa, Fastify, Express | Chosen based on service performance needs |
| **GraphQL** | `graphql-js`, `graphql-relay`, `DataLoader` | Ledger manipulation and query batching |
| **Databases** | MongoDB 7 (Replica Set), PostgreSQL 16, Redis 7 | Event sourcing, transaction logging, caching |
| **Protocols & Formats** | ISO 20022 (XML), ISO 8583 (Binary), SOAP/XML | High fidelity financial integration |
| **Frontend** | Next.js 14 (App Router), React 18, Zustand, Radix UI | Responsive interfaces & state sync |
| **Testing** | Jest, Vitest, Testing Library | Test-Driven Development (TDD) cycle |

---

## 📂 Project Structure / Estrutura do Projeto

```
banking-stack/
├── packages/
│   ├── backend/
│   │   ├── ledger/               # Double-entry ledger API (GraphQL/Relay/MongoDB)
│   │   ├── spi-simulator/        # SPI instant payment settlement (ISO 20022 XML)
│   │   ├── dict-simulator/       # Pix directory lookup & registry (REST/MongoDB)
│   │   ├── iso8583/              # Credit card transaction network packet parser (TCP)
│   │   ├── workflow-engine/      # Distributed state automation engine (WebSockets/Redis)
│   │   ├── open-finance/         # Open Finance consent flows (OAuth 2.0/REST)
│   │   ├── nfse/                 # Brazilian electronic service invoices (SOAP/XML)
│   │   ├── report-system/        # Microservice compiling reports to S3 (PostgreSQL/MinIO)
│   │   └── leaky-bucket/         # Distributed API rate limiter (GraphQL/Redis)
│   │
│   ├── frontend/
│   │   ├── landing-page/         # Next.js 14 landing page & shared design system
│   │   ├── kyc-system/           # React 18 / Zustand frontend for identity validation
│   │   └── shared-ui/            # Reusable UI component library (Radix/Tailwind)
│   │
│   └── docs/                     # Documentation hub (VitePress + Mermaid)
```

---

## 🧩 Challenges / Desafios

| # | Challenge (EN / PT) | Status | Core Stack | Documentation |
|---|---|---|---|---|
| **01** | **CRUD Bank Ledger** / *Ledger Bancário* | ✅ Completed | Koa, GraphQL, Relay, MongoDB | [docs](./packages/docs/src/challenges/01-ledger.md) |
| **02** | **SPI Simulator** / *Simulador SPI/ICOM* | ✅ Completed | Fastify, ISO 20022, XML Parser | [docs](./packages/docs/src/challenges/02-spi.md) |
| **03** | **DICT Simulator** / *Simulador DICT* | ✅ Completed | Fastify, REST API, MongoDB | [docs](./packages/docs/src/challenges/03-dict.md) |
| **04** | **ISO 8583 Simulator** / *Simulador ISO 8583* | ✅ Completed | Fastify, raw TCP sockets, binary | [docs](./packages/docs/src/challenges/04-iso8583.md) |
| **05** | **Workflow Engine** / *Automador de Processos* | ✅ Completed | Fastify, WebSockets, Redis pub/sub | [docs](./packages/docs/src/challenges/05-workflow.md) |
| **06** | **Open Finance** / *Consentimento Pix* | ✅ Completed | Fastify, OAuth 2.0, REST, certs | [docs](./packages/docs/src/challenges/06-open-finance.md) |
| **07** | **NFS-e Integration** / *Integração Nota Fiscal* | ✅ Completed | Fastify, SOAP, XML signatures | [docs](./packages/docs/src/challenges/07-nfse.md) |
| **08** | **Report System** / *Geração de Relatórios* | ✅ Completed | Fastify, PostgreSQL, MinIO SDK | [docs](./packages/docs/src/challenges/08-report.md) |
| **09** | **Leaky Bucket** / *Limitador de Banda* | ✅ Completed | Fastify, GraphQL, Redis hashing | [docs](./packages/docs/src/challenges/09-leaky-bucket.md) |
| **10** | **Landing Page + DS** / *Landing Page e DS* | ✅ Completed | Next.js 14, Radix UI, Storybook | [docs](./packages/docs/src/challenges/10-landing-page.md) |
| **11** | **KYC System** / *Verificação cadastral* | ✅ Completed | Vite, React, Zustand, Zod schema | [docs](./packages/docs/src/challenges/11-kyc.md) |
| **12** | **DevOps Proxmox** / *Infraestrutura Proxmox* | ✅ Completed | Proxmox VE, LXC containers, Docker | [docs](./packages/docs/src/challenges/12-proxmox.md) |
| **13** | **CI/CD Pipeline** / *Automação de entrega* | ✅ Completed | GitHub Actions, Turborepo cache | [docs](./packages/docs/src/challenges/13-cicd.md) |
| **14** | **Architecture RFC** / *Decisões de Arquitetura* | ✅ Completed | VitePress, Markdown, Mermaid, ADRs | [docs](./packages/docs/src/challenges/14-rfc.md) |

---

## 🚀 Quick Start / Início Rápido

### Prerequisites
*   Node.js (>=20.0.0)
*   pnpm (>=9.0.0)
*   Docker & Docker Compose

### Commands
```bash
# 1. Clone & install dependencies
git clone https://github.com/mateussiqueira/banking-stack.git
cd banking-stack
pnpm install

# 2. Environment config & initial script setup
cp .env.example .env
make setup

# 3. Spin up MongoDB, Redis, PostgreSQL, and MinIO locally
make infra-up

# 4. Run all services in development mode (using Turborepo)
make dev

# 5. Run full test suite (Jest/Vitest)
make test

# 6. Verify linting & type checks
make lint
make typecheck
```

---

## 📚 Technical Documentation / Documentação Técnica

The monorepo features a comprehensive VitePress documentation suite containing Architecture Decision Records (ADRs) and detailed guides:

*   [Architecture Overview](./packages/docs/src/architecture/overview.md)
*   [Architecture Decision Log (ADRs)](./packages/docs/src/architecture/decision-log.md)
*   [RFC: Credit on top of Pix (Crédito sobre o Pix)](./packages/docs/rfc/credit-on-pix.md)
*   [RFC: Data Lake for Fintechs](./packages/docs/rfc/data-lake.md)
*   [RFC: Financial Transaction Monitoring System](./packages/docs/rfc/financial-monitoring.md)

---

## 📄 License / Licença

Distributed under the MIT License. See [LICENSE](LICENSE) for more details.
