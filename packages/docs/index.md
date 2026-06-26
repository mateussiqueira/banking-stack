---
layout: home
hero:
  name: Banking Challenges
  text: Desafios técnicos para fintechs
  tagline: 14 projetos que simulam problemas reais do mercado financeiro brasileiro
  actions:
    - theme: brand
      text: Começar
      link: /getting-started
    - theme: alt
      text: Ver no GitHub
      link: https://github.com/mateussiqueira/banking-stack
features:
  - title: SPI Simulator
    details: Simulador do Sistema de Pagamentos Instantâneos do Banco Central. ISO 20022, transações em tempo real.
  - title: DICT Simulator
    details: Diretório de Identificadores de Contas Transacionais. O sistema por trás das chaves Pix.
  - title: ISO 8583
    details: Simulador de mensagens financeiras binárias. O protocolo que move o mundo dos cartões.
  - title: Go para performance
    details: Serviços críticos em Go. Por que? Porque quando o dinheiro está em jogo, milissegundos importam.
---

# Banking Challenges

Você já parou pra pensar como funciona uma transferência Pix por baixo dos panos?

Não aquela interface bonitinha do app do banco. A parte feia. Os XMLs gigantes, os protocolos binários, os diretórios de chaves, as reconciliações noturnas.

Esse projeto é um mergulho nessa parte. 14 desafios técnicos que simulam problemas reais do mercado financeiro brasileiro.

## Por que existe

Cada desafio é uma miniatura de um sistema real. SPI, DICT, ISO 8583, Open Finance — tudo isso existe de verdade e move bilhões por dia.

A ideia é simples: se você entende como esses sistemas funcionam por dentro, você consegue construir qualquer coisa em fintech.

## O que você vai encontrar

- **9 backend services** — cada um resolvendo um problema específico
- **2 frontend apps** — KYC e landing page com design system
- **Go e TypeScript** — a mesma coisa implementada em duas linguagens pra você ver a diferença
- **Docs vivas** — não aquela documentação morta que ninguém lê

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
