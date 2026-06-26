# Challenge 07 — NFS-e Integration

**What is it:** A simulator for electronic service invoices (NFS-e) in Brazil.

**Why it matters:** Every service business in Brazil needs to issue NFS-e. It's how the government tracks service transactions.

## The problem

When a company provides a service, they need to:
1. Generate an XML invoice
2. Sign it with a digital certificate
3. Send it to the city's web service
4. Receive the confirmation
5. Store the invoice for 5 years

This involves SOAP, XML signatures, and X509 certificates. It's not fun.

## The flow

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Company    │───▶│   NFS-e      │───▶│   City       │
│   (Issuer)   │    │   Service    │    │   Server     │
└──────────────┘    └──────────────┘    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Digital    │
                    │  Certificate │
                    └──────────────┘
```

## Key concepts

- **SOAP** — XML-based web service protocol
- **XML Signature** — cryptographic proof of authorship
- **X509 Certificate** — digital identity from a CA
- **NFSe schema** — the XML structure for invoices
- **RPS** — Recibo Provisório de Serviços (provisional receipt)

## Why TypeScript

NFS-e involves a lot of XML manipulation and certificate handling. TypeScript's string handling and buffer manipulation make this easier. Go could work, but the development speed would be much slower.
