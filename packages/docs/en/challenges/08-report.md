# Challenge 08 — Report System

**What is it:** A system for generating financial reports and storing them in S3-compatible storage.

**Why it matters:** Banks generate thousands of reports daily. Balance sheets, transaction summaries, compliance reports. They all need to be stored and retrieved quickly.

## The problem

A bank needs to:
1. Generate PDF reports from transaction data
2. Store them in object storage (S3/MinIO)
3. Allow searching by date, account, type
4. Handle concurrent generation
5. Keep reports for 5+ years

## The architecture

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   PostgreSQL │───▶│   Report     │───▶│   MinIO      │
│   (Data)     │    │   Generator  │    │   (S3)       │
└──────────────┘    └──────────────┘    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   PDF/CSV    │
                    │   Output     │
                    └──────────────┘
```

## Report types

| Report | Frequency | Data |
|--------|-----------|------|
| Balance Sheet | Daily | Assets, liabilities, equity |
| Transaction Summary | Hourly | All transactions in period |
| Compliance Report | Monthly | Regulatory requirements |
| Audit Trail | Real-time | All system actions |

## What we learned

1. **MinIO is great for testing** — S3-compatible, runs locally
2. **PDF generation is slow** — consider async processing
3. **Compression matters** — reports can be huge
4. **Indexing is crucial** — you need to find reports fast
