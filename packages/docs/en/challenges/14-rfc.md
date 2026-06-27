# 14 — RFC Architecture

**What is it:** RFC (Request for Comments) architecture documents for financial systems.

**Why it matters:** Complex systems need well-documented decisions. RFCs capture the reasoning behind architecture choices.

## Challenge Description

Create RFC (Request for Comments) architecture documents for hypothetical financial systems, demonstrating ability to design complex systems with well-documented decisions.

Requirements:
- Complete RFC structure (problem, solution, trade-offs)
- Architecture diagrams (ASCII and Mermaid)
- Data modeling (ERD)
- REST/GraphQL API design
- Security considerations
- Alternatives analysis

---

## RFC Documents

| # | RFC | Description |
|---|-----|-------------|
| 1 | [Credit on top of Pix](/en/rfc/credit-on-pix) | Credit system layered on Pix instant payments |
| 2 | [Data Lake for Fintech](/en/rfc/data-lake) | Analytical data lake for financial data |
| 3 | [Financial Monitoring](/en/rfc/financial-monitoring) | Real-time financial transaction monitoring |

---

## RFC Structure

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

## How to View

```bash
# Open RFCs via VitePress
make docs

# Direct markdown
open packages/docs/rfc/credit-on-pix.md
open packages/docs/rfc/data-lake.md
open packages/docs/rfc/financial-monitoring.md
```
