---
layout: home
hero:
  name: Banking Challenges
  text: Desafios técnicos para fintechs
  tagline: 14 desafios que simulam problemas reais do mercado financeiro brasileiro
  image:
    src: /hero.png
    alt: Banking Challenges
  actions:
    - theme: brand
      text: Começar
      link: /guides/getting-started
    - theme: alt
      text: Ver no GitHub
      link: https://github.com/mateussiqueira/banking-stack
badges:
  - label: TypeScript
    type: tip
  - label: Go
    type: tip
  - label: Docker
    type: info
  - label: GraphQL
    type: info
  - label: MIT License
    type: warning
features:
  - icon: 💰
    title: Ledger GraphQL
    details: Ledger bancário com GraphQL Relay, DataLoader e MongoDB. Paginação cursor-based, transações ACID.
    link: /challenges/01-ledger
  - icon: ⚡
    title: SPI Simulator
    details: Simulador do Sistema de Pagamentos Instantâneos. ISO 20022 XML, transações em tempo real.
    link: /challenges/02-spi
  - icon: 🔑
    title: DICT Simulator
    details: Diretório de Identificadores de Contas Transacionais. O sistema por trás das chaves Pix.
    link: /challenges/03-dict
  - icon: 💳
    title: ISO 8583
    details: Simulador de mensagens financeiras binárias TCP. O protocolo que move o mundo dos cartões.
    link: /challenges/04-iso8583
  - icon: 🔄
    title: Workflow Engine
    details: Engine de workflows DAG com WebSockets. Orquestração de processos financeiros em tempo real.
    link: /challenges/05-workflow
  - icon: 🏦
    title: Go para Performance
    details: SPI e DICT reimplementados em Go + Gin. 4x menos memória, deploy binário, concurrency nativa.
    link: /decisions/why-go
---

# Banking Challenges

Você já parou pra pensar como funciona uma transferência Pix por baixo dos panos?

Não aquela interface bonitinha do app do banco. A parte feia. Os XMLs gigantes, os protocolos binários, os diretórios de chaves, as reconciliações noturnas.

Esse projeto é um mergulho nessa parte. 14 desafios técnicos que simulam problemas reais do mercado financeiro brasileiro.

## Por que existe

Cada desafio é uma miniatura de um sistema real. SPI, DICT, ISO 8583, Open Finance — tudo isso existe de verdade e move bilhões por dia.

A ideia é simples: se você entende como esses sistemas funcionam por dentro, você consegue construir qualquer coisa em fintech.

## O que você vai encontrar

- **11 backend services** — cada um resolvendo um problema específico
- **2 Go services** — SPI e DICT reimplementados para performance
- **2 frontend apps** — KYC e landing page com design system
- **4 databases** — MongoDB, PostgreSQL, Redis, MinIO
- **Infra completa** — Docker, Turborepo, CI/CD, Kubernetes
- **Docs vivas** — VitePress com i18n, Mermaid, busca integrada

## Como usar

Cada desafio é independente. Você pode rodar só o SPI Simulator ou subir tudo de uma vez.

```bash
git clone https://github.com/mateussiqueira/banking-stack.git
cd banking-stack
pnpm install
docker compose up -d
pnpm dev
```

Pronto. 13 serviços rodando. Cada um na sua porta, cada um com seu banco de dados.

## A filosofia

Não existe resposta certa ou errada. Existem trade-offs.

Node.js é ótimo pra prototipar. Go é ótimo pra produção. GraphQL é bom pra consultas complexas. REST é bom pra simplicidade. MongoDB é bom pra dados flexíveis. PostgreSQL é bom pra dados estruturados.

O objetivo não é te ensinar uma linguagem. É te ensinar a pensar.

---

<div class="author-section">

### Mateus Siqueira

Full-stack developer especializado em arquitetura de sistemas financeiros.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/mateussiqueira)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/mateussiqueira)

</div>
