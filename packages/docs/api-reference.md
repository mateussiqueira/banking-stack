# Referência da API

Documentação completa de todos os endpoints dos serviços.

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

### Criar Pagamento (pacs.008)

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
- `400` — XML inválido
- `409` — EndToEndId duplicado
- `422` — Valor inválido

### Listar Transações

```
GET /spi/transactions
```

**Response:**
```json
[
  {
    "id": "uuid",
    "endToEndId": "E2E202606260001",
    "txId": "TX202606260001",
    "amount": 150.00,
    "creditorIspb": "87654321",
    "creditorName": "Empresa Teste LTDA",
    "debtorIspb": "12345678",
    "debtorName": "Mateus Siqueira",
    "status": "ACCEPTED",
    "createdAt": "2026-06-26T10:00:00Z"
  }
]
```

### Consultar Transação

```
GET /spi/transactions/:endToEndId
```

---

## DICT Simulator (Go)

**Base URL:** `http://localhost:3003`

### Health Check

```
GET /dict/health
```

### Criar Chave Pix

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

**Response (201):**
```json
{
  "id": "uuid",
  "keyType": "CPF",
  "keyValue": "12345678901",
  "accountId": "acc_001",
  "status": "ACTIVE",
  "createdAt": "2026-06-26T10:00:00Z"
}
```

### Consultar Chave

```
GET /dict/keys/:keyType/:keyValue
```

### Listar Chaves

```
GET /dict/keys
```

### Deletar Chave

```
DELETE /dict/keys/:id
```

---

## ISO 8583 Simulator

**Base URL:** `http://localhost:3004`

### Health Check

```
GET /health
```

### Autorização

```
POST /iso8583/acquirer/authorize
POST /iso8583/issuer/authorize
```

### Transação Financeira

```
POST /iso8583/acquirer/financial
POST /iso8583/issuer/financial
```

### Reversão

```
POST /iso8583/acquirer/reversal
POST /iso8583/issuer/reversal
```

### Admin

```
GET /admin/cards
POST /admin/cards
POST /admin/cards/:pan/reset
POST /admin/reset
```

---

## Workflow Engine

**Base URL:** `http://localhost:3005`

### Health Check

```
GET /health
```

### Workflows

```
GET /workflows
POST /workflows
GET /workflows/:id
PUT /workflows/:id
DELETE /workflows/:id
```

### Execuções

```
GET /workflows/:id/executions
POST /workflows/:id/executions
GET /executions/:id
```

### Webhooks

```
POST /webhooks/:workflowId
```

---

## Open Finance Simulator

**Base URL:** `http://localhost:3006`

### Health Check

```
GET /health
```

### Discovery

```
GET /open-banking/discovery/v1/endpoints
```

### Consents

```
POST /open-banking/consents/v1/consents
GET /open-banking/consents/v1/consents/:id
DELETE /open-banking/consents/v1/consents/:id
```

### Accounts

```
GET /open-banking/accounts/v1/accounts
GET /open-banking/accounts/v1/accounts/:id
GET /open-banking/accounts/v1/accounts/:id/balances
GET /open-banking/accounts/v1/accounts/:id/transactions
```

### Payments

```
POST /open-banking/payments/v1/pix/payments
GET /open-banking/payments/v1/pix/payments
```

---

## NFS-e Integration

**Base URL:** `http://localhost:3007`

### Health Check

```
GET /health
```

### Nota Fiscal

```
POST /nfse/issue
GET /nfse/:id
GET /nfse/:id/xml
```

---

## Report System

**Base URL:** `http://localhost:3008`

### Health Check

```
GET /health
```

### Relatórios

```
POST /reports/generate
GET /reports/:id
GET /reports/:id/download
GET /reports
```

---

## Leaky Bucket

**Base URL:** `http://localhost:3009`

### Health Check

```
GET /health
```

### Auth

```
POST /auth/register
POST /auth/token
```

### Pix (rate limited)

```
POST /pix/query
```

### GraphQL

```
POST /graphql
GET /graphql
```
