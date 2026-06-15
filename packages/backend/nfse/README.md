# @banking/nfse

**🇧🇷** Integração com Nota Fiscal de Serviços Eletrônica (padrão ABRASF)  
**🇬🇧** Electronic Service Invoice Integration (ABRASF standard)

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Express** | HTTP framework |
| **SOAP** | City hall communication |
| **xml-crypto** | XML digital signing |
| **node-forge** | Certificate handling |

## How to Run

```bash
pnpm --filter @banking/nfse dev
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/nfse/emitter` | Emit invoice |
| `GET` | `/api/v1/nfse/:id` | Get invoice |
| `POST` | `/api/v1/nfse/:id/cancel` | Cancel invoice |
| `GET` | `/api/v1/nfse` | List invoices |
| `GET` | `/api/v1/nfse/dashboard` | Dashboard statistics |

## Municipalities / Municípios

- SAO_PAULO
- RIO_DE_JANEIRO
- BELO_HORIZONTE
- CURITIBA
- (configurable)
