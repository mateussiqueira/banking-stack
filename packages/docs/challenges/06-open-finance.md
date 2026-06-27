# 06 — Open Finance Simulator

**🇧🇷** Simulador do Ecossistema Open Finance Brasil  
**🇬🇧** Open Finance Ecosystem Simulator

---

## Descrição do Desafio

Implementar um simulador do Open Finance Brasil, o ecossistema de compartilhamento de dados financeiros regulado pelo Banco Central. O simulador deve replicar os principais endpoints de compartilhamento de dados entre instituições.

Requisitos:
- Consentimento OAuth 2.0 FAPI
- Compartilhamento de dados de contas
- Compartilhamento de dados de cartões de crédito
- Compartilhamento de dados de transações
- Gerenciamento de consentimento
- Webhooks para notificação de eventos

---

## Challenge Description

Implement an Open Finance Brasil simulator — the financial data sharing ecosystem regulated by the Brazilian Central Bank. The simulator must replicate the main data sharing endpoints between institutions.

Requirements:
- OAuth 2.0 FAPI consent
- Account data sharing
- Credit card data sharing
- Transaction data sharing
- Consent management
- Webhooks for event notifications

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Open Finance Simulator                     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  OAuth 2.0 / FAPI                                      │   │
│  │  POST /auth/authorize      Authorization request       │   │
│  │  POST /auth/token          Token exchange              │   │
│  │  GET  /auth/consent/:id    Consent details             │   │
│  │  DELETE /auth/consent/:id  Revoke consent              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Data Endpoints                                       │   │
│  │  GET /accounts                    List accounts       │   │
│  │  GET /accounts/:id                Account details     │   │
│  │  GET /accounts/:id/balances       Balances            │   │
│  │  GET /accounts/:id/transactions   Transactions        │   │
│  │  GET /accounts/:id/credit-cards   Credit cards        │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## Consent Flow

```mermaid
sequenceDiagram
    participant User
    participant Participant
    participant Directory
    participant ResourceServer

    User->>Participant: 1. Initiate consent
    Participant->>Directory: 2. Discover resource server
    Directory-->>Participant: Resource server URL
    Participant->>User: 3. Redirect to authorization
    User->>Participant: 4. Authorize consent
    Participant->>ResourceServer: 5. Exchange code for token
    ResourceServer-->>Participant: Access token
    Participant->>ResourceServer: 6. Request data
    ResourceServer-->>Participant: Account data
    Participant-->>User: 7. Display data
```

---

## OAuth 2.0 FAPI Flow

### 1. Authorization Request

```http
POST /auth/authorize HTTP/1.1
Content-Type: application/json

{
  "response_type": "code",
  "client_id": "client_abc123",
  "redirect_uri": "https://consumer.com/callback",
  "scope": "accounts:read transactions:read",
  "state": "random_state_value",
  "code_challenge": "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
  "code_challenge_method": "S256"
}
```

### 2. Token Exchange

```http
POST /auth/token HTTP/1.1
Content-Type: application/json

{
  "grant_type": "authorization_code",
  "code": "auth_code_xyz",
  "redirect_uri": "https://consumer.com/callback",
  "client_id": "client_abc123",
  "client_secret": "secret_abc123",
  "code_verifier": "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
}
```

### 3. Token Response

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "accounts:read transactions:read",
  "consent_id": "consent_abc123"
}
```

---

## Data Endpoints

### List Accounts

```http
GET /accounts HTTP/1.1
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```

```json
{
  "data": [
    {
      "accountId": "acc_001",
      "type": "CONTA_DEPOSITO_AVISTA",
      "subtype": "INDIVIDUAL",
      "description": "Conta Corrente",
      "currency": "BRL",
      "combos": [
        {
          "name": "A",
          "complementary": {
            "companyName": "Bank Name"
          }
        }
      ]
    }
  ]
}
```

### Get Account Balances

```http
GET /accounts/acc_001/balances HTTP/1.1
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```

```json
{
  "data": [
    {
      "accountId": "acc_001",
      "balances": [
        {
          "type": "AVAILABLE",
          "amount": {
            "currency": "BRL",
            "value": "15000.00"
          },
          "dateTime": "2024-01-15T10:30:00Z"
        }
      ]
    }
  ]
}
```

### Get Transactions

```http
GET /accounts/acc_001/transactions?from=2024-01-01&to=2024-01-31 HTTP/1.1
Authorization: Bearer eyJhbGciOiJSUzI1NiIs...
```

```json
{
  "data": [
    {
      "transactionId": "txn_001",
      "type": "TRANSFERENCIA",
      "status": "SETTLED",
      "amount": {
        "currency": "BRL",
        "value": "250.00"
      },
      "date": "2024-01-15",
      "description": "Transfer to John",
      "parties": [
        {
          "type": "DEBITED",
          "personType": "NATURAL_PERSON",
          "document": "12345678901",
          "name": "Jane Doe"
        }
      ]
    }
  ]
}
```

---

## Code Example: Token Validation

```typescript
import jwt from 'jsonwebtoken';

interface FAPIToken {
  sub: string;
  client_id: string;
  scope: string;
  consent_id: string;
  exp: number;
  iat: number;
}

class TokenService {
  private publicKey: string;

  constructor(publicKey: string) {
    this.publicKey = publicKey;
  }

  validateToken(token: string): FAPIToken {
    try {
      const decoded = jwt.verify(token, this.publicKey, {
        algorithms: ['RS256'],
        issuer: 'https://auth.openfinance.com.br',
        audience: 'https://api.openfinance.com.br'
      }) as FAPIToken;

      // Check expiration
      if (decoded.exp < Date.now() / 1000) {
        throw new Error('Token expired');
      }

      return decoded;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  generateToken(consent: Consent): string {
    return jwt.sign(
      {
        sub: consent.participantId,
        client_id: consent.clientId,
        scope: consent.scope,
        consent_id: consent.id
      },
      this.privateKey,
      {
        algorithm: 'RS256',
        expiresIn: '1h',
        issuer: 'https://auth.openfinance.com.br',
        audience: 'https://api.openfinance.com.br'
      }
    );
  }
}
```

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Fastify** | HTTP framework |
| **OAuth 2.0 / OIDC** | FAPI authentication |
| **JWT (RS256)** | Token signing/verification |
| **TypeScript** | Type safety |
| **PostgreSQL** | Consent and token storage |

---

## How to Run

```bash
pnpm --filter @banking/open-finance dev
# Starts server on port 3006
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/authorize` | Authorization request |
| POST | `/auth/token` | Token exchange |
| GET | `/auth/consent/:id` | Get consent details |
| DELETE | `/auth/consent/:id` | Revoke consent |
| GET | `/accounts` | List accounts |
| GET | `/accounts/:id` | Get account details |
| GET | `/accounts/:id/balances` | Get account balances |
| GET | `/accounts/:id/transactions` | Get transactions |
| GET | `/accounts/:id/credit-cards` | Get credit cards |
