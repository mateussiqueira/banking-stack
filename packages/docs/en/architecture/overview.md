# Architecture Overview

## System design

The banking stack is a monorepo with 9 backend services, 2 frontend apps, and shared infrastructure.

```
┌─────────────────────────────────────────────────────────────┐
│                    Infrastructure                            │
├─────────────────────────────────────────────────────────────┤
│  MongoDB    │  PostgreSQL  │  Redis    │  MinIO             │
│  (JSON)     │  (Relational)│  (Cache)  │  (Object Storage) │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Backend Services                          │
├─────────────────────────────────────────────────────────────┤
│  SPI Simulator (Go)    │  DICT Simulator (Go)              │
│  ISO 8583 (TS)         │  Workflow Engine (TS)             │
│  Open Finance (TS)     │  NFS-e (TS)                       │
│  Report System (TS)    │  Leaky Bucket (TS)                │
│  Ledger (TS + GraphQL)                                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Frontend Apps                             │
├─────────────────────────────────────────────────────────────┤
│  Landing Page (Next.js)  │  KYC System (Vite + React)      │
└─────────────────────────────────────────────────────────────┘
```

## Why this structure

- **Monorepo** — shared code, atomic deploys
- **Service per domain** — each service does one thing well
- **Go for critical paths** — performance where it matters
- **TypeScript for business logic** — speed of development
- **Polyglot** — use the right tool for the job

## Data flow

```
User → Frontend → API Gateway → Service → Database
                                      ↓
                               Other Services
                                      ↓
                               Message Queue
                                      ↓
                               Background Jobs
```
