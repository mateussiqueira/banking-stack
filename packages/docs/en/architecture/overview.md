# System Architecture / Arquitetura do Sistema

## Overview

Banking Challenges is a **monorepo** managed by **Turborepo** with **pnpm workspaces**. Each challenge is an independent package, but all share one vision: **simulating real Brazilian financial systems** with the most appropriate technology for each problem.

## Switch: TypeScript vs Go

<LanguageToggle />

<div class="lang-content ts" style="display:block;">

### Full Stack

| Layer | Technology | Challenges |
|-------|------------|------------|
| **Backend** | TypeScript (Koa, Fastify, Express) | 01, 05, 06, 07, 08, 09 |
| **Frontend** | Next.js 14, Vite + React | 10, 11 |
| **Database** | MongoDB, PostgreSQL, Redis | All |
| **Infra** | Docker, Kubernetes, Proxmox | 12 |
| **CI/CD** | GitHub Actions, GitLab CI | 13 |
| **Docs** | VitePress | All |

### Challenge Mapping

| # | Challenge | Main Stack | Database |
|---|-----------|------------|----------|
| 01 | [Ledger GraphQL](/en/challenges/01-ledger) | Koa + GraphQL | MongoDB |
| 02 | [SPI Simulator](/en/challenges/02-spi) | Go (Gin) + ISO 20022 | In-memory |
| 03 | [DICT Simulator](/en/challenges/03-dict) | Go (Gin) + REST | In-memory |
| 04 | [ISO 8583](/en/challenges/04-iso8583) | TCP Server + Go | PostgreSQL |
| 05 | [Workflow Engine](/en/challenges/05-workflow) | Fastify + DAG | Redis |
| 06 | [Open Finance](/en/challenges/06-open-finance) | Fastify + FAPI | PostgreSQL |
| 07 | [NFS-e](/en/challenges/07-nfse) | Fastify + SOAP | PostgreSQL |
| 08 | [Report System](/en/challenges/08-report) | Fastify + Streaming | PostgreSQL |
| 09 | [Leaky Bucket](/en/challenges/09-leaky-bucket) | Fastify + Lua | Redis |
| 10 | [Landing Page](/en/challenges/10-landing-page) | Next.js 14 | - |
| 11 | [KYC System](/en/challenges/11-kyc) | Vite + React | PostgreSQL |
| 12 | [Proxmox + IaC](/en/challenges/12-proxmox) | Terraform + Ansible | - |
| 13 | [CI/CD](/en/challenges/13-cicd) | GitHub Actions | - |
| 14 | [RFC / ADR](/en/challenges/14-rfc) | Markdown | - |
| 15 | [PISP](/en/challenges/15-pisp) | Open Finance + FAPI | PostgreSQL |
| 16 | [Anticipation](/en/challenges/16-anticipation) | Pricing Engine | PostgreSQL |

### Security

| Layer | Technology |
|-------|------------|
| Transport | TLS 1.3, mTLS |
| Auth | JWT, OAuth 2.0, FAPI |
| Crypto | AES-256, RSA, 3DES |
| Rate Limiting | Leaky Bucket (Redis + Lua) |
| Audit | Immutable logs, 5+ years |

</div>

<div class="lang-content go" style="display:none;">

### Go Stack in Banking Stack

| Layer | Technology | Challenges |
|-------|------------|------------|
| **Backend Core** | Go (Gin) | 02 SPI, 03 DICT |
| **ISO 8583** | Go TCP Server | 04 |
| **Performance** | Goroutines + Channels | All Go services |
| **Crypto** | crypto/rsa, crypto/x509 | 02, 04 |
| **XML** | encoding/xml | 02, 04 |
| **Deploy** | Single binary | All |

### Why Go for Critical Services?

| Service | Why Go |
|---------|--------|
| **SPI Simulator** | ISO 20022 XML parsing, < 1ms latency |
| **DICT Simulator** | High-perf REST, concurrency |
| **ISO 8583** | TCP binary, bit-level parsing |

### Benchmark: Go vs TypeScript

| Service | TS Throughput | Go Throughput | Gain |
|---------|--------------|---------------|-------|
| SPI Transfer | ~2K req/s | ~50K req/s | 25x |
| DICT Query | ~5K req/s | ~45K req/s | 9x |
| ISO 8583 Parse | ~1K msg/s | ~10K msg/s | 10x |

### Decision: Go vs TypeScript

| Criterion | Choice |
|-----------|--------|
| **GraphQL API** | TypeScript (Apollo ecosystem) |
| **ISO 20022 XML** | Go (encoding/xml native) |
| **TCP Binary** | Go (performance) |
| **Simple REST API** | TypeScript (fast) |
| **High performance** | Go (Gin, goroutines) |
| **Frontend** | TypeScript (React, Next.js) |

</div>

---

## How to test

```bash
# Start everything
docker compose up -d

# Test Ledger
curl -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ accounts { id name balance } }"}'

# Test SPI (Go)
cd packages/backend/spi-simulator-go
go run .

# Test ISO 8583
echo "0100..." | nc localhost 3004
```

---

## Lessons learned

1. **Monorepo with Turborepo** — Independence between challenges, shared code
2. **Go for critical services** — SPI, DICT, ISO 8583 need performance
3. **TypeScript for APIs** — GraphQL, REST, webhooks are more productive in TS
4. **Docker Compose** — Complete local infra (MongoDB, PostgreSQL, Redis, MinIO)
5. **Financial standards** — ISO 20022, ISO 8583, ABRASF are not optional
6. **Security in layers** — TLS, JWT, mTLS, rate limiting, audit
7. **Living docs** — VitePress with i18n PT/EN
8. **CI/CD mandatory** — Every change goes through tests and approval
