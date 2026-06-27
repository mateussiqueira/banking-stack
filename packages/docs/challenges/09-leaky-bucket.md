# 09 — Leaky Bucket (Rate Limiter)

**🇧🇷** Rate Limiter Baseado no Algoritmo Leaky Bucket  
**🇬🇧** Leaky Bucket Rate Limiter

---

## Descrição do Desafio

Implementar um rate limiter distribuído baseado no algoritmo Leaky Bucket usando Redis. O Leaky Bucket é um algoritmo de controle de vazão que trata o tráfego como água em um balde com um furo: a água entra em taxa variável e sai a uma taxa constante.

Requisitos:
- Algoritmo Leaky Bucket com Redis
- Configuração por rota/IP/usuário
- Headers de rate limit (X-RateLimit-Limit, Remaining, Reset)
- Resposta 429 Too Many Requests quando excedido
- Múltiplos buckets (capacity e refill rate configuráveis)
- Suporte a clusters Redis

---

## Challenge Description

Implement a distributed rate limiter based on the Leaky Bucket algorithm using Redis. The Leaky Bucket is a traffic shaping algorithm that treats traffic like water in a bucket with a hole: water enters at a variable rate and exits at a constant rate.

Requirements:
- Leaky Bucket algorithm with Redis
- Configurable per route/IP/user
- Rate limit headers (X-RateLimit-Limit, Remaining, Reset)
- 429 Too Many Requests response when exceeded
- Multiple buckets (configurable capacity and refill rate)
- Redis cluster support

---

## Leaky Bucket Algorithm

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

### How It Works

1. **Request arrives**: Check if bucket has tokens
2. **Bucket has tokens**: Remove one token, process request
3. **Bucket empty**: Reject request (429)
4. **Refill**: Tokens added at constant rate (e.g., 10/second)

---

## Redis Key Structure

```
leaky:bucket:{namespace}:{key}
  → { capacity, tokens, lastRefill, refillRate, refillInterval }
```

---

## Redis Lua Script (Atomic Operations)

```lua
-- LEAKY BUCKET ALGORITHM (Redis Lua Script)
-- This runs atomically in Redis

local key = KEYS[1]
local capacity = tonumber(ARGV[1])
local refill_rate = tonumber(ARGV[2])      -- tokens per interval
local refill_interval = tonumber(ARGV[3])  -- in milliseconds
local now = tonumber(ARGV[4])              -- current timestamp in ms

-- Get current bucket state
local bucket = redis.call('HMGET', key, 
  'tokens', 'last_refill')
local tokens = tonumber(bucket[1]) or capacity
local last_refill = tonumber(bucket[2]) or now

-- Calculate time elapsed
local elapsed = now - last_refill

-- Refill tokens based on elapsed time
if elapsed > 0 then
  local refill_count = math.floor(elapsed / refill_interval) * refill_rate
  tokens = math.min(capacity, tokens + refill_count)
  last_refill = now
end

-- Check if request can be processed
if tokens >= 1 then
  -- Consume one token
  tokens = tokens - 1
  
  -- Update bucket state
  redis.call('HMSET', key, 
    'tokens', tokens,
    'last_refill', last_refill)
  
  -- Set expiry (2x refill interval)
  redis.call('PEXPIRE', key, refill_interval * 2)
  
  -- Return success
  return {1, tokens, capacity}
else
  -- Update last_refill even on rejection
  redis.call('HMSET', key, 
    'tokens', tokens,
    'last_refill', last_refill)
  
  -- Calculate reset time
  local reset_in = refill_interval - (now % refill_interval)
  
  -- Return failure
  return {0, 0, reset_in}
end
```

---

## Code Example: Rate Limiter Middleware

```typescript
import Redis from 'ioredis';

interface BucketConfig {
  capacity: number;
  refillRate: number;
  refillInterval: number; // ms
}

class LeakyBucketRateLimiter {
  private redis: Redis;
  private luaScript: string;

  constructor(redis: Redis) {
    this.redis = redis;
    this.luaScript = `
      -- Lua script from above
    `;
  }

  async checkLimit(
    namespace: string,
    key: string,
    config: BucketConfig
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetIn: number;
  }> {
    const redisKey = `leaky:bucket:${namespace}:${key}`;
    const now = Date.now();
    
    const result = await this.redis.eval(
      this.luaScript,
      1, // number of keys
      redisKey,
      config.capacity.toString(),
      config.refillRate.toString(),
      config.refillInterval.toString(),
      now.toString()
    ) as [number, number, number];
    
    return {
      allowed: result[0] === 1,
      remaining: result[1],
      resetIn: result[2]
    };
  }
}

// Express/Fastify middleware
function rateLimiterMiddleware(limiter: LeakyBucketRateLimiter) {
  return async (req: any, res: any, next: any) => {
    const ip = req.ip;
    const route = req.route.path;
    
    const result = await limiter.checkLimit(
      'api',
      `${ip}:${route}`,
      {
        capacity: 100,
        refillRate: 10,
        refillInterval: 1000
      }
    );
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', 100);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(result.resetIn / 1000));
    
    if (!result.allowed) {
      res.status(429).json({
        error: 'Too Many Requests',
        retryAfter: Math.ceil(result.resetIn / 1000)
      });
      return;
    }
    
    next();
  };
}
```

---

## Rate Limit Headers

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests allowed |
| `X-RateLimit-Remaining` | Requests remaining in window |
| `X-RateLimit-Reset` | Seconds until bucket refills |

---

## Example Response Headers

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 97
X-RateLimit-Reset: 1

HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1
Retry-After: 1

{
  "error": "Too Many Requests",
  "retryAfter": 1
}
```

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Fastify** | HTTP framework |
| **Redis** | Distributed state |
| **ioredis** | Redis client |
| **Lua scripts** | Atomic operations |

---

## Configuration

```env
LEAKY_BUCKET_CAPACITY=100
LEAKY_BUCKET_REFILL_RATE=10
LEAKY_BUCKET_REFILL_INTERVAL_MS=1000
REDIS_URI=redis://localhost:6379
```

---

## How to Run

```bash
# Ensure Redis is running
make infra-up

pnpm --filter @banking/leaky-bucket dev
# Starts server on port 3009
```

## Testing

```bash
# Load test with autocannon
npx autocannon -c 100 -d 10 http://localhost:3009/api/test

# Watch rate limit headers
curl -v http://localhost:3009/api/test
```
