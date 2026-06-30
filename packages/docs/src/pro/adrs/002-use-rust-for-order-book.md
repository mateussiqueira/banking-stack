# ADR-002: Use Rust for Order Book Engine

## Status

Accepted

## Context

Need microsecond latency for the matching engine. The order book requires deterministic performance with no garbage collection pauses, memory safety without runtime overhead, and zero-copy deserialization for maximum throughput.

## Decision

Use Rust with zero-copy deserialization.

## Consequences

- Maximum performance with zero-cost abstractions
- No garbage collector for deterministic latency
- Memory safety guaranteed at compile time
- Steeper learning curve for the team
- Strong ecosystem for systems programming
