# Architecture Decision Records (ADR)

Registro de Decisões de Arquitetura

---

## ADR-001: Monorepo com Turborepo

**Status:** ✅ Accepted / Aceito

**Context:**
O projeto contém múltiplos desafios que compartilham configurações de TypeScript, ferramentas de lint, e dependências de desenvolvimento. Cada desafio precisa ser desenvolvido e testado independentemente, mas com a capacidade de reutilizar código comum.

**Decision:**
Utilizar **Turborepo** com **pnpm workspaces** como gerenciador de monorepo.

- Turborepo oferece cache inteligente de build e paralelismo.
- pnpm é rápido e eficiente com seus links simbólicos.
- Cada desafio é um pacote separado em `packages/backend/`, `packages/frontend/`, etc.
- Scripts compartilhados via `turbo.json` pipeline.
- `Makefile` como interface unificada para comandos comuns.

**Consequences:**
- **Positive:** Builds rápidos com cache, isolamento entre pacotes, dependências compartilhadas.
- **Positive:** Facilidade para adicionar novos desafios como novos pacotes.
- **Negative:** Complexidade inicial de configuração do Turborepo.
- **Negative:** Consumo de disco maior com `node_modules` duplicados entre pacotes.

---

## ADR-002: GraphQL com Relay para Ledger

**Status:** ✅ Accepted / Aceito

**Context:**
O desafio do ledger bancário exige um CRUD com paginação eficiente e consultas flexíveis. O padrão Relay Connection é ideal para listas paginadas com cursor-based pagination.

**Decision:**
Implementar o ledger usando **graphql-js** + **graphql-relay** + **DataLoader** + **Koa**.

- Relay Connections para paginação consistente.
- DataLoader para evitar N+1 queries no MongoDB.
- Koa como framework HTTP leve e moderno.
- Mutations seguindo o padrão Relay (input/payload/clientMutationId).

**Consequences:**
- **Positive:** Paginação cursor-based eficiente e previsível.
- **Positive:** Batched queries com DataLoader reduzem latência.
- **Positive:** Compatível com clientes Relay modernos.
- **Negative:** Curva de aprendizado do padrão Relay.
- **Negative:** GraphQL demanda mais configuração inicial que REST.

---

## ADR-003: ISO 20022 para SPI Simulation

**Status:** ✅ Accepted / Aceito

**Context:**
O SPI (Sistema de Pagamentos Instantâneos) do Banco Central do Brasil utiliza mensagens ISO 20022 no formato XML. Para simular o fluxo Pix de forma realista, é necessário implementar parsing e geração dessas mensagens.

**Decision:**
Utilizar **Fastify** + **fast-xml-parser** para implementar o simulador SPI.

- Mensagens ISO 20022 padrões: pacs.008 (crédito), pacs.002 (status), pacs.004 (devolução).
- Parsing e validação rigorosa dos campos obrigatórios.
- Armazenamento em memória para simplicidade (substituível por MongoDB).
- Endpoints REST que aceitam/enviram XML.

**Consequences:**
- **Positive:** Fidelidade ao protocolo real do SPI.
- **Positive:** XML é verboso mas auto-descritivo e validável.
- **Positive:** Código reutilizável para integração real com o BCB.
- **Negative:** XML é mais pesado que JSON para tráfego.
- **Negative:** Parsing de XML requer validação cuidadosa.

---

## ADR-004: MongoDB para Dados Financeiros

**Status:** ✅ Accepted / Aceito

**Context:**
Sistemas financeiros precisam de consistência transacional e capacidade de armazenar documentos com esquemas flexíveis. O ledger bancário e outros serviços precisam de transações ACID.

**Decision:**
Utilizar **MongoDB 7** com **Replica Set** para transações multi-documento.

- MongoDB oferece transações ACID desde a versão 4.0.
- Replica Set necessário para suporte a transações.
- Mongoose como ODM para modelagem e validação.
- Esquemas flexíveis para evolução rápida.

**Consequences:**
- **Positive:** Transações ACID para operações financeiras (débito/crédito atômicos).
- **Positive:** Esquema flexível para acomodar diferentes tipos de transação.
- **Positive:** Boa performance para leituras e escritas.
- **Negative:** MongoDB não é a escolha tradicional para sistemas financeiros (PostgreSQL seria mais comum).
- **Negative:** Replica Set adiciona complexidade operacional.

---

## ADR-005: Design System Componentizado

**Status:** ✅ Accepted / Aceito

**Context:**
A landing page e o sistema KYC precisam de componentes UI reutilizáveis e consistentes. Em vez de um único design system monolítico, optou-se por componentes desacoplados.

**Decision:**
Criar um design system com **Radix UI** + **TailwindCSS** + **CVA** + **Storybook**.

- Radix UI para componentes acessíveis e sem estilo.
- TailwindCSS para estilização utilitária.
- CVA (Class Variance Authority) para variantes de componentes.
- Storybook para documentação e desenvolvimento isolado.
- Tailwind Merge para resolução de conflitos de classes.
- Lucide React para ícones.

**Consequences:**
- **Positive:** Componentes acessíveis (Radix UI garante WAI-ARIA).
- **Positive:** Estilização consistente com TailwindCSS.
- **Positive:** Storybook permite desenvolvimento e teste isolados.
- **Negative:** Múltiplas dependências (Radix, CVA, Tailwind Merge).
- **Negative:** Storybook aumenta o tempo de build.
