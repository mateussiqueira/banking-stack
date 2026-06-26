# Challenge 03 — DICT Simulator

**What is it:** A simulator for the Directory of Transactional Account Identifiers — the system behind Pix keys.

**Why it matters:** When you register a Pix key (CPF, email, phone), it goes to DICT. When someone sends you a Pix, the bank queries DICT to find your account.

## The problem

Pix has 4 types of keys:

- **CPF/CNPJ** — your tax ID
- **Email** — your email address
- **Phone** — your phone number
- **Random** — a UUID

Each key maps to exactly one account. If someone already registered your CPF, you can't register it again.

DICT needs to:
1. Validate key format
2. Check for duplicates
3. Register the key
4. Allow queries by key type and value
5. Handle key ownership transfers between banks

## The architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     DICT Simulator                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Validação  │───▶│   Registro   │───▶│   Consulta   │  │
│  │              │    │              │    │              │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Chave CPF  │    │   Chave Pix  │    │   Chave      │  │
│  │   123456789  │    │   email@..   │    │   Aleatória  │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Go vs TypeScript

We implemented both versions:

| Feature | TypeScript | Go |
|---------|-----------|-----|
| Startup | 2s | 50ms |
| Memory | 50MB | 10MB |
| Validation | Runtime | Compile-time |
| Concurrency | Event loop | Goroutines |

Go is better for DICT because:
- Multiple banks query simultaneously
- Validation needs to be fast
- Memory usage matters at scale

## How to test

```bash
# Register a Pix key
curl -X POST http://localhost:3003/dict/keys \
  -H "Content-Type: application/json" \
  -d '{
    "keyType": "CPF",
    "keyValue": "12345678901",
    "accountId": "acc_001",
    "ispb": "12345678",
    "branch": "0001",
    "accountNumber": "12345",
    "accountType": "CHECKING",
    "holderName": "Mateus Siqueira"
  }'

# Query by key
curl http://localhost:3003/dict/keys/CPF/12345678901
```
