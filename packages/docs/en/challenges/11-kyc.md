# Challenge 11 — KYC System

**What is it:** A Know Your Customer system for identity verification.

**Why it matters:** Every financial institution must verify customer identity. It's the law.

## The problem

When someone opens a bank account, the bank needs to:
1. Verify their identity (ID, CPF, proof of address)
2. Check against government databases
3. Assess risk level
4. Store verification status
5. Re-verify periodically

## The flow

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   User       │───▶│   Document   │───▶│   Verification│
│   Upload     │    │   Analysis   │    │   Decision    │
└──────────────┘    └──────────────┘    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Risk       │
                    │   Score      │
                    └──────────────┘
```

## Verification steps

1. **Document upload** — ID, CPF, proof of address
2. **OCR** — extract text from documents
3. **Validation** — check format, checksums
4. **Database check** — verify against government databases
5. **Liveness check** — ensure person is real (selfie)
6. **Decision** — approve, reject, or manual review

## Tech stack

- **Vite** — fast dev server
- **React** — UI framework
- **Zod** — schema validation
- **Zustand** — state management

## What we learned

1. **OCR is not perfect** — need manual review fallback
2. **Liveness is critical** — prevents photo/video attacks
3. **Risk scoring matters** — not all customers are equal
4. **Audit trail is required** — regulators want to see everything
