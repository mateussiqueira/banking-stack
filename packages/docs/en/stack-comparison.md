# Stack Comparison

Why we chose each technology and when to use each one.

## Backend

| Technology | When to use | Project example |
|------------|-------------|-----------------|
| **Go** | Critical performance, low latency | SPI Simulator, DICT Simulator |
| **Node.js** | Rapid prototyping, rich ecosystem | ISO 8583, Workflow Engine |
| **GraphQL** | Complex queries, nested data | Ledger |
| **REST** | Simplicity, basic CRUD | DICT, Open Finance |

## Go vs Node.js

```
┌─────────────────┬─────────────────┬─────────────────┐
│ Criterion       │ Go              │ Node.js         │
├─────────────────┼─────────────────┼─────────────────┤
│ Latency         │ ~0.2ms          │ ~5ms            │
│ Memory          │ ~10MB           │ ~50MB           │
│ Throughput      │ 50K req/s       │ 2K req/s        │
│ Startup         │ ~50ms           │ ~2s             │
│ Learning curve  │ High            │ Low             │
│ Ecosystem       │ Growing         │ Mature          │
│ Concurrency     │ Goroutines      │ Event loop      │
│ Deploy          │ Single binary   │ Node + node_modules │
└─────────────────┴─────────────────┴─────────────────┘
```

### When to use Go

- Financial systems (SPI, DICT)
- High-performance APIs
- Microservices with thousands of connections
- Where memory predictability matters

### When to use Node.js

- Prototypes and MVPs
- Simple CRUD APIs
- Apps with complex business logic
- Teams that know JavaScript

## Databases

| Technology | When to use | Project example |
|------------|-------------|-----------------|
| **PostgreSQL** | Structured data, transactions | Report System |
| **MongoDB** | Flexible data, dynamic schema | Ledger, DICT |
| **Redis** | Caching, rate limiting, sessions | Leaky Bucket |
| **MinIO** | File storage (S3-compatible) | Report System |

## PostgreSQL vs MongoDB

```
┌─────────────────┬─────────────────┬─────────────────┐
│ Criterion       │ PostgreSQL      │ MongoDB         │
├─────────────────┼─────────────────┼─────────────────┤
│ Schema          │ Rigid           │ Flexible        │
│ Joins           │ Native          │ $lookup (slow)  │
│ Transactions    │ Full ACID       │ Multi-document  │
│ Performance     │ B-tree indexes  │ BSON indexes    │
│ Scalability     │ Vertical        │ Horizontal      │
│ JSON support    │ JSONB           │ Native          │
└─────────────────┴─────────────────┴─────────────────┘
```

### When to use PostgreSQL

- Relational data (accounts, transactions)
- Referential integrity
- Complex queries with JOINs
- Compliance and auditing

### When to use MongoDB

- Semi-structured data (logs, events)
- Schema that changes frequently
- Rapid prototyping
- Large data with sequential access

## Frontend

| Technology | When to use | Project example |
|------------|-------------|-----------------|
| **Next.js** | SSR, landing pages, SEO | Landing Page |
| **Vite + React** | SPA, internal apps | KYC System |
| **Radix UI** | Accessible components | Landing Page |
| **Tailwind** | Rapid styling | Landing Page |

## Infrastructure

| Technology | When to use | Project example |
|------------|-------------|-----------------|
| **Docker** | Local containerization | All services |
| **Kubernetes** | Production orchestration | Deploy |
| **Vercel** | Frontend and docs | Landing Page, Docs |
| **Proxmox** | On-premise hypervisor | DevOps Challenge |

## The golden rule

> **Use the right tool for the job.**

There's no "best stack". There are trade-offs.

- Go is better for performance
- Node.js is better for productivity
- PostgreSQL is better for structured data
- MongoDB is better for flexible data
- Docker is better for consistency
- Kubernetes is better for scale

The goal is to understand these trade-offs and make informed choices.
