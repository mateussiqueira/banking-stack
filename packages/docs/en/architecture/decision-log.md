# Architecture Decision Records (ADR)

---

## ADR-001: Monorepo with Turborepo

**Status:** Accepted

**Context:**
The project contains multiple challenges that share TypeScript configurations, lint tools, and development dependencies. Each challenge needs to be developed and tested independently, but with the ability to reuse common code.

**Decision:**
Use **Turborepo** with **pnpm workspaces** as the monorepo manager.

- Turborepo offers intelligent build caching and parallelism.
- pnpm is fast and efficient with symbolic links.
- Each challenge is a separate package in `packages/backend/`, `packages/frontend/`, etc.
- Shared scripts via `turbo.json` pipeline.
- `Makefile` as a unified interface for common commands.

**Consequences:**
- **Positive:** Fast builds with cache, isolation between packages, shared dependencies.
- **Positive:** Easy to add new challenges as new packages.
- **Negative:** Initial Turborepo configuration complexity.
- **Negative:** Higher disk consumption with duplicated `node_modules` between packages.

---

## ADR-002: GraphQL with Relay for Ledger

**Status:** Accepted

**Context:**
The banking ledger challenge requires a CRUD with efficient pagination and flexible queries. The Relay Connection pattern is ideal for cursor-based pagination lists.

**Decision:**
Implement the ledger using **graphql-js** + **graphql-relay** + **DataLoader** + **Koa**.

- Relay Connections for consistent pagination.
- DataLoader to avoid N+1 queries in MongoDB.
- Koa as a lightweight and modern HTTP framework.
- Mutations following Relay pattern (input/payload/clientMutationId).

**Consequences:**
- **Positive:** Efficient and predictable cursor-based pagination.
- **Positive:** Batched queries with DataLoader reduce latency.
- **Positive:** Compatible with modern Relay clients.
- **Negative:** Learning curve of Relay pattern.
- **Negative:** GraphQL requires more initial configuration than REST.

---

## ADR-003: ISO 20022 for SPI Simulation

**Status:** Accepted

**Context:**
The SPI (Instant Payment System) of Brazil's Central Bank uses ISO 20022 messages in XML format. To realistically simulate the Pix flow, it's necessary to implement parsing and generation of these messages.

**Decision:**
Use **Fastify** + **fast-xml-parser** to implement the SPI simulator.

- Standard ISO 20022 messages: pacs.008 (credit), pacs.002 (status), pacs.004 (return).
- Rigorous parsing and validation of mandatory fields.
- In-memory storage for simplicity (replaceable by MongoDB).
- REST endpoints that accept/send XML.

**Consequences:**
- **Positive:** Fidelity to the real SPI protocol.
- **Positive:** XML is verbose but self-descriptive and validatable.
- **Positive:** Reusable code for real BCB integration.
- **Negative:** XML is heavier than JSON for traffic.
- **Negative:** XML parsing requires careful validation.

---

## ADR-004: MongoDB for Financial Data

**Status:** Accepted

**Context:**
Financial systems need transactional consistency and the ability to store documents with flexible schemas. The banking ledger and other services need ACID transactions.

**Decision:**
Use **MongoDB 7** with **Replica Set** for multi-document transactions.

- MongoDB has offered ACID transactions since version 4.0.
- Replica Set required for transaction support.
- Mongoose as ODM for modeling and validation.
- Flexible schemas for rapid evolution.

**Consequences:**
- **Positive:** ACID transactions for financial operations (atomic debit/credit).
- **Positive:** Flexible schema to accommodate different transaction types.
- **Positive:** Good performance for reads and writes.
- **Negative:** MongoDB is not the traditional choice for financial systems (PostgreSQL would be more common).
- **Negative:** Replica Set adds operational complexity.

---

## ADR-005: Componentized Design System

**Status:** Accepted

**Context:**
The landing page and KYC system need reusable and consistent UI components. Instead of a single monolithic design system, decoupled components were chosen.

**Decision:**
Create a design system with **Radix UI** + **TailwindCSS** + **CVA** + **Storybook**.

- Radix UI for accessible and unstyled components.
- TailwindCSS for utility styling.
- CVA (Class Variance Authority) for component variants.
- Storybook for isolated documentation and development.
- Tailwind Merge for class conflict resolution.
- Lucide React for icons.

**Consequences:**
- **Positive:** Accessible components (Radix UI ensures WAI-ARIA).
- **Positive:** Consistent styling with TailwindCSS.
- **Positive:** Storybook allows isolated development and testing.
- **Negative:** Multiple dependencies (Radix, CVA, Tailwind Merge).
- **Negative:** Storybook increases build time.
