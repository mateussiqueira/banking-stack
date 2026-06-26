# Challenge 05 — Workflow Engine

**What is it:** A mini n8n/zapier for automating financial processes.

**Why it matters:** Banks automate everything: loan approvals, fraud detection, compliance checks. This is how.

## The problem

A loan application goes through steps:
1. Submit documents
2. Credit check
3. Income verification
4. Risk analysis
5. Manager approval
6. Contract generation
7. Disbursement

Each step depends on the previous one. Some steps run in parallel. Some need human approval. Some can fail and need retry.

## The architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Workflow Engine                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ Trigger  │───▶│  Step 1  │───▶│  Step 2  │              │
│  └──────────┘    └──────────┘    └──────────┘              │
│                                      │                      │
│                                      ▼                      │
│                                ┌──────────┐                │
│                                │ Parallel │                │
│                                └──────────┘                │
│                                      │                      │
│                                ┌─────┴─────┐              │
│                                ▼           ▼              │
│                          ┌──────────┐ ┌──────────┐        │
│                          │ Step 3a  │ │ Step 3b  │        │
│                          └──────────┘ └──────────┘        │
│                                │           │              │
│                                ▼           ▼              │
│                          ┌─────────────────────┐          │
│                          │    Step 4 (merge)   │          │
│                          └─────────────────────┘          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Key concepts

- **Directed graph** — workflows are graphs, not lists
- **Conditions** — branching based on data
- **Retries** — automatic retry with backoff
- **Webhooks** — trigger from external systems
- **State** — each execution has its own state

## Why TypeScript

Workflow engines need:
- Flexibility (lots of different step types)
- Async handling (waiting for external systems)
- JSON manipulation (data flows between steps)

TypeScript is perfect for this. Go would be overkill.
