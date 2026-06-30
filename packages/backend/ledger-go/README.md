# 📒 Ledger Contábil — Go

Ledger bancário de partidas dobradas (double-entry) com GraphQL, implementado em Go.

Este projeto é uma re-implementação do [Ledger original em Node.js](../ledger/) utilizando Go para alta performance.

## 🎯 Objetivo

Simular um livro-razão financeiro com:
- **Contas** com saldo e versionamento (optimistic concurrency)
- **Transações** atômicas (débito + crédito)
- **Idempotência** via chave de idempotência
- **GraphQL API** com Relay-compatible patterns

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                      Ledger Go                               │
│                                                              │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐ │
│  │ GraphQL API │───▶│   Service    │───▶│  In-Memory Store│ │
│  │  (chi/mux)  │    │  (Business)  │    │  (sync.RWMutex) │ │
│  └─────────────┘    └──────────────┘    └─────────────────┘ │
│         │                   │                     │          │
│         ▼                   ▼                     ▼          │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────┐ │
│  │   Schema    │    │ Double-Entry │    │   Account +     │ │
│  │  (graphql)  │    │   Logic      │    │   Transaction   │ │
│  └─────────────┘    └──────────────┘    └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Estrutura

```
ledger-go/
├── cmd/ledger/
│   └── main.go                    # Entry point
├── internal/
│   ├── handlers/
│   │   ├── graphql_handler.go     # GraphQL HTTP handler
│   │   └── graphql_test.go        # Tests
│   ├── models/
│   │   └── account.go             # Account + Transaction models + Store
│   └── graphql/
│       └── schema.go              # GraphQL schema (Query + Mutation)
├── Dockerfile
├── Makefile
├── go.mod
└── README.md
```

## 🚀 Quick Start

```bash
cd packages/backend/ledger-go
make run
```

Servidor inicia em `http://localhost:3001`

## 📡 GraphQL API

### Queries

```graphql
# Listar contas
query {
  accounts(page: 1, limit: 10) {
    id
    name
    document
    balance
  }
}

# Buscar conta por ID
query {
  account(id: "uuid") {
    id
    name
    balance
  }
}

# Listar transações
query {
  transactions(page: 1, limit: 10, accountId: "uuid") {
    id
    amount
    type
    status
    createdAt
  }
}
```

### Mutations

```graphql
# Criar conta
mutation {
  createAccount(name: "João Silva", document: "12345678909", initialBalance: 1000) {
    id
    name
    balance
  }
}

# Criar transação (transferência)
mutation {
  createTransaction(
    senderAccountId: "sender-uuid"
    receiverAccountId: "receiver-uuid"
    amount: 200
    type: PIX
    description: "Pagamento"
    idempotencyKey: "unique-key-123"
  ) {
    id
    amount
    status
  }
}
```

## 🧪 Testes

```bash
make test
```

## 🔄 Fluxo de Transação

```
1. Criar conta A (saldo: 1000)
2. Criar conta B (saldo: 500)
3. Transferir 200 de A para B
   - A: debit 200 → saldo 800
   - B: credit 200 → saldo 700
4. Transação atômica (ambas atualizam ou nenhuma)
```

## 🔒 Garantias

- **Atomicidade**: Transações são atômicas (debit + credit)
- **Idempotência**: Chave de idempotência previne duplicatas
- **Optimistic Concurrency**: Versionamento de contas previne lost updates
- **Saldo não-negativo**: Validação impede saldo negativo

## 📚 Referências

- [GraphQL Specification](https://graphql.org/)
- [Double-Entry Bookkeeping](https://en.wikipedia.org/wiki/Double-entry_bookkeeping)

## 📄 Licença

MIT License
