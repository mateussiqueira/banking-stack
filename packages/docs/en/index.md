---
layout: home
hero:
  name: Banking Challenges
  text: Full-stack fintech challenges
  tagline: 14 challenges simulating real Brazilian financial market problems
  image:
    src: /hero.png
    alt: Banking Challenges
  actions:
    - theme: brand
      text: Get Started
      link: /en/guides/getting-started
    - theme: alt
      text: View on GitHub
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
    details: Banking ledger with GraphQL Relay, DataLoader and MongoDB. Cursor-based pagination, ACID transactions.
    link: /en/challenges/01-ledger
  - icon: ⚡
    title: SPI Simulator
    details: Brazilian Central Bank Instant Payment System. ISO 20022 XML, real-time transactions.
    link: /en/challenges/02-spi
  - icon: 🔑
    title: DICT Simulator
    details: Directory of Transactional Account Identifiers. The system behind Pix keys.
    link: /en/challenges/03-dict
  - icon: 💳
    title: ISO 8583
    details: Binary financial message simulator over TCP. The protocol that powers the card industry.
    link: /en/challenges/04-iso8583
  - icon: 🔄
    title: Workflow Engine
    details: DAG workflow engine with WebSockets. Real-time financial process orchestration.
    link: /en/challenges/05-workflow
  - icon: 🏦
    title: Go for Performance
    details: SPI and DICT reimplemented in Go + Gin. 4x less memory, binary deploy, native concurrency.
    link: /en/decisions/why-go
---

# Banking Challenges

Ever wondered how a Pix transfer actually works under the hood?

Not the pretty app interface. The ugly part. The massive XMLs, binary protocols, key directories, nightly reconciliations.

This project is a deep dive into that. 14 technical challenges simulating real Brazilian financial market problems.

## Why it exists

Each challenge is a miniature of a real system. SPI, DICT, ISO 8583, Open Finance — these all exist in production and move billions daily.

The idea is simple: if you understand how these systems work internally, you can build anything in fintech.

## What you'll find

- **11 backend services** — each solving a specific problem
- **2 Go services** — SPI and DICT reimplemented for performance
- **2 frontend apps** — KYC and landing page with design system
- **4 databases** — MongoDB, PostgreSQL, Redis, MinIO
- **Full infra** — Docker, Turborepo, CI/CD, Kubernetes
- **Living docs** — VitePress with i18n, Mermaid, built-in search

## How to use

Each challenge is independent. You can run just the SPI Simulator or spin everything up at once.

```bash
git clone https://github.com/mateussiqueira/banking-stack.git
cd banking-stack
pnpm install
docker compose up -d
pnpm dev
```

Done. 13 services running. Each on its own port, each with its own database.

## The philosophy

There's no right or wrong answer. There are trade-offs.

Node.js is great for prototyping. Go is great for production. GraphQL is good for complex queries. REST is good for simplicity. MongoDB is good for flexible data. PostgreSQL is good for structured data.

The goal isn't to teach you a language. It's to teach you how to think.

---

<div class="author-section">

### Mateus Siqueira

Full-stack developer specialized in financial systems architecture.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/mateussiqueira)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/mateussiqueira)

</div>
