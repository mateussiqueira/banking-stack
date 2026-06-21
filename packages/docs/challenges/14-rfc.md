# 14 — RFC Architecture

**🇧🇷** Documentos de Arquitetura RFC  
**🇬🇧** RFC Architecture Documents

---

## 🇧🇷 Descrição do Desafio

Criar documentos de arquitetura no formato RFC (Request for Comments) para sistemas financeiros hipotéticos, demonstrando capacidade de projetar sistemas complexos com decisões bem documentadas.

Requisitos:
- Estrutura RFC completa (problema, solução, trade-offs)
- Diagramas de arquitetura em ASCII e Mermaid
- Modelagem de dados (ERD)
- Design de API REST/GraphQL
- Considerações de segurança
- Análise de alternativas

---

## 🇬🇧 Challenge Description

Create RFC (Request for Comments) architecture documents for hypothetical financial systems, demonstrating ability to design complex systems with well-documented decisions.

Requirements:
- Complete RFC structure (problem, solution, trade-offs)
- Architecture diagrams (ASCII and Mermaid)
- Data modeling (ERD)
- REST/GraphQL API design
- Security considerations
- Alternatives analysis

---

## RFC Documents / Documentos RFC

| # | RFC | Description | Descrição |
|---|-----|-------------|-----------|
| 1 | [Credit on top of Pix](../rfc/credit-on-pix.md) | Credit system layered on Pix instant payments | Sistema de crédito sobre pagamentos Pix |
| 2 | [Data Lake for Fintech](../rfc/data-lake.md) | Analytical data lake for financial data | Data lake analítico para dados financeiros |
| 3 | [Financial Monitoring](../rfc/financial-monitoring.md) | Real-time financial transaction monitoring | Monitoramento de transações financeiras em tempo real |

---

## RFC Structure / Estrutura RFC

Each RFC follows this structure:

```
1. Title and Metadata
   - Title, Author, Date, Status, Version

2. Problem Statement
   - Context
   - Motivation
   - Goals and Non-Goals

3. Proposed Solution
   - Architecture Overview
   - Component Diagram
   - Data Flow

4. Database Schema (Mermaid ERD)
   - Entity-Relationship Diagram
   - Table descriptions

5. API Design
   - Endpoints
   - Request/Response examples
   - Authentication

6. Trade-offs and Alternatives
   - Options considered
   - Pros and cons

7. Security Considerations
   - Threats
   - Mitigations
   - Compliance

8. Open Questions
   - Items needing further discussion
```

## How to View / Como Visualizar

```bash
# Open RFCs via VitePress
make docs

# Direct markdown
open packages/docs/rfc/credit-on-pix.md
open packages/docs/rfc/data-lake.md
open packages/docs/rfc/financial-monitoring.md
```
