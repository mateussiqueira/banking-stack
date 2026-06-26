# Challenge 06 — Open Finance

**What is it:** A simulator for Open Finance — Brazil's open banking ecosystem.

**Why it matters:** Open Finance lets you share your financial data between institutions. It's how apps like Mobills can see all your accounts.

## The problem

Open Finance is based on OAuth 2.0 and REST APIs. The flow:

1. User consents to share data
2. Client app requests access
3. Bank issues access token
4. Client app reads data
5. User can revoke consent anytime

## The endpoints

```
POST /open-banking/consents/v1/consents      — Create consent
GET  /open-banking/consents/v1/consents/:id  — Get consent
DELETE /open-banking/consents/v1/consents/:id — Revoke consent

GET /open-banking/accounts/v1/accounts        — List accounts
GET /open-banking/accounts/v1/accounts/:id    — Get account
GET /open-banking/accounts/v1/accounts/:id/balances — Get balances
GET /open-banking/accounts/v1/accounts/:id/transactions — Get transactions

POST /open-banking/payments/v1/pix/payments   — Initiate payment
GET  /open-banking/payments/v1/pix/payments   — List payments
```

## Security

- **Mutual TLS** — both client and server authenticate
- **OAuth 2.0** — token-based access
- **Consent management** — user controls what's shared
- **Audit logs** — everything is logged

## What we learned

1. **OAuth 2.0 is complex** — but necessary for security
2. **Consent is key** — users must control their data
3. **Discovery endpoints help** — clients can find available APIs
4. **Testing is hard** — you need to mock the entire banking ecosystem
