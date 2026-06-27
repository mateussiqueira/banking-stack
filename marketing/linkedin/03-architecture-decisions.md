# Post 3: Architecture Decisions That Shaped the Project

## Hook
5 decisões de arquitetura que mudaram completamente o Banking Challenges.

## Body

Ao construir um sistema bancário do zero, cada escolha importa. Aqui estão as 5 decisões que definiram o projeto:

**1. Monorepo com Turborepo**
Antes: múltiplos repos, build lento, dependências duplicadas.
Depois: cache inteligente, builds paralelos, shared configs.

**2. GraphQL + Relay para o Ledger**
O padrão Relay Connection é perfeito para paginação cursor-based. DataLoader elimina N+1 queries.

**3. ISO 20022 XML para SPI**
O SPI do Banco Central usa XML. Em vez de simplificar, implementei o protocolo real. Mais verboso, mas mais fiel.

**4. MongoDB com Replica Set**
Sim, PostgreSQL seria mais tradicional para finanças. Mas MongoDB oferece transações ACID desde 4.0 e esquema flexível para evolução rápida.

**5. Design System Componentizado**
Radix UI + TailwindCSS + CVA + Storybook. Componentes acessíveis, estilização consistente, desenvolvimento isolado.

Cada decisão tem trade-offs documentados nos ADRs. Transparência total.

Qual decisão você discorda? 🤔

#architecture #decisions #monorepo #graphql #mongodb #designsystem