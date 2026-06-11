# @banking/spi-simulator

**🇧🇷** Simulador SPI/ICOM com mensagens ISO 20022  
**🇬🇧** SPI/ICOM Simulator with ISO 20022 messages

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Fastify** | HTTP framework |
| **fast-xml-parser** | XML parsing and building |
| **@fastify/xml-body-parser** | XML content-type support |
| **In-memory** | Transaction storage |

## How to Run

```bash
# Dev mode
pnpm --filter @banking/spi-simulator dev

# Tests
pnpm --filter @banking/spi-simulator test

# Build
pnpm --filter @banking/spi-simulator build
```

Server starts at `http://localhost:3001`.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/spi/payments` | Send payment (pacs.008 XML or JSON) |
| `GET` | `/api/v1/spi/payments` | List all payments |
| `GET` | `/api/v1/spi/payments/:id` | Get payment details |
| `POST` | `/api/v1/spi/payments/:id/return` | Return payment (pacs.004 XML) |

## ISO 20022 Messages

- **pacs.008.001.08**: Credit Transfer (payment order)
- **pacs.002.001.10**: Status Report (confirmation)
- **pacs.004.001.09**: Payment Return (reversal)

## Structure

```
src/
├── iso20022/
│   ├── schemas.ts              # TypeScript interfaces for ISO messages
│   ├── parser.ts               # XML parsing (pacs.008/002/004)
│   └── messages.ts             # XML building (pacs.008/002/004)
├── models/
│   └── transaction.ts          # In-memory transaction store
└── __tests__/                  # Test files
```
