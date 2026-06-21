# 03 — DICT Simulator

**🇧🇷** Simulador do Diretório de Identificadores de Contas Transacionais  
**🇬🇧** DICT (Directory of Transactional Account Identifiers) Simulator

---

## 🇧🇷 Descrição do Desafio

Implementar um simulador do DICT (Diretório de Identificadores de Contas Transacionais), o sistema que gerencia as chaves Pix no Brasil. O DICT armazena a relação entre chaves Pix (CPF, CNPJ, e-mail, telefone, chave aleatória) e as contas transacionais associadas.

Requisitos:
- Registrar chaves Pix (CPF, CNPJ, e-mail, telefone, aleatória)
- Consultar chaves por tipo e valor
- Validar formato das chaves
- Gerenciar ownership (uma chave → uma conta)
- Portabilidade de chaves entre instituições
- Reivindicação (claim) de chave

---

## 🇬🇧 Challenge Description

Implement a DICT (Directory of Transactional Account Identifiers) simulator — the system that manages Pix keys in Brazil. DICT stores the relationship between Pix keys (CPF, CNPJ, email, phone, random key) and their associated transactional accounts.

Requirements:
- Register Pix keys (CPF, CNPJ, email, phone, random)
- Query keys by type and value
- Validate key formats
- Manage ownership (one key → one account)
- Key portability between institutions
- Key claiming

---

## Architecture / Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    DICT Simulator                            │
│                                                              │
│  POST   /api/v1/dict/keys            Register key           │
│  GET    /api/v1/dict/keys/:key       Query key              │
│  PATCH  /api/v1/dict/keys/:key/claim Claim/port key         │
│  DELETE /api/v1/dict/keys/:key       Remove key             │
│  GET    /api/v1/dict/accounts/:ispb/keys List account keys  │
│                                                              │
│  Key Types: CPF, CNPJ, EMAIL, PHONE, RANDOM                 │
└──────────────────────────────────────────────────────────────┘
```

## Tech Stack (Proposed)

| Technology | Purpose |
|------------|---------|
| **Express** | HTTP framework |
| **TypeScript** | Type safety |
| **In-memory / MongoDB** | Key-value storage |

## API Endpoints

### `POST /api/v1/dict/keys`
```json
{
  "type": "CPF",
  "value": "123.456.789-00",
  "account": {
    "ispb": "12345678",
    "branch": "0001",
    "number": "12345-6",
    "type": "CACC"
  },
  "owner": {
    "name": "John Doe",
    "document": "123.456.789-00"
  }
}
```

### `GET /api/v1/dict/keys/:key`

Returns key details if found.

### `PATCH /api/v1/dict/keys/:key/claim`

Portability request — transfers key ownership to another institution.

```json
{
  "targetIspb": "87654321",
  "targetAccount": {
    "branch": "0001",
    "number": "67890-1"
  }
}
```
