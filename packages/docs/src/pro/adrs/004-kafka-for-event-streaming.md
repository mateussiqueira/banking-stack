# ADR-004: Use Apache Kafka for Event Streaming

## Status

Accepted

## Context

Need scalable, durable event streaming for inter-service communication. The system must handle high throughput with guaranteed delivery and exactly-once semantics for financial transactions.

## Decision

Use Kafka with exactly-once semantics.

## Consequences

- High throughput with partitioned topics
- Durability with replication and persistence
- Exactly-once semantics for transaction integrity
- Operational complexity of managing Kafka clusters
- Strong ecosystem for stream processing
