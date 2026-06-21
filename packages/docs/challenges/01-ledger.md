# 01 — CRUD Bank GraphQL Relay

**🇧🇷** Ledger Bancário com GraphQL e Relay  
**🇬🇧** Bank Ledger with GraphQL and Relay

---

## 🇧🇷 Descrição do Desafio

Implementar um sistema de ledger bancário (contas e transações) utilizando GraphQL com o padrão Relay Connection. O sistema deve permitir criar contas, realizar transferências entre contas com consistência transacional, e consultar contas e transações com paginação cursor-based.

Requisitos:
- CRUD de contas bancárias com saldo
- Transferências entre contas com validação de saldo
- Paginação Relay Connection (cursor-based)
- Mutations no padrão Relay (input/payload/clientMutationId)
- DataLoader para evitar N+1
- Transações MongoDB para atomicidade

---

## 🇬🇧 Challenge Description

Implement a bank ledger system (accounts and transactions) using GraphQL with the Relay Connection pattern. The system must allow creating accounts, transferring between accounts with transactional consistency, and querying accounts and transactions with cursor-based pagination.

Requirements:
- CRUD bank accounts with balance
- Transfers between accounts with balance validation
- Relay Connection pagination (cursor-based)
- Relay-standard mutations (input/payload/clientMutationId)
- DataLoader to avoid N+1
- MongoDB transactions for atomicity

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Koa** | HTTP framework (lightweight, modern) |
| **graphql-js** | GraphQL engine |
| **graphql-relay** | Relay Connection helpers |
| **DataLoader** | Batch loading / N+1 prevention |
| **Mongoose** | MongoDB ODM |
| **MongoDB 7** | Database (Replica Set for transactions) |
| **Jest** | Testing |

---

## Architecture / Arquitetura

```
┌──────────────────────────────────────────────────────────────────┐
│                      GraphQL Schema                               │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  Queries                                                │     │
│  │  ├─ account(id: ID!): Account                           │     │
│  │  ├─ accounts(first, after): AccountConnection           │     │
│  │  ├─ transaction(id: ID!): Transaction                   │     │
│  │  └─ transactions(first, after, accountId): TxConnection │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │  Mutations                                              │     │
│  │  ├─ createAccount(input: CreateAccountInput!): ...      │     │
│  │  └─ createTransaction(input: CreateTransactionInput!):  │     │
│  └─────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────┘
            │                                        │
┌───────────▼────────────────────────────────────────▼───────────┐
│                      Resolvers                                 │
│  ┌──────────────────────┐  ┌──────────────────────────────┐   │
│  │   Account Resolvers  │  │   Transaction Resolvers      │   │
│  │   DataLoader:        │  │   populate sender/receiver   │   │
│  │   batch findById     │  │                              │   │
│  └──────────────────────┘  └──────────────────────────────┘   │
└───────────────────────────┬───────────────────────────────────┘
                            │
┌───────────────────────────▼───────────────────────────────────┐
│                      Services                                  │
│  ┌──────────────────────┐  ┌──────────────────────────────┐   │
│  │   accountService     │  │   transactionService         │   │
│  │   ├─ createAccount   │  │   ├─ createTransaction       │   │
│  │   ├─ getAccountById  │  │   │  (MongoDB session)       │   │
│  │   └─ getAccounts     │  │   ├─ getTransactionById      │   │
│  │                      │  │   └─ getTransactions         │   │
│  └──────────────────────┘  └──────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼───────────────────────────────────┐
│                      MongoDB (Replica Set)                     │
│  ┌──────────────────────┐  ┌──────────────────────────────┐   │
│  │   accounts           │  │   transactions                │   │
│  │   ├─ _id             │  │   ├─ _id                     │   │
│  │   ├─ name            │  │   ├─ senderAccount (ref)     │   │
│  │   ├─ document (unique)│  │   ├─ receiverAccount (ref)  │   │
│  │   └─ balance         │  │   ├─ amount                  │   │
│  │                      │  │   ├─ type (PIX/TED/DOC/TRANS)│   │
│  │                      │  │   └─ status (PENDING/COMPLT) │   │
│  └──────────────────────┘  └──────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

---

## GraphQL Schema

### Types

```graphql
interface Node {
  id: ID!
}

type Account implements Node {
  id: ID!
  _id: ID!
  name: String!
  document: String!
  balance: Float!
  createdAt: String!
}

type Transaction implements Node {
  id: ID!
  _id: ID!
  sender: Account!
  receiver: Account!
  amount: Float!
  description: String
  type: TransactionType!
  status: TransactionStatus!
  createdAt: String!
}

enum TransactionType { PIX TED DOC TRANSFER }
enum TransactionStatus { PENDING COMPLETED FAILED REVERTED }
```

### Connections

```graphql
type AccountConnection {
  edges: [AccountEdge]
  pageInfo: PageInfo!
  totalCount: Int!
}

type TransactionConnection {
  edges: [TransactionEdge]
  pageInfo: PageInfo!
  totalCount: Int!
}
```

### Mutations

```graphql
input CreateAccountInput {
  clientMutationId: String
  name: String!
  document: String!
  balance: Float
}

type CreateAccountPayload {
  clientMutationId: String
  account: Account!
}
```

---

## Transaction Flow / Fluxo de Transação

```
createTransaction(senderId, receiverId, amount, type)
         │
         ▼
  ┌─────────────────┐
  │ Validações       │
  │ amount > 0       │
  │ sender != receiver│
  └────────┬─────────┘
           │
           ▼
  ┌─────────────────┐
  │ startSession()  │
  │ startTransaction│
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────────┐
  │ find sender account  │
  │ find receiver account│
  │ check sender balance │
  └────────┬─────────────┘
           │
           ▼
  ┌──────────────────────┐
  │ sender.balance -= amt │
  │ receiver.balance += am│
  │ create Transaction   │
  │   status: COMPLETED  │
  └────────┬─────────────┘
           │
           ▼
  ┌──────────────────────┐
  │ commitTransaction()  │
  │        OR            │
  │ abortTransaction()   │
  │   (on error)         │
  └──────────────────────┘
```

---

## How to Run / Como Executar

```bash
# Start MongoDB replica set
make infra-up

# Install dependencies
pnpm install

# Run ledger service
pnpm --filter @banking/ledger dev
```

The server starts at `http://localhost:3001`.

### GraphQL Playground

Open `http://localhost:3001/playground` in your browser.

### Example Queries

```graphql
# Create account
mutation {
  createAccount(input: {
    name: "John Doe"
    document: "123.456.789-00"
    balance: 1000
  }) {
    account { id name document balance }
  }
}

# List accounts
query {
  accounts(first: 10) {
    edges {
      node { id name document balance }
    }
    totalCount
  }
}

# Create transaction
mutation {
  createTransaction(input: {
    senderAccount: "QWNjb3VudDox"  # base64 encoded Relay ID
    receiverAccount: "QWNjb3VudDoy"
    amount: 100
    type: PIX
  }) {
    transaction {
      id amount type status
      sender { name }
      receiver { name }
    }
  }
}
```

---

## Tests / Testes

```bash
pnpm --filter @banking/ledger test
```

Test structure:
- Unit tests for services
- Integration tests for GraphQL resolvers
- Transaction atomicity tests

---

## Deployment / Deploy

```bash
pnpm --filter @banking/ledger build
docker compose build ledger
docker compose up -d ledger
```
