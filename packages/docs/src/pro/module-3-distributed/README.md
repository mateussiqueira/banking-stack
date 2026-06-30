# 🌐 Módulo 3: Arquitetura de Sistemas Distribuídos e Finanças

> A engenharia por trás do fluxo do dinheiro. Como garantir imutabilidade e consistência eventual e forte.

## Aulas

| # | Aula | Status | Duração |
|---|------|--------|---------|
| 22 | Event Sourcing — Logs imutáveis vs State-based | ⏳ Pendente | 60min |
| 23 | CQRS — Separando leitura e escrita | ⏳ Pendente | 55min |
| 24 | Implementação com EventStoreDB ou Kafka | ⏳ Pendente | 65min |
| 25 | Kafka Internals — Partitions, Consumer Groups | ⏳ Pendente | 60min |
| 26 | Exactly-Once Semantics com idempotência | ⏳ Pendente | 50min |
| 27 | Schema Registry e Avro/Protobuf | ⏳ Pendente | 45min |
| 28 | Isolamento Transacional — Read Committed vs Serializable | ⏳ Pendente | 55min |
| 29 | CockroachDB e banco distribuído | ⏳ Pendente | 50min |
| 30 | Arquitetura completa — Revisão dos 3 módulos | ⏳ Pendente | 70min |

## Desafios Práticos

| # | Desafio | Baseado em | Status |
|---|---------|------------|--------|
| 06 | Ledger com Event Sourcing em Rust | Novo desafio | ⏳ Pendente |
| 07 | Pipeline de processamento SPI com Kafka | Novo desafio | ⏳ Pendente |
| 08 | **Projeto Final:** Sistema completo de pagamentos | Go + Rust + Kafka | ⏳ Pendente |

## Tópicos Chave

### Event Sourcing e CQRS
- Por que os maiores bancos utilizam logs imutáveis
- Event Store vs State Store
- Projeções e queries otimizadas

### Apache Kafka com Exactly-Once
- Garantindo que uma ordem de pagamento seja entregue exatamente uma vez
- Eliminando duplicidades no ecossistema Pix/SPI
- Idempotent producers e transactions

### Isolamento Transacional
- Read Uncommitted → Read Committed → Repeatable Read → Serializable
- Snapshot isolation no PostgreSQL/CockroachDB
- Optimistic vs Pessimistic locking

## Certificação

Ao completar todos os 30 desafios + projeto final, o aluno recebe:
- **Certificado Banking Stack Pro** (verificação por hash)
- **Badge digital** para LinkedIn
- **Acesso vitalício** a atualizações futuras

## RFCs Relacionados

- [RFC: Financial Transaction Monitoring](/rfc/financial-monitoring.md)
- [RFC: Data Lake for Fintechs](/rfc/data-lake.md)
