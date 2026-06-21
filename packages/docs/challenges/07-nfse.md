# 07 — NFS-e Integration

**🇧🇷** Integração com Nota Fiscal de Serviços Eletrônica  
**🇬🇧** Electronic Service Invoice Integration

---

## 🇧🇷 Descrição do Desafio

Implementar integração com sistemas municipais de NFS-e (Nota Fiscal de Serviços Eletrônica), permitindo a geração, envio e consulta de notas fiscais de serviços. A integração segue o padrão ABRASF (Associação Brasileira das Secretarias de Finanças das Capitais).

Requisitos:
- Geração de XML de NFS-e no padrão ABRASF
- Envio para prefeituras via SOAP
- Consulta de notas emitidas e recebidas
- Cancelamento de notas
- Cálculo de impostos (ISS, IR, CSLL, PIS, COFINS)
- Certificação digital (A1/A3) para assinatura XML

---

## 🇬🇧 Challenge Description

Implement integration with municipal NFS-e (Electronic Service Invoice) systems, allowing generation, submission, and query of service invoices. The integration follows the ABRASF standard (Brazilian Association of Capital City Finance Secretariats).

Requirements:
- Generate NFS-e XML in ABRASF standard
- Submit to city halls via SOAP
- Query issued and received invoices
- Cancel invoices
- Tax calculation (ISS, IR, CSLL, PIS, COFINS)
- Digital certificate (A1/A3) for XML signing

---

## Architecture / Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                    NFS-e Integration                         │
│                                                              │
│  POST /api/v1/nfse/emitter        Emit invoice              │
│  GET  /api/v1/nfse/:id            Get invoice               │
│  POST /api/v1/nfse/:id/cancel     Cancel invoice            │
│  GET  /api/v1/nfse                List invoices             │
│  GET  /api/v1/nfse/dashboard      Dashboard statistics      │
│                                                              │
│  Communication: SOAP/XML over HTTP                           │
│  Standard: ABRASF 3.0                                       │
└──────────────────────────────────────────────────────────────┘
```

## Tech Stack (Proposed)

| Technology | Purpose |
|------------|---------|
| **Express** | HTTP framework |
| **node-soap / strong-soap** | SOAP client/server |
| **xml-crypto** | XML digital signature |
| **node-forge** | Certificate handling |

## Invoice Flow / Fluxo da Nota Fiscal

```
Company                    NFS-e Module                   City Hall
  │                            │                              │
  │ 1. Invoice data            │                              │
  │ ──────────────────────────►│                              │
  │                            │ 2. Generate XML (ABRASF)     │
  │                            │ 3. Sign XML (certificate)    │
  │                            │ 4. Send via SOAP             │
  │                            │ ────────────────────────────►│
  │                            │ 5. Return protocol number    │
  │                            │ ◄────────────────────────────│
  │ 6. Invoice with protocol   │                              │
  │ ◄──────────────────────────│                              │
```

## How to Run (Proposed)

```bash
pnpm --filter @banking/nfse dev
```
