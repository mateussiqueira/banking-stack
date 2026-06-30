# ADR-003: Use Event Sourcing for Ledger

## Status

Accepted

## Context

Need complete audit trail and time-travel queries for the ledger system. Financial regulations require immutable history of all transactions with the ability to reconstruct state at any point in time.

## Decision

Implement event sourcing with CQRS (Command Query Responsibility Segregation) pattern.

## Consequences

- Full auditability with immutable event log
- Time-travel queries for state reconstruction
- Eventual consistency between read and write models
- More complex system architecture
- Better separation of concerns between commands and queries
