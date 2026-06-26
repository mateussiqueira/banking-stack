# Comparação de Stacks

Por que escolhemos cada tecnologia e quando usar cada uma.

## Backend

| Tecnologia | Quando usar | Exemplo no projeto |
|------------|-------------|-------------------|
| **Go** | Performance crítica, baixa latência | SPI Simulator, DICT Simulator |
| **Node.js** | Prototipagem rápida, ecossistema rico | ISO 8583, Workflow Engine |
| **GraphQL** | Consultas complexas, dados aninhados | Ledger |
| **REST** | Simplicidade, CRUD básico | DICT, Open Finance |

## Go vs Node.js

```
┌─────────────────┬─────────────────┬─────────────────┐
│ Critério        │ Go              │ Node.js         │
├─────────────────┼─────────────────┼─────────────────┤
│ Latência        │ ~0.2ms          │ ~5ms            │
│ Memória         │ ~10MB           │ ~50MB           │
│ Throughput      │ 50K req/s       │ 2K req/s        │
│ Startup         │ ~50ms           │ ~2s             │
│ Learning curve  │ Alto            │ Baixo           │
│ Ecossistema     │ Crescendo       │ Maduro          │
│ Concorrência    │ Goroutines      │ Event loop      │
│ Deploy          │ Binário único   │ Node + node_modules │
└─────────────────┴─────────────────┴─────────────────┘
```

### Quando usar Go

- Sistemas financeiros (SPI, DICT)
- APIs de alta performance
- Microserviços com milhares de conexões
- Where memory predictability matters

### Quando usar Node.js

- Protótipos e MVPs
- CRUD APIs simples
- Aplicações com lógica de negócio complexa
- Times que conhecem JavaScript

## Bancos de Dados

| Tecnologia | Quando usar | Exemplo no projeto |
|------------|-------------|-------------------|
| **PostgreSQL** | Dados estruturados, transações | Report System |
| **MongoDB** | Dados flexíveis, schema dinâmico | Ledger, DICT |
| **Redis** | Cache, rate limiting, sessões | Leaky Bucket |
| **MinIO** | Storage de arquivos (S3-compatible) | Report System |

## PostgreSQL vs MongoDB

```
┌─────────────────┬─────────────────┬─────────────────┐
│ Critério        │ PostgreSQL      │ MongoDB         │
├─────────────────┼─────────────────┼─────────────────┤
│ Schema          │ Rígido          │ Flexível        │
│ Joins           │ Nativo          │lookup (lento)   │
│ Transações      │ ACID completo   │ Multi-document  │
│ Performance     │ Índices B-tree  │ Índices BSON    │
│ Escalabilidade  │ Vertical        │ Horizontal      │
│ JSON support    │ JSONB           │ Nativo          │
└─────────────────┴─────────────────┴─────────────────┘
```

### Quando usar PostgreSQL

- Dados relacionais (contas, transações)
- Integridade referencial
- Queries complexas com JOINs
- Compliance e auditoria

### Quando usar MongoDB

- Dados semi-estruturados (logs, eventos)
- Schema que muda frequentemente
- Prototipagem rápida
- Dados grandes com acesso sequencial

## Frontend

| Tecnologia | Quando usar | Exemplo no projeto |
|------------|-------------|-------------------|
| **Next.js** | SSR, landing pages, SEO | Landing Page |
| **Vite + React** | SPA, apps internos | KYC System |
| **Radix UI** | Componentes acessíveis | Landing Page |
| **Tailwind** | Estilização rápida | Landing Page |

## Infraestrutura

| Tecnologia | Quando usar | Exemplo no projeto |
|------------|-------------|-------------------|
| **Docker** | Containerização local | Todos os serviços |
| **Kubernetes** | Ordonação em produção | Deploy |
| **Vercel** | Frontend e docs | Landing Page, Docs |
| **Proxmox** | Hipervisor on-premise | DevOps Challenge |

## A regra de ouro

> **Use a ferramenta certa para o job certo.**

Não existe "melhor stack". Existem trade-offs.

- Go é melhor para performance
- Node.js é melhor para produtividade
- PostgreSQL é melhor para dados estruturados
- MongoDB é melhor para dados flexíveis
- Docker é melhor para consistência
- Kubernetes é melhor para escala

O objetivo é entender esses trade-offs e fazer escolhas informadas.
