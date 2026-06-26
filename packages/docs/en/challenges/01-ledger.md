# Challenge 01 — Bank Ledger

**What is it:** A CRUD API for a bank ledger using GraphQL and Relay.

**Why it matters:** Every financial system needs a ledger. It's the source of truth for all transactions.

## The problem

Banks need to track every penny. Not just "account A sent money to account B". They need:

- Who sent it
- Who received it
- When it happened
- What was the balance before
- What was the balance after
- Who authorized it
- What was the exchange rate

And they need to be able to query this data in any direction: by account, by date, by amount, by type.

## Why GraphQL

REST would require dozens of endpoints:

```
GET /accounts/:id/transactions
GET /accounts/:id/balance
GET /transactions/:id
GET /transactions?date=2026-01-01
GET /transactions?amount_gt=1000
```

GraphQL gives you one endpoint with flexible queries:

```graphql
query {
  account(id: "acc_123") {
    name
    balance
    transactions(first: 10, orderBy: CREATED_AT_DESC) {
      edges {
        node {
          id
          amount
          type
          createdAt
        }
      }
    }
  }
}
```

## The stack

- **Koa** — lightweight HTTP framework
- **GraphQL** — query language
- **Relay** — GraphQL client with pagination
- **MongoDB** — flexible document storage
- **Dataloader** — batching and caching

## What we learned

1. **GraphQL is overkill for simple CRUD** — but it shines when you have complex, nested data
2. **Relay is strict** — it forces you to follow conventions, which is good for large teams
3. **MongoDB works for ledgers** — but you need to be careful about consistency
4. **Dataloader is essential** — without it, you get N+1 query problems
