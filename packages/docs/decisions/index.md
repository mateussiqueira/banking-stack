---
title: Decisions
---

# Decisions

Architecture Decision Records and technical decisions for the Banking Stack project.

## ADR (Architecture Decision Records)

- [ADR-001: Monorepo with Turborepo](/architecture/decision-log#adr-001-monorepo-com-turborepo)
- [ADR-002: MongoDB for Ledger](/architecture/decision-log#adr-002-mongodb-para-ledger)
- [ADR-003: GraphQL for Ledger API](/architecture/decision-log#adr-003-graphql-para-ledger-api)
- [ADR-004: Go for Critical Services](/architecture/decision-log#adr-004-go-para-serviços-críticos)
- [ADR-005: Redis for Rate Limiting](/architecture/decision-log#adr-005-redis-para-rate-limiting)

## Technical Decisions

- [Por que Go?](/decisions/why-go) — Performance comparison between TypeScript and Go
- [Comparação de Stacks](/stack-comparison) — Side-by-side stack comparison

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
