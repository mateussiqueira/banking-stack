# @banking/ledger

**🇧🇷** Ledger Bancário CRUD com GraphQL e Relay  
**🇬🇧** Bank Ledger CRUD with GraphQL and Relay

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **Koa** | HTTP framework |
| **graphql-js** | GraphQL engine |
| **graphql-relay** | Relay Connection pattern |
| **DataLoader** | N+1 prevention |
| **Mongoose** | MongoDB ODM |
| **MongoDB 7** | Database (Replica Set) |

## How to Run

```bash
# Start MongoDB
make infra-up

# Dev mode
pnpm --filter @banking/ledger dev

# Build
pnpm --filter @banking/ledger build

# Tests
pnpm --filter @banking/ledger test
```

Server starts at `http://localhost:3001`.  
GraphQL Playground at `http://localhost:3001/playground`.

## API

### Queries

- `account(id: ID!)` — Get account by Relay global ID
- `accounts(first, after)` — Paginated accounts list
- `transaction(id: ID!)` — Get transaction by ID
- `transactions(first, after, accountId)` — Paginated transactions

### Mutations

- `createAccount(input: CreateAccountInput!)` — Create new account
- `createTransaction(input: CreateTransactionInput!)` — Transfer between accounts

## Structure

```
src/
├── config.ts                   # Environment config
├── graphql/
│   ├── types.ts                # GraphQL schema + resolvers
│   └── connections.ts          # Connection type factory
├── loaders/
│   ├── accountLoader.ts        # DataLoader for accounts
│   └── transactionLoader.ts    # DataLoader for transactions
├── models/
│   ├── Account.ts              # Account MongoDB model
│   └── Transaction.ts          # Transaction MongoDB model
├── services/
│   ├── accountService.ts       # Account business logic
│   └── transactionService.ts   # Transaction logic with sessions
└── __tests__/                  # Test files
```
