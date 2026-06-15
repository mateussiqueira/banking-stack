# @banking/open-finance

**🇧🇷** Simulador do ecossistema Open Finance Brasil  
**🇬🇧** Open Finance Brasil ecosystem simulator

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Express** | HTTP framework |
| **JWT / OAuth** | Authentication |
| **TypeScript** | Type safety |

## How to Run

```bash
pnpm --filter @banking/open-finance dev
```

## Endpoints

### OAuth 2.0

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/authorize` | Authorization request |
| `POST` | `/auth/token` | Token exchange |
| `GET` | `/auth/consent/:id` | Consent details |
| `DELETE` | `/auth/consent/:id` | Revoke consent |

### Data API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/accounts` | List accounts |
| `GET` | `/accounts/:id` | Account details |
| `GET` | `/accounts/:id/balances` | Account balances |
| `GET` | `/accounts/:id/transactions` | Account transactions |
| `GET` | `/accounts/:id/credit-cards` | Credit card details |
