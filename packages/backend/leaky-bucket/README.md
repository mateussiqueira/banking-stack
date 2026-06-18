# @banking/leaky-bucket

**🇧🇷** Rate limiter baseado no algoritmo Leaky Bucket  
**🇬🇧** Leaky Bucket rate limiter

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Express** | HTTP framework |
| **Redis** | Distributed state |
| **ioredis** | Redis client |

## How to Run

```bash
# Ensure Redis is running
make infra-up

pnpm --filter @banking/leaky-bucket dev
```

## Algorithm

The Leaky Bucket treats incoming requests as water poured into a bucket. Water leaks out at a constant rate. If the bucket overflows, requests are rejected (429).

```
Requests ──► [ Leaky Bucket ] ──► Processed
                  │
                  ▼
             Overflow (429)
```

## Configuration

```env
LEAKY_BUCKET_CAPACITY=100         # Max bucket capacity
LEAKY_BUCKET_REFILL_RATE=10       # Tokens per refill
LEAKY_BUCKET_REFILL_INTERVAL_MS=1000  # Refill interval
```

## Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1705312345
```
