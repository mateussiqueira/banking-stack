
<h1 align="center">Banking Challenges</h1>

<p align="center">
  <strong>Monorepo de desafios técnicos full-stack para fintechs</strong>
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

## Descrição

**Banking Challenges** é um monorepo contendo 14 desafios técnicos que simulam problemas reais do mercado financeiro brasileiro. O projeto foi construído para demonstrar proficiência em arquitetura de sistemas financeiros, incluindo:

- Simulação do **SPI (Sistema de Pagamentos Instantâneos)** do Banco Central do Brasil
- **DICT (Diretório de Identificadores de Contas Transacionais)** — o diretório do Pix
- **Ledger bancário** com GraphQL e Relay
- **ISO 8583** — padrão de mensagens financeiras
- **Open Finance** — simulação do ecossistema de dados abertos
- **NFS-e** — integração com nota fiscal de serviços eletrônica
- **Workflow Engine** — automação de processos
- **KYC** — sistema de verificação de identidade
- **Landing Page** com design system componentizado
- E outros sistemas auxiliares

---

## Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Banking Challenges Monorepo                         │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                          Infrastructure                              │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐             │  │
│  │  │ MongoDB  │  │  Redis   │  │PostgreSQL│  │  MinIO   │             │  │
│  │  │  (7)     │  │ (7-alpine)│  │(16-alpine)│  │(S3-compat)│           │  │
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
│  │                      Documentação (VitePress)                        │  │
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

## Pilha Tecnológica

| Categoria | Tecnologias |
|-----------|-------------|
| **Monorepo** | Turborepo, pnpm, TypeScript |
| **Backend** | Node.js 20+, Koa, Fastify, Express |
| **GraphQL** | graphql-js, graphql-relay, DataLoader |
| **Frontend** | Next.js 14, React 18, Vite, TailwindCSS |
| **Design System** | Radix UI, Storybook, CVA, Tailwind Merge |
| **Banco de Dados** | MongoDB 7 (Replica Set), PostgreSQL 16, Redis 7 |
| **Armazenamento** | MinIO (S3-compatível) |
| **Mensageria** | ISO 20022 (XML), ISO 8583 (binário) |
| **Testes** | Jest, Vitest, Testing Library |
| **CI/CD** | GitHub Actions / Bitbucket Pipelines |
| **Virtualização** | Proxmox, Docker, Docker Compose |
| **Documentação** | VitePress, Markdown, Mermaid |

---

## Início Rápido

```bash
# Clonar
git clone https://github.com/your-org/banking-stack.git
cd banking-stack

# Instalar dependências
pnpm install

# Configurar ambiente
cp .env.example .env
make setup

# Iniciar infraestrutura
make infra-up

# Iniciar desenvolvimento
make dev

# Executar testes
make test

# Compilar todos os pacotes
make build

# Lint e typecheck
make lint
make typecheck
```

---

## Estrutura do Projeto

```
banking-stack/
├── package.json                  # Root package.json com scripts
├── pnpm-workspace.yaml           # Configuração do pnpm workspace
├── turbo.json                    # Pipeline do Turborepo
├── tsconfig.json                 # Config TS raiz
├── Makefile                      # Comandos de automação
├── docker-compose.yml            # Serviços de infraestrutura
├── docker-compose.dev.yml        # Overrides de dev
├── .env.example                  # Template de variáveis de ambiente
│
├── packages/
│   ├── backend/
│   │   ├── ledger/               # CRUD Bank GraphQL Relay
│   │   ├── spi-simulator/        # Simulador SPI/ICOM (ISO 20022)
│   │   ├── dict-simulator/       # Simulador DICT
│   │   ├── iso8583/              # Simulador ISO 8583
│   │   ├── workflow-engine/      # Mini n8n/zapier
│   │   ├── open-finance/         # Simulador Open Finance
│   │   ├── nfse/                 # Integração NFS-e
│   │   ├── report-system/        # Sistema de Relatórios
│   │   └── leaky-bucket/         # Leaky Bucket (Rate Limiter)
│   │
│   ├── frontend/
│   │   ├── landing-page/         # Landing Page + Design System
│   │   ├── kyc-system/           # Sistema KYC
│   │   └── shared-ui/            # Componentes Compartilhados
│   │
│   ├── devops/
│   │   ├── cicd/                 # Desafio CI/CD
│   │   └── proxmox/              # DevOps Proxmox
│   │
│   └── docs/                     # Documentação VitePress
│       ├── src/
│       │   ├── index.md
│       │   ├── architecture/
│       │   ├── challenges/
│       │   └── guides/
│       └── rfc/
│
├── services/
│   ├── mongodb/                  # Scripts de inicialização MongoDB
│   ├── postgres/                 # Scripts de inicialização PostgreSQL
│   └── redis/                    # Configuração Redis
│
└── scripts/
    └── setup.sh                  # Script de setup
```

---

## Desafios

| # | Desafio | Status | Stack | Documentação |
|---|---|---|---|---|
| 01 | **Ledger Bancário CRUD** | ✅ Implementado | Koa, GraphQL, Relay, MongoDB | [docs](./packages/docs/src/challenges/01-ledger.md) |
| 02 | **Simulador SPI/ICOM** | ✅ Implementado | Fastify, ISO 20022, XML | [docs](./packages/docs/src/challenges/02-spi.md) |
| 03 | **Simulador DICT** | 📋 Scaffold | Express, REST | [docs](./packages/docs/src/challenges/03-dict.md) |
| 04 | **Simulador ISO 8583** | 📋 Scaffold | Protocolo binário, TCP | [docs](./packages/docs/src/challenges/04-iso8583.md) |
| 05 | **Workflow Engine** | 📋 Scaffold | Grafo direcionado, Redis | [docs](./packages/docs/src/challenges/05-workflow.md) |
| 06 | **Open Finance** | 📋 Scaffold | OAuth 2.0, REST | [docs](./packages/docs/src/challenges/06-open-finance.md) |
| 07 | **NFS-e** | 📋 Scaffold | SOAP/XML, Certificados | [docs](./packages/docs/src/challenges/07-nfse.md) |
| 08 | **Sistema de Relatórios** | 📋 Scaffold | PostgreSQL, MinIO, S3 | [docs](./packages/docs/src/challenges/08-report.md) |
| 09 | **Leaky Bucket** | 📋 Scaffold | Redis, Rate Limiting | [docs](./packages/docs/src/challenges/09-leaky-bucket.md) |
| 10 | **Landing Page + DS** | ✅ Implementado | Next.js 14, Radix, Storybook | [docs](./packages/docs/src/challenges/10-landing-page.md) |
| 11 | **Sistema KYC** | ✅ Implementado | Vite, React, Zod, Zustand | [docs](./packages/docs/src/challenges/11-kyc.md) |
| 12 | **DevOps Proxmox** | 📋 Scaffold | Proxmox VE, LXC, Docker | [docs](./packages/docs/src/challenges/12-proxmox.md) |
| 13 | **CI/CD** | 📋 Scaffold | GH Actions, Bitbucket | [docs](./packages/docs/src/challenges/13-cicd.md) |
| 14 | **Arquitetura RFC** | 📋 Docs | ADRs, Mermaid | [docs](./packages/docs/src/challenges/14-rfc.md) |

---

## Documentação

Documentação completa disponível no VitePress:

- [Visão Geral da Arquitetura](./packages/docs/src/architecture/overview.md)
- [Registro de Decisões de Arquitetura](./packages/docs/src/architecture/decision-log.md)
- [Guia de Início](./packages/docs/src/guides/getting-started.md)
- [Guia de Contribuição](./packages/docs/src/guides/contribution.md)
- [Guia de Deploy](./packages/docs/src/guides/deployment.md)
- [Estratégia de Testes](./packages/docs/src/guides/testing.md)

### Documentos RFC

- [Crédito sobre Pix](./packages/docs/rfc/credit-on-pix.md)
- [Data Lake para Fintech](./packages/docs/rfc/data-lake.md)
- [Sistema de Monitoramento Financeiro](./packages/docs/rfc/financial-monitoring.md)

---

## Licença

MIT © Banking Challenges
