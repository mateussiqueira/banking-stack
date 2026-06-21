# 02 — SPI/ICOM Simulator (ISO 20022)

**🇧🇷** Simulador do Sistema de Pagamentos Instantâneos  
**🇬🇧** Instant Payment System Simulator

---

## 🇧🇷 Descrição do Desafio

Implementar um simulador do SPI (Sistema de Pagamentos Instantâneos) do Banco Central do Brasil, utilizando mensagens ISO 20022 no formato XML. O simulador deve processar mensagens pacs.008 (crédito), gerar pacs.002 (status) e pacs.004 (devolução), replicando o fluxo de uma transação Pix entre instituições financeiras.

Requisitos:
- Parsing de mensagens ISO 20022 (pacs.008, pacs.002, pacs.004)
- Geração de XML padrão BCB
- Validação de campos obrigatórios
- Simulação de aceitação/rejeição de transações
- Fluxo completo: pagamento → confirmação → devolução
- Endpoints REST para XML e JSON

---

## 🇬🇧 Challenge Description

Implement an SPI (Instant Payment System) simulator from the Brazilian Central Bank, using ISO 20022 messages in XML format. The simulator must process pacs.008 (credit transfer) messages, generate pacs.002 (status) and pacs.004 (return) messages, replicating a Pix transaction flow between financial institutions.

Requirements:
- Parse ISO 20022 messages (pacs.008, pacs.002, pacs.004)
- Generate BCB-standard XML
- Validate required fields
- Simulate transaction acceptance/rejection
- Full flow: payment → confirmation → return
- REST endpoints for XML and JSON

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Fastify** | HTTP framework (fast, low overhead) |
| **fast-xml-parser** | XML parsing and building |
| **@fastify/xml-body-parser** | Fastify XML content-type support |
| **In-memory store** | Transaction storage (simple, no DB) |
| **Jest** | Testing |

---

## ISO 20022 Messages / Mensagens ISO 20022

| Message | Type | Description | Descrição |
|---------|------|-------------|-----------|
| `pacs.008.001.08` | Credit Transfer | Payment order | Ordem de pagamento |
| `pacs.002.001.10` | Status Report | Payment confirmation | Confirmação de pagamento |
| `pacs.004.001.09` | Payment Return | Payment reversal | Devolução de pagamento |

### Message Flow / Fluxo de Mensagens

```
ISP B (Debtor)              SPI Simulator               ISP A (Creditor)
     │                            │                            │
     │  pacs.008 (XML)            │                            │
     │ ──────────────────────────►│                            │
     │                            │  Validate ISO 20022        │
     │                            │  Create transaction        │
     │                            │  Status: ACCEPTED/REJECTED │
     │  pacs.002 (XML)            │                            │
     │ ◄──────────────────────────│                            │
     │                            │                            │
     │  ... time passes ...       │                            │
     │                            │                            │
     │  pacs.004 (XML)            │                            │
     │ ──────────────────────────►│                            │
     │                            │  Return payment            │
     │  pacs.002 (RETURNED)       │                            │
     │ ◄──────────────────────────│                            │
```

---

## Architecture / Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                   Fastify Server                             │
│                                                              │
│  POST /api/v1/spi/payments       (pacs.008)                 │
│  POST /api/v1/spi/payments/:id/return  (pacs.004)           │
│  GET  /api/v1/spi/payments              (list)              │
│  GET  /api/v1/spi/payments/:id          (detail)            │
│                                                              │
│  Content-Type: application/xml  or  application/json        │
└───────────────────────┬──────────────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────────────┐
│  ISO 20022 Layer                                              │
│                                                               │
│  ┌─────────────────────┐  ┌─────────────────────────────┐   │
│  │     Parser          │  │        Builder              │   │
│  │  parsePacs008(xml)  │  │  buildPacs008(tx) → xml    │   │
│  │  parsePacs002(xml)  │  │  buildPacs002(tx, st) → xml│   │
│  │  parsePacs004(xml)  │  │  buildPacs004(tx) → xml    │   │
│  └─────────────────────┘  └─────────────────────────────┘   │
└───────────────────────┬──────────────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────────────┐
│  Transaction Store (in-memory Map)                           │
│                                                               │
│  Transactions Map<string, Transaction>                        │
│    key: endToEndId                                            │
│    value: { endToEndId, amount, creditorIspb, debtorIspb,    │
│             status, createdAt, ... }                          │
└──────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### `POST /api/v1/spi/payments`

**Content-Type:** `application/xml` or `application/json`

**XML (pacs.008):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>PACS008E2E1234567890</MsgId>
      <CreDtTm>2024-01-15T10:30:00Z</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <TtlIntrBkSttlmAmt>150.00</TtlIntrBkSttlmAmt>
      <IntrBkSttlmDt>2024-01-15</IntrBkSttlmDt>
      <SttlmInf><SttlmMtd>CLRG</SttlmMtd></SttlmInf>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId>
        <EndToEndId>E2E1234567890</EndToEndId>
        <TxId>TXN1234567890</TxId>
      </PmtId>
      <InstgAgt>
        <FinInstnId><ClrSysMmbId><MmbId>12345678</MmbId></ClrSysMmbId></FinInstnId>
      </InstgAgt>
      <DbtrAgt>
        <FinInstnId><ClrSysMmbId><MmbId>12345678</MmbId></ClrSysMmbId></FinInstnId>
      </DbtrAgt>
      <CdtrAgt>
        <FinInstnId><ClrSysMmbId><MmbId>87654321</MmbId></ClrSysMmbId></FinInstnId>
      </CdtrAgt>
      <IntrBkSttlmAmt>150.00</IntrBkSttlmAmt>
      <ChrgBr>SLEV</ChrgBr>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>
```

**Response (pacs.002):**
```xml
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.002.001.10">
  <FIToFIPmtStsRpt>
    <TxInfAndSts>
      <OrgnlEndToEndId>E2E1234567890</OrgnlEndToEndId>
      <TxSts>ACCP</TxSts>
      ...
```

### `POST /api/v1/spi/payments/:id/return`

**Content-Type:** `application/xml`

**Request (pacs.004):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.004.001.09">
  <FIToFIPmtRtr>
    ...
    <TxInf>
      <RtrInf>
        <Rsn><Cd>FRAD</Cd></Rsn>
        <AddtlInf>Fraud suspected</AddtlInf>
      </RtrInf>
    </TxInf>
  </FIToFIPmtRtr>
</Document>
```

### `GET /api/v1/spi/payments`

List all transactions.

### `GET /api/v1/spi/payments/:id`

Get transaction details.

---

## Transaction Status / Status da Transação

| Status | Meaning | Significado |
|--------|---------|-------------|
| `ACCEPTED` | Payment accepted | Pagamento aceito |
| `REJECTED` | Payment rejected | Pagamento rejeitado |
| `SETTLED` | Payment settled | Pagamento liquidado |
| `RETURNED` | Payment returned | Pagamento devolvido |

---

## How to Run / Como Executar

```bash
# Install dependencies
pnpm install

# Run SPI simulator
pnpm --filter @banking/spi-simulator dev
```

The server starts at `http://localhost:3001`.

### Test with curl

```bash
# Send a payment (XML)
curl -X POST http://localhost:3001/api/v1/spi/payments \
  -H "Content-Type: application/xml" \
  -d @packages/backend/spi-simulator/samples/pacs008_sample.xml

# Send a payment (JSON)
curl -X POST http://localhost:3001/api/v1/spi/payments \
  -H "Content-Type: application/json" \
  -d '{"endToEndId":"E2E123","amount":150.00,"creditorIspb":"87654321","debtorIspb":"12345678"}'

# List payments
curl http://localhost:3001/api/v1/spi/payments
```

---

## Tests / Testes

```bash
pnpm --filter @banking/spi-simulator test
```

Tests cover:
- ISO 20022 message parsing
- XML generation
- Transaction status transitions
- Validation error scenarios
- Return flow

---

## Deployment / Deploy

```bash
pnpm --filter @banking/spi-simulator build
docker compose build spi-simulator
docker compose up -d spi-simulator
```
