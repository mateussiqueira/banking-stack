# Challenge 09 — Leaky Bucket

**What is it:** A rate limiter using the leaky bucket algorithm, with GraphQL for querying.

**Why it matters:** APIs need rate limiting. Without it, one bad client can take down your entire system.

## The problem

You have an API that processes payments. A client starts sending 1000 requests per second. Your system can handle 100 requests per second.

Without rate limiting:
- Your system crashes
- All clients suffer
- Money is lost

With rate limiting:
- The bad client gets throttled
- Your system stays healthy
- Other clients are unaffected

## The algorithm

```
┌─────────────────────────────────────────────────────────────┐
│                    Leaky Bucket                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Requests ──▶ ┌──────────┐ ──▶ Processing                  │
│               │  Bucket  │                                   │
│               │  (10)    │                                   │
│               └──────────┘                                   │
│                   │                                          │
│                   ▼                                          │
│              ┌──────────┐                                    │
│              │  Leaking │  (1 per second)                    │
│              │  Rate    │                                    │
│              └──────────┘                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

The bucket has a capacity (e.g., 10 requests). Requests fill the bucket. The bucket leaks at a constant rate (e.g., 1 per second). If the bucket is full, new requests are rejected.

## GraphQL integration

```graphql
query {
  rateLimit(clientId: "client_123") {
    capacity
    remaining
    resetAt
  }
}
```

## Why Redis

Redis is perfect for rate limiting because:
- Atomic operations (INCR, EXPIRE)
- Fast (in-memory)
- Distributed (multiple API servers can share state)
- TTL support (auto-expire counters)
