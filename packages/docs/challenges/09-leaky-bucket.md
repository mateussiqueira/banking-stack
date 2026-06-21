# 09 — Leaky Bucket (Rate Limiter)

**🇧🇷** Rate Limiter Baseado no Algoritmo Leaky Bucket  
**🇬🇧** Leaky Bucket Rate Limiter

---

## 🇧🇷 Descrição do Desafio

Implementar um rate limiter distribuído baseado no algoritmo Leaky Bucket usando Redis. O Leaky Bucket é um algoritmo de controle de vazão que trata o tráfego como água em um balde com um furo: a água entra em taxa variável e sai a uma taxa constante.

Requisitos:
- Algoritmo Leaky Bucket com Redis
- Configuração por rota/IP/usuário
- Headers de rate limit (X-RateLimit-Limit, Remaining, Reset)
- Resposta 429 Too Many Requests quando excedido
- Múltiplos buckets (capacity e refill rate configuráveis)
- Suporte a clusters Redis

---

## 🇬🇧 Challenge Description

Implement a distributed rate limiter based on the Leaky Bucket algorithm using Redis. The Leaky Bucket is a traffic shaping algorithm that treats traffic like water in a bucket with a hole: water enters at a variable rate and exits at a constant rate.

Requirements:
- Leaky Bucket algorithm with Redis
- Configurable per route/IP/user
- Rate limit headers (X-RateLimit-Limit, Remaining, Reset)
- 429 Too Many Requests response when exceeded
- Multiple buckets (configurable capacity and refill rate)
- Redis cluster support

---

## Leaky Bucket Algorithm / Algoritmo

```
┌─────────────────────────────────────────────────────────────┐
│                    Leaky Bucket                              │
│                                                              │
│                 ┌─────────────────────┐                      │
│  Requests ─────►│                     │                     │
│  (variable rate)│   Leaky Bucket      │────► Processed      │
│                 │   (capacity)        │     (constant rate) │
│                 │                     │                      │
│                 └─────────────────────┘                      │
│                        │                                     │
│                        ▼                                     │
│                  Overflow (429)                               │
└──────────────────────────────────────────────────────────────┘
```

### Redis Key Structure / Estrutura de Chave Redis

```
leaky:bucket:{namespace}:{key}
  → { capacity, tokens, lastRefill, refillRate, refillInterval }
```

## Tech Stack (Proposed)

| Technology | Purpose |
|------------|---------|
| **Express** | HTTP framework |
| **Redis** | Distributed state |
| **ioredis** | Redis client |

## How to Run (Proposed)

```bash
# Ensure Redis is running
make infra-up

pnpm --filter @banking/leaky-bucket dev
```

### Configuration / Configuração

```env
LEAKY_BUCKET_CAPACITY=100
LEAKY_BUCKET_REFILL_RATE=10
LEAKY_BUCKET_REFILL_INTERVAL_MS=1000
```
