# Challenge 14 — RFC Architecture

**What is it:** Architecture Decision Records (ADRs) for documenting technical decisions.

**Why it matters:** Teams forget why they made decisions. ADRs preserve that knowledge.

## The problem

Six months from now, someone will ask: "why did we use Go for the SPI simulator?"

If you don't have an ADR, you'll spend hours digging through git history, Slack messages, and documentation to find the answer.

## The format

```markdown
# ADR 001: Use Go for SPI Simulator

## Status
Accepted

## Context
The SPI simulator needs to process 10K+ transactions per second with low latency.

## Decision
Use Go instead of TypeScript for the SPI simulator.

## Consequences
- Better performance (50K req/s vs 2K req/s)
- Lower memory usage (10MB vs 50MB)
- Team needs to learn Go
- Smaller ecosystem compared to Node.js
```

## How to use

1. When making a significant decision, write an ADR
2. Get team review
3. Accept or reject
4. Keep all ADRs in the repo
5. Reference ADRs in code comments when relevant

## What we learned

1. **Write ADRs before coding** — forces you to think
2. **Keep them short** — one page maximum
3. **Include context** — not just the decision, but why
4. **Accept that decisions change** — mark ADRs as superseded when needed
