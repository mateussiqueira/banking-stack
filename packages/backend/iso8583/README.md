# @banking/iso8583

**🇧🇷** Simulador do padrão ISO 8583 para mensagens financeiras  
**🇬🇧** ISO 8583 Financial Message Standard Simulator

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **TCP Server** | Low-level socket communication |
| **Buffer/Node.js** | Binary data manipulation |
| **TypeScript** | Type safety |

## How to Run

```bash
pnpm --filter @banking/iso8583 dev
```

Starts TCP server on port `3003`.

## Message Types

| MTI | Meaning |
|-----|---------|
| 0100 | Authorization Request |
| 0110 | Authorization Response |
| 0200 | Financial Request |
| 0210 | Financial Response |
| 0420 | Reversal Request |
| 0430 | Reversal Response |
