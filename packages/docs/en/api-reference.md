# API Reference

Complete documentation for all service endpoints.

## SPI Simulator (Go)

**Base URL:** `http://localhost:3002`

### Health Check

```
GET /spi/health
```

**Response:**
```json
{
  "status": "ok",
  "service": "spi-simulator-go",
  "version": "1.0.0",
  "timestamp": "2026-06-26T10:00:00Z"
}
```

### Create Payment (pacs.008)

```
POST /spi/pacs.008
Content-Type: application/xml
```

**Request:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pacs.008.001.08">
  <FIToFICstmrCdtTrf>
    <GrpHdr>
      <MsgId>PACS00820260626001</MsgId>
      <CreDtTm>2026-06-26T10:00:00</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <TtlIntrBkSttlmAmt Ccy="BRL">150.00</TtlIntrBkSttlmAmt>
      <IntrBkSttlmDt>2026-06-26</IntrBkSttlmDt>
      <SttlmInf>
        <SttlmMtd>CLRG</SttlmMtd>
      </SttlmInf>
    </GrpHdr>
    <CdtTrfTxInf>
      <PmtId>
        <EndToEndId>E2E202606260001</EndToEndId>
        <TxId>TX202606260001</TxId>
      </PmtId>
      <InstgAgt>
        <FinInstnId>
          <ClrSysMmbId>
            <MmbId>12345678</MmbId>
          </ClrSysMmbId>
        </FinInstnId>
      </InstgAgt>
      <Dbtr>
        <Nm>Mateus Siqueira</Nm>
      </Dbtr>
      <CdtrAgt>
        <FinInstnId>
          <ClrSysMmbId>
            <MmbId>87654321</MmbId>
          </ClrSysMmbId>
        </FinInstnId>
      </CdtrAgt>
      <Cdtr>
        <Nm>Empresa Teste LTDA</Nm>
      </Cdtr>
      <IntrBkSttlmAmt Ccy="BRL">150.00</IntrBkSttlmAmt>
      <ChrgBr>SLEV</ChrgBr>
    </CdtTrfTxInf>
  </FIToFICstmrCdtTrf>
</Document>
```

**Response (200):**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Document>
  <FIToFIPmtStsRpt>
    <GrpHdr>
      <MsgID>PACS002E2E202606260001</MsgID>
      <CreDtTm>2026-06-26T10:00:00Z</CreDtTm>
      <NbOfTxs>1</NbOfTxs>
      <TtlIntrBkSttlmAmt Ccy="BRL">150.00</TtlIntrBkSttlmAmt>
    </GrpHdr>
    <TxInfAndSts>
      <OrgnlEndToEndId>E2E202606260001</OrgnlEndToEndId>
      <TxSts>ACCP</TxSts>
    </TxInfAndSts>
  </FIToFIPmtStsRpt>
</Document>
```

**Errors:**
- `400` — Invalid XML
- `409` — Duplicate EndToEndId
- `422` — Invalid amount

### List Transactions

```
GET /spi/transactions
```

### Get Transaction

```
GET /spi/transactions/:endToEndId
```

---

## DICT Simulator (Go)

**Base URL:** `http://localhost:3003`

### Create Pix Key

```
POST /dict/keys
Content-Type: application/json
```

**Request:**
```json
{
  "keyType": "CPF",
  "keyValue": "12345678901",
  "accountId": "acc_001",
  "ispb": "12345678",
  "branch": "0001",
  "accountNumber": "12345",
  "accountType": "CHECKING",
  "holderName": "Mateus Siqueira"
}
```

**Key Types:** `CPF`, `CNPJ`, `EMAIL`, `PHONE`, `RANDOM`

### Get Key

```
GET /dict/keys/:keyType/:keyValue
```

### List Keys

```
GET /dict/keys
```

### Delete Key

```
DELETE /dict/keys/:id
```

---

## ISO 8583 Simulator

**Base URL:** `http://localhost:3004`

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/iso8583/acquirer/authorize` | Authorization request |
| POST | `/iso8583/acquirer/financial` | Financial transaction |
| POST | `/iso8583/acquirer/reversal` | Reversal request |
| POST | `/iso8583/issuer/authorize` | Issuer authorization |
| POST | `/iso8583/issuer/financial` | Issuer financial |
| POST | `/iso8583/issuer/reversal` | Issuer reversal |
| GET | `/admin/cards` | List test cards |
| POST | `/admin/cards` | Create test card |
| POST | `/admin/reset` | Reset all cards |

---

## Workflow Engine

**Base URL:** `http://localhost:3005`

### Workflows

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/workflows` | List workflows |
| POST | `/workflows` | Create workflow |
| GET | `/workflows/:id` | Get workflow |
| PUT | `/workflows/:id` | Update workflow |
| DELETE | `/workflows/:id` | Delete workflow |
| POST | `/workflows/:id/executions` | Start execution |
| GET | `/executions/:id` | Get execution status |

---

## Open Finance Simulator

**Base URL:** `http://localhost:3006`

### Consents

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/open-banking/consents/v1/consents` | Create consent |
| GET | `/open-banking/consents/v1/consents/:id` | Get consent |
| DELETE | `/open-banking/consents/v1/consents/:id` | Revoke consent |

### Accounts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/open-banking/accounts/v1/accounts` | List accounts |
| GET | `/open-banking/accounts/v1/accounts/:id` | Get account |
| GET | `/open-banking/accounts/v1/accounts/:id/balances` | Get balances |
| GET | `/open-banking/accounts/v1/accounts/:id/transactions` | Get transactions |

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/open-banking/payments/v1/pix/payments` | Initiate payment |
| GET | `/open-banking/payments/v1/pix/payments` | List payments |

---

## NFS-e Integration

**Base URL:** `http://localhost:3007`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/nfse/issue` | Issue invoice |
| GET | `/nfse/:id` | Get invoice |
| GET | `/nfse/:id/xml` | Get invoice XML |

---

## Report System

**Base URL:** `http://localhost:3008`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/reports/generate` | Generate report |
| GET | `/reports/:id` | Get report |
| GET | `/reports/:id/download` | Download report |
| GET | `/reports` | List reports |

---

## Leaky Bucket

**Base URL:** `http://localhost:3009`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register client |
| POST | `/auth/token` | Get access token |
| POST | `/pix/query` | Query Pix (rate limited) |
| POST | `/graphql` | GraphQL endpoint |
