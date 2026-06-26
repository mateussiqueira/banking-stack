---
layout: home
hero:
  name: Banking Challenges
  text: Full-stack fintech challenges
  tagline: 14 projects simulating real Brazilian financial market problems
  actions:
    - theme: brand
      text: Get Started
      link: /en/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/mateussiqueira/banking-stack
features:
  - title: SPI Simulator
    details: Brazilian Central Bank Instant Payment System simulator. ISO 20022, real-time transactions.
  - title: DICT Simulator
    details: Directory of Transactional Account Identifiers. The system behind Pix keys.
  - title: ISO 8583
    details: Binary financial message simulator. The protocol that powers the card industry.
  - title: Go for performance
    details: Critical services in Go. Why? Because when money is at stake, milliseconds matter.
---

# Banking Challenges

Ever wondered how a Pix transfer actually works under the hood?

Not the pretty app interface. The ugly part. The massive XMLs, binary protocols, key directories, nightly reconciliations.

This project is a deep dive into that. 14 technical challenges simulating real Brazilian financial market problems.

## Why it exists

Each challenge is a miniature of a real system. SPI, DICT, ISO 8583, Open Finance — these all exist in production and move billions daily.

The idea is simple: if you understand how these systems work internally, you can build anything in fintech.

## What you'll find

- **9 backend services** — each solving a specific problem
- **2 frontend apps** — KYC and landing page with design system
- **Go and TypeScript** — same thing implemented in two languages so you can see the difference
- **Living docs** — not the dead documentation nobody reads

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
