# International Payment Systems

Phase 6 — Global Expansion and Enterprise (Months 19-24)

## ACH (Automated Clearing House)

### Overview

The Automated Clearing House is the US electronic funds transfer system operated by Nacha. Processes over 30 billion transactions annually.

### Key Characteristics

| Attribute | Details |
|-----------|---------|
| Processing Time | 1-3 business days |
| Cost | $0.20-$1.50 per transaction |
| Settlement | Same-day or next-day |
| Operating Hours | 24/7 submission, batch settlement |

### Transaction Types

- **ACH Credit** — Push payment (employer payroll, government benefits)
- **ACH Debit** — Pull payment (bills, subscriptions)
- **Same-Day ACH** — Expedited settlement with higher fees
- **RTP (Real-Time Payments)** — Near-instant settlement via The Clearing House

### Code Integration

```typescript
// ACH Transfer Configuration
interface ACHTransfer {
  type: 'credit' | 'debit';
  routingNumber: string;      // 9-digit ABA routing number
  accountNumber: string;
  amount: number;
  companyName: string;        // Originator name
  companyEntryDescription: string;
  effectiveDate: Date;
  secCode: 'PPD' | 'CCD' | 'WEB' | 'TEL'; // Standard Entry Class
}
```

---

## SEPA (Single Euro Payments Area)

### Overview

The Single Euro Payments Area covers 36 European countries, enabling cross-border EUR transfers with domestic-level pricing.

### Key Characteristics

| Attribute | Details |
|-----------|---------|
| Processing Time | 1 business day (SCT), instant (SCT Inst) |
| Cost | €0.01-€0.15 per transaction |
| Settlement | T+1 for SCT, instant for SCT Inst |
| Coverage | 27 EU + 9 additional countries |

### Transaction Types

- **SEPA Credit Transfer (SCT)** — Standard EUR transfer
- **SEPA Instant Credit Transfer (SCT Inst)** — 10-second settlement
- **SEPA Direct Debit (SDD)** — Recurring payments
- **SEPA Direct Debit Core** — Consumer payments
- **SEPA Direct Debit B2B** — Business-to-business payments

### Code Integration

```typescript
// SEPA Transfer Configuration
interface SEPATransfer {
  type: 'SCT' | 'SCT Inst' | 'SDD';
  iban: string;               // International Bank Account Number
  bic: string;                // Bank Identifier Code
  amount: number;
  currency: 'EUR';
  remittanceInfo: string;     // Payment reference
  endToEndId?: string;        // End-to-end identification
  mandateId?: string;         // For direct debits
}
```

---

## SWIFT gpi (Global Payments Innovation)

### Overview

SWIFT gpi is the global standard for international payments, providing end-to-end tracking and faster settlement across 11,000+ institutions.

### Key Characteristics

| Attribute | Details |
|-----------|---------|
| Processing Time | Same-day to 2 business days |
| Cost | $15-$50 per transaction |
| Settlement | Varies by corridor |
| Tracking | Real-time via UETR |

### Key Features

- **UETR (Unique End-to-end Transaction Reference)** — Universal tracking ID
- **Bank-to-bank transparency** — Each bank confirms processing
- **Priority handling** — Fast-track for gpi-enabled banks
- **Confirmation receipts** — End-to-end validation

### Code Integration

```typescript
// SWIFT gpi Transfer Configuration
interface SWIFTTransfer {
  type: 'swift_gpi';
  senderBic: string;
  receiverBic: string;
  amount: number;
  currency: string;           // ISO 4217
  uetr: string;               // Unique tracking reference
  purposeCode: string;        // Payment purpose
  charges: 'SHA' | 'BEN' | 'OUR'; // Charge bearer
  regulatoryReporting?: string;
}
```

---

## Comparison with Brazilian PIX/SPI

### PIX vs Global Systems

| Feature | PIX | ACH | SEPA | SWIFT gpi |
|---------|-----|-----|------|-----------|
| Speed | Instant (24/7) | 1-3 days | T+1/Instant | Same-day+ |
| Cost | Free/R$0.49 | $0.20-1.50 | €0.01-0.15 | $15-50 |
| Availability | 24/7/365 | Business hours* | 24/7 | Business hours |
| Cross-border | No | No | Yes (EUR zone) | Yes (Global) |
| QR Code | Yes | No | No | No |
| Key-based | Yes (CPF/CNPJ) | No | No | No |

*Same-Day ACH available with extended hours

### SPI (Sistema de Pagamentos Instantâneos)

The Brazilian Central Bank's instant payment infrastructure that powers PIX:

| SPI Feature | Global Equivalent |
|-------------|-------------------|
| Real-time gross settlement | FedNow (US), RT1 (EU) |
| Central bank operated | Similar to FedNow |
| 24/7 availability | FedNow, SCT Inst |
| QR code support | Varies by system |
| Key-based addressing | IBAN (EU), Account+Routing (US) |

### Implementation Considerations for Multi-Currency

```typescript
// Multi-system payment router
interface PaymentRouter {
  detectCurrency(currency: string): PaymentSystem[];
  getOptimalRoute(params: {
    origin: string;
    destination: string;
    amount: number;
    urgency: 'instant' | 'standard' | 'economy';
  }): PaymentRoute;
  estimateCost(route: PaymentRoute): CostEstimate;
}
```

### Key Takeaways

1. **PIX is faster** — No global system matches PIX's instant, free model
2. **ACH is cheapest** — For US domestic transfers under $1,000
3. **SEPA is best for EUR** — Unified pricing across Europe
4. **SWIFT gpi is global** — Only option for true cross-border payments
