# @banking/dict-simulator

**🇧🇷** Simulador do DICT (Diretório de Identificadores de Contas Transacionais)  
**🇬🇧** DICT (Transactional Account Identifiers Directory) Simulator

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Express** | HTTP framework |
| **TypeScript** | Type safety |

## How to Run

```bash
pnpm --filter @banking/dict-simulator dev
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/dict/keys` | Register a Pix key |
| `GET` | `/api/v1/dict/keys/:key` | Query a Pix key |
| `PATCH` | `/api/v1/dict/keys/:key/claim` | Claim/port a Pix key |
| `DELETE` | `/api/v1/dict/keys/:key` | Remove a Pix key |
| `GET` | `/api/v1/dict/accounts/:ispb/keys` | List keys for an ISPB |

## Key Types

- `CPF` — Individual taxpayer ID
- `CNPJ` — Business taxpayer ID
- `EMAIL` — Email address
- `PHONE` — Phone number (+55 format)
- `RANDOM` — UUID v4 random key
