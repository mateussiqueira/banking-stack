---
title: Decisions
---

# Decisions

Architecture Decision Records and technical decisions for the Banking Stack project.

## ADR (Architecture Decision Records)

- [ADR-001: Monorepo with Turborepo](/en/architecture/decision-log#adr-001-monorepo-with-turborepo)
- [ADR-002: MongoDB for Ledger](/en/architecture/decision-log#adr-002-mongodb-for-ledger)
- [ADR-003: GraphQL for Ledger API](/en/architecture/decision-log#adr-003-graphql-for-ledger-api)
- [ADR-004: Go for Critical Services](/en/architecture/decision-log#adr-004-go-for-critical-services)
- [ADR-005: Redis for Rate Limiting](/en/architecture/decision-log#adr-005-redis-for-rate-limiting)

## Technical Decisions

- [Why Go?](/en/decisions/why-go) — Performance comparison between TypeScript and Go
- [Stack Comparison](/en/stack-comparison) — Side-by-side stack comparison

## How to Create an ADR

1. Copy the template below
2. Save as `ADR-NNN-title.md` in `/architecture/decisions/`
3. Add to the sidebar in `config.ts`
4. Update this index

### ADR Template

```markdown
# ADR-NNN: Title

## Status

Proposed | Accepted | Deprecated | Superseded by [ADR-XXX](link)

## Context

What is the issue that we're seeing that is motivating this decision?

## Decision

What is the change that we're proposing and/or doing?

## Consequences

What becomes easier or more difficult to do because of this change?

### Positive

- Positive consequence 1
- Positive consequence 2

### Negative

- Negative consequence 1
- Negative consequence 2
```
