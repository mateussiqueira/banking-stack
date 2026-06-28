# Desafio 14: RFC — Documentação de Decisões de Arquitetura

**🇧🇷** Request for Comments  
**🇬🇧** Architecture Decision Records

---

RFCs são o **registro vivo** de decisões de arquitetura. Em fintechs, decisões ruins podem gerar **perdas financeiras, violações regulatórias e discrepancies**. Um RFC documenta: o problema, as opções consideradas, a solução escolhida e o raciocínio.

## Switch: RFC Standard vs ADR (Architecture Decision Record)

<LanguageToggle />

<div class="lang-content rfc" style="display:block;">

### O que é um RFC?

Um RFC é uma **proposta que convida discussão**. O objetivo não é dictar — é convergir. Um bom RFC passa por: **draft → review → approval → implementation → retrospective**.

| Elemento | Descrição |
|----------|-----------|
| **Status** | Draft → Review → Approved → Deprecated |
| **Context** | O problema que motivou a decisão |
| **Decision** | O que foi decidido |
| **Alternatives** | Opções consideradas |
| **Consequences** | Impactos positivos e negativos |
| **Security** | Implicações de segurança |

### Estrutura de um RFC

```
RFC-001: Título
├── Status: [Draft | Review | Approved | Deprecated]
├── Authors: [nomes]
├── Date: [data]
├── Context
│   ├── Problema
│   ├── Restrições
│   └── Drivers
├── Decision
│   ├── Solução escolhida
│   └── Justificativa
├── Alternatives Considered
│   ├── Opção A (descartada)
│   ├── Opção B (descartada)
│   └── Opção C (escolhida) ✅
├── Consequences
│   ├── Positivas
│   └── Negativas
├── Security Considerations
├── Testing Strategy
└── References
```

### RFC-001: Crédito sobre Pix

**Status:** Approved

**Context:**
O Pix movimenta R$ 3 tri/mês, mas não oferece crédito. Empresas precisam de capital de giro entre a venda e o recebimento do Pix. Um serviço de crédito sobre Pix permite antecipação de fluxo de caixa com taxa inferior ao cartão de crédito.

**Decision:**
Criar um **serviço de crédito orquestrado por workflow** que:
1. Valida identidade do cliente (KYC via Open Finance)
2. Consulta score de crédito (Serasa/Boa Vista)
3. Calcula taxa baseada em risco + CDI
4. Gera contrato digital
5. Libera crédito via Pix

**Alternatives Considered:**

| Opção | Prós | Contras | Decisão |
|-------|------|---------|---------|
| **Antecipação de recebíveis** | Simples | Limita a merchants | ❌ Muito restritivo |
| **Empréstimo P2P** | Flexível | Complexidade regulatória | ❌ Regulação pesada |
| **Crédito sobre Pix (escolhido)** | Novo, escalável | Requer Open Finance | ✅ Futuro-proof |

**Consequences:**
- ✅ Novo revenue stream (spread de 2-8% a.a.)
- ✅ Diferencial competitivo
- ❌ Complexidade de integração com Open Finance
- ❌ Necessita licenciamento BCB

### RFC-002: Data Lake para Fintech

**Status:** Approved

**Context:**
Bilhões de transações precisam ser transformadas em insights. Relatórios regulatórios (BACEN, SCR) exigem dados históricos de 5+ anos. Data warehouse tradicional não escala para streaming em tempo real.

**Decision:**
Arquitetura **Lambda** com:
- **Hot path**: PostgreSQL + Redis para transações em tempo real
- **Cold path**: ClickHouse + S3 para analytics e relatórios
- **Streaming**: Kafka para ingestão de eventos

**Alternatives Considered:**

| Opção | Prós | Contras | Decisão |
|-------|------|---------|---------|
| **Só PostgreSQL** | Simples | Não escala para analytics | ❌ Performance |
| **Só ClickHouse** | Analytics rápido | Não serve OLTP | ❌ Não substitui PG |
| **Lambda (escolhido)** | Hot + Cold | Complexidade | ✅ Melhor dos dois |
| **Lakehouse (Databricks)** | Moderno | Vendor lock-in | ❌ Custo |

**Security:**
- Dados PII criptografados em repouso (AES-256)
- Row-level security por tenant
- Audit log imutável em S3

### RFC-003: Monitoramento Financeiro

**Status:** Approved

**Context:**
Transações financeiras precisam ser monitoradas em tempo real para detectar fraudes, conformidade regulatória e SLAs. Um sistema de monitoramento deve processar milhões de eventos/minuto com latência < 100ms.

**Decision:**
Pipeline **Kafka + Flink + Elasticsearch**:
- **Ingestão**: Kafka (1M+ eventos/s)
- **Processamento**: Apache Flink (CEP rules)
- **Armazenamento**: Elasticsearch + PostgreSQL
- **Alertas**: PagerDuty + Slack

**Alternatives Considered:**

| Opção | Prós | Contras | Decisão |
|-------|------|---------|---------|
| **Só Elasticsearch** | Simples | Não processa em tempo real | ❌ Latência |
| **Prometheus + Grafana** | Métricas boas | Não faz CEP | ❌ Só métricas |
| **Flink + Kafka (escolhido)** | Real-time + escalável | Complexo | ✅ Poderoso |
| **Datadog** | Managed | Vendor lock-in, custo | ❌ Caro |

### Template de RFC

```markdown
# RFC-XXX: [Título]

**Status:** Draft | Review | Approved | Deprecated
**Authors:** [nomes]
**Date:** [data]
**Reviewers:** [nomes]

## Context

[Qual problema motivou esta decisão? Quais restrições existem?]

## Decision

[O que foi decidido? Por quê?]

## Alternatives Considered

| Opção | Prós | Contras | Decisão |
|-------|------|---------|---------|
| A | ... | ... | ❌ |
| B | ... | ... | ❌ |
| C (escolhida) | ... | ... | ✅ |

## Consequences

### Positivas
- [impactos positivos]

### Negativas
- [impactos negativos]

## Security Considerations
- [implicações de segurança]

## Testing Strategy
- [como testar]

## References
- [links relevantes]
```

### Casos de Uso

- **Migração de banco**: PostgreSQL → Aurora
- **Novo serviço**: Implementar PISP
- **Mudança de stack**: Express → Fastify
- **Segurança**: Adicionar mTLS
- **Compliance**: Novo relatório BACEN

</div>

<div class="lang-content adr" style="display:none;">

### ADR (Architecture Decision Record)

ADRs são mais **leves e focados** que RFCs. Cada ADR documenta **uma decisão específica** com contexto mínimo.

### Diferença: RFC vs ADR

| Aspecto | RFC | ADR |
|---------|-----|-----|
| **Escopo** | Projeto/sistema inteiro | Decisão específica |
| **Tamanho** | 2-10 páginas | 1-2 páginas |
| **Público** | Stakeholders, arquitetos | Time de engenharia |
| **Vida** | Atualizado continuamente | Histórico imutável |
| **Formato** | Livre | Template padronizado |

### Template ADR

```markdown
# ADR-XXX: [Título]

**Status:** Proposed | Accepted | Deprecated | Superseded by ADR-YYY
**Date:** [data]
**Deciders:** [quem decidiu]

## Context
[O que está acontecendo que força uma decisão?]

## Decision
[O que decidimos fazer?]

## Consequences
[O que fica bom? O que fica ruim?]
```

### Exemplo: ADR-001 — Monorepo com Turborepo

```markdown
# ADR-001: Monorepo com Turborepo

**Status:** Accepted
**Date:** 2024-01-15

## Context
O projeto banking-stack contém 14+ desafios independentes que compartilham configuração TypeScript, dependências de dev e scripts de build. Manter repositórios separados causa duplicação e inconsistência.

## Decision
Usar **Turborepo** com **pnpm workspaces** como gerenciador de monorepo.

- Cada desafio é um pacote em `apps/` ou `packages/`
- Scripts compartilhados via `turbo.json`
- `Makefile` como interface unificada

## Consequences

### Positivas
- Builds rápidos com cache
- Isolamento entre pacotes
- Dependências compartilhadas
- Facilidade para adicionar novos desafios

### Negativas
- Complexidade inicial de configuração
- Consumo de disco maior com node_modules
```

### Exemplo: ADR-002 — GraphQL + Relay para Ledger

```markdown
# ADR-002: GraphQL + Relay para Ledger

**Status:** Accepted
**Date:** 2024-01-20

## Context
O ledger bancário precisa de CRUD com paginação eficiente e consultas flexíveis. REST não resolve bem N+1 problem.

## Decision
Usar **graphql-js** + **graphql-relay** + **DataLoader** + **Koa**.

## Consequences

### Positivas
- Paginação cursor-based eficiente
- Batched queries com DataLoader
- Compatível com clientes Relay

### Negativas
- Curva de aprendizado do padrão Relay
- Mais configuração inicial que REST
```

### Exemplo: ADR-005 — Go para SPI e DICT

```markdown
# ADR-005: Go para SPI e DICT

**Status:** Accepted
**Date:** 2024-02-10

## Context
SPI e DICT processam transações financeiras em tempo real. Requisitos: latência < 10ms, throughput > 50K req/s, GC determinístico.

## Decision
Reimplementar SPI e DICT em **Go** com framework Gin.

### Benchmarks

| Operação | TypeScript | Go |
|----------|-----------|-----|
| Transferência simples | ~2.1ms | ~0.8ms |
| Batch 100 transfers | ~185ms | ~72ms |
| Startup (cold) | ~350ms | ~8ms |

## Consequences

### Positivas
- 2-3x mais rápido que Node.js
- GC determinístico (pausas < 1ms)
- Deploy como binário único

### Negativas
- Menos ecossistema GraphQL
- Equipe precisa aprender Go
```

### ADRs do Banking Stack

| # | Título | Status |
|---|--------|--------|
| 001 | Monorepo com Turborepo | ✅ Accepted |
| 002 | GraphQL + Relay para Ledger | ✅ Accepted |
| 003 | ISO 20022 para SPI | ✅ Accepted |
| 004 | MongoDB para Ledger | ✅ Accepted |
| 005 | Go para SPI e DICT | ✅ Accepted |

</div>

---

## Lições aprendidas

1. **RFC ≠ ADR** — RFC é para projetos inteiros, ADR para decisões específicas
2. **Sempre documentar alternativas** — Mostra que você considerou opções
3. **Status é vivo** — Draft → Review → Approved → Deprecated
4. **Security sempre** — Toda decisão tem implicações de segurança
5. **Consequences honestas** — Liste prós E contras
6. **Referências** — Links para specs, docs, artigos
7. **Onboarding** — Novos engenheiros entendem o "por quê"
8. **Compliance** — Auditores precisam de justificativas documentadas
9. **Evolução** — RFCs documentam a história do sistema
10. **Ferramenta** — Use Notion, Confluence ou markdown no Git
