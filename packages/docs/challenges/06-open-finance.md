# 06 — Open Finance Simulator

**🇧🇷** Simulador do Ecossistema Open Finance Brasil  
**🇬🇧** Open Finance Ecosystem Simulator

---

## 🇧🇷 Descrição do Desafio

Implementar um simulador do Open Finance Brasil, o ecossistema de compartilhamento de dados financeiros regulado pelo Banco Central. O simulador deve replicar os principais endpoints de compartilhamento de dados entre instituições.

Requisitos:
- Consentimento OAuth 2.0 FAPI
- Compartilhamento de dados de contas
- Compartilhamento de dados de cartões de crédito
- Compartilhamento de dados de transações
- Gerenciamento de consentimento
- Webhooks para notificação de eventos

---

## 🇬🇧 Challenge Description

Implement an Open Finance Brasil simulator — the financial data sharing ecosystem regulated by the Brazilian Central Bank. The simulator must replicate the main data sharing endpoints between institutions.

Requirements:
- OAuth 2.0 FAPI consent
- Account data sharing
- Credit card data sharing
- Transaction data sharing
- Consent management
- Webhooks for event notifications

---

## Architecture / Arquitetura

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

## Tech Stack (Proposed)

| Technology | Purpose |
|------------|---------|
| **Express** | HTTP framework |
| **JWT / OAuth** | Authentication |
| **TypeScript** | Type safety |

## Consent Flow / Fluxo de Consentimento

```
User                      Open Finance Simulator               Data Consumer
  │                              │                                    │
  │  1. Initiate consent         │                                    │
  │ ────────────────────────────►│                                    │
  │                              │  2. Redirect to authorization      │
  │ ◄────────────────────────────│                                    │
  │  3. Authorize                │                                    │
  │ ────────────────────────────►│                                    │
  │                              │  4. Authorization code             │
  │                              │ ──────────────────────────────────►│
  │                              │  5. Exchange for access token      │
  │                              │ ◄──────────────────────────────────│
  │                              │  6. Access token                   │
  │                              │ ──────────────────────────────────►│
  │                              │                                    │
  │                              │  7. Request data with token        │
  │                              │ ◄──────────────────────────────────│
  │                              │  8. Return account data            │
  │                              │ ──────────────────────────────────►│
```

## How to Run (Proposed)

```bash
pnpm --filter @banking/open-finance dev
```
